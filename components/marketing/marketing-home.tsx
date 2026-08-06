import Link from "next/link";
import type { CSSProperties } from "react";
import { HeroCycler } from "./hero-cycler";
import { MarketingShell } from "./marketing-shell";
import { listThemes, resolveTheme } from "@/lib/themes";

const FEATURES = [
  {
    title: "Snap your menu",
    body: "Photograph your paper menu — AI reads every dish, price, and section into an editable draft in seconds. Review, then publish.",
  },
  {
    title: "Four designer themes",
    body: "Pick a look that fits — dark and lacquered, clean and bright, editorial — and tune the accent to your brand, live.",
  },
  {
    title: "QR & print, always in sync",
    body: "Table QR codes and print-ready sheets come from the same menu, so the price on the wall can never disagree with the screen.",
  },
  {
    title: "Your own address",
    body: "Share a clean link today; connect your own domain when you're ready. Nothing for diners to download.",
  },
];

const pill = "rounded-card border border-hairline/25 px-3 py-2 text-sm text-porcelain/90";

export function MarketingHome() {
  const themes = listThemes();

  return (
    <MarketingShell>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-12 md:grid-cols-2 md:py-20">
        <div>
          <h1 className="font-display text-4xl leading-[1.1] text-porcelain md:text-6xl">
            Your restaurant menu, online in minutes.
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted">
            Snap a photo of your paper menu. Platter turns it into a beautiful, always-current
            digital menu — with QR codes, your own theme, and no app to download.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/admin/signup"
              className="rounded-card bg-accent px-5 py-3 text-sm font-medium text-porcelain outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              Get started free
            </Link>
            <Link
              href="/menu"
              className="rounded-card border border-hairline/30 px-5 py-3 text-sm text-muted outline-none hover:text-porcelain focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              See a live menu →
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted">Free to start · no card required.</p>
        </div>
        <HeroCycler />
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-x-10 gap-y-9 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title}>
              <h3 className="font-display text-xl text-porcelain">{f.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Themes strip */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl text-porcelain md:text-3xl">One menu, every look</h2>
          <Link href="/themes" className="shrink-0 text-sm text-brass hover:text-porcelain">
            Browse themes →
          </Link>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {themes.map((t) => {
            const resolved = resolveTheme(t.id, {});
            const v = resolved.cssVars as unknown as CSSProperties;
            return (
              <div
                key={t.id}
                style={v}
                data-theme={t.id}
                className="rounded-card border border-hairline/20 bg-bg p-4 text-text"
              >
                <div className="flex items-center justify-between">
                  <span className="h-6 w-6 rounded-full bg-accent" />
                  <span className="tabular text-[0.55rem] uppercase tracking-widest text-accent">
                    {resolved.scheme}
                  </span>
                </div>
                <p className="mt-6 font-display text-lg text-text">{t.name}</p>
                <p className="line-clamp-2 text-xs text-text/60">{t.tagline}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-card border border-hairline/20 p-6">
            <p className="font-display text-xl text-porcelain">Free</p>
            <p className="mt-1 text-sm text-muted">Everything to get one menu online.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={pill}>1 menu</span>
              <span className={pill}>AI import</span>
              <span className={pill}>QR codes</span>
            </div>
          </div>
          <div className="rounded-card border border-brass/40 p-6">
            <p className="font-display text-xl text-brass">Pro</p>
            <p className="mt-1 text-sm text-muted">For multiple menus, themes, and your own domain.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={pill}>Unlimited menus</span>
              <span className={pill}>All themes</span>
              <span className={pill}>Custom domain</span>
              <span className={pill}>Team seats</span>
            </div>
          </div>
        </div>
        <div className="mt-5">
          <Link href="/pricing" className="text-sm text-brass hover:text-porcelain">
            See full pricing →
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="mx-auto max-w-xl font-display text-3xl text-porcelain md:text-4xl">
          Put your menu online tonight.
        </h2>
        <div className="mt-7">
          <Link
            href="/admin/signup"
            className="inline-block rounded-card bg-accent px-6 py-3 text-sm font-medium text-porcelain outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            Get started free
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
