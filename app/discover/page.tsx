import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { DiscoverGrid } from "@/components/marketing/discover-grid";
import { getListedVenues } from "@/lib/queries/discover";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discover — Platter",
  description: "Browse restaurants and cafés with a live Platter menu. No app, no sign-in.",
};

const SERIF = "var(--font-display)";
const MONO = "var(--font-mono)";

export default async function DiscoverPage() {
  const venues = await getListedVenues();

  return (
    <MarketingShell active="discover">
      {/* hero */}
      <section id="top" style={{ maxWidth: 1400, margin: "0 auto", padding: "clamp(52px,7vw,104px) 32px clamp(28px,3vw,44px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span style={{ width: 30, height: 1, background: "var(--color-hairline-strong)" }} />
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-hairline-strong)" }}>Live menus</span>
        </div>
        <h1 className="m-fade" style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(46px,8vw,126px)", lineHeight: 0.86, letterSpacing: "-.05em", margin: "22px 0 0", maxWidth: "14ch", animation: "m-up 800ms var(--ease-out) both" }}>
          Eat somewhere <span style={{ fontStyle: "italic" }}>good.</span>
        </h1>
        <p style={{ fontSize: "clamp(16px,1.35vw,20px)", lineHeight: 1.55, color: "var(--color-text-secondary)", margin: "26px 0 0", maxWidth: "44ch" }}>
          Every menu here is current — read it before you leave the house. No app, no sign-in, and nothing to download at the table.
        </p>
      </section>

      <DiscoverGrid venues={venues} />

      {/* CTA */}
      <section style={{ borderTop: "1px solid var(--color-hairline)", background: "radial-gradient(70% 60% at 22% 40%,rgba(168,47,44,.28),transparent 62%),var(--color-bg)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "clamp(70px,9vw,140px) 32px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: 44, alignItems: "end" }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(42px,7vw,116px)", lineHeight: 0.86, letterSpacing: "-.05em", margin: 0 }}>
            Put yours
            <br />
            <span style={{ fontStyle: "italic" }}>here.</span>
          </h2>
          <div>
            <p style={{ fontSize: 16.5, lineHeight: 1.6, color: "var(--color-text-secondary)", margin: "0 0 22px", maxWidth: "40ch" }}>
              Listing is free and takes an evening — photograph your paper menu, pick a theme, print a code. Diners find you here, and the menu is never out of date.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
              <Link href="/admin/signup" className="inline-flex items-center font-semibold" style={{ height: 56, padding: "0 30px", borderRadius: 9, background: "var(--color-accent-hover)", color: "#fff", fontSize: 16, boxShadow: "0 10px 36px -8px rgba(168,47,44,.75)" }}>
                Put your menu on Platter
              </Link>
              <span style={{ fontSize: 14, color: "var(--color-text-tertiary)" }}>Free forever · no card</span>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
