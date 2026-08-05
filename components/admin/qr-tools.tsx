"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function download(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
}

export function QrTools({ siteUrl, venuePath }: { siteUrl: string; venuePath: string }) {
  const [table, setTable] = useState("");
  const [png, setPng] = useState("");
  const [busy, setBusy] = useState(false);

  const t = table.trim();
  const suffix = t ? `-t${t}` : "";
  const url = `${siteUrl}${venuePath}${t ? `?t=${encodeURIComponent(t)}` : ""}`;

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 512,
      margin: 1,
      color: { dark: "#14110fff", light: "#f7f4eeff" },
    })
      .then(setPng)
      .catch(() => setPng(""));
  }, [url]);

  async function downloadSvg() {
    const svg = await QRCode.toString(url, {
      type: "svg",
      margin: 1,
      color: { dark: "#14110fff", light: "#f7f4eeff" },
    });
    download(
      URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })),
      `menu-qr${suffix}.svg`,
    );
  }

  async function downloadPdf() {
    setBusy(true);
    try {
      // Plain black/white for print scannability.
      const qrForPrint = await QRCode.toDataURL(url, { width: 600, margin: 1 });
      const { generateTableTentPdf } = await import("@/lib/table-tent");
      const blob = await generateTableTentPdf(qrForPrint, t);
      download(URL.createObjectURL(blob), `table-tent${suffix}.pdf`);
    } catch {
      toast.error("Could not generate the PDF");
    } finally {
      setBusy(false);
    }
  }

  const btn =
    "rounded-card border border-hairline/30 px-3 py-2 text-sm text-muted outline-none hover:text-porcelain focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-50";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start gap-5">
        <div className="rounded-card border border-hairline/25 bg-porcelain p-3">
          {png ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={png} alt="Menu QR code" width={180} height={180} />
          ) : (
            <div className="h-[180px] w-[180px]" />
          )}
        </div>

        <div className="space-y-3">
          <div>
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
              Table number (optional)
            </span>
            <input
              value={table}
              onChange={(e) => setTable(e.target.value)}
              inputMode="numeric"
              placeholder="e.g. 12"
              className="tabular w-32 rounded-card border border-hairline/30 bg-black/20 px-3 py-2 text-sm text-porcelain outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => png && download(png, `menu-qr${suffix}.png`)} className={btn}>
              PNG
            </button>
            <button type="button" onClick={downloadSvg} className={btn}>
              SVG
            </button>
            <button type="button" onClick={downloadPdf} disabled={busy} className={btn}>
              {busy ? "Building…" : "A6 table-tent PDF"}
            </button>
          </div>
          <p className="tabular break-all text-xs text-muted">{url}</p>
        </div>
      </div>
    </div>
  );
}
