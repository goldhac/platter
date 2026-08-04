import { QrTools } from "@/components/admin/qr-tools";

export const dynamic = "force-dynamic";

export default function QrPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <div>
      <h1 className="font-display text-2xl text-porcelain">QR codes</h1>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Print these for tables. They point at{" "}
        <span className="tabular text-porcelain">{siteUrl}/menu</span> — set your real domain in the
        env before printing for production. The printed code never changes when the menu changes.
      </p>
      <div className="mt-5">
        <QrTools siteUrl={siteUrl} />
      </div>
    </div>
  );
}
