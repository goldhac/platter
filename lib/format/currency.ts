// The D1/D3 fix, in one place. Money is NEVER formatted by hand anywhere else
// (code-standards.md §6). Currency + locale come from the restaurant/tenant setting,
// not a hardcoded symbol (foundation.md §7 #5).

export type SecondaryCurrency = { code: string; rate: number };
export type MoneyOpts = { currency?: string; locale?: string; secondary?: SecondaryCurrency | null };

const DEFAULTS = { currency: "NGN", locale: "en-NG" } as const;

/**
 * Optional dual-currency line: `formatSecondary(9000, { secondary: { code: "USD", rate: 0.00065 } })`
 * → "≈ $5.85". Returns null when no secondary currency is configured (or the code is invalid).
 * `rate` is secondary units per 1 primary unit.
 */
export function formatSecondary(amount: number, opts: MoneyOpts = {}): string | null {
  const sec = opts.secondary;
  if (!sec || !sec.code || !(sec.rate > 0)) return null;
  const converted = amount * sec.rate;
  try {
    const s = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: sec.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: converted < 20 ? 2 : 0,
    }).format(converted);
    return `≈ ${s}`;
  } catch {
    return null; // unknown ISO currency code
  }
}

/**
 * Format an amount as a grouped currency string with no decimals on whole amounts.
 * `formatMoney(6000)` → "₦6,000"; `formatMoney(19500)` → "₦19,500"; `formatMoney(6.5)` → "₦6.50".
 */
export function formatMoney(amount: number, opts: MoneyOpts = {}): string {
  const currency = opts.currency ?? DEFAULTS.currency;
  const locale = opts.locale ?? DEFAULTS.locale;
  const whole = Number.isInteger(amount);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Variant/"from" price shown on a card: `formatFrom(6000)` → "from ₦6,000". */
export function formatFrom(amount: number, opts: MoneyOpts = {}): string {
  return `from ${formatMoney(amount, opts)}`;
}
