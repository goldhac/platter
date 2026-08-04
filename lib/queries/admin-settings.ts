import { getCurrentStaff } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";

export type RestaurantSettings = {
  id: string;
  name: string;
  name_zh: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  currency: string;
  timezone: string;
  ordering_enabled: boolean;
  sold_out_reset_time: string;
  accent: string;
};

export type OpeningHourRow = {
  weekday: number;
  opens: string | null;
  closes: string | null;
  is_closed: boolean;
};

const DEFAULT_ACCENT = "#8e1d1d";

export async function getRestaurantSettings(): Promise<{
  restaurant: RestaurantSettings | null;
  hours: OpeningHourRow[];
}> {
  const staff = await getCurrentStaff();
  if (!staff) return { restaurant: null, hours: [] };

  const supabase = await createClient();
  const { data: r } = await supabase
    .from("restaurants")
    .select(
      "id, name, name_zh, phone, whatsapp, address, currency, timezone, ordering_enabled, sold_out_reset_time, theme",
    )
    .eq("tenant_id", staff.tenantId)
    .limit(1)
    .maybeSingle();

  if (!r) return { restaurant: null, hours: [] };

  const theme = (r.theme ?? {}) as { accent?: string };
  const { data: hourRows } = await supabase
    .from("opening_hours")
    .select("weekday, opens, closes, is_closed")
    .eq("restaurant_id", r.id)
    .order("weekday");

  // Ensure all 7 weekdays are present (0=Sun … 6=Sat).
  const byDay = new Map((hourRows ?? []).map((h) => [h.weekday, h]));
  const hours: OpeningHourRow[] = Array.from({ length: 7 }, (_, weekday) => {
    const h = byDay.get(weekday);
    return {
      weekday,
      opens: h?.opens ?? "11:00:00",
      closes: h?.closes ?? "22:00:00",
      is_closed: h?.is_closed ?? false,
    };
  });

  return {
    restaurant: {
      id: r.id,
      name: r.name,
      name_zh: r.name_zh,
      phone: r.phone,
      whatsapp: r.whatsapp,
      address: r.address,
      currency: r.currency,
      timezone: r.timezone,
      ordering_enabled: r.ordering_enabled,
      sold_out_reset_time: r.sold_out_reset_time,
      accent: theme.accent ?? DEFAULT_ACCENT,
    },
    hours,
  };
}
