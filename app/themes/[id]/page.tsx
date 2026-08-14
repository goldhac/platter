import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { getTheme, listThemes, resolveTheme, THEMES } from "@/lib/themes";
import type { SchemeId, ThemeManifest } from "@/lib/themes";

// One shipped theme, shown in full: a live preview of a sample menu rendered in the theme,
// plus its capabilities (schemes · layouts · accents). Static — the registry is code.
export const dynamic = "error";

export function generateStaticParams() {
  return listThemes().map((t) => ({ id: t.id }));
}

function known(id: string): id is ThemeManifest["id"] {
  return id in THEMES;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!known(id)) return { title: "Theme not found — Platter" };
  const t = getTheme(id);
  return {
    title: `${t.name} — Platter themes`,
    description: `${t.tagline} Best for ${t.bestFor.join(", ")}.`,
  };
}

const SAMPLE: { section: string; items: [string, string][] }[] = [
  {
    section: "To Start",
    items: [
      ["Seared Scallops", "£18"],
      ["Burrata & Heirloom Tomato", "£14"],
      ["Steak Tartare", "£16"],
    ],
  },
  {
    section: "Mains",
    items: [
      ["Aged Ribeye, 300g", "£29"],
      ["Wild Sea Bass", "£24"],
      ["Wild Mushroom Risotto", "£19"],
    ],
  },
];

/** A sample menu rendered entirely in one theme + scheme (the same cssVars the real menu uses). */
function ThemePreview({ id, scheme }: { id: string; scheme: SchemeId }) {
  const resolved = resolveTheme(id, { scheme });
  const v = resolved.cssVars as unknown as CSSProperties;
  return (
    <div className="overflow-hidden rounded-card border border-hairline/20">
      <div style={v} data-theme={id} className="bg-bg px-6 py-7 text-text">
        <div className="flex items-baseline justify-between border-b border-hairline/30 pb-3">
          <span className="font-display text-2xl text-text">La Maison</span>
          <span className="tabular text-[0.6rem] uppercase tracking-widest text-accent">
            {scheme}
          </span>
        </div>
        {SAMPLE.map((s) => (
          <div key={s.section} className="mt-5">
            <h3 className="tabular text-[0.7rem] uppercase tracking-[0.22em] text-hairline">
              {s.section}
            </h3>
            <ul className="mt-1.5">
              {s.items.map(([n, p]) => (
                <li
                  key={n}
                  className="flex items-baseline justify-between gap-4 border-b border-hairline/15 py-2.5"
                >
                  <span className="font-display text-[0.95rem] text-text">{n}</span>
                  <span className="tabular text-sm text-text">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function ThemeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!known(id)) notFound();

  const t = getTheme(id);
  const others = listThemes().filter((o) => o.id !== t.id);

  return (
    <MarketingShell>
      <article className="mx-auto max-w-6xl px-6 py-12">
        <Link href="/themes" className="text-sm text-muted hover:text-porcelain">
          ← All themes
        </Link>

        <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-porcelain md:text-5xl">{t.name}</h1>
            <p className="mt-2 max-w-md text-muted">{t.tagline}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {t.bestFor.map((b) => (
                <span
                  key={b}
                  className="tabular rounded-card border border-hairline/25 px-2.5 py-1 text-[0.65rem] uppercase tracking-wider text-brass"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
          <Link
            href="/admin/signup"
            className="rounded-card bg-accent px-5 py-2.5 text-sm text-porcelain outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            Use this theme →
          </Link>
        </header>

        {/* Live preview — one panel per supported scheme */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {t.supports.schemes.map((s) => (
            <ThemePreview key={s} id={t.id} scheme={s} />
          ))}
        </div>

        {/* Capabilities */}
        <dl className="mt-10 grid gap-4 rounded-card border border-hairline/15 p-6 sm:grid-cols-3">
          <Spec label="Colour schemes">
            <span className="capitalize text-porcelain">{t.supports.schemes.join(" · ")}</span>
          </Spec>
          <Spec label="Layouts">
            <span className="text-porcelain">
              {t.layouts.map((l) => l.replace("-", " ")).join(" · ")}
            </span>
          </Spec>
          <Spec label="Photos">
            <span className="capitalize text-porcelain">{t.supports.images}</span>
          </Spec>
          <Spec label="Accent options">
            <span className="mt-1 flex flex-wrap gap-1.5">
              {t.accentChoices.map((c) => (
                <span
                  key={c}
                  title={c}
                  className="inline-block h-5 w-5 rounded-full border border-hairline/30"
                  style={{ backgroundColor: c }}
                />
              ))}
            </span>
          </Spec>
          <Spec label="Default layout">
            <span className="text-porcelain">{t.defaultLayout.replace("-", " ")}</span>
          </Spec>
          <Spec label="Marks">
            <span className="capitalize text-porcelain">{t.motif}</span>
          </Spec>
        </dl>

        {/* Other themes */}
        <section className="mt-14">
          <h2 className="font-display text-xl text-porcelain">Other themes</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {others.map((o) => (
              <Link
                key={o.id}
                href={`/themes/${o.id}`}
                className="rounded-card border border-hairline/20 px-4 py-3 outline-none hover:border-hairline/40 focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                <span className="font-display text-porcelain">{o.name}</span>
                <span className="mt-0.5 block text-xs text-muted">{o.tagline}</span>
              </Link>
            ))}
          </div>
        </section>
      </article>
    </MarketingShell>
  );
}

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="tabular text-[0.65rem] uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}
