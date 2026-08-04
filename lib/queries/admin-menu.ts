import { createClient } from "@/lib/supabase/server";

// The admin sees everything within its tenant (drafts included), non-deleted.
// RLS scopes every row to the caller's tenant automatically (security.md §2).

export type AdminItem = {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  is_available: boolean;
  is_featured: boolean;
  status: string;
  spice_level: number;
  image_url: string | null;
  category_id: string;
  sort_order: number;
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  group_id: string | null;
  is_active: boolean;
  items: AdminItem[];
};

export type AdminGroup = {
  id: string;
  name: string;
  slug: string;
  categories: AdminCategory[];
};

export type AdminTree = {
  groups: AdminGroup[];
  ungrouped: AdminCategory[];
  totalItems: number;
};

export async function getAdminMenuTree(): Promise<AdminTree> {
  const supabase = await createClient();

  const [{ data: groupRows, error: gErr }, { data: catRows, error: cErr }] = await Promise.all([
    supabase.from("menu_groups").select("id, name, slug, sort_order").order("sort_order"),
    supabase
      .from("categories")
      .select(
        "id, name, slug, sort_order, group_id, is_active, deleted_at, items(id, name, slug, base_price, is_available, is_featured, status, spice_level, image_url, category_id, sort_order, deleted_at)",
      )
      .is("deleted_at", null)
      .order("sort_order"),
  ]);

  if (gErr) throw new Error(`getAdminMenuTree: groups failed: ${gErr.message}`);
  if (cErr) throw new Error(`getAdminMenuTree: categories failed: ${cErr.message}`);

  let totalItems = 0;

  const categories: AdminCategory[] = (catRows ?? []).map((c) => {
    const items: AdminItem[] = (c.items ?? [])
      .filter((it) => it.deleted_at === null)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((it) => ({
        id: it.id,
        name: it.name,
        slug: it.slug,
        base_price: it.base_price,
        is_available: it.is_available,
        is_featured: it.is_featured,
        status: it.status,
        spice_level: it.spice_level,
        image_url: it.image_url,
        category_id: it.category_id,
        sort_order: it.sort_order,
      }));
    totalItems += items.length;
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      group_id: c.group_id,
      is_active: c.is_active,
      items,
    };
  });

  const groups: AdminGroup[] = (groupRows ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
    categories: categories.filter((c) => c.group_id === g.id),
  }));

  const ungrouped = categories.filter((c) => c.group_id === null);

  return { groups, ungrouped, totalItems };
}

/** Categories for the item form's category picker (tenant-scoped by RLS). */
export async function getCategoryOptions(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, sort_order")
    .is("deleted_at", null)
    .order("sort_order");
  return (data ?? []).map((c) => ({ id: c.id, name: c.name }));
}

export type EditableItem = {
  id: string;
  category_id: string;
  name: string;
  name_zh: string | null;
  description: string | null;
  base_price: number;
  compare_at_price: number | null;
  spice_level: number;
  dietary_tags: string[];
  allergens: string[];
  prep_time_minutes: number | null;
  is_featured: boolean;
  is_available: boolean;
  status: string;
  image_url: string | null;
  variants: { id: string; label: string; price: number }[];
};

export async function getItemForEdit(id: string): Promise<EditableItem | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("items")
    .select(
      "id, category_id, name, name_zh, description, base_price, compare_at_price, spice_level, dietary_tags, allergens, prep_time_minutes, is_featured, is_available, status, image_url, item_variants(id, label, price, sort_order)",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) return null;

  const { item_variants, ...rest } = data;
  return {
    ...rest,
    variants: (item_variants ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((v) => ({ id: v.id, label: v.label, price: v.price })),
  };
}
