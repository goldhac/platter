"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseList } from "@/lib/csv";
import { requireManager, type StaffContext } from "@/lib/rbac";
import { slugify } from "@/lib/slug";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getActiveVenueId } from "@/lib/venue/active";

export type ImportRow = {
  category: string;
  name: string;
  name_zh?: string;
  description?: string;
  price: string;
  spice_level?: string;
  dietary_tags?: string;
  allergens?: string;
  is_featured?: string;
  status?: string;
};

export type ImportResult =
  | { ok: true; itemsCreated: number; categoriesCreated: number }
  | { ok: false; error: string };

const DIETARY = new Set(["vegetarian", "vegan", "contains_pork", "seafood", "gluten_free"]);

async function resolveRestaurantId(
  supabase: SupabaseClient<Database>,
  staff: StaffContext,
): Promise<string | null> {
  if (staff.restaurantId) return staff.restaurantId;
  const { data } = await supabase
    .from("restaurants")
    .select("id")
    .eq("id", (await getActiveVenueId(staff.tenantId)) ?? "")
    .maybeSingle();
  return data?.id ?? null;
}

/** Import parsed CSV rows as draft items, creating categories by name as needed (A11). */
export async function importItemsCsv(rows: ImportRow[]): Promise<ImportResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };

  const supabase = await createClient();
  const restaurantId = await resolveRestaurantId(supabase, staff);
  if (!restaurantId) return { ok: false, error: "No restaurant configured" };

  const { data: cats } = await supabase.from("categories").select("id, name").is("deleted_at", null);
  const catMap = new Map((cats ?? []).map((c) => [c.name.trim().toLowerCase(), c.id]));

  let itemsCreated = 0;
  let categoriesCreated = 0;
  const sortByCat: Record<string, number> = {};

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const catName = row.category.trim();
    const name = row.name.trim();
    if (!catName || !name) continue;

    let catId = catMap.get(catName.toLowerCase());
    if (!catId) {
      const { data: nc, error: ce } = await supabase
        .from("categories")
        .insert({
          tenant_id: staff.tenantId,
          restaurant_id: restaurantId,
          name: catName,
          slug: slugify(catName),
        })
        .select("id")
        .single();
      if (ce) return { ok: false, error: `Row ${i + 2} category "${catName}": ${ce.message}` };
      catId = nc.id;
      catMap.set(catName.toLowerCase(), catId);
      categoriesCreated++;
    }

    const price = Math.round(Number(row.price));
    if (!Number.isFinite(price) || price < 0) {
      return { ok: false, error: `Row ${i + 2} "${name}": invalid price "${row.price}"` };
    }

    sortByCat[catId] = (sortByCat[catId] ?? 0) + 1000;
    const dietary = parseList(row.dietary_tags).filter((t) => DIETARY.has(t));

    const { error: ie } = await supabase.from("items").insert({
      tenant_id: staff.tenantId,
      restaurant_id: restaurantId,
      category_id: catId,
      name,
      name_zh: row.name_zh?.trim() || null,
      description: row.description?.trim() || null,
      slug: slugify(name),
      base_price: price,
      spice_level: Math.max(0, Math.min(3, Number(row.spice_level) || 0)),
      dietary_tags: dietary,
      allergens: parseList(row.allergens),
      is_featured: /^(yes|true|1)$/i.test((row.is_featured ?? "").trim()),
      status: (row.status ?? "").trim().toLowerCase() === "published" ? "published" : "draft",
      sort_order: sortByCat[catId],
    });
    if (ie) return { ok: false, error: `Row ${i + 2} "${name}": ${ie.message}` };
    itemsCreated++;
  }

  revalidatePath("/admin/menu");
  revalidatePath("/admin/categories");
  revalidatePath("/menu");
  return { ok: true, itemsCreated, categoriesCreated };
}
