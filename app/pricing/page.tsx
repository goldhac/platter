import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Pricing — Platter",
  description: "Start free. Upgrade to Pro for unlimited menus, every theme, and your own domain.",
};

const ROWS: { label: string; free: string; pro: string }[] = [
  { label: "Menus", free: "1", pro: "Unlimited" },
  { label: "AI menu import", free: "✓", pro: "✓" },
  { label: "QR codes & print", free: "✓", pro: "✓" },
  { label: "Themes", free: "Lacquer", pro: "All 4 + live customiser" },
  { label: "Custom domain", free: "—", pro: "✓" },
  { label: "Team seats", free: "1 (owner)", pro: String(PLANS.pro.teamSeats) },
  { label: "Platter branding", free: "Shown", pro: "Removed" },
];

export default function PricingPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-center font-display text-4xl text-porcelain md:text-5xl">Simple pricing</h1>
        <p className="mt-3 text-center text-muted">Start free. Upgrade when you need more.</p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-card border border-hairline/20 p-6">
            <p className="font-display text-2xl text-porcelain">Free</p>
            <p className="tabular mt-2 text-3xl text-porcelain">₦0</p>
            <p className="mt-1 text-sm text-muted">forever</p>
            <Link
              href="/admin/signup"
              className="mt-6 block rounded-card border border-hairline/30 py-2.5 text-center text-sm text-porcelain outline-none hover:border-brass focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              Get started
            </Link>
          </div>
          <div className="rounded-card border border-brass/40 p-6">
            <p className="font-display text-2xl text-brass">Pro</p>
            <p className="tabular mt-2 text-3xl text-porcelain">Coming soon</p>
            <p className="mt-1 text-sm text-muted">card checkout launching shortly</p>
            <Link
              href="/admin/signup"
              className="mt-6 block rounded-card bg-accent py-2.5 text-center text-sm text-porcelain outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              Start free, upgrade later
            </Link>
          </div>
        </div>

        <div className="mt-14">
          <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-2 border-b border-hairline/20 pb-2 text-[0.7rem] uppercase tracking-wider text-muted">
            <span />
            <span>Free</span>
            <span className="text-brass">Pro</span>
          </div>
          {ROWS.map((r) => (
            <div
              key={r.label}
              className="grid grid-cols-[1.5fr_1fr_1fr] gap-2 border-b border-hairline/10 py-3 text-sm"
            >
              <span className="text-muted">{r.label}</span>
              <span className="tabular text-porcelain">{r.free}</span>
              <span className="tabular text-porcelain">{r.pro}</span>
            </div>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
