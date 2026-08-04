"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";

export type VariantInput = { label: string; price: number };
export type VariantResult = { ok: true } | { ok: false; error: string };

/**
 * Replace an item's variants with the given set (delete-all + insert). Variants
 * aren't referenced elsewhere in v1, so a full replace is safe and simplest.
 */
export async function setItemVariants(
  itemId: string,
  variants: VariantInput[],
): Promise<VariantResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };

  const clean = variants
    .map((v) => ({ label: (v.label ?? "").trim(), price: Number(v.price) }))
    .filter((v) => v.label.length > 0);
  for (const v of clean) {
    if (!Number.isFinite(v.price) || v.price < 0) {
      return { ok: false, error: `Invalid price for "${v.label}"` };
    }
  }

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("items")
    .select("tenant_id")
    .eq("id", itemId)
    .single();
  if (!item) return { ok: false, error: "Item not found" };

  const { error: delErr } = await supabase.from("item_variants").delete().eq("item_id", itemId);
  if (delErr) return { ok: false, error: delErr.message };

  if (clean.length > 0) {
    const rows = clean.map((v, i) => ({
      tenant_id: item.tenant_id,
      item_id: itemId,
      label: v.label,
      price: v.price,
      sort_order: (i + 1) * 1000,
    }));
    const { error: insErr } = await supabase.from("item_variants").insert(rows);
    if (insErr) return { ok: false, error: insErr.message };
  }

  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  return { ok: true };
}
