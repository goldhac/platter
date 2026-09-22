"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { OpeningHourRow, RestaurantSettings } from "@/lib/queries/admin-settings";
import { saveSettings } from "@/lib/mutations/settings";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const field =
  "w-full rounded-sm border border-hairline bg-surface-sunken px-3.5 py-2.5 text-sm text-text outline-none placeholder:text-text-tertiary focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40";
const label = "mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary";

// Pickers instead of free text — a typo in either silently breaks price formatting or the
// open/closed pill (handoff §11.6).
const CURRENCY_CODES = [
  "NGN", "USD", "GBP", "EUR", "GHS", "KES", "ZAR", "XOF", "XAF", "EGP", "MAD", "TZS", "UGX",
  "CAD", "AUD", "INR", "AED",
];
function tzList(): string[] {
  try {
    const fn = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
    const all = fn?.("timeZone") ?? [];
    if (all.length) return all;
  } catch {
    // older runtime — fall through to a curated list
  }
  return [
    "Africa/Lagos", "Africa/Accra", "Africa/Nairobi", "Africa/Johannesburg", "Africa/Cairo",
    "Europe/London", "Europe/Paris", "America/New_York", "America/Los_Angeles", "Asia/Dubai", "UTC",
  ];
}
const TIMEZONES = tzList();

type HourEdit = { weekday: number; opens: string; closes: string; is_closed: boolean };

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-hairline-strong">{children}</span>
      <span className="h-px flex-1 bg-hairline" />
    </div>
  );
}

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
    secondaryCode: restaurant.secondary_code,
    secondaryRate: restaurant.secondary_rate != null ? String(restaurant.secondary_rate) : "",
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
    const res = await saveSettings({
      ...form,
      secondaryRate: form.secondaryRate.trim() ? Number(form.secondaryRate) : null,
      hours,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Settings saved");
    router.refresh();
  }

  // Keep whatever is stored selectable even if it's outside the common list.
  const currencyOptions = CURRENCY_CODES.includes(form.currency)
    ? CURRENCY_CODES
    : [form.currency, ...CURRENCY_CODES];
  const timezoneOptions = TIMEZONES.includes(form.timezone) ? TIMEZONES : [form.timezone, ...TIMEZONES];

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-5">
      {/* ── Venue ── */}
      <SectionHead>Venue</SectionHead>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <span className={label}>Phone</span>
          <input className={field} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <span className={label}>WhatsApp</span>
          <input className={field} value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
        </div>
      </div>
      <div>
        <span className={label}>Address</span>
        <input className={field} value={form.address} onChange={(e) => set("address", e.target.value)} />
      </div>

      {/* ── Hours ── */}
      <SectionHead>Hours</SectionHead>
      <div className="space-y-1.5">
        {hours.map((h) => (
          <div key={h.weekday} className="flex items-center gap-2">
            <span className="w-24 text-sm text-text">{DAYS[h.weekday]}</span>
            <input
              type="time"
              disabled={h.is_closed}
              value={h.opens}
              onChange={(e) => setHour(h.weekday, { opens: e.target.value })}
              className={`${field} w-28 font-mono disabled:opacity-40`}
            />
            <span className="text-text-tertiary">–</span>
            <input
              type="time"
              disabled={h.is_closed}
              value={h.closes}
              onChange={(e) => setHour(h.weekday, { closes: e.target.value })}
              className={`${field} w-28 font-mono disabled:opacity-40`}
            />
            <label className="ml-2 flex items-center gap-1.5 text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={h.is_closed}
                onChange={(e) => setHour(h.weekday, { is_closed: e.target.checked })}
                className="accent-[var(--color-accent)]"
              />
              Closed
            </label>
          </div>
        ))}
      </div>

      {/* ── Money & display ── */}
      <SectionHead>Money &amp; display</SectionHead>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <span className={label}>Currency</span>
          <select
            className={`${field} font-mono`}
            value={form.currency}
            onChange={(e) => set("currency", e.target.value)}
          >
            {currencyOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className={label}>Timezone</span>
          <select
            className={`${field} font-mono`}
            value={form.timezone}
            onChange={(e) => set("timezone", e.target.value)}
          >
            {timezoneOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className={label}>Sold-out reset</span>
          <input
            type="time"
            className={`${field} font-mono`}
            value={form.sold_out_reset_time}
            onChange={(e) => set("sold_out_reset_time", e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-sm border border-hairline p-3">
        <span className={label}>Second currency on prices (optional)</span>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            className={`${field} font-mono`}
            maxLength={3}
            placeholder="e.g. USD"
            value={form.secondaryCode}
            onChange={(e) => set("secondaryCode", e.target.value.toUpperCase())}
          />
          <input
            className={`${field} font-mono`}
            inputMode="decimal"
            placeholder={`rate per 1 ${form.currency || "unit"}`}
            value={form.secondaryRate}
            onChange={(e) => set("secondaryRate", e.target.value.replace(/[^0-9.]/g, ""))}
          />
        </div>
        <p className="mt-1.5 text-[0.7rem] text-text-secondary">
          Shows an “≈” second price in the item view. Rate = second-currency units per 1 {form.currency || "unit"}
          {form.secondaryCode && form.secondaryRate
            ? ` (e.g. 1,000 ${form.currency} ≈ ${(1000 * Number(form.secondaryRate || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${form.secondaryCode})`
            : ""}
          . Leave blank to turn off.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-text">
          <span className={`${label} mb-0`}>Accent</span>
          <input
            type="color"
            value={form.accent}
            onChange={(e) => set("accent", e.target.value)}
            className="h-8 w-12 rounded-sm border border-hairline bg-transparent"
            aria-label="Theme accent colour"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={form.ordering_enabled}
            onChange={(e) => set("ordering_enabled", e.target.checked)}
            className="accent-[var(--color-accent)]"
          />
          Ordering enabled
        </label>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-sm bg-accent px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.08em] text-on-accent outline-none transition-colors hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
