/** Minimal RFC-4180-ish CSV helpers (no dependency). */

export function toCsv(rows: Record<string, string>[], columns: string[]): string {
  const esc = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const header = columns.map(esc).join(",");
  const lines = rows.map((r) => columns.map((c) => esc(r[c] ?? "")).join(","));
  return [header, ...lines].join("\n");
}

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (rows.length === 0) return [];

  const header = rows[0].map((h) => h.trim());
  return rows
    .slice(1)
    .filter((r) => r.some((c) => c.trim() !== ""))
    .map((r) => {
      const obj: Record<string, string> = {};
      header.forEach((h, i) => {
        obj[h] = (r[i] ?? "").trim();
      });
      return obj;
    });
}

/** Split a "a|b" or "a,b" cell into a clean array. */
export function parseList(cell: string | undefined): string[] {
  return (cell ?? "")
    .split(/[|,]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export const CSV_COLUMNS = [
  "category",
  "name",
  "name_zh",
  "description",
  "price",
  "spice_level",
  "dietary_tags",
  "allergens",
  "is_featured",
  "status",
] as const;
