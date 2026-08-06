import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { listThemes, resolveTheme } from "@/lib/themes";

export const metadata: Metadata = {
  title: "Themes — Platter",
  description: "Four designer themes for your menu — from dark and lacquered to clean and bright.",
};

const SAMPLE: [string, string][] = [
  ["Seared Scallops", "£18"],
  ["Aged Ribeye", "£29"],
  ["Chocolate Tart", "£9"],
];

export default function ThemesPage() {
  const themes = listThemes();

  return (
    <MarketingShell>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="font-display text-4xl text-porcelain md:text-5xl">Themes</h1>
        <p className="mt-3 max-w-lg text-muted">
          Every Platter menu is styled by a theme — a full look, from colours to type to layout.
          Switch anytime; your dishes stay put.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {themes.map((t) => {
            const resolved = resolveTheme(t.id, {});
            const v = resolved.cssVars as unknown as CSSProperties;
            return (
              <div key={t.id} className="overflow-hidden rounded-card border border-hairline/20">
                <div style={v} data-theme={t.id} className="bg-bg p-6 text-text">
                  <div className="flex items-baseline justify-between border-b border-hairline/25 pb-3">
                    <span className="font-display text-xl text-text">La Maison</span>
                    <span className="tabular text-[0.6rem] uppercase tracking-widest text-accent">
                      {resolved.scheme}
                    </span>
                  </div>
                  <ul className="mt-3">
                    {SAMPLE.map(([n, p]) => (
                      <li
                        key={n}
                        className="flex items-baseline justify-between border-b border-hairline/15 py-2.5"
                      >
                        <span className="font-display text-sm text-text">{n}</span>
                        <span className="tabular text-sm text-text">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-ink p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-display text-lg text-porcelain">{t.name}</p>
                    <span className="tabular text-[0.6rem] uppercase tracking-wider text-muted">
                      {t.layouts[0]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{t.tagline}</p>
                  <p className="mt-2 text-xs text-brass">{t.bestFor.join(" · ")}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/admin/signup"
            className="inline-block rounded-card bg-accent px-6 py-3 text-sm text-porcelain outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            Try them on your menu
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
