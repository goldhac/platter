"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { parseCsv } from "@/lib/csv";
import { importItemsCsv, type ImportRow } from "@/lib/mutations/import";

export function CsvImport() {
  const router = useRouter();
  const [valid, setValid] = useState<ImportRow[]>([]);
  const [errors, setErrors] = useState<{ row: number; reason: string }[]>([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [importing, setImporting] = useState(false);

  function analyze(text: string) {
    if (!text.trim()) {
      setAnalyzed(false);
      return;
    }
    const parsed = parseCsv(text) as unknown as ImportRow[];
    const errs: { row: number; reason: string }[] = [];
    const ok: ImportRow[] = [];
    parsed.forEach((r, i) => {
      const category = (r.category ?? "").trim();
      const name = (r.name ?? "").trim();
      if (!category || !name) {
        errs.push({ row: i + 2, reason: "missing category or name" });
        return;
      }
      if (!Number.isFinite(Number(r.price))) {
        errs.push({ row: i + 2, reason: `invalid price "${r.price ?? ""}"` });
        return;
      }
      ok.push(r);
    });
    setValid(ok);
    setErrors(errs);
    setAnalyzed(true);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then(analyze);
  }

  async function doImport() {
    setImporting(true);
    const res = await importItemsCsv(valid);
    setImporting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`Imported ${res.itemsCreated} items · ${res.categoriesCreated} new categories`);
    router.push("/admin/menu");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Columns:{" "}
        <span className="tabular text-porcelain">
          category, name, name_zh, description, price, spice_level, dietary_tags, allergens,
          is_featured, status
        </span>
        . Tags use <span className="tabular">|</span> separators; items import as{" "}
        <span className="text-porcelain">draft</span>.
      </p>

      <input
        type="file"
        accept=".csv,text/csv"
        onChange={onFile}
        className="block w-full text-sm text-muted file:mr-3 file:rounded-card file:border file:border-hairline/30 file:bg-black/20 file:px-3 file:py-2 file:text-porcelain"
      />
      <textarea
        placeholder="…or paste CSV here"
        onChange={(e) => analyze(e.target.value)}
        rows={4}
        className="w-full rounded-card border border-hairline/30 bg-black/20 px-3 py-2 text-xs text-porcelain outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      />

      {analyzed && (
        <div className="rounded-card border border-hairline/20 p-4 text-sm">
          <div className="flex gap-4">
            <span className="text-positive">{valid.length} ready to import</span>
            {errors.length > 0 && <span className="text-accent">{errors.length} skipped</span>}
          </div>
          {errors.length > 0 && (
            <ul className="mt-2 max-h-32 space-y-0.5 overflow-y-auto text-xs text-muted">
              {errors.slice(0, 20).map((e) => (
                <li key={e.row}>
                  Row {e.row}: {e.reason}
                </li>
              ))}
            </ul>
          )}
          {valid.length > 0 && (
            <button
              type="button"
              onClick={doImport}
              disabled={importing}
              className="mt-3 rounded-card bg-accent px-4 py-2 text-sm font-medium text-porcelain disabled:opacity-50"
            >
              {importing ? "Importing…" : `Import ${valid.length} item${valid.length === 1 ? "" : "s"}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
