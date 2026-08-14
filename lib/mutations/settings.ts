"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { getActiveVenueId } from "@/lib/venue/active";

export type SettingsResult = { ok: true } | { ok: false; error: string };

export type SettingsInput = {
  name: string;
  name_zh?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  currency: string;
  timezone: string;
  ordering_enabled: boolean;
  sold_out_reset_time: string;
  accent: string;
  secondaryCode?: string;
  secondaryRate?: number | null;
  hours: { weekday: number; opens: string; closes: string; is_closed: boolean }[];
};

export async function saveSettings(input: SettingsInput): Promise<SettingsResult> {
  const { staff, error } = await requireOwner();
  if (!staff) return { ok: false, error };

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Restaurant name is required" };
  const currency = input.currency.trim().toUpperCase();
  if (currency.length !== 3) return { ok: false, error: "Currency must be a 3-letter code (e.g. NGN)" };

  const supabase = await createClient();
  const { data: r } = await supabase
    .from("restaurants")
    .select("id, theme")
    .eq("id", (await getActiveVenueId(staff.tenantId)) ?? "")
    .maybeSingle();
  if (!r) return { ok: false, error: "Restaurant not found" };

  const secondaryCode = (input.secondaryCode ?? "").trim().toUpperCase();
  const secondaryCurrency =
    secondaryCode.length === 3 && (input.secondaryRate ?? 0) > 0
      ? { code: secondaryCode, rate: input.secondaryRate }
      : undefined; // omitted from the jsonb → dual-currency off
  const theme = {
    ...((r.theme ?? {}) as Record<string, unknown>),
    accent: input.accent,
    secondaryCurrency,
  };
  const { error: rErr } = await supabase
    .from("restaurants")
    .update({
      name,
      name_zh: input.name_zh?.trim() || null,
      phone: input.phone?.trim() || null,
      whatsapp: input.whatsapp?.trim() || null,
      address: input.address?.trim() || null,
      currency,
      timezone: input.timezone,
      ordering_enabled: input.ordering_enabled,
      sold_out_reset_time: input.sold_out_reset_time,
      theme,
    })
    .eq("id", r.id);
  if (rErr) return { ok: false, error: rErr.message };

  await supabase.from("opening_hours").delete().eq("restaurant_id", r.id);
  const rows = input.hours.map((h) => ({
    tenant_id: staff.tenantId,
    restaurant_id: r.id,
    weekday: h.weekday,
    opens: h.is_closed ? null : h.opens || null,
    closes: h.is_closed ? null : h.closes || null,
    is_closed: h.is_closed,
  }));
  const { error: hErr } = await supabase.from("opening_hours").insert(rows);
  if (hErr) return { ok: false, error: hErr.message };

  revalidatePath("/admin/settings");
  revalidatePath("/menu");
  return { ok: true };
}
