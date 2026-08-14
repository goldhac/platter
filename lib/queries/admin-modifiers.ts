import { getCurrentStaff } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { getActiveVenueId } from "@/lib/venue/active";

export type ModifierGroupRow = {
  id: string;
  name: string;
  is_required: boolean;
  min_select: number;
  max_select: number;
  option_count: number;
};

export async function getModifierGroups(): Promise<ModifierGroupRow[]> {
  const supabase = await createClient();
  const staff = await getCurrentStaff();
  const venueId = staff ? ((await getActiveVenueId(staff.tenantId)) ?? "") : "";
  const [{ data: groups }, { data: mods }] = await Promise.all([
    supabase
      .from("modifier_groups")
      .select("id, name, is_required, min_select, max_select")
      .eq("restaurant_id", venueId)
      .order("name"),
    supabase.from("modifiers").select("group_id"),
  ]);
  const counts = new Map<string, number>();
  for (const m of mods ?? []) counts.set(m.group_id, (counts.get(m.group_id) ?? 0) + 1);
  return (groups ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    is_required: g.is_required,
    min_select: g.min_select,
    max_select: g.max_select,
    option_count: counts.get(g.id) ?? 0,
  }));
}

export type EditableModifierGroup = {
  id: string;
  name: string;
  name_zh: string | null;
  min_select: number;
  max_select: number;
  is_required: boolean;
  options: { name: string; price_delta: number }[];
};

export async function getModifierGroupForEdit(id: string): Promise<EditableModifierGroup | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("modifier_groups")
    .select("id, name, name_zh, min_select, max_select, is_required, modifiers(name, price_delta, sort_order)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;

  const { modifiers, ...rest } = data;
  return {
    ...rest,
    options: (modifiers ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => ({ name: m.name, price_delta: m.price_delta })),
  };
}

export async function getModifierGroupOptions(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const staff = await getCurrentStaff();
  const venueId = staff ? ((await getActiveVenueId(staff.tenantId)) ?? "") : "";
  const { data } = await supabase
    .from("modifier_groups")
    .select("id, name")
    .eq("restaurant_id", venueId)
    .order("name");
  return (data ?? []).map((g) => ({ id: g.id, name: g.name }));
}

export async function getItemModifierGroupIds(itemId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("item_modifier_groups")
    .select("group_id")
    .eq("item_id", itemId);
  return (data ?? []).map((r) => r.group_id);
}
