// The D1/D3 fix, in one place. Money is NEVER formatted by hand anywhere else
// (code-standards.md §6). Currency + locale come from the restaurant/tenant setting,
// not a hardcoded symbol (foundation.md §7 #5).

export type MoneyOpts = { currency?: string; locale?: string };

const DEFAULTS = { currency: "NGN", locale: "en-NG" } as const;

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
