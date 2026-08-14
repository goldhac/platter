import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/format/currency";
import { getMenu } from "@/lib/queries/menu";
import { resolveTheme } from "@/lib/themes";
import { venueExists } from "@/lib/venue/resolve";
import { PrintButton } from "@/components/menu/print-button";

// A printable, paper-optimized menu (Cmd/Ctrl-P → Save as PDF). Print is a distinct output
// medium — like the OG image route — so it renders on paper colours, but keeps the venue's
// theme fonts + accent so it still feels on-brand.
export const dynamic = "force-dynamic";

export default async function MenuPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  const { venue } = await params;
  const { m } = await searchParams;
  if (!(await venueExists(venue))) notFound();

  const menu = await getMenu(venue, m);
  const money = { currency: menu.restaurant.currency, locale: menu.restaurant.locale };
  const resolved = resolveTheme(menu.themeId, menu.themeConfig);

  const style = {
    "--font-display": resolved.cssVars["--font-display"],
    "--font-body": resolved.cssVars["--font-body"],
    "--font-mono": resolved.cssVars["--font-mono"],
    "--font-cjk": resolved.cssVars["--font-cjk"] ?? resolved.cssVars["--font-body"],
    "--print-accent": resolved.cssVars["--color-accent"],
    fontFamily: "var(--font-body)",
  } as CSSProperties;

  return (
    <div style={style} className="min-h-screen bg-white text-black">
      <div className="print-page mx-auto max-w-2xl px-8 py-8">
        <PrintButton />

        <header className="mb-7 border-b border-black/15 pb-4 text-center">
          {menu.restaurant.name_zh && (
            <div style={{ fontFamily: "var(--font-cjk)", color: "var(--print-accent)" }} className="text-lg">
              {menu.restaurant.name_zh}
            </div>
          )}
          <h1 style={{ fontFamily: "var(--font-display)" }} className="mt-1 text-3xl">
            {menu.restaurant.name}
          </h1>
          {menu.restaurant.address && (
            <p className="mt-1 text-xs text-black/50">{menu.restaurant.address}</p>
          )}
        </header>

        {menu.categories.map((cat) => (
          <section key={cat.id} className="mb-6">
            <h2
              style={{ fontFamily: "var(--font-display)", color: "var(--print-accent)" }}
              className="mb-2 border-b border-black/10 pb-1 text-lg"
            >
              {cat.name}
            </h2>
            <ul className="space-y-1.5">
              {cat.items.map((it) => (
                <li key={it.id} className="flex items-baseline justify-between gap-4">
                  <div className="min-w-0">
                    <span className="font-medium">{it.name}</span>
                    {it.name_zh && (
                      <span style={{ fontFamily: "var(--font-cjk)" }} className="ml-1.5 text-sm text-black/55">
                        {it.name_zh}
                      </span>
                    )}
                    {it.description && <p className="text-xs text-black/55">{it.description}</p>}
                  </div>
                  <span
                    style={{ fontFamily: "var(--font-mono)" }}
                    className="shrink-0 whitespace-nowrap text-sm"
                  >
                    {it.from_price != null ? "from " : ""}
                    {formatMoney(it.from_price ?? it.base_price, money)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <footer className="mt-8 border-t border-black/10 pt-3 text-center text-[0.65rem] text-black/40">
          {menu.restaurant.name} · Menu on Platter
        </footer>
      </div>
    </div>
  );
}
