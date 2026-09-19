import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PLAN_FEATURE_ROWS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Pricing — Platter",
  description: "Start free. Upgrade to Pro for unlimited menus, every theme, and your own domain.",
};

export default function PricingPage() {
  return (
    <MarketingShell active="pricing">
      <section className="mx-auto max-w-4xl px-6 py-20 md:py-28">
        <div className="flex items-center gap-3">
          <span className="h-px w-9 bg-hairline-strong" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-hairline-strong">Pricing</span>
        </div>
        <h1 className="mt-6 max-w-[15ch] font-display text-[clamp(40px,7vw,72px)] font-normal leading-[0.95] tracking-[-0.03em] text-text">
          Start free. Grow into <span className="italic text-accent-text">Pro.</span>
        </h1>
        <p className="mt-5 max-w-[54ch] text-lg leading-relaxed text-text-secondary">
          Everything you need to put a beautiful menu online is free — AI import, QR codes, print, your first menu. Pro
          adds unlimited menus, every theme, your own domain, and your team.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-hairline bg-surface p-7">
            <p className="font-display text-2xl text-text">Free</p>
            <p className="mt-3 font-mono text-4xl tracking-[-0.04em] text-text">₦0</p>
            <p className="mt-1 text-sm text-text-tertiary">forever</p>
            <Link
              href="/admin/signup"
              className="mt-7 block rounded-sm border border-hairline py-3 text-center text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary outline-none transition-colors hover:border-hairline-strong hover:text-text focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              Get started
            </Link>
          </div>
          <div className="rounded-md border border-hairline-strong/40 bg-surface p-7">
            <div className="flex items-center gap-2.5">
              <p className="font-display text-2xl text-text">Pro</p>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-hairline-strong">Coming soon</span>
            </div>
            <p className="mt-3 font-display text-3xl italic text-text-secondary">Coming soon</p>
            <p className="mt-1 text-sm text-text-tertiary">set up by hand while checkout is built</p>
            <Link
              href="/admin/signup"
              className="mt-7 block rounded-sm bg-accent py-3 text-center text-sm font-semibold uppercase tracking-[0.08em] text-on-accent outline-none transition-colors hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              Start free, upgrade later
            </Link>
          </div>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-[1fr_72px_96px] gap-3 border-b border-hairline-strong/40 pb-2.5 sm:grid-cols-[1fr_96px_120px]">
            <span />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-secondary">Free</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-hairline-strong">Pro</span>
          </div>
          {PLAN_FEATURE_ROWS.map((r) => (
            <div
              key={r.label}
              className="grid grid-cols-[1fr_72px_96px] items-center gap-3 border-b border-hairline py-3.5 sm:grid-cols-[1fr_96px_120px]"
            >
              <span className="text-sm text-text-secondary">{r.label}</span>
              <span className="font-mono text-[13px] tracking-[-0.02em] text-text">{r.free}</span>
              <span className="font-mono text-[13px] tracking-[-0.02em] text-text">{r.pro}</span>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-text-tertiary">
          Prices in Naira. Pro is set up by hand for now —{" "}
          <Link href="/admin/signup" className="text-hairline-strong underline-offset-2 hover:text-text hover:underline">
            start free
          </Link>{" "}
          and we&apos;ll help you upgrade when you need it.
        </p>
      </section>
    </MarketingShell>
  );
}
