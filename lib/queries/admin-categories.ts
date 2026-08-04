import { createClient } from "@/lib/supabase/server";

export type AdminCategoryRow = {
  id: string;
  name: string;
  slug: string;
  group_id: string | null;
  group_name: string | null;
  is_active: boolean;
  item_count: number;
};

export async function getAdminCategories(): Promise<AdminCategoryRow[]> {
  const supabase = await createClient();
  const [{ data: cats }, { data: groups }, { data: items }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, group_id, is_active, sort_order")
      .is("deleted_at", null)
      .order("sort_order"),
    supabase.from("menu_groups").select("id, name"),
    supabase.from("items").select("category_id").is("deleted_at", null),
  ]);

  const groupName = new Map((groups ?? []).map((g) => [g.id, g.name]));
  const counts = new Map<string, number>();
  for (const it of items ?? []) counts.set(it.category_id, (counts.get(it.category_id) ?? 0) + 1);

  return (cats ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    group_id: c.group_id,
    group_name: c.group_id ? (groupName.get(c.group_id) ?? null) : null,
    is_active: c.is_active,
    item_count: counts.get(c.id) ?? 0,
  }));
}

export async function getGroupOptions(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("menu_groups")
    .select("id, name, sort_order")
    .order("sort_order");
  return (data ?? []).map((g) => ({ id: g.id, name: g.name }));
}

export type EditableCategory = {
  id: string;
  name: string;
  name_zh: string | null;
  description: string | null;
  slug: string;
  group_id: string | null;
  is_active: boolean;
  available_from: string | null;
  available_to: string | null;
};

export async function getCategoryForEdit(id: string): Promise<EditableCategory | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, name_zh, description, slug, group_id, is_active, available_from, available_to")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  return data ?? null;
}
