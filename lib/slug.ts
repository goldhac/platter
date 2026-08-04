/**
 * Derive a URL slug from a display name (fixes D2 — real slugs, not template
 * leftovers). Strips accents so "Jīn Cāntīng" → "jin-canting".
 */
export function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
  return s || "item";
}
