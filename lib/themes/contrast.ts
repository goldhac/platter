// WCAG relative-luminance contrast (foundation.md §13 P3 — the accent picker's blocking check).
// A custom accent must keep its on-accent label readable (>= 4.5:1) — the customiser refuses to
// publish an unreadable accent (DESIGN-SPEC §3 · PRD §6.7).

function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const h = hex.replace("#", "").trim();
  if (h.length !== 6) return 0;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

/** WCAG contrast ratio between two hex colors (1..21). */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export const AA_TEXT = 4.5;

/** True if `on` (the label/glyph) reads acceptably on the `accent` fill. */
export function accentReadable(accent: string, onAccent: string): boolean {
  return contrastRatio(accent, onAccent) >= AA_TEXT;
}

/** A well-formed 6-digit hex like #ff5a1f. */
export function isHex(v: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(v.trim());
}
