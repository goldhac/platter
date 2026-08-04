export type OpeningHour = {
  weekday: number; // 0 = Sunday … 6 = Saturday
  opens: string | null; // "11:00:00"
  closes: string | null;
  is_closed: boolean;
};

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const hhmm = (t: string) => t.slice(0, 5); // "22:00:00" → "22:00"

/** Open/closed state for a restaurant, evaluated in its own timezone. */
export function getOpenState(
  hours: OpeningHour[],
  timezone: string,
  now: Date = new Date(),
): { open: boolean; label: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const wd = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const weekday = WEEKDAY_INDEX[wd] ?? 0;
  const nowMin = hour * 60 + minute;

  const today = hours.find((h) => h.weekday === weekday);
  if (!today || today.is_closed || !today.opens || !today.closes) {
    return { open: false, label: "Closed today" };
  }

  const [oh, om] = today.opens.split(":").map(Number);
  const [ch, cm] = today.closes.split(":").map(Number);
  const openMin = oh * 60 + om;
  const closeMin = ch * 60 + cm;
  const open = nowMin >= openMin && nowMin < closeMin;

  return open
    ? { open: true, label: `Open until ${hhmm(today.closes)}` }
    : { open: false, label: `Closed · opens ${hhmm(today.opens)}` };
}
