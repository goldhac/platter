"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { extractMenu, parsedMenuSchema, type ParsedMenu } from "@/lib/ai/gemini";
import { canAddMenu, upgradeMessage } from "@/lib/plans";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB — matches next.config serverActions limit
const ACCEPTED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "x"
  );
}

/** slugify(base) made unique against `taken`, adding the result to the set. */
function uniqueSlug(base: string, taken: Set<string>): string {
  let s = slugify(base);
  if (taken.has(s)) {
    let n = 2;
    while (taken.has(`${s}-${n}`)) n++;
    s = `${s}-${n}`;
  }
  taken.add(s);
  return s;
}

export type ParseResult = { ok: true; menu: ParsedMenu } | { ok: false; error: string };

/** Read an uploaded menu photo/PDF and return its structured contents for review. */
export async function parseMenuUpload(formData: FormData): Promise<ParseResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a menu photo or PDF first." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "That file is over 10MB — use a smaller photo or PDF." };
  }
  const mimeType = file.type || "application/octet-stream";
  if (!ACCEPTED.has(mimeType)) {
    return { ok: false, error: "Unsupported file — upload a JPG, PNG, WEBP, HEIC, or PDF." };
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  return extractMenu(base64, mimeType);
}

export type CommitResult =
  | { ok: true; slug: string; groups: number; categories: number; items: number }
  | { ok: false; error: string };

/**
 * Turn a reviewed ParsedMenu into a real DRAFT menu: menu → groups → categories →
 * items, all draft. Categories are attached to groups that belong to the new menu,
 * so it shows up correctly on the storefront (unlike a flat/orphaned import).
 */
export async function commitParsedMenu(input: unknown, themeId = "lacquer"): Promise<CommitResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };

  const parsed = parsedMenuSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "The reviewed menu is malformed." };
  const menu = parsed.data;
  if (menu.groups.length === 0) return { ok: false, error: "Nothing to import — add at least one item." };

  const supabase = await createClient();
  const { data: r } = await supabase
    .from("restaurants")
    .select("id")
    .eq("tenant_id", staff.tenantId)
    .limit(1)
    .maybeSingle();
  if (!r) return { ok: false, error: "Venue not found" };

  // Plan gate: Free is capped at one menu per venue (import creates a new one).
  const { data: tenant } = await supabase
    .from("tenants")
    .select("plan")
    .eq("id", staff.tenantId)
    .maybeSingle();
  const { count: menuCount } = await supabase
    .from("menus")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", r.id)
    .is("deleted_at", null);
  if (!canAddMenu(tenant?.plan, menuCount ?? 0)) {
    return { ok: false, error: upgradeMessage("Importing more than one menu") };
  }

  // Unique slugs within the venue (menu per-venue; groups/cats/items seeded from
  // existing rows so the import can't collide with what's already there).
  const [{ data: menuRows }, { data: groupRows }, { data: catRows }, { data: itemRows }] =
    await Promise.all([
      supabase.from("menus").select("slug").eq("restaurant_id", r.id),
      supabase.from("menu_groups").select("slug").eq("restaurant_id", r.id),
      supabase.from("categories").select("slug").eq("restaurant_id", r.id),
      supabase.from("items").select("slug").eq("restaurant_id", r.id),
    ]);

  const menuSlug = uniqueSlug(menu.menuName, new Set((menuRows ?? []).map((m) => m.slug)));
  const groupSlugs = new Set((groupRows ?? []).map((g) => g.slug));
  const catSlugs = new Set((catRows ?? []).map((c) => c.slug));
  const itemSlugs = new Set((itemRows ?? []).map((i) => i.slug));

  const { data: newMenu, error: mErr } = await supabase
    .from("menus")
    .insert({
      tenant_id: staff.tenantId,
      restaurant_id: r.id,
      name: menu.menuName,
      slug: menuSlug,
      theme_id: themeId,
      status: "draft",
      sort_order: 4000,
    })
    .select("id, slug")
    .single();
  if (mErr || !newMenu) return { ok: false, error: mErr?.message ?? "Could not create the menu." };

  let nGroups = 0;
  let nCats = 0;
  let nItems = 0;

  for (let gi = 0; gi < menu.groups.length; gi++) {
    const g = menu.groups[gi];
    const { data: group, error: gErr } = await supabase
      .from("menu_groups")
      .insert({
        tenant_id: staff.tenantId,
        restaurant_id: r.id,
        menu_id: newMenu.id,
        name: g.name,
        slug: uniqueSlug(g.name, groupSlugs),
        sort_order: (gi + 1) * 1000,
      })
      .select("id")
      .single();
    if (gErr || !group) return { ok: false, error: `Group "${g.name}": ${gErr?.message ?? "insert failed"}` };
    nGroups++;

    for (let ci = 0; ci < g.categories.length; ci++) {
      const c = g.categories[ci];
      const { data: cat, error: cErr } = await supabase
        .from("categories")
        .insert({
          tenant_id: staff.tenantId,
          restaurant_id: r.id,
          group_id: group.id,
          name: c.name,
          slug: uniqueSlug(c.name, catSlugs),
          sort_order: (ci + 1) * 1000,
        })
        .select("id")
        .single();
      if (cErr || !cat) return { ok: false, error: `Category "${c.name}": ${cErr?.message ?? "insert failed"}` };
      nCats++;

      if (c.items.length === 0) continue;
      const rows = c.items.map((it, ii) => ({
        tenant_id: staff.tenantId,
        restaurant_id: r.id,
        category_id: cat.id,
        name: it.name,
        description: it.description ?? null,
        slug: uniqueSlug(it.name, itemSlugs),
        base_price: Math.round(it.price * 100) / 100, // numeric(,2) — keep pence/cents, drop float noise
        spice_level: it.spice_level,
        dietary_tags: it.dietary_tags,
        status: "draft" as const,
        sort_order: (ii + 1) * 1000,
      }));
      const { error: iErr } = await supabase.from("items").insert(rows);
      if (iErr) return { ok: false, error: `Items in "${c.name}": ${iErr.message}` };
      nItems += rows.length;
    }
  }

  revalidatePath("/admin/menus");
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  return { ok: true, slug: newMenu.slug, groups: nGroups, categories: nCats, items: nItems };
}
