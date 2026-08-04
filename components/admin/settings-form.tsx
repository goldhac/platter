"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { OpeningHourRow, RestaurantSettings } from "@/lib/queries/admin-settings";
import { saveSettings } from "@/lib/mutations/settings";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const field =
  "w-full rounded-card border border-hairline/30 bg-black/20 px-3 py-2.5 text-sm text-porcelain outline-none focus-visible:ring-2 focus-visible:ring-accent/70";
const label = "mb-1 block text-xs uppercase tracking-wider text-muted";

type HourEdit = { weekday: number; opens: string; closes: string; is_closed: boolean };

export function SettingsForm({
  restaurant,
  hours: initialHours,
}: {
  restaurant: RestaurantSettings;
  hours: OpeningHourRow[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: restaurant.name,
    name_zh: restaurant.name_zh ?? "",
    phone: restaurant.phone ?? "",
    whatsapp: restaurant.whatsapp ?? "",
    address: restaurant.address ?? "",
    currency: restaurant.currency,
    timezone: restaurant.timezone,
    ordering_enabled: restaurant.ordering_enabled,
    sold_out_reset_time: restaurant.sold_out_reset_time.slice(0, 5),
    accent: restaurant.accent,
  });
  const [hours, setHours] = useState<HourEdit[]>(
    initialHours.map((h) => ({
      weekday: h.weekday,
      opens: (h.opens ?? "11:00:00").slice(0, 5),
      closes: (h.closes ?? "22:00:00").slice(0, 5),
      is_closed: h.is_closed,
    })),
  );

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function setHour(weekday: number, patch: Partial<HourEdit>) {
    setHours((arr) => arr.map((h) => (h.weekday === weekday ? { ...h, ...patch } : h)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await saveSettings({ ...form, hours });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Settings saved");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className={label}>Restaurant name</span>
          <input className={field} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <span className={label}>Name (中文)</span>
          <input
            className={`${field} font-cjk`}
            value={form.name_zh}
            onChange={(e) => set("name_zh", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className={label}>Phone</span>
          <input className={field} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <span className={label}>WhatsApp</span>
          <input
            className={field}
            value={form.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
          />
        </div>
      </div>

      <div>
        <span className={label}>Address</span>
        <input className={field} value={form.address} onChange={(e) => set("address", e.target.value)} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <span className={label}>Currency</span>
          <input
            className={`${field} tabular`}
            maxLength={3}
            value={form.currency}
            onChange={(e) => set("currency", e.target.value.toUpperCase())}
          />
        </div>
        <div>
          <span className={label}>Timezone</span>
          <input
            className={`${field} tabular`}
            value={form.timezone}
            onChange={(e) => set("timezone", e.target.value)}
          />
        </div>
        <div>
          <span className={label}>Sold-out reset</span>
          <input
            type="time"
            className={`${field} tabular`}
            value={form.sold_out_reset_time}
            onChange={(e) => set("sold_out_reset_time", e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-porcelain">
          <span className={label + " mb-0"}>Accent</span>
          <input
            type="color"
            value={form.accent}
            onChange={(e) => set("accent", e.target.value)}
            className="h-8 w-12 rounded border border-hairline/30 bg-transparent"
            aria-label="Theme accent colour"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-porcelain">
          <input
            type="checkbox"
            checked={form.ordering_enabled}
            onChange={(e) => set("ordering_enabled", e.target.checked)}
            className="accent-[var(--color-lacquer)]"
          />
          Ordering enabled
        </label>
      </div>

      <div>
        <span className={label}>Opening hours</span>
        <div className="space-y-1.5">
          {hours.map((h) => (
            <div key={h.weekday} className="flex items-center gap-2">
              <span className="w-24 text-sm text-porcelain">{DAYS[h.weekday]}</span>
              <input
                type="time"
                disabled={h.is_closed}
                value={h.opens}
                onChange={(e) => setHour(h.weekday, { opens: e.target.value })}
                className={`${field} tabular w-28 disabled:opacity-40`}
              />
              <span className="text-muted">–</span>
              <input
                type="time"
                disabled={h.is_closed}
                value={h.closes}
                onChange={(e) => setHour(h.weekday, { closes: e.target.value })}
                className={`${field} tabular w-28 disabled:opacity-40`}
              />
              <label className="ml-2 flex items-center gap-1.5 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={h.is_closed}
                  onChange={(e) => setHour(h.weekday, { is_closed: e.target.checked })}
                  className="accent-[var(--color-lacquer)]"
                />
                Closed
              </label>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-card bg-accent px-4 py-2.5 text-sm font-medium text-porcelain outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
