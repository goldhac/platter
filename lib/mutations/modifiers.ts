"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireManager, type StaffContext } from "@/lib/rbac";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getActiveVenueId } from "@/lib/venue/active";

export type ModifierOption = { name: string; price_delta: number };
export type ModifierGroupInput = {
  name: string;
  name_zh?: string;
  min_select: number;
  max_select: number;
  is_required: boolean;
  options: ModifierOption[];
};
export type ModifierResult = { ok: true; id?: string } | { ok: false; error: string };

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

function bust() {
  revalidatePath("/admin/modifiers");
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
}

/** Create or update a modifier group and replace its options (A13). */
export async function saveModifierGroup(
  id: string | null,
  input: ModifierGroupInput,
): Promise<ModifierResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Name is required" };

  const supabase = await createClient();
  const restaurantId = await resolveRestaurantId(supabase, staff);
  if (!restaurantId) return { ok: false, error: "No restaurant configured" };

  const fields = {
    name,
    name_zh: input.name_zh?.trim() || null,
    min_select: input.min_select,
    max_select: input.max_select,
    is_required: input.is_required,
  };

  let groupId = id;
  if (groupId) {
    const { error: e } = await supabase.from("modifier_groups").update(fields).eq("id", groupId);
    if (e) return { ok: false, error: e.message };
  } else {
    const { data, error: e } = await supabase
      .from("modifier_groups")
      .insert({ tenant_id: staff.tenantId, restaurant_id: restaurantId, ...fields })
      .select("id")
      .single();
    if (e) return { ok: false, error: e.message };
    groupId = data.id;
  }

  await supabase.from("modifiers").delete().eq("group_id", groupId);
  const opts = input.options
    .map((o) => ({ name: (o.name ?? "").trim(), price_delta: Number(o.price_delta) || 0 }))
    .filter((o) => o.name);
  if (opts.length > 0) {
    const rows = opts.map((o, i) => ({
      tenant_id: staff.tenantId,
      group_id: groupId!,
      name: o.name,
      price_delta: o.price_delta,
      sort_order: (i + 1) * 1000,
    }));
    const { error: me } = await supabase.from("modifiers").insert(rows);
    if (me) return { ok: false, error: me.message };
  }

  bust();
  return { ok: true, id: groupId };
}

export async function deleteModifierGroup(id: string): Promise<ModifierResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };
  const supabase = await createClient();
  // modifiers + item_modifier_groups cascade on the group FK.
  const { error: e } = await supabase.from("modifier_groups").delete().eq("id", id);
  if (e) return { ok: false, error: e.message };
  bust();
  return { ok: true };
}

/** Which modifier groups apply to an item (replace-all). */
export async function setItemModifierGroups(
  itemId: string,
  groupIds: string[],
): Promise<ModifierResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };
  const supabase = await createClient();
  await supabase.from("item_modifier_groups").delete().eq("item_id", itemId);
  if (groupIds.length > 0) {
    const rows = groupIds.map((gid, i) => ({
      tenant_id: staff.tenantId,
      item_id: itemId,
      group_id: gid,
      sort_order: (i + 1) * 1000,
    }));
    const { error: e } = await supabase.from("item_modifier_groups").insert(rows);
    if (e) return { ok: false, error: e.message };
  }
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  return { ok: true };
}
