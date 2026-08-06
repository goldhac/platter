import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata: Metadata = {
  title: "Snap your menu — Platter",
  description:
    "Photograph your paper menu and get a beautiful digital menu with prices, sections, and QR codes — in minutes.",
};

const STEPS = [
  { n: "1", title: "Snap or upload", body: "Take a photo of your paper menu, or upload a PDF." },
  {
    n: "2",
    title: "AI reads it",
    body: "Every dish, price, and section is pulled into an editable draft in seconds.",
  },
  {
    n: "3",
    title: "Review & publish",
    body: "Fix anything, pick a theme, and your menu is live with a QR code.",
  },
];

export default function MenuImportLanding() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="font-display text-4xl text-porcelain md:text-5xl">
          Your paper menu, digital in minutes.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
          Snap a photo. Our AI reads every dish and price into a clean, editable menu — then you
          publish with a QR code. No typing it all out.
        </p>
        <div className="mt-8">
          <Link
            href="/admin/signup"
            className="inline-block rounded-card bg-accent px-6 py-3 text-sm font-medium text-porcelain outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            Try it free
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-8">
        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-card border border-hairline/20 p-5">
              <span className="tabular text-2xl text-brass">{s.n}</span>
              <h3 className="mt-2 font-display text-lg text-porcelain">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="font-display text-2xl text-porcelain">Works with any cuisine, any currency.</p>
        <div className="mt-6">
          <Link
            href="/admin/signup"
            className="inline-block rounded-card bg-accent px-6 py-3 text-sm text-porcelain outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            Get started free
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
