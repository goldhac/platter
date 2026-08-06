"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { canAddMenu, upgradeMessage } from "@/lib/plans";

export type MenuResult = { ok: true; slug: string } | { ok: false; error: string };

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "menu"
  );
}

/** Create a new menu on the venue. Lands as `draft` with a starter group so it's editable. */
export async function createMenu(name: string, themeId = "lacquer"): Promise<MenuResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };
  const clean = name.trim();
  if (!clean) return { ok: false, error: "Menu name is required" };

  const supabase = await createClient();
  const { data: r } = await supabase
    .from("restaurants")
    .select("id")
    .eq("tenant_id", staff.tenantId)
    .limit(1)
    .maybeSingle();
  if (!r) return { ok: false, error: "Venue not found" };

  // Plan gate: Free is capped at one menu per venue.
  const { data: tenant } = await supabase
    .from("tenants")
    .select("plan")
    .eq("id", staff.tenantId)
    .maybeSingle();
  const { count } = await supabase
    .from("menus")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", r.id)
    .is("deleted_at", null);
  if (!canAddMenu(tenant?.plan, count ?? 0)) {
    return { ok: false, error: upgradeMessage("More than one menu") };
  }

  // unique slug within the venue
  let slug = slugify(clean);
  const { data: existing } = await supabase.from("menus").select("slug").eq("restaurant_id", r.id);
  const taken = new Set((existing ?? []).map((m) => m.slug));
  if (taken.has(slug)) {
    let n = 2;
    while (taken.has(`${slug}-${n}`)) n++;
    slug = `${slug}-${n}`;
  }

  const { data: menu, error: mErr } = await supabase
    .from("menus")
    .insert({
      tenant_id: staff.tenantId,
      restaurant_id: r.id,
      name: clean,
      slug,
      theme_id: themeId,
      status: "draft",
      sort_order: 3000,
    })
    .select("id, slug")
    .single();
  if (mErr || !menu) return { ok: false, error: mErr?.message ?? "Could not create menu" };

  // a starter group so the new menu is immediately editable
  await supabase.from("menu_groups").insert({
    tenant_id: staff.tenantId,
    restaurant_id: r.id,
    menu_id: menu.id,
    name: "Menu",
    slug: "menu",
    sort_order: 1000,
  });

  revalidatePath("/admin/menus");
  return { ok: true, slug: menu.slug };
}
