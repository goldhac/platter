"use server";

import { revalidatePath } from "next/cache";
import { getCurrentStaff, requireManager } from "@/lib/rbac";
import { itemInsertSchema } from "@/lib/schemas";
import { slugify } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

export type MutationResult = { ok: true; id?: string } | { ok: false; error: string };

function bust() {
  revalidatePath("/admin/menu");
  revalidatePath("/menu"); // public menu is force-dynamic today; harmless + future-proof
}

/**
 * The sold-out toggle — the <10s flow (A5). Any staff role may do this; RLS +
 * the enforce_staff trigger guarantee only is_available changes for staff.
 */
export async function toggleItemAvailability(
  itemId: string,
  nextAvailable: boolean,
): Promise<MutationResult> {
  const staff = await getCurrentStaff();
  if (!staff) return { ok: false, error: "Not signed in" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("items")
    .update({ is_available: nextAvailable })
    .eq("id", itemId);
  if (error) return { ok: false, error: error.message };
  bust();
  return { ok: true };
}

/** Persist a new position after drag-reorder (A6). Manager+ (the staff trigger blocks sort_order changes). */
export async function reorderItem(itemId: string, newSortOrder: number): Promise<MutationResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };
  const supabase = await createClient();
  const { error: dbErr } = await supabase
    .from("items")
    .update({ sort_order: newSortOrder })
    .eq("id", itemId);
  if (dbErr) return { ok: false, error: dbErr.message };
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  return { ok: true };
}

/** Publish / unpublish a single item (a per-item precursor to M4's batch publish). */
export async function setItemStatus(
  itemId: string,
  status: "draft" | "published",
): Promise<MutationResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };
  const supabase = await createClient();
  const patch: { status: string; published_at?: string } = { status };
  if (status === "published") patch.published_at = new Date().toISOString();
  const { error: dbErr } = await supabase.from("items").update(patch).eq("id", itemId);
  if (dbErr) return { ok: false, error: dbErr.message };
  bust();
  return { ok: true };
}

/**
 * Publish every draft item on a menu at once — the "just imported a whole menu as drafts,
 * make it all live" action. Manager+; scoped to the menu via its groups → categories.
 */
export async function publishMenuDrafts(menuId: string): Promise<MutationResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };
  const supabase = await createClient();
  const { data: groups } = await supabase.from("menu_groups").select("id").eq("menu_id", menuId);
  const gids = (groups ?? []).map((g) => g.id);
  if (!gids.length) return { ok: true };
  const { data: cats } = await supabase
    .from("categories")
    .select("id")
    .in("group_id", gids)
    .is("deleted_at", null);
  const cids = (cats ?? []).map((c) => c.id);
  if (!cids.length) return { ok: true };
  const { error: dbErr } = await supabase
    .from("items")
    .update({ status: "published", published_at: new Date().toISOString() })
    .in("category_id", cids)
    .eq("status", "draft")
    .is("deleted_at", null);
  if (dbErr) return { ok: false, error: dbErr.message };
  bust();
  return { ok: true };
}

export async function softDeleteItem(itemId: string): Promise<MutationResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };
  const supabase = await createClient();
  const { error: dbErr } = await supabase
    .from("items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", itemId);
  if (dbErr) return { ok: false, error: dbErr.message };
  bust();
  return { ok: true };
}

export async function restoreItem(itemId: string): Promise<MutationResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };
  const supabase = await createClient();
  const { error: dbErr } = await supabase
    .from("items")
    .update({ deleted_at: null })
    .eq("id", itemId);
  if (dbErr) return { ok: false, error: dbErr.message };
  revalidatePath("/admin/menu");
  return { ok: true };
}

export async function createItem(input: unknown): Promise<MutationResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };

  const parsed = itemInsertSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;

  const supabase = await createClient();
  const { data: cat } = await supabase
    .from("categories")
    .select("id, restaurant_id, tenant_id")
    .eq("id", d.category_id)
    .single();
  if (!cat) return { ok: false, error: "Category not found" };

  const { data, error: dbErr } = await supabase
    .from("items")
    .insert({
      tenant_id: cat.tenant_id,
      restaurant_id: cat.restaurant_id,
      category_id: d.category_id,
      name: d.name,
      name_zh: d.name_zh || null,
      description: d.description || null,
      slug: d.slug ?? slugify(d.name),
      base_price: d.base_price,
      compare_at_price: d.compare_at_price ?? null,
      spice_level: d.spice_level,
      dietary_tags: d.dietary_tags,
      allergens: d.allergens,
      prep_time_minutes: d.prep_time_minutes ?? null,
      is_featured: d.is_featured,
      is_available: d.is_available,
      image_url: d.image_url ?? null,
      status: "draft", // every new item lands in draft (foundation.md §7 #8)
    })
    .select("id")
    .single();
  if (dbErr) return { ok: false, error: dbErr.message };
  bust();
  return { ok: true, id: data.id };
}

export async function updateItem(itemId: string, input: unknown): Promise<MutationResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };

  const parsed = itemInsertSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;

  const supabase = await createClient();
  const { error: dbErr } = await supabase
    .from("items")
    .update({
      category_id: d.category_id,
      name: d.name,
      name_zh: d.name_zh || null,
      description: d.description || null,
      slug: d.slug ?? slugify(d.name),
      base_price: d.base_price,
      compare_at_price: d.compare_at_price ?? null,
      spice_level: d.spice_level,
      dietary_tags: d.dietary_tags,
      allergens: d.allergens,
      prep_time_minutes: d.prep_time_minutes ?? null,
      is_featured: d.is_featured,
      is_available: d.is_available,
      image_url: d.image_url ?? null,
    })
    .eq("id", itemId);
  if (dbErr) return { ok: false, error: dbErr.message };
  bust();
  return { ok: true, id: itemId };
}

/**
 * The quick-edit drawer's save (the admin-on-public-menu layer): just name + price,
 * no slug change (keeps deep-links stable). Availability + publish/hide go through
 * toggleItemAvailability / setItemStatus. Manager+ — the staff trigger blocks the rest.
 */
export async function quickUpdateItem(
  itemId: string,
  patch: { name: string; base_price: number },
): Promise<MutationResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };
  const name = (patch.name ?? "").trim();
  if (!name) return { ok: false, error: "Name is required" };
  const price = Number(patch.base_price);
  if (!Number.isFinite(price) || price < 0) return { ok: false, error: "Price must be a number ≥ 0" };
  const supabase = await createClient();
  const { error: dbErr } = await supabase
    .from("items")
    .update({ name, base_price: price })
    .eq("id", itemId);
  if (dbErr) return { ok: false, error: dbErr.message };
  bust();
  return { ok: true, id: itemId };
}

export async function duplicateItem(itemId: string): Promise<MutationResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };
  const supabase = await createClient();
  const { data: it } = await supabase.from("items").select("*").eq("id", itemId).single();
  if (!it) return { ok: false, error: "Item not found" };

  const { data, error: dbErr } = await supabase
    .from("items")
    .insert({
      tenant_id: it.tenant_id,
      restaurant_id: it.restaurant_id,
      category_id: it.category_id,
      name: `${it.name} (copy)`,
      name_zh: it.name_zh,
      description: it.description,
      slug: slugify(`${it.name}-copy`),
      base_price: it.base_price,
      compare_at_price: it.compare_at_price,
      spice_level: it.spice_level,
      dietary_tags: it.dietary_tags,
      allergens: it.allergens,
      prep_time_minutes: it.prep_time_minutes,
      is_featured: it.is_featured,
      is_available: it.is_available,
      status: "draft",
    })
    .select("id")
    .single();
  if (dbErr) return { ok: false, error: dbErr.message };
  bust();
  return { ok: true, id: data.id };
}
