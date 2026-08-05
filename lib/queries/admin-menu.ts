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

/** A menu the manager can edit — for the editor's scope picker. */
export type AdminMenuOption = {
  id: string;
  name: string;
  slug: string;
  is_default: boolean;
  status: string;
};

export type AdminTree = {
  groups: AdminGroup[];
  ungrouped: AdminCategory[];
  totalItems: number;
  /** Non-archived menus on this venue; the picker hides itself when length <= 1. */
  menus: AdminMenuOption[];
  activeSlug: string;
  activeName: string;
};

/**
 * The editor tree for ONE menu. A category is "on" a menu iff its group's
 * `menu_id` points at that menu — exactly how the public site (getMenu) resolves
 * it — so passing a menu isolates its tree from every other menu on the venue.
 * v1's single default menu owns every group, so the scope is a no-op there.
 * RLS scopes every row to the caller's tenant (security.md §2).
 */
export async function getAdminMenuTree(menuSlug?: string): Promise<AdminTree> {
  const supabase = await createClient();

  // Drafts included — the editor edits unpublished menus too.
  const { data: menuRows, error: mErr } = await supabase
    .from("menus")
    .select("id, name, slug, is_default, status, sort_order")
    .neq("status", "archived")
    .order("sort_order");
  if (mErr) throw new Error(`getAdminMenuTree: menus failed: ${mErr.message}`);

  const menus: AdminMenuOption[] = (menuRows ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    slug: m.slug,
    is_default: m.is_default,
    status: m.status,
  }));
  // Active menu: the requested slug → the default → the first.
  const active =
    (menuSlug ? menus.find((m) => m.slug === menuSlug) : undefined) ??
    menus.find((m) => m.is_default) ??
    menus[0] ??
    null;

  const [{ data: groupRows, error: gErr }, { data: catRows, error: cErr }] = await Promise.all([
    supabase.from("menu_groups").select("id, name, slug, sort_order, menu_id").order("sort_order"),
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

  const allCategories: AdminCategory[] = (catRows ?? []).map((c) => {
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
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      group_id: c.group_id,
      is_active: c.is_active,
      items,
    };
  });

  // Scope to the active menu's groups (group.menu_id is the menu link).
  const activeGroups = active
    ? (groupRows ?? []).filter((g) => g.menu_id === active.id)
    : (groupRows ?? []);

  const groups: AdminGroup[] = activeGroups.map((g) => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
    categories: allCategories.filter((c) => c.group_id === g.id),
  }));

  // Orphan categories (no group) sit on no menu, so they can't reach the
  // storefront. Surface them only on the default menu as a fix-me bucket
  // (normally empty) rather than repeating them under every menu.
  const ungrouped = active?.is_default
    ? allCategories.filter((c) => c.group_id === null)
    : [];

  const totalItems =
    groups.reduce((n, g) => n + g.categories.reduce((k, c) => k + c.items.length, 0), 0) +
    ungrouped.reduce((k, c) => k + c.items.length, 0);

  return {
    groups,
    ungrouped,
    totalItems,
    menus,
    activeSlug: active?.slug ?? "",
    activeName: active?.name ?? "Menu",
  };
}

/**
 * Categories for the item form's picker. When a menu slug is given, only that
 * menu's categories are offered — so an item added from one menu's editor lands
 * on that menu, not another. Without a slug, every category (tenant-scoped by RLS).
 */
export async function getCategoryOptions(menuSlug?: string): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();

  let groupIds: Set<string> | null = null;
  if (menuSlug) {
    const { data: menu } = await supabase
      .from("menus")
      .select("id")
      .eq("slug", menuSlug)
      .maybeSingle();
    if (menu) {
      const { data: groups } = await supabase
        .from("menu_groups")
        .select("id")
        .eq("menu_id", menu.id);
      groupIds = new Set((groups ?? []).map((g) => g.id));
    }
  }

  const { data } = await supabase
    .from("categories")
    .select("id, name, group_id, sort_order")
    .is("deleted_at", null)
    .order("sort_order");
  return (data ?? [])
    .filter((c) => groupIds == null || (c.group_id != null && groupIds.has(c.group_id)))
    .map((c) => ({ id: c.id, name: c.name }));
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
