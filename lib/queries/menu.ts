import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getOpenState } from "@/lib/format/hours";

// ── View-model types (assembled below; the public menu codes against these) ──
export type MenuVariant = {
  id: string;
  label: string;
  label_zh: string | null;
  price: number;
  is_available: boolean;
};

export type MenuItem = {
  id: string;
  name: string;
  name_zh: string | null;
  description: string | null;
  slug: string;
  category_slug: string;
  category_name: string;
  base_price: number;
  /** min variant price when the item has variants, else null → card shows "from …" */
  from_price: number | null;
  spice_level: number;
  dietary_tags: string[];
  allergens: string[];
  is_featured: boolean;
  is_available: boolean;
  image_url: string | null;
  prep_time_minutes: number | null;
  variants: MenuVariant[];
};

export type MenuCategory = {
  id: string;
  name: string;
  name_zh: string | null;
  slug: string;
  items: MenuItem[];
};

export type MenuGroup = {
  id: string;
  name: string;
  name_zh: string | null;
  slug: string;
  categories: MenuCategory[];
};

export type MenuRestaurant = {
  id: string;
  name: string;
  name_zh: string | null;
  slug: string;
  currency: string;
  locale: string;
  timezone: string;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  ordering_enabled: boolean;
};

export type OpenState = { open: boolean; label: string };

export type Menu = {
  restaurant: MenuRestaurant;
  openState: OpenState;
  /** Two-level nav: only groups that actually have categories with items. */
  groups: MenuGroup[];
  /** Flat, ordered — for the category rail + scrollspy. */
  categories: MenuCategory[];
  /** slug → item, for the shallow-routed detail sheet. */
  itemsBySlug: Record<string, MenuItem>;
};

/**
 * Public menu for one restaurant, fully assembled. Runs on the anon client, so
 * RLS returns only published, non-deleted items and active categories/groups
 * (security.md §2). Sold-out items sort to the bottom of their category (P8).
 */
export const getMenu = cache(async (restaurantSlug: string): Promise<Menu> => {
  const supabase = await createClient();

  const { data: restaurant, error: rErr } = await supabase
    .from("restaurants")
    .select(
      "id, name, name_zh, slug, currency, locale, timezone, phone, whatsapp, address, ordering_enabled",
    )
    .eq("slug", restaurantSlug)
    .single();

  if (rErr || !restaurant) {
    throw new Error(
      `getMenu: restaurant "${restaurantSlug}" not found${rErr ? `: ${rErr.message}` : ""}`,
    );
  }

  const [
    { data: groupRows, error: gErr },
    { data: catRows, error: cErr },
    { data: hourRows },
  ] = await Promise.all([
    supabase
      .from("menu_groups")
      .select("id, name, name_zh, slug, sort_order")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order"),
    // Single string literal so supabase-js can infer the nested row types.
    supabase
      .from("categories")
      .select(
        "id, name, name_zh, slug, sort_order, group_id, items(id, name, name_zh, description, slug, base_price, spice_level, dietary_tags, allergens, is_featured, is_available, image_url, prep_time_minutes, sort_order, item_variants(id, label, label_zh, price, sort_order, is_available))",
      )
      .eq("restaurant_id", restaurant.id)
      .order("sort_order"),
    supabase
      .from("opening_hours")
      .select("weekday, opens, closes, is_closed")
      .eq("restaurant_id", restaurant.id),
  ]);

  if (gErr) throw new Error(`getMenu: groups query failed: ${gErr.message}`);
  if (cErr) throw new Error(`getMenu: categories query failed: ${cErr.message}`);

  const openState = getOpenState(hourRows ?? [], restaurant.timezone);

  const itemsBySlug: Record<string, MenuItem> = {};

  const categories: MenuCategory[] = (catRows ?? []).map((c) => {
    const items: MenuItem[] = (c.items ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((it): MenuItem => {
        const variants: MenuVariant[] = (it.item_variants ?? [])
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((v) => ({
            id: v.id,
            label: v.label,
            label_zh: v.label_zh,
            price: v.price,
            is_available: v.is_available,
          }));

        const item: MenuItem = {
          id: it.id,
          name: it.name,
          name_zh: it.name_zh,
          description: it.description,
          slug: it.slug,
          category_slug: c.slug,
          category_name: c.name,
          base_price: it.base_price,
          from_price: variants.length ? Math.min(...variants.map((v) => v.price)) : null,
          spice_level: it.spice_level,
          dietary_tags: it.dietary_tags,
          allergens: it.allergens,
          is_featured: it.is_featured,
          is_available: it.is_available,
          image_url: it.image_url,
          prep_time_minutes: it.prep_time_minutes,
          variants,
        };
        itemsBySlug[item.slug] = item;
        return item;
      })
      // stable: available first, sold-out sinks to the bottom of its category (P8)
      .sort((a, b) => Number(b.is_available) - Number(a.is_available));

    return { id: c.id, name: c.name, name_zh: c.name_zh, slug: c.slug, items };
  });

  // Two-level nav: attach categories to their group; keep only non-empty groups.
  const groups: MenuGroup[] = (groupRows ?? [])
    .map((g) => ({
      id: g.id,
      name: g.name,
      name_zh: g.name_zh,
      slug: g.slug,
      categories: categories.filter(
        (c) => catRows?.find((cr) => cr.id === c.id)?.group_id === g.id && c.items.length > 0,
      ),
    }))
    .filter((g) => g.categories.length > 0);

  return {
    restaurant,
    openState,
    groups,
    categories: categories.filter((c) => c.items.length > 0),
    itemsBySlug,
  };
});
