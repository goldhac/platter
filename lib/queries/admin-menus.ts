import { getCurrentStaff } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { getActiveVenueId } from "@/lib/venue/active";

export type AdminMenu = {
  id: string;
  name: string;
  slug: string;
  themeId: string;
  status: string;
  isDefault: boolean;
  itemCount: number;
};

/**
 * The venue's menus for the manager (all statuses), with a live item count each.
 * RLS scopes reads to the caller's tenant; we also filter by the venue.
 */
export async function getAdminMenus(): Promise<{
  restaurantName: string;
  restaurantSlug: string;
  menus: AdminMenu[];
} | null> {
  const staff = await getCurrentStaff();
  if (!staff) return null;

  const supabase = await createClient();
  const { data: r } = await supabase
    .from("restaurants")
    .select("id, name, slug")
    .eq("id", (await getActiveVenueId(staff.tenantId)) ?? "")
    .maybeSingle();
  if (!r) return null;

  const [{ data: menus }, { data: groups }, { data: cats }, { data: items }] = await Promise.all([
    supabase
      .from("menus")
      .select("id, name, slug, theme_id, status, is_default, sort_order")
      .eq("restaurant_id", r.id)
      .order("sort_order"),
    supabase.from("menu_groups").select("id, menu_id").eq("restaurant_id", r.id),
    supabase.from("categories").select("id, group_id").eq("restaurant_id", r.id),
    supabase.from("items").select("category_id, deleted_at").eq("restaurant_id", r.id),
  ]);

  // item count per menu: item → category → group → menu
  const groupToMenu = new Map((groups ?? []).map((g) => [g.id, g.menu_id]));
  const catToMenu = new Map<string, string>();
  for (const c of cats ?? []) {
    const mid = c.group_id ? groupToMenu.get(c.group_id) : undefined;
    if (mid) catToMenu.set(c.id, mid);
  }
  const counts = new Map<string, number>();
  for (const it of items ?? []) {
    if (it.deleted_at) continue;
    const mid = catToMenu.get(it.category_id);
    if (mid) counts.set(mid, (counts.get(mid) ?? 0) + 1);
  }

  return {
    restaurantName: r.name,
    restaurantSlug: r.slug,
    menus: (menus ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      slug: m.slug,
      themeId: m.theme_id,
      status: m.status,
      isDefault: m.is_default,
      itemCount: counts.get(m.id) ?? 0,
    })),
  };
}
