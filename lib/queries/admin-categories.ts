import { getCurrentStaff } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { getActiveVenueId } from "@/lib/venue/active";

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
  const staff = await getCurrentStaff();
  const venueId = staff ? ((await getActiveVenueId(staff.tenantId)) ?? "") : "";
  const [{ data: cats }, { data: groups }, { data: items }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, group_id, is_active, sort_order")
      .eq("restaurant_id", venueId)
      .is("deleted_at", null)
      .order("sort_order"),
    supabase.from("menu_groups").select("id, name").eq("restaurant_id", venueId),
    supabase.from("items").select("category_id").eq("restaurant_id", venueId).is("deleted_at", null),
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

/** Group options for the category picker, scoped to one menu when a slug is given. */
export async function getGroupOptions(menuSlug?: string): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const staff = await getCurrentStaff();
  const venueId = staff ? ((await getActiveVenueId(staff.tenantId)) ?? "") : "";

  let menuId: string | null = null;
  if (menuSlug) {
    const { data: menu } = await supabase
      .from("menus")
      .select("id")
      .eq("restaurant_id", venueId)
      .eq("slug", menuSlug)
      .maybeSingle();
    menuId = menu?.id ?? null;
  }

  const { data } = await supabase
    .from("menu_groups")
    .select("id, name, menu_id, sort_order")
    .eq("restaurant_id", venueId)
    .order("sort_order");
  return (data ?? [])
    .filter((g) => menuId == null || g.menu_id === menuId)
    .map((g) => ({ id: g.id, name: g.name }));
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
