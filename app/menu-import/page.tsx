import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata: Metadata = {
  title: "Snap your menu — Platter",
  description:
    "Photograph your paper menu and get a beautiful digital menu with prices, sections, and QR codes — in minutes.",
};

const STEPS = [
  { n: "01", title: "Snap or upload", body: "Take a photo of your paper menu, or upload a PDF." },
  { n: "02", title: "AI reads it", body: "Every dish, price, and section is pulled into an editable draft in seconds." },
  { n: "03", title: "Review & publish", body: "Fix anything, pick a theme, and your menu is live with a QR code." },
];

const cta =
  "inline-flex items-center rounded-sm bg-accent px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.08em] text-on-accent outline-none transition-colors hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent/50";

export default function MenuImportLanding() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-4xl px-6 py-20 md:py-28">
        <div className="flex items-center gap-3">
          <span className="h-px w-9 bg-hairline-strong" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-hairline-strong">AI menu import</span>
        </div>
        <h1 className="mt-6 max-w-[16ch] font-display text-[clamp(40px,7vw,72px)] font-normal leading-[0.95] tracking-[-0.03em] text-text">
          Your paper menu, <span className="italic text-accent-text">digital in minutes.</span>
        </h1>
        <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-text-secondary">
          Snap a photo. Our AI reads every dish and price into a clean, editable menu — then you publish with a QR code.
          No typing it all out.
        </p>
        <div className="mt-9">
          <Link href="/admin/signup" className={cta}>
            Try it free
          </Link>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-md border border-hairline bg-surface p-6">
              <span className="font-mono text-lg tracking-[0.05em] text-hairline-strong">{s.n}</span>
              <h3 className="mt-3 font-display text-xl tracking-[-0.01em] text-text">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-hairline">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="font-display text-[clamp(28px,4vw,44px)] leading-tight tracking-[-0.02em] text-text">
            Works with any cuisine, any currency.
          </p>
          <div className="mt-7">
            <Link href="/admin/signup" className={cta}>
              Get started free
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
