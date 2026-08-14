"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentStaff, requireOwner } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { getTenantVenues, VENUE_COOKIE } from "@/lib/venue/active";

export type VenueResult = { ok: true; id: string; slug: string } | { ok: false; error: string };
export type OkResult = { ok: true } | { ok: false; error: string };

const YEAR = 60 * 60 * 24 * 365;

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "venue"
  );
}

function setVenueCookie(jar: Awaited<ReturnType<typeof cookies>>, id: string) {
  jar.set(VENUE_COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: YEAR });
}

/** Switch which venue the admin operates on. Any staff of the tenant may switch; the target
 *  must be a venue the tenant actually owns (never trust the id blindly). */
export async function setActiveVenue(restaurantId: string): Promise<OkResult> {
  const staff = await getCurrentStaff();
  if (!staff) return { ok: false, error: "Not signed in." };

  const venues = await getTenantVenues(staff.tenantId);
  if (!venues.some((v) => v.id === restaurantId)) return { ok: false, error: "Unknown venue." };

  setVenueCookie(await cookies(), restaurantId);
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/** Owner adds a venue: a restaurant + a default live menu + a starter group, ready to edit.
 *  Inherits currency/timezone/locale from an existing venue. Switches to it on success. */
export async function createVenue(nameRaw: unknown): Promise<VenueResult> {
  const { staff, error } = await requireOwner();
  if (!staff) return { ok: false, error };
  const name = String(nameRaw ?? "").trim();
  if (!name) return { ok: false, error: "Give the venue a name." };

  const supabase = await createClient();

  const { data: base } = await supabase
    .from("restaurants")
    .select("currency, timezone, locale")
    .eq("tenant_id", staff.tenantId)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  // Restaurant slugs are globally unique — find a free one.
  const baseSlug = slugify(name);
  let slug = baseSlug;
  for (let n = 2; n < 100; n++) {
    const { data: clash } = await supabase.from("restaurants").select("id").eq("slug", slug).maybeSingle();
    if (!clash) break;
    slug = `${baseSlug}-${n}`;
  }

  const { data: rest, error: rErr } = await supabase
    .from("restaurants")
    .insert({
      tenant_id: staff.tenantId,
      name,
      slug,
      currency: base?.currency ?? "NGN",
      timezone: base?.timezone ?? "Africa/Lagos",
      locale: base?.locale ?? "en-NG",
      status: "active",
    })
    .select("id, slug")
    .single();
  if (rErr || !rest) return { ok: false, error: rErr?.message ?? "Could not create the venue." };

  // A default LIVE menu + starter group so the new venue renders + is immediately editable.
  const { data: menu } = await supabase
    .from("menus")
    .insert({
      tenant_id: staff.tenantId,
      restaurant_id: rest.id,
      name: "Menu",
      slug: "menu",
      theme_id: "lacquer",
      status: "live",
      is_default: true,
      sort_order: 1000,
    })
    .select("id")
    .single();
  if (menu) {
    await supabase.from("menu_groups").insert({
      tenant_id: staff.tenantId,
      restaurant_id: rest.id,
      menu_id: menu.id,
      name: "Menu",
      slug: "menu",
      sort_order: 1000,
    });
  }

  setVenueCookie(await cookies(), rest.id);
  revalidatePath("/admin", "layout");
  return { ok: true, id: rest.id, slug: rest.slug };
}
