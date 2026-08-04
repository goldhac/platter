"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";

export type BulkResult = { ok: true; count: number } | { ok: false; error: string };

function bust() {
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
}

export async function bulkSetAvailable(ids: string[], available: boolean): Promise<BulkResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };
  if (ids.length === 0) return { ok: true, count: 0 };
  const supabase = await createClient();
  const { error: e } = await supabase.from("items").update({ is_available: available }).in("id", ids);
  if (e) return { ok: false, error: e.message };
  bust();
  return { ok: true, count: ids.length };
}

export async function bulkSetStatus(
  ids: string[],
  status: "draft" | "published",
): Promise<BulkResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };
  if (ids.length === 0) return { ok: true, count: 0 };
  const supabase = await createClient();
  const patch: { status: string; published_at?: string } = { status };
  if (status === "published") patch.published_at = new Date().toISOString();
  const { error: e } = await supabase.from("items").update(patch).in("id", ids);
  if (e) return { ok: false, error: e.message };
  bust();
  return { ok: true, count: ids.length };
}

export async function bulkMoveCategory(ids: string[], categoryId: string): Promise<BulkResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };
  if (ids.length === 0) return { ok: true, count: 0 };
  const supabase = await createClient();
  const { data: cat } = await supabase.from("categories").select("id").eq("id", categoryId).maybeSingle();
  if (!cat) return { ok: false, error: "Category not found" };
  const { error: e } = await supabase.from("items").update({ category_id: categoryId }).in("id", ids);
  if (e) return { ok: false, error: e.message };
  bust();
  return { ok: true, count: ids.length };
}

export async function bulkDelete(ids: string[]): Promise<BulkResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };
  if (ids.length === 0) return { ok: true, count: 0 };
  const supabase = await createClient();
  const { error: e } = await supabase
    .from("items")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", ids);
  if (e) return { ok: false, error: e.message };
  bust();
  return { ok: true, count: ids.length };
}

/** Adjust base price by a percentage or a flat amount; rounds to whole units. (A9) */
export async function bulkAdjustPrice(
  ids: string[],
  mode: "percent" | "flat",
  value: number,
): Promise<BulkResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };
  if (ids.length === 0) return { ok: true, count: 0 };
  if (!Number.isFinite(value)) return { ok: false, error: "Invalid amount" };

  const supabase = await createClient();
  const { data: items } = await supabase.from("items").select("id, base_price").in("id", ids);
  if (!items) return { ok: false, error: "Items not found" };

  for (const it of items) {
    const raw = mode === "percent" ? it.base_price * (1 + value / 100) : it.base_price + value;
    const next = Math.max(0, Math.round(raw));
    const { error: e } = await supabase.from("items").update({ base_price: next }).eq("id", it.id);
    if (e) return { ok: false, error: e.message };
  }
  bust();
  return { ok: true, count: items.length };
}
