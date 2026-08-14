import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { SecondaryCurrency } from "@/lib/format/currency";
import { getOpenState } from "@/lib/format/hours";
import type { ThemeConfig } from "@/lib/themes";

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
  /** 'published' | 'draft'. Anon only ever sees 'published' (RLS); staff see drafts too. */
  status: string;
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
  tenant_id: string;
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
  /** Optional dual-currency display (owner-set code + rate); null when off. */
  secondary_currency: SecondaryCurrency | null;
};

export type OpenState = { open: boolean; label: string };

/** A live menu on this venue — for the public switcher. */
export type MenuSummary = {
  id: string;
  name: string;
  name_zh: string | null;
  slug: string;
  is_default: boolean;
};

export type Menu = {
  restaurant: MenuRestaurant;
  openState: OpenState;
  /** The active menu's theme (from its `menus` record) — drives <ThemeProvider>. */
  themeId: string;
  themeConfig: ThemeConfig;
  /** All live menus on the venue; the switcher hides itself when length <= 1. */
  menus: MenuSummary[];
  activeMenuSlug: string;
  /** Two-level nav: only groups that actually have categories with items. */
  groups: MenuGroup[];
  /** Flat, ordered — for the category rail + scrollspy. */
  categories: MenuCategory[];
  /** slug → item, for the shallow-routed detail sheet. */
  itemsBySlug: Record<string, MenuItem>;
  /** Top items by diner taps (last 30d) — drives the "Most popular" shelf. May be empty. */
  popular: MenuItem[];
};

/**
 * Public menu for one restaurant, fully assembled. Runs on the anon client, so
 * RLS returns only published, non-deleted items and active categories/groups
 * (security.md §2). Sold-out items sort to the bottom of their category (P8).
 */
export const getMenu = cache(async (restaurantSlug: string, menuSlug?: string): Promise<Menu> => {
  const supabase = await createClient();

  const { data: restaurant, error: rErr } = await supabase
    .from("restaurants")
    .select(
      "id, tenant_id, name, name_zh, slug, currency, locale, timezone, phone, whatsapp, address, ordering_enabled, theme",
    )
    .eq("slug", restaurantSlug)
    .single();

  if (rErr || !restaurant) {
    throw new Error(
      `getMenu: restaurant "${restaurantSlug}" not found${rErr ? `: ${rErr.message}` : ""}`,
    );
  }

  const [
    { data: menuRows, error: mErr },
    { data: groupRows, error: gErr },
    { data: catRows, error: cErr },
    { data: hourRows },
    { data: popRows },
  ] = await Promise.all([
    supabase
      .from("menus")
      .select("id, name, name_zh, slug, theme_id, theme_config, is_default, sort_order")
      .eq("restaurant_id", restaurant.id)
      .eq("status", "live")
      .order("sort_order"),
    supabase
      .from("menu_groups")
      .select("id, name, name_zh, slug, sort_order, menu_id")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order"),
    // Single string literal so supabase-js can infer the nested row types.
    supabase
      .from("categories")
      .select(
        "id, name, name_zh, slug, sort_order, group_id, items(id, name, name_zh, description, slug, base_price, spice_level, dietary_tags, allergens, is_featured, is_available, image_url, prep_time_minutes, status, sort_order, item_variants(id, label, label_zh, price, sort_order, is_available))",
      )
      .eq("restaurant_id", restaurant.id)
      .order("sort_order"),
    supabase
      .from("opening_hours")
      .select("weekday, opens, closes, is_closed")
      .eq("restaurant_id", restaurant.id),
    // Aggregate popularity (item id + tap count) via SECURITY DEFINER RPC — anon can't
    // read raw menu_events. Ordered by count desc; we map ids → live items below.
    supabase.rpc("popular_items", { p_restaurant_id: restaurant.id, p_days: 30, p_limit: 8 }),
  ]);

  if (mErr) throw new Error(`getMenu: menus query failed: ${mErr.message}`);
  if (gErr) throw new Error(`getMenu: groups query failed: ${gErr.message}`);
  if (cErr) throw new Error(`getMenu: categories query failed: ${cErr.message}`);

  const allMenus = menuRows ?? [];
  // Active menu: the requested slug → the default → the first live menu.
  const activeMenu =
    (menuSlug ? allMenus.find((m) => m.slug === menuSlug) : undefined) ??
    allMenus.find((m) => m.is_default) ??
    allMenus[0] ??
    null;

  // Scope groups + categories to the active menu. v1's single default menu owns every
  // group, so this is a no-op there; with 2+ menus it isolates each menu's tree.
  const activeGroupRows = activeMenu
    ? (groupRows ?? []).filter((g) => g.menu_id === activeMenu.id)
    : (groupRows ?? []);
  const activeGroupIds = new Set(activeGroupRows.map((g) => g.id));
  const activeCatRows = (catRows ?? []).filter(
    (c) => c.group_id != null && activeGroupIds.has(c.group_id),
  );

  const openState = getOpenState(hourRows ?? [], restaurant.timezone);

  const itemsBySlug: Record<string, MenuItem> = {};

  const categories: MenuCategory[] = activeCatRows.map((c) => {
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
          status: it.status,
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
  const groups: MenuGroup[] = activeGroupRows
    .map((g) => ({
      id: g.id,
      name: g.name,
      name_zh: g.name_zh,
      slug: g.slug,
      categories: categories.filter(
        (c) => activeCatRows.find((cr) => cr.id === c.id)?.group_id === g.id && c.items.length > 0,
      ),
    }))
    .filter((g) => g.categories.length > 0);

  const menus: MenuSummary[] = allMenus.map((m) => ({
    id: m.id,
    name: m.name,
    name_zh: m.name_zh,
    slug: m.slug,
    is_default: m.is_default,
  }));

  // "Most popular" shelf: map the aggregate item ids back onto items that are live in
  // THIS menu + available, preserving the popularity order. Items from another menu on
  // the venue (or now sold-out / unpublished) simply drop out.
  const byId: Record<string, MenuItem> = {};
  for (const c of categories) for (const it of c.items) byId[it.id] = it;
  const popular: MenuItem[] = ((popRows ?? []) as { item_id: string; views: number }[])
    .map((r) => byId[r.item_id])
    .filter((it): it is MenuItem => !!it && it.is_available)
    .slice(0, 6);

  // Dual-currency config lives in the venue's settings bag (restaurants.theme jsonb).
  const themeBag = (restaurant.theme ?? {}) as { secondaryCurrency?: { code?: string; rate?: number } };
  const sc = themeBag.secondaryCurrency;
  const secondary_currency: SecondaryCurrency | null =
    sc && sc.code && typeof sc.rate === "number" && sc.rate > 0
      ? { code: sc.code, rate: sc.rate }
      : null;

  return {
    restaurant: { ...restaurant, secondary_currency },
    openState,
    themeId: activeMenu?.theme_id ?? "lacquer",
    themeConfig: (activeMenu?.theme_config ?? {}) as ThemeConfig,
    menus,
    activeMenuSlug: activeMenu?.slug ?? "menu",
    groups,
    categories: categories.filter((c) => c.items.length > 0),
    itemsBySlug,
    popular,
  };
});
