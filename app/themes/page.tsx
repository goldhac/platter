import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata: Metadata = {
  title: "Themes — Platter",
  description: "Four designer themes for your menu — each a different set of typographic decisions, running on your real dishes.",
};

const SERIF = "var(--font-display)";
const SANS = "var(--font-body)";
const MONO = "var(--font-mono)";
const CJK = "var(--font-cjk)";

// Theme tokens mirror lib/themes/{lacquer,carafe,counter,palm}.ts (the real menu engine). This
// marketing showcase renders each in its own colours + fonts + layout so the four read as
// genuinely different products. Preview fonts use the menu's faces (still loaded in layout.tsx).
type Theme = {
  id: string;
  name: string;
  tagline: string;
  reason: string;
  bestFor: string[];
  scheme: "Dark" | "Light";
  free: boolean;
  layout: "list-dense" | "ruled-list" | "card-grid" | "editorial";
  layoutLabel: string;
  images: "Optional" | "Required" | "Ignored";
  display: string;
  displayName: string;
  body: string;
  numeric: string;
  radius: string;
  accents: string[];
  k: { bg: string; surface: string; text: string; textOnSurface: string; textSecondary: string; accent: string; hairline: string; positive: string };
};

const F = { display: "var(--font-fraunces)", body: "var(--font-inter)", numeric: "var(--font-plex-mono)" };

const THEMES: Theme[] = [
  { id: "lacquer", name: "Lacquer", free: true, tagline: "Dark, quiet, and precise — porcelain plates on a lacquer table.", reason: "The default, and the one most restaurants should keep. Long menus read well because nothing competes with the dish names.", bestFor: ["Fine dining", "Pan-Asian", "Hotel restaurants"], scheme: "Dark", layout: "list-dense", layoutLabel: "Dense list", images: "Optional", ...F, displayName: "Fraunces", radius: "4px", accents: ["#8e1d1d", "#7a2e2e", "#a23a2a", "#b08d4f", "#3f6b58"], k: { bg: "#14110f", surface: "#f7f4ee", text: "#f7f4ee", textOnSurface: "#14110f", textSecondary: "#8a827a", accent: "#8e1d1d", hairline: "#b08d4f", positive: "#3f6b58" } },
  { id: "carafe", name: "Carafe", free: false, tagline: "A printed drinks list — typographic, calm, no photography.", reason: "Leader dots and a gilt column, because a wine list is read by name and price. Photographs are ignored entirely, by design.", bestFor: ["Wine lists", "Cocktail bars", "Hotel bars", "Spirits"], scheme: "Dark", layout: "ruled-list", layoutLabel: "Ruled list", images: "Ignored", ...F, displayName: "Fraunces", radius: "2px", accents: ["#c2a06a", "#b8935a", "#d8c9a8", "#8b867d"], k: { bg: "#0d0d0f", surface: "#17171b", text: "#e9e5db", textOnSurface: "#e9e5db", textSecondary: "#8b867d", accent: "#c2a06a", hairline: "#4b463d", positive: "#7a9885" } },
  { id: "counter", name: "Counter", free: false, tagline: "Bright, photo-forward, appetite-first.", reason: "The only light scheme, and the only one that needs photographs — every dish is a card with an image. Without them it looks unfinished.", bestFor: ["QSR", "Bakeries", "Bubble tea", "Food trucks"], scheme: "Light", layout: "card-grid", layoutLabel: "Card grid", images: "Required", display: "var(--font-inter)", displayName: "Inter", body: "var(--font-inter)", numeric: "var(--font-plex-mono)", radius: "10px", accents: ["#ff5a1f", "#e11d48", "#7c3aed", "#0891b2"], k: { bg: "#faf8f4", surface: "#ffffff", text: "#1a1714", textOnSurface: "#1a1714", textSecondary: "#6b645c", accent: "#ff5a1f", hairline: "#e4ded4", positive: "#2f8f5b" } },
  { id: "palm", name: "Palm", free: false, tagline: "Deep green and raffia-warm — generous and rooted.", reason: "A non-Western vocabulary: dish names set large in serif, a rule and a price beneath. The only theme offering two layouts.", bestFor: ["Nigerian kitchens", "Afro-Caribbean", "Lounges", "Buka-style"], scheme: "Dark", layout: "editorial", layoutLabel: "Editorial", images: "Optional", ...F, displayName: "Fraunces", radius: "6px", accents: ["#d98b3a", "#c2703a", "#e0a95a", "#8fb89a"], k: { bg: "#123a2e", surface: "#efe6d2", text: "#efe6d2", textOnSurface: "#123a2e", textSecondary: "#a7b3a0", accent: "#d98b3a", hairline: "#3c5c4b", positive: "#8fb89a" } },
];

const ITEMS = [
  { name: "Chicken Samosa", price: "₦6,000", desc: "Spiced minced chicken, fried golden.", photo: true },
  { name: "Hot Chicken Wings", price: "₦6,000", desc: "Six wings in a fiery house glaze.", photo: true },
  { name: "Vegetable Spring Rolls", price: "₦6,000", desc: "Hand-rolled, garden vegetables.", photo: false },
  { name: "Fried Jumbo Shrimp", price: "₦20,500", desc: "Salt, chilli and garlic.", photo: true },
];

function Preview({ t }: { t: Theme }) {
  const k = t.k;
  const div = `color-mix(in srgb, ${k.text} 11%, transparent)`;
  const row = `color-mix(in srgb, ${k.text} 8%, transparent)`;
  return (
    <div style={{ width: "min(100%,392px)", borderRadius: 20, overflow: "hidden", border: "1px solid var(--color-hairline-strong)", background: k.bg, boxShadow: "0 50px 110px -34px #000" }}>
      <div style={{ padding: "26px 22px 20px", textAlign: "center", borderBottom: `1px solid ${div}` }}>
        <div style={{ fontFamily: CJK, fontSize: 11, letterSpacing: ".42em", color: k.hairline, paddingLeft: ".42em" }}>金餐厅</div>
        <div style={{ fontFamily: t.display, fontSize: 30, letterSpacing: "-.026em", color: k.text, marginTop: 9 }}>Jīn Cāntīng</div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 13, fontFamily: t.body, fontSize: 11.5, color: k.textSecondary }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: k.positive }} />
          Open until 22:00
        </span>
      </div>
      <div style={{ display: "flex", gap: 16, padding: "11px 22px", borderBottom: `1px solid ${div}`, overflow: "hidden" }}>
        {["Appetizers", "Noodles", "Rice"].map((c, i) => (
          <span key={c} style={{ fontFamily: t.body, fontWeight: 600, fontSize: 9.5, letterSpacing: ".13em", textTransform: "uppercase", color: i === 0 ? k.text : k.textSecondary, borderBottom: i === 0 ? `2px solid ${k.accent}` : "none", paddingBottom: 8, whiteSpace: "nowrap" }}>
            {c}
          </span>
        ))}
      </div>

      {t.layout === "list-dense" &&
        ITEMS.map((p) => (
          <div key={p.name} style={{ display: "flex", gap: 12, alignItems: "center", padding: "14px 22px", borderBottom: `1px solid ${row}` }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontFamily: t.body, fontWeight: 500, fontSize: 14, color: k.text }}>{p.name}</span>
              <span style={{ display: "block", fontFamily: t.body, fontSize: 11.5, color: k.textSecondary, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.desc}</span>
              <span style={{ display: "block", fontFamily: t.numeric, fontSize: 12, letterSpacing: "-.03em", fontVariantNumeric: "tabular-nums", color: k.text, marginTop: 7 }}>{p.price}</span>
            </span>
            <span style={{ flex: "none", display: "grid", placeItems: "center", width: 48, height: 48, borderRadius: t.radius, border: `1px solid ${k.hairline}`, background: p.photo ? `color-mix(in srgb, ${k.hairline} 22%, ${k.bg})` : "transparent" }}>
              {!p.photo && <span style={{ fontFamily: CJK, fontSize: 15, color: k.hairline }}>餐</span>}
            </span>
          </div>
        ))}

      {t.layout === "ruled-list" &&
        ITEMS.map((p) => (
          <div key={p.name} style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "15px 22px", borderBottom: `1px solid ${row}` }}>
            <span style={{ fontFamily: t.body, fontSize: 14, color: k.text }}>{p.name}</span>
            <span style={{ flex: 1, borderBottom: `1px dotted ${k.hairline}`, transform: "translateY(-4px)" }} />
            <span style={{ fontFamily: t.numeric, fontSize: 12, letterSpacing: "-.03em", fontVariantNumeric: "tabular-nums", color: k.accent }}>{p.price}</span>
          </div>
        ))}

      {t.layout === "card-grid" && (
        <div style={{ padding: "6px 0" }}>
          {ITEMS.map((p) => (
            <div key={p.name} style={{ padding: "7px 18px" }}>
              <span style={{ display: "flex", gap: 12, alignItems: "center", background: k.surface, borderRadius: t.radius, padding: 10, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
                <span style={{ flex: "none", display: "grid", placeItems: "center", width: 54, height: 54, borderRadius: t.radius, background: `color-mix(in srgb, ${k.accent} 12%, ${k.surface})`, fontFamily: t.body, fontSize: 9, color: k.textSecondary }}>photo</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontFamily: t.display, fontWeight: 600, fontSize: 14, color: k.textOnSurface }}>{p.name}</span>
                  <span style={{ display: "block", fontFamily: t.numeric, fontSize: 12, letterSpacing: "-.03em", fontVariantNumeric: "tabular-nums", color: k.accent, marginTop: 5 }}>{p.price}</span>
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      {t.layout === "editorial" &&
        ITEMS.map((p) => (
          <div key={p.name} style={{ padding: "18px 22px", borderBottom: `1px solid ${k.hairline}` }}>
            <span style={{ display: "block", fontFamily: t.display, fontSize: 21, letterSpacing: "-.02em", lineHeight: 1.15, color: k.text }}>{p.name}</span>
            <span style={{ display: "block", fontFamily: t.body, fontSize: 12, color: k.textSecondary, marginTop: 5 }}>{p.desc}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 9 }}>
              <span style={{ width: 22, height: 1, background: k.accent }} />
              <span style={{ fontFamily: t.numeric, fontSize: 12.5, letterSpacing: "-.03em", fontVariantNumeric: "tabular-nums", color: k.accent }}>{p.price}</span>
            </span>
          </div>
        ))}
    </div>
  );
}

export default function ThemesPage() {
  return (
    <MarketingShell active="themes">
      {/* hero */}
      <section id="top" style={{ maxWidth: 1400, margin: "0 auto", padding: "clamp(60px,8vw,120px) 32px clamp(40px,5vw,72px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span style={{ width: 30, height: 1, background: "var(--color-hairline-strong)" }} />
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-hairline-strong)" }}>Four themes</span>
        </div>
        <h1 className="m-fade" style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(48px,8.4vw,132px)", lineHeight: 0.86, letterSpacing: "-.05em", margin: "22px 0 0", maxWidth: "15ch", animation: "m-up 800ms var(--ease-out) both" }}>
          A menu that looks like <span style={{ fontStyle: "italic" }}>you.</span>
        </h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 44, alignItems: "end", marginTop: "clamp(30px,4vw,54px)" }}>
          <p style={{ fontSize: "clamp(16px,1.35vw,20px)", lineHeight: 1.55, color: "var(--color-text-secondary)", margin: 0, maxWidth: "40ch" }}>
            A wine list and a bubble-tea counter should not read the same. Each theme is a different set of typographic decisions — not a colour swap — and every one runs on your real dishes before you commit.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {THEMES.map((t) => (
              <a key={t.id} href={`#${t.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 9, height: 42, padding: "0 16px", borderRadius: 999, border: "1px solid var(--color-hairline-strong)", fontSize: 14 }}>
                <span style={{ width: 11, height: 11, borderRadius: 3, background: t.k.accent }} />
                {t.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* the four */}
      {THEMES.map((t, i) => (
        <section key={t.id} id={t.id} style={{ borderTop: "1px solid var(--color-hairline)" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", padding: "clamp(56px,7vw,110px) 32px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,330px),1fr))", gap: "clamp(36px,5vw,72px)", alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 11, flexWrap: "wrap" }}>
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--color-hairline-strong)" }}>0{i + 1}</span>
                <span style={{ display: "inline-flex", alignItems: "center", height: 21, padding: "0 9px", borderRadius: 999, border: "1px solid var(--color-hairline-strong)", fontFamily: MONO, fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--color-text-secondary)" }}>{t.scheme}</span>
                <span style={{ display: "inline-flex", alignItems: "center", height: 21, padding: "0 9px", borderRadius: 999, border: t.free ? "1px solid rgba(95,156,124,.42)" : "1px solid rgba(201,166,103,.45)", color: t.free ? "var(--color-positive)" : "var(--color-hairline-strong)", font: "600 9px var(--font-body)", letterSpacing: ".14em", textTransform: "uppercase" }}>{t.free ? "On Free" : "Pro"}</span>
              </div>
              <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(44px,6.4vw,96px)", lineHeight: 0.9, letterSpacing: "-.048em", margin: "18px 0 0" }}>{t.name}</h2>
              <p style={{ fontSize: "clamp(16px,1.3vw,19px)", lineHeight: 1.55, color: "var(--color-text-secondary)", margin: "20px 0 0", maxWidth: "42ch" }}>{t.tagline}</p>
              <p style={{ fontSize: 15, lineHeight: 1.62, color: "var(--color-text-tertiary)", margin: "14px 0 0", maxWidth: "44ch" }}>{t.reason}</p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 26 }}>
                {t.bestFor.map((b) => (
                  <span key={b} style={{ display: "inline-flex", alignItems: "center", height: 30, padding: "0 12px", borderRadius: 999, border: "1px solid var(--color-hairline)", fontSize: 13, color: "var(--color-text-secondary)" }}>{b}</span>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,130px),1fr))", gap: 1, marginTop: 30, background: "var(--color-hairline)", border: "1px solid var(--color-hairline)", borderRadius: 12, overflow: "hidden" }}>
                {[
                  ["Display", <span key="d" style={{ fontFamily: t.display, fontSize: 19, marginTop: 9, lineHeight: 1.15, display: "block", color: "var(--color-text)" }}>{t.displayName}</span>],
                  ["Layout", <span key="l" style={{ fontFamily: MONO, fontSize: 12.5, letterSpacing: "-.02em", marginTop: 11, display: "block", color: "var(--color-text-secondary)" }}>{t.layoutLabel}</span>],
                  ["Photos", <span key="p" style={{ fontSize: 13, marginTop: 11, display: "block", color: t.images === "Ignored" ? "var(--color-text-tertiary)" : t.images === "Required" ? "var(--color-caution)" : "var(--color-text-secondary)" }}>{t.images}</span>],
                ].map(([label, val]) => (
                  <div key={label as string} style={{ background: "var(--color-surface)", padding: 16 }}>
                    <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--color-text-tertiary)" }}>{label}</div>
                    {val}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 22, flexWrap: "wrap" }}>
                <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginRight: 4 }}>Accents</span>
                {t.accents.map((a) => (
                  <span key={a} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid var(--color-hairline-strong)", background: a } as CSSProperties} />
                ))}
              </div>

              <div style={{ display: "flex", gap: 11, marginTop: 32, flexWrap: "wrap" }}>
                <Link href="/admin/signup" className="inline-flex items-center font-semibold" style={{ height: 52, padding: "0 26px", borderRadius: 9, background: "var(--color-accent-hover)", color: "#fff", fontSize: 15.5, boxShadow: "0 8px 30px -10px rgba(168,47,44,.7)" }}>
                  Try {t.name} on your menu
                </Link>
                <Link href="/v/jin-canting" className="inline-flex items-center font-semibold" style={{ height: 52, padding: "0 22px", borderRadius: 9, border: "1px solid var(--color-hairline-strong)", fontSize: 15.5 }}>
                  See it live
                </Link>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <Preview t={t} />
            </div>
          </div>
        </section>
      ))}

      {/* how it works */}
      <section style={{ borderTop: "1px solid var(--color-hairline)", background: "var(--color-surface)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "clamp(60px,7vw,110px) 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 40, alignItems: "end" }}>
            <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(38px,5.4vw,82px)", lineHeight: 0.9, letterSpacing: "-.045em", margin: 0 }}>
              Switching is
              <br />
              <span style={{ fontStyle: "italic", color: "var(--color-accent-text)" }}>one tap.</span>
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: "var(--color-text-secondary)", margin: "0 0 10px", maxWidth: "44ch" }}>
              The theme is a set of tokens, not a rebuild. Your dishes, prices, photos and QR codes are untouched — the same menu simply reads differently.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: 1, marginTop: 44, background: "var(--color-hairline)", border: "1px solid var(--color-hairline)", borderRadius: 16, overflow: "hidden" }}>
            {[
              ["01", "Preview on your dishes", "Not a stock demo — your names, your prices, your photographs."],
              ["02", "Tune the accent", "Curated swatches, or your own hex — checked for contrast before it can publish."],
              ["03", "Publish when it's right", "Nothing changes for diners until you say so. Printed codes keep working."],
            ].map(([n, t2, d]) => (
              <div key={n} style={{ background: "var(--color-surface-raised)", padding: 28 }}>
                <div style={{ fontFamily: MONO, fontSize: 11, color: "var(--color-accent-text)", letterSpacing: ".1em" }}>{n}</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginTop: 14 }}>{t2}</div>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--color-text-secondary)", margin: "8px 0 0" }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" style={{ borderTop: "1px solid var(--color-hairline)", background: "radial-gradient(70% 60% at 24% 40%,rgba(168,47,44,.3),transparent 62%),var(--color-bg)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "clamp(80px,10vw,160px) 32px" }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(48px,9vw,150px)", lineHeight: 0.84, letterSpacing: "-.05em", margin: 0 }}>
            See yours in
            <br />
            <span style={{ fontStyle: "italic" }}>one evening.</span>
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 44, flexWrap: "wrap" }}>
            <Link href="/admin/signup" className="inline-flex items-center font-semibold" style={{ height: 58, padding: "0 32px", borderRadius: 9, background: "var(--color-accent-hover)", color: "#fff", fontSize: 16, boxShadow: "0 10px 36px -8px rgba(168,47,44,.75)" }}>
              Start free
            </Link>
            <span style={{ fontSize: 14.5, color: "var(--color-text-secondary)", maxWidth: "38ch" }}>Photograph your paper menu, pick a theme, put a code on the table. Lacquer is free forever.</span>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
