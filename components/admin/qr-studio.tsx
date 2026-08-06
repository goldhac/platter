"use client";

import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function download(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
}

const DARK = "#14110fff";
const LIGHT = "#f7f4eeff";
const MAX_TABLES = 100;

export function QrStudio({
  siteUrl,
  venuePath,
  venueName,
  menus,
}: {
  siteUrl: string;
  venuePath: string;
  venueName: string;
  menus: { name: string; slug: string }[];
}) {
  const [menuSlug, setMenuSlug] = useState("");
  const [mode, setMode] = useState<"none" | "single" | "bulk">("none");
  const [single, setSingle] = useState("");
  const [bulkN, setBulkN] = useState("10");
  const [highEC, setHighEC] = useState(true);
  const [png, setPng] = useState("");
  const [busy, setBusy] = useState(false);

  const ec = highEC ? "H" : "M";

  const codeUrl = useMemo(
    () => (table?: string) => {
      const qs = new URLSearchParams();
      if (menuSlug) qs.set("m", menuSlug);
      if (table) qs.set("t", table);
      const q = qs.toString();
      return `${siteUrl}${venuePath}${q ? `?${q}` : ""}`;
    },
    [siteUrl, venuePath, menuSlug],
  );

  // The single code currently previewed (menu + optional single table).
  const previewUrl = codeUrl(mode === "single" ? single.trim() : undefined);
  const suffix = `${menuSlug ? `-${menuSlug}` : ""}${mode === "single" && single.trim() ? `-t${single.trim()}` : ""}`;

  useEffect(() => {
    QRCode.toDataURL(previewUrl, {
      width: 512,
      margin: 1,
      errorCorrectionLevel: ec,
      color: { dark: DARK, light: LIGHT },
    })
      .then(setPng)
      .catch(() => setPng(""));
  }, [previewUrl, ec]);

  async function downloadSvg() {
    const svg = await QRCode.toString(previewUrl, {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: ec,
      color: { dark: DARK, light: LIGHT },
    });
    download(URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })), `qr${suffix}.svg`);
  }

  async function downloadTent() {
    setBusy(true);
    try {
      const qrForPrint = await QRCode.toDataURL(previewUrl, { width: 600, margin: 1, errorCorrectionLevel: ec });
      const { generateTableTentPdf } = await import("@/lib/table-tent");
      const blob = await generateTableTentPdf(qrForPrint, mode === "single" ? single.trim() : "", venueName);
      download(URL.createObjectURL(blob), `table-tent${suffix}.pdf`);
    } catch {
      toast.error("Could not generate the PDF");
    } finally {
      setBusy(false);
    }
  }

  async function downloadSheet() {
    const n = Math.max(1, Math.min(MAX_TABLES, parseInt(bulkN, 10) || 0));
    if (n < 1) return;
    setBusy(true);
    try {
      const codes = [];
      for (let i = 1; i <= n; i++) {
        const p = await QRCode.toDataURL(codeUrl(String(i)), { width: 300, margin: 1, errorCorrectionLevel: ec });
        codes.push({ png: p, label: `Table ${i}` });
      }
      const { generateQrSheetPdf } = await import("@/lib/table-tent");
      const blob = await generateQrSheetPdf(codes, venueName);
      download(URL.createObjectURL(blob), `table-qr-sheet-1-${n}.pdf`);
      toast.success(`Sheet ready — tables 1–${n}`);
    } catch {
      toast.error("Could not generate the sheet");
    } finally {
      setBusy(false);
    }
  }

  const btn =
    "rounded-card border border-hairline/30 px-3 py-2 text-sm text-muted outline-none hover:text-porcelain focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-50";
  const seg = (active: boolean) =>
    `tabular rounded-card px-3 py-1.5 text-xs uppercase tracking-wider outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${active ? "bg-accent text-porcelain" : "border border-hairline/30 text-muted hover:text-porcelain"}`;
  const field =
    "rounded-card border border-hairline/30 bg-black/20 px-3 py-2 text-sm text-porcelain outline-none focus-visible:ring-2 focus-visible:ring-accent/70";

  return (
    <div className="flex flex-wrap items-start gap-6">
      {/* Preview */}
      <div className="shrink-0">
        <div className="rounded-card border border-hairline/25 bg-porcelain p-3">
          {png ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={png} alt="Menu QR code" width={190} height={190} />
          ) : (
            <div className="h-[190px] w-[190px]" />
          )}
        </div>
        {mode === "bulk" && <p className="mt-2 max-w-[214px] text-xs text-muted">Preview shows the base code; the sheet has one per table.</p>}
      </div>

      {/* Controls */}
      <div className="min-w-[240px] flex-1 space-y-5">
        {/* Menu target */}
        <div>
          <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Points at</span>
          <select value={menuSlug} onChange={(e) => setMenuSlug(e.target.value)} className={field}>
            <option value="" className="bg-ink">Whole venue (default menu)</option>
            {menus.map((m) => (
              <option key={m.slug} value={m.slug} className="bg-ink">{m.name}</option>
            ))}
          </select>
        </div>

        {/* Table mode */}
        <div>
          <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Table codes</span>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setMode("none")} className={seg(mode === "none")}>None</button>
            <button type="button" onClick={() => setMode("single")} className={seg(mode === "single")}>Single</button>
            <button type="button" onClick={() => setMode("bulk")} className={seg(mode === "bulk")}>Bulk 1–N</button>
          </div>
          {mode === "single" && (
            <input
              value={single}
              onChange={(e) => setSingle(e.target.value)}
              inputMode="numeric"
              placeholder="Table number, e.g. 12"
              className={`${field} tabular mt-2 w-40`}
            />
          )}
          {mode === "bulk" && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted">
              Tables 1 to
              <input
                value={bulkN}
                onChange={(e) => setBulkN(e.target.value)}
                inputMode="numeric"
                className={`${field} tabular w-20`}
              />
              <span className="text-xs">(max {MAX_TABLES})</span>
            </div>
          )}
        </div>

        {/* Error correction */}
        <div>
          <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Durability</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setHighEC(true)} className={seg(highEC)}>High</button>
            <button type="button" onClick={() => setHighEC(false)} className={seg(!highEC)}>Standard</button>
          </div>
          <p className="mt-1 text-xs text-muted">High survives scuffs and small logos; standard is denser.</p>
        </div>

        {/* Export */}
        <div className="flex flex-wrap gap-2 border-t border-hairline/15 pt-4">
          {mode === "bulk" ? (
            <button type="button" onClick={downloadSheet} disabled={busy} className={`${btn} bg-accent text-porcelain hover:opacity-90`}>
              {busy ? "Building sheet…" : "A4 sheet PDF (all tables)"}
            </button>
          ) : (
            <>
              <button type="button" onClick={() => png && download(png, `qr${suffix}.png`)} className={btn}>PNG</button>
              <button type="button" onClick={downloadSvg} className={btn}>SVG</button>
              <button type="button" onClick={downloadTent} disabled={busy} className={btn}>
                {busy ? "Building…" : "A6 table-tent PDF"}
              </button>
            </>
          )}
        </div>

        {mode !== "bulk" && <p className="tabular break-all text-xs text-muted">{previewUrl}</p>}
        <p className="text-xs text-muted">Scans show up in your Google Analytics by table and menu.</p>
      </div>
    </div>
  );
}
