"use server";

import { revalidatePath } from "next/cache";
import { requireManager, type StaffContext } from "@/lib/rbac";
import { categoryInputSchema } from "@/lib/schemas";
import { slugify } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import { getActiveVenueId } from "@/lib/venue/active";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type CategoryResult = { ok: true; id?: string } | { ok: false; error: string };

function bust() {
  revalidatePath("/admin/menu");
  revalidatePath("/admin/categories");
  revalidatePath("/menu");
}

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

export async function createCategory(input: unknown): Promise<CategoryResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };
  const parsed = categoryInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;

  const supabase = await createClient();
  const restaurantId = await resolveRestaurantId(supabase, staff);
  if (!restaurantId) return { ok: false, error: "No restaurant configured" };

  const { data, error: dbErr } = await supabase
    .from("categories")
    .insert({
      tenant_id: staff.tenantId,
      restaurant_id: restaurantId,
      name: d.name,
      name_zh: d.name_zh || null,
      description: d.description || null,
      slug: d.slug ?? slugify(d.name),
      group_id: d.group_id ?? null,
      available_from: d.available_from || null,
      available_to: d.available_to || null,
      is_active: d.is_active,
    })
    .select("id")
    .single();
  if (dbErr) return { ok: false, error: dbErr.message };
  bust();
  return { ok: true, id: data.id };
}

export async function updateCategory(id: string, input: unknown): Promise<CategoryResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };
  const parsed = categoryInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;

  const supabase = await createClient();
  const { error: dbErr } = await supabase
    .from("categories")
    .update({
      name: d.name,
      name_zh: d.name_zh || null,
      description: d.description || null,
      slug: d.slug ?? slugify(d.name),
      group_id: d.group_id ?? null,
      available_from: d.available_from || null,
      available_to: d.available_to || null,
      is_active: d.is_active,
    })
    .eq("id", id);
  if (dbErr) return { ok: false, error: dbErr.message };
  bust();
  return { ok: true, id };
}

export async function setCategoryActive(id: string, active: boolean): Promise<CategoryResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };
  const supabase = await createClient();
  const { error: dbErr } = await supabase
    .from("categories")
    .update({ is_active: active })
    .eq("id", id);
  if (dbErr) return { ok: false, error: dbErr.message };
  bust();
  return { ok: true, id };
}

/** Soft-delete, blocked while the category still has items (A12). */
export async function softDeleteCategory(id: string): Promise<CategoryResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };
  const supabase = await createClient();

  const { count } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id)
    .is("deleted_at", null);
  if ((count ?? 0) > 0) {
    return { ok: false, error: `Category still has ${count} item(s) — move or delete them first` };
  }

  const { error: dbErr } = await supabase
    .from("categories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (dbErr) return { ok: false, error: dbErr.message };
  bust();
  return { ok: true, id };
}
