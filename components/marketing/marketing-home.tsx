/* eslint-disable @next/next/no-img-element -- marketing imagery + brand mark; decorative, not LCP */
import Link from "next/link";
import { listThemes } from "@/lib/themes";
import { LandingFaq } from "./landing-faq";
import { RevealObserver } from "./reveal-observer";

// Platter v2 marketing landing: product-led redesign (2026-08). The product is the hero, not
// food: a browser frame with the menu editor + the diner's phone, layered for depth. Own chrome
// (dark oxblood/bone). Photos are on-brand generated stills. No eyebrows, no em dashes.

const SERIF = "var(--font-display)";
const SANS = "var(--font-body)";
const MONO = "var(--font-mono)";
const CJK = "var(--font-cjk)";

const BG = "#08070a";
const SURFACE = "#100e12";
const SURFACE2 = "#17141a";
const SUNKEN = "#0c0a0e";
const TEXT = "#f6f2ea";
const TEXT2 = "#a49c95";
const TEXT3 = "#7d7570";
const ACCENT = "#a82f2c";
const ACCENT2 = "#c4453f";
const ACCENT_TEXT = "#e0655a";
const ACCENT_SOFT = "rgba(168,47,44,.16)";
const LINE = "rgba(246,242,234,.09)";
const LINE2 = "rgba(246,242,234,.16)";
const GILT = "#c9a667";
const POS = "#5f9c7c";
const CAUTION = "#d9a441";

const OCTAGON = "polygon(29% 0,71% 0,100% 29%,100% 71%,71% 100%,29% 100%,0 71%,0 29%)";

// The struck plate, lit from above like the seal, sits on the surface. Appears three times.
function Plate({ dot, glow, children, dim }: { dot: string; glow: string; children: React.ReactNode; dim?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 8, height: 30, padding: "0 14px", borderRadius: 999,
        background: "linear-gradient(160deg,rgba(246,242,234,.09),rgba(246,242,234,.02))",
        boxShadow: "0 1px 0 rgba(246,242,234,.14) inset,0 -1px 2px rgba(0,0,0,.5) inset,0 1px 2px rgba(0,0,0,.4)",
        border: "1px solid rgba(246,242,234,.14)", color: dim ? TEXT2 : TEXT, font: `600 11.5px ${SANS}`, letterSpacing: ".01em",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, boxShadow: `0 0 0 3px ${glow}` }} />
      {children}
    </span>
  );
}

// A faint oversized CJK glyph watermark, engraved into a section for premium depth.
function Watermark({ glyph, color = "rgb(201 166 103)", opacity = 0.05, size = 460, right = "-4%", top = "-8%", bottom }: { glyph: string; color?: string; opacity?: number; size?: number | string; right?: string; top?: string; bottom?: string }) {
  return (
    <span
      aria-hidden
      style={{
        position: "absolute", right, ...(bottom != null ? { bottom } : { top }), zIndex: 0, pointerEvents: "none",
        fontFamily: CJK, fontSize: size, lineHeight: 1, color, opacity, userSelect: "none",
      }}
    >
      {glyph}
    </span>
  );
}

const H2 = (extra?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: SERIF, fontWeight: 500, lineHeight: 0.94, letterSpacing: "-.04em", margin: 0, ...extra,
});

const MINI_NAV: [string, boolean][] = [
  ["Dash", false], ["Menus", false], ["Editor", true], ["Insights", false], ["Theme", false], ["QR", false], ["Team", false],
];

const MINI_ROWS: { name: string; price: string; on: boolean }[] = [
  { name: "Singapore Noodles", price: "₦10,000", on: true },
  { name: "Vegetable Noodles", price: "₦9,500", on: true },
  { name: "Spaghetti Bolognese", price: "₦9,000", on: true },
  { name: "Chinese Noodles Chicken", price: "₦9,000", on: false },
  { name: "Chicken Noodle Soup", price: "₦8,000", on: true },
];

const PHONE_ROWS: { name: string; price: string; dim: boolean }[] = [
  { name: "Chicken Samosa", price: "₦6,000", dim: false },
  { name: "Hot Chicken Wings", price: "₦6,000", dim: false },
  { name: "Vegetable Spring Rolls", price: "Sold out", dim: true },
];

const REPLACES = ["a laminated card", "a PDF nobody can read", "reprinting for one price change", "a chalkboard", "“sorry, we’re out of that”"];

const STEPS = [
  { n: "01", time: "2 minutes", title: "Photograph the paper", body: "Whatever you already print: a laminated card, a PDF, a page in a notebook. Straight down, whole page in frame.", img: "/images/marketing/photograph.jpg" },
  { n: "02", time: "30 seconds", title: "Correct the draft", body: "Every dish, price and section comes back editable, with the reader's uncertain lines flagged. Nothing is live yet.", img: "/images/marketing/edit.jpg" },
  { n: "03", time: "1 minute", title: "Print the code", body: "Publish, then export an A6 tent or a sheet for every table. That code never needs reprinting again.", img: "/images/marketing/tent.jpg" },
];

const FLAGS = [
  { tag: "Low", note: "The reader wasn't sure of this line", colour: CAUTION, border: "rgba(217,164,65,.45)", bg: "rgba(217,164,65,.12)" },
  { tag: "No price", note: "Nothing readable in the price column", colour: ACCENT_TEXT, border: "rgba(196,69,63,.5)", bg: "rgba(168,47,44,.14)" },
  { tag: "Dupe", note: "Same name and price as the line above", colour: CAUTION, border: "rgba(217,164,65,.45)", bg: "rgba(217,164,65,.12)" },
  { tag: "Section", note: "Doesn't look like it belongs here", colour: CAUTION, border: "rgba(217,164,65,.45)", bg: "rgba(217,164,65,.12)" },
];

const FEATURES = [
  { glyph: "印", title: "Print stays in sync", body: "The paper menu regenerates from the same dishes, so the wall can never disagree with the screen.", detail: "A4 · A5 · PDF" },
  { glyph: "厨", title: "Chef's picks", body: "Mark a dish and it takes the seal, then rises into the popular shelf at the top of the menu.", detail: "Seal motif · shelf" },
  { glyph: "素", title: "Dietary and allergens", body: "Vegetarian, vegan, pork, seafood, gluten-free, plus an allergen list on every dish card.", detail: "5 tags · 8 allergens" },
  { glyph: "价", title: "Two currencies", body: "Set your own, and optionally show an approximate second price beneath it for visitors.", detail: "≈ line, quieter grey" },
  { glyph: "众", title: "Roles that fit a kitchen", body: "Staff flip sold-out and nothing else. Managers edit and publish. You keep billing.", detail: "3 roles · 10 seats" },
  { glyph: "问", title: "Ask the kitchen", body: "A concierge panel on the menu answers what is mild, what is popular, and what sits under a price.", detail: "On the diner menu" },
];

const SERVICE_BULLETS = [
  "Works from a phone, one-handed, on kitchen wifi",
  "Sold-out dishes stay visible but dim, so diners stop asking",
  "Staff can do it without being able to change a price",
];

const SOLD_ROWS: { name: string; price: string; out: boolean }[] = [
  { name: "Chicken Samosa", price: "₦6,000", out: false },
  { name: "Hot Chicken Wings", price: "₦6,000", out: false },
  { name: "Vegetable Spring Rolls", price: "₦6,000", out: true },
  { name: "Crispy Beef", price: "₦6,000", out: false },
];

const MISSES = [
  { term: "jollof", count: "47", pct: "100%" },
  { term: "suya", count: "31", pct: "66%" },
  { term: "vegan", count: "24", pct: "51%" },
  { term: "pepper soup", count: "19", pct: "40%" },
];

const FARE: { n: string; d: string; tier: "Free" | "Pro" }[] = [
  { n: "One menu, live tonight", d: "Dishes, sections and prices, set to be read on a phone across a dark table.", tier: "Free" },
  { n: "AI menu import", d: "Photograph the paper. It comes back editable, and stays a draft until you publish.", tier: "Free" },
  { n: "Table QR codes", d: "One per menu or one per table, exported as PNG, SVG or a print-ready sheet.", tier: "Free" },
  { n: "A printed sheet", d: "Regenerated from the same menu, so the paper can never disagree with the screen.", tier: "Free" },
  { n: "Sold out, in one tap", d: "Mark a dish gone from the floor. It sinks, dims, and returns at 04:00.", tier: "Free" },
  { n: "Insights", d: "What diners opened, what they searched for and didn't find, and when they look.", tier: "Free" },
  { n: "Unlimited menus", d: "Dinner, bar, breakfast, Christmas. Each with its own theme and its own code.", tier: "Pro" },
  { n: "All four themes", d: "Lacquer, Carafe, Counter, Palm, previewed against your real dishes.", tier: "Pro" },
  { n: "Your own domain", d: "Point your address at the menu. No Platter mark anywhere on it.", tier: "Pro" },
  { n: "Ten team seats", d: "Managers edit, staff flip sold-out, you approve. Revoke when they leave.", tier: "Pro" },
];

const QUESTIONS = [
  { q: "Does the diner need an app?", a: "No. The code opens the menu in the browser already on their phone. No download, no account, no login. That is the entire point." },
  { q: "My menu is a photo. Or a PDF. Or handwritten.", a: "Upload whatever you have. The importer reads the dishes, prices and sections into a draft. It gets things wrong sometimes, which is exactly why it lands as a draft. You correct it, then publish." },
  { q: "Can I change a price during service?", a: "Yes, from your phone, and it is live immediately, including on the codes already sitting on the tables. That is the difference between a dynamic code and a printed PDF." },
  { q: "What happens to my printed QR codes if I change the menu?", a: "Nothing. The code encodes a link, never menu content. Edit prices, hide a dish, switch the whole theme. Every tent already on a table keeps working." },
  { q: "What if I have hundreds of dishes?", a: "Jīn Cāntīng runs 258 across 19 sections on Platter. Nobody typed them in." },
  { q: "Is Free actually free?", a: "One menu, the import, QR codes, print and insights, forever, without a card. Pro is for more than one menu, your own domain, or people other than you editing." },
];

// Theme previews read from the manifests so this page can never drift from the product.
const THEME_PREVIEWS = listThemes().map((t) => {
  const tk = (t.tokens[t.defaultScheme] ?? Object.values(t.tokens)[0])!;
  return { name: t.name, bg: tk.bg, text: tk.text, secondary: tk.textSecondary, accent: tk.accent, hairline: tk.hairline, font: t.typography.display.var };
});
const THEME_ROWS = [{ name: "Chicken Samosa", price: "₦6,000" }, { name: "Singapore Noodles", price: "₦10,000" }];

const SECTION = "clamp(56px,7vw,104px) 32px";
const WRAP: React.CSSProperties = { maxWidth: 1400, margin: "0 auto" };
const REL: React.CSSProperties = { position: "relative", zIndex: 1 };

export function MarketingHome() {
  return (
    <div style={{ overflowX: "hidden", background: BG, color: TEXT, fontFamily: SANS }}>
      {/* NAV */}
      <header className="lp-nav" style={{ position: "sticky", top: 0, zIndex: 60, backdropFilter: "blur(20px)", background: "rgba(8,7,10,.72)", borderBottom: `1px solid ${LINE}` }}>
        <div style={{ ...WRAP, padding: "0 32px", height: 64, display: "flex", alignItems: "center", gap: 32 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, marginRight: "auto" }}>
            <img src="/brand/platter-mark-bone.png" alt="" style={{ height: 26, width: "auto", display: "block" }} />
            <span style={{ fontFamily: SERIF, fontSize: 20, letterSpacing: "-.01em" }}>Platter</span>
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 14, color: TEXT2 }} className="max-sm:hidden">
            <a href="#features">Features</a>
            <a href="#import">Import</a>
            <a href="#pricing">Pricing</a>
            <Link href="/admin/login">Sign in</Link>
          </nav>
          <Link href="/admin/signup" className="inline-flex items-center font-bold" style={{ height: 38, padding: "0 18px", borderRadius: 7, background: ACCENT, color: "#fff", fontSize: 13.5 }}>
            Get started
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section id="top" style={{ position: "relative", background: `radial-gradient(80% 50% at 78% -6%,rgba(168,47,44,.22),transparent 62%),${BG}` }}>
        <div style={{ ...WRAP, padding: "clamp(48px,6vw,88px) 32px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", gap: "clamp(36px,4vw,64px)", alignItems: "center" }}>
            <div>
              <span className="lp-enter-plate" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 30, padding: "0 14px", borderRadius: 999, background: "linear-gradient(160deg,rgba(246,242,234,.09),rgba(246,242,234,.02))", boxShadow: "0 1px 0 rgba(246,242,234,.14) inset,0 -1px 2px rgba(0,0,0,.5) inset,0 1px 2px rgba(0,0,0,.4)", border: "1px solid rgba(246,242,234,.14)", color: TEXT2, font: `600 11.5px ${SANS}`, letterSpacing: ".01em" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: POS, boxShadow: "0 0 0 3px rgba(95,156,124,.2)" }} />
                Live at Jīn Cāntīng
                <span style={{ width: 1, height: 11, background: LINE2 }} />
                <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "-.02em", color: TEXT }}>258 dishes</span>
              </span>

              <h1 className="lp-enter" style={H2({ fontWeight: 500, fontSize: "clamp(44px,5.6vw,82px)", lineHeight: 0.94, letterSpacing: "-.042em", margin: "22px 0 0", maxWidth: "19ch" })}>The menu system for restaurants.</h1>

              <p className="lp-enter-d1" style={{ fontSize: "clamp(16.5px,1.35vw,20px)", lineHeight: 1.55, color: TEXT2, margin: "24px 0 0", maxWidth: "44ch", textWrap: "pretty" }}>Photograph the menu you already print. Platter reads it, sets it properly, and puts it behind a QR code you never have to reprint. Change a price from the floor and every table sees it.</p>

              <div className="lp-enter-d2" style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 32, flexWrap: "wrap" }}>
                <Link href="/admin/signup" className="lp-cta-primary inline-flex items-center font-bold" style={{ height: 54, padding: "0 28px", borderRadius: 9, background: ACCENT, color: "#fff", fontSize: 15.5, boxShadow: "0 8px 30px -8px rgba(168,47,44,.7)" }}>Start free</Link>
                <a href="#features" className="lp-cta-ghost inline-flex items-center font-semibold" style={{ height: 54, padding: "0 24px", borderRadius: 9, border: `1px solid ${LINE2}`, fontSize: 15.5 }}>See how it works</a>
              </div>

              <div className="lp-enter-d3" style={{ display: "flex", flexWrap: "wrap", gap: 20, marginTop: 28, fontSize: 13.5, color: TEXT3 }}>
                {["Free forever for one menu", "No card", "No app for diners"].map((t) => (
                  <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><span style={{ color: POS }}>✓</span>{t}</span>
                ))}
              </div>
            </div>

            {/* the product: admin editor + diner phone, layered for depth */}
            <div className="lp-enter-frame" style={{ position: "relative", minHeight: "clamp(380px,34vw,500px)" }}>
              {/* depth: blurred glow orbs behind */}
              <span aria-hidden className="lp-orb-a" style={{ position: "absolute", right: "2%", top: "-8%", width: "58%", height: "62%", borderRadius: "50%", background: "radial-gradient(circle,rgba(168,47,44,.5),transparent 66%)", filter: "blur(64px)", zIndex: 0, pointerEvents: "none" }} />
              <span aria-hidden className="lp-orb-b" style={{ position: "absolute", left: "-6%", bottom: "-6%", width: "48%", height: "50%", borderRadius: "50%", background: "radial-gradient(circle,rgba(201,166,103,.28),transparent 64%)", filter: "blur(58px)", zIndex: 0, pointerEvents: "none" }} />
              {/* depth: a ghost panel stacked behind the frame */}
              <span aria-hidden style={{ position: "absolute", inset: "7% -5% -9% 9%", borderRadius: 16, border: `1px solid ${LINE}`, background: "linear-gradient(160deg,rgba(29,25,23,.5),rgba(12,10,14,.15))", boxShadow: "0 30px 80px -34px #000", zIndex: 1 }} />

              {/* the frame (floats) */}
              <div className="lp-float" style={{ position: "relative", zIndex: 2, borderRadius: 14, border: `1px solid ${LINE2}`, background: SURFACE, boxShadow: "0 44px 90px -34px #000", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", borderBottom: `1px solid ${LINE}`, background: SURFACE2 }}>
                  {[0, 1, 2].map((i) => <span key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: LINE2 }} />)}
                  <span style={{ flex: 1, display: "flex", justifyContent: "center" }}><span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".06em", color: TEXT3 }}>platter.app/admin/menu</span></span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "88px minmax(0,1fr)" }}>
                  <span style={{ borderRight: `1px solid ${LINE}`, padding: "14px 0", display: "grid", gap: 4, alignContent: "start" }}>
                    {MINI_NAV.map(([label, on]) => (
                      <span key={label} style={{ margin: "0 6px", padding: "6px 7px", borderRadius: 4, font: `600 7.5px ${SANS}`, letterSpacing: ".11em", textTransform: "uppercase", ...(on ? { background: ACCENT_SOFT, border: "1px solid rgba(168,47,44,.5)", color: TEXT } : { color: TEXT3 }) }}>{label}</span>
                    ))}
                  </span>
                  <span style={{ minWidth: 0, padding: "16px 18px 20px" }}>
                    <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                      <span style={{ fontFamily: SERIF, fontSize: 22, letterSpacing: "-.024em" }}>Dinner</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 8, letterSpacing: ".13em", textTransform: "uppercase", color: CAUTION }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: CAUTION }} />258 drafts</span>
                    </span>
                    <span style={{ display: "flex", gap: 6, marginTop: 12 }}>
                      <span style={{ height: 22, padding: "0 9px", borderRadius: 4, border: `1px solid ${LINE}`, display: "inline-flex", alignItems: "center", font: `600 8px ${SANS}`, letterSpacing: ".1em", textTransform: "uppercase", color: TEXT3 }}>Search</span>
                      <span style={{ height: 22, padding: "0 9px", borderRadius: 4, border: "1px solid rgba(217,164,65,.45)", background: "rgba(217,164,65,.12)", display: "inline-flex", alignItems: "center", font: `600 8px ${SANS}`, letterSpacing: ".1em", textTransform: "uppercase", color: CAUTION }}>Sold out</span>
                      <span style={{ flex: 1 }} />
                      <span style={{ height: 22, padding: "0 9px", borderRadius: 4, background: ACCENT, display: "inline-flex", alignItems: "center", font: `600 8px ${SANS}`, letterSpacing: ".1em", textTransform: "uppercase", color: "#fff" }}>Publish</span>
                    </span>
                    <span style={{ display: "block", marginTop: 12, border: `1px solid ${LINE}`, borderRadius: 6, overflow: "hidden" }}>
                      {MINI_ROWS.map((r) => (
                        <span key={r.name} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderBottom: `1px solid ${LINE}`, background: SURFACE }}>
                          <span style={{ flex: "none", width: 20, height: 20, borderRadius: 3, border: `1px solid ${LINE}`, background: "linear-gradient(160deg,#1b1715,#100d0c)" }} />
                          <span style={{ flex: 1, minWidth: 0, fontSize: 10.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: TEXT }}>{r.name}</span>
                          <span style={{ flex: "none", fontFamily: MONO, fontSize: 9, letterSpacing: "-.03em", fontVariantNumeric: "tabular-nums", color: TEXT2 }}>{r.price}</span>
                          <span style={{ flex: "none", width: 24, height: 14, borderRadius: 999, border: `1px solid ${r.on ? "rgba(95,156,124,.6)" : LINE2}`, background: r.on ? "rgba(95,156,124,.75)" : "rgba(246,242,234,.12)", padding: 1 }}>
                            <span style={{ display: "block", width: 10, height: 10, borderRadius: "50%", background: r.on ? "#f6f2ea" : TEXT3, transform: r.on ? "translateX(10px)" : "none" }} />
                          </span>
                        </span>
                      ))}
                    </span>
                  </span>
                </div>
              </div>

              {/* floating live toast (layering) */}
              <span className="max-md:hidden lp-float-chip" style={{ position: "absolute", left: -24, top: "31%", zIndex: 3, display: "inline-flex", alignItems: "center", gap: 8, height: 33, padding: "0 15px", borderRadius: 999, background: "linear-gradient(160deg,rgba(24,20,26,.96),rgba(12,10,14,.92))", backdropFilter: "blur(10px)", border: `1px solid ${LINE2}`, boxShadow: "0 20px 46px -16px #000", font: `600 11.5px ${SANS}`, color: TEXT, whiteSpace: "nowrap" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: POS, boxShadow: "0 0 0 3px rgba(95,156,124,.2)" }} />
                Price updated · live
              </span>

              {/* the diner phone (floats, own rhythm) */}
              <div className="max-sm:hidden lp-float-phone" style={{ position: "absolute", right: -6, bottom: -30, zIndex: 4, width: "min(38%,168px)", borderRadius: 16, border: `1px solid ${LINE2}`, background: BG, boxShadow: "0 34px 70px -22px #000", overflow: "hidden" }}>
                <span style={{ display: "block", padding: "14px 12px 10px", textAlign: "center", borderBottom: `1px solid ${LINE}`, background: "radial-gradient(120% 70% at 50% 0%,rgba(168,47,44,.28),transparent 68%)" }}>
                  <span style={{ display: "block", fontFamily: CJK, fontSize: 7, letterSpacing: ".4em", color: GILT, paddingLeft: ".4em" }}>金餐厅</span>
                  <span style={{ display: "block", fontFamily: SERIF, fontSize: 15, letterSpacing: "-.02em", marginTop: 5 }}>Jīn Cāntīng</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 7, fontSize: 7.5, color: TEXT2 }}><span style={{ width: 4, height: 4, borderRadius: "50%", background: POS }} />Open until 23:00</span>
                </span>
                {PHONE_ROWS.map((p) => (
                  <span key={p.name} style={{ display: "flex", gap: 8, alignItems: "center", padding: "9px 11px", borderBottom: `1px solid ${LINE}`, opacity: p.dim ? 0.42 : 1 }}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 9, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
                      <span style={{ display: "block", fontFamily: MONO, fontSize: 8, letterSpacing: "-.03em", color: GILT, marginTop: 3 }}>{p.price}</span>
                    </span>
                    <span style={{ flex: "none", display: "grid", placeItems: "center", width: 26, height: 26, borderRadius: 4, border: `1px solid ${LINE}`, background: "linear-gradient(160deg,#1b1715,#100d0c)", fontFamily: CJK, fontSize: 9, color: "rgba(201,166,103,.6)" }}>餐</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* what it replaces */}
          <div data-reveal style={{ display: "flex", flexWrap: "wrap", gap: "12px 44px", alignItems: "center", marginTop: "clamp(52px,6vw,84px)", padding: "22px 0", borderTop: `1px solid ${LINE}` }}>
            <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".18em", textTransform: "uppercase", color: TEXT3, marginRight: 8 }}>Replaces</span>
            {REPLACES.map((r) => (
              <span key={r} style={{ fontSize: 14, color: TEXT2, textDecoration: "line-through", textDecorationColor: "rgba(196,69,63,.7)" }}>{r}</span>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ borderTop: `1px solid ${LINE}`, background: SURFACE }}>
        <div style={{ ...WRAP, padding: SECTION }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 40, alignItems: "end" }}>
            <h2 data-reveal style={H2({ fontSize: "clamp(34px,4.6vw,68px)" })}>Set up in<br />one evening.</h2>
            <p data-reveal style={{ fontSize: 17, lineHeight: 1.6, color: TEXT2, margin: "0 0 8px", maxWidth: "42ch" }}>No integration, no POS, no training. Three steps, and the longest one is waiting for the reader.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,270px),1fr))", gap: 16, marginTop: 44 }}>
            {STEPS.map((s, i) => (
              <div key={s.n} data-reveal className="lp-step" style={{ overflow: "hidden", transitionDelay: `${i * 90}ms` }}>
                <span style={{ position: "relative", display: "block", aspectRatio: "16/10", overflow: "hidden", background: SUNKEN }}>
                  <img src={s.img} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.82 }} />
                  <span style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(8,7,10,.15),rgba(8,7,10,.82))" }} />
                  <span style={{ position: "absolute", left: 16, bottom: 14, display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".1em", color: ACCENT_TEXT }}>{s.n}</span>
                    <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: ".14em", textTransform: "uppercase", color: TEXT2 }}>{s.time}</span>
                  </span>
                </span>
                <span style={{ display: "block", padding: 22 }}>
                  <span style={{ display: "block", fontFamily: SERIF, fontSize: 23, letterSpacing: "-.022em" }}>{s.title}</span>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: TEXT2, margin: "10px 0 0" }}>{s.body}</p>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ position: "relative", borderTop: `1px solid ${LINE}`, overflow: "hidden" }}>
        <Watermark glyph="金" size="clamp(320px,40vw,620px)" opacity={0.045} right="-3%" top="-14%" color="rgb(201 166 103)" />
        <div style={{ ...REL, ...WRAP, padding: SECTION }}>
          <h2 data-reveal style={H2({ fontSize: "clamp(34px,4.6vw,68px)", maxWidth: "20ch" })}>Built for a service, not a spreadsheet.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: 16, marginTop: 44 }}>
            {/* AI import */}
            <div id="import" data-reveal style={{ border: "1px solid rgba(201,166,103,.28)", borderRadius: 16, background: `linear-gradient(160deg,rgba(201,166,103,.07),transparent 52%),${SURFACE}`, padding: 30 }}>
              <Plate dot={ACCENT2} glow="rgba(196,69,63,.18)">AI import</Plate>
              <div style={{ fontFamily: SERIF, fontSize: "clamp(26px,2.6vw,34px)", letterSpacing: "-.026em", marginTop: 16 }}>Nobody types it in.</div>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: TEXT2, margin: "12px 0 0", maxWidth: "40ch" }}>Photograph the sheet. The reader pulls out dishes, sections and prices, keeps the order you wrote them in, and hands back a draft, flagging every line it wasn't sure of.</p>
              <div style={{ display: "grid", gap: 7, marginTop: 22, border: `1px solid ${LINE}`, borderRadius: 10, background: SUNKEN, padding: 14 }}>
                {FLAGS.map((f) => (
                  <span key={f.tag} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ flex: "none", display: "inline-flex", alignItems: "center", height: 19, padding: "0 7px", borderRadius: 4, border: `1px solid ${f.border}`, background: f.bg, color: f.colour, font: `600 8px ${SANS}`, letterSpacing: ".1em", textTransform: "uppercase" }}>{f.tag}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: TEXT2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.note}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Dynamic QR */}
            <div data-reveal style={{ border: "1px solid rgba(95,156,124,.3)", borderRadius: 16, background: `linear-gradient(160deg,rgba(95,156,124,.07),transparent 52%),${SURFACE}`, padding: 30, transitionDelay: "80ms" }}>
              <Plate dot={POS} glow="rgba(95,156,124,.2)">Dynamic QR</Plate>
              <div style={{ fontFamily: SERIF, fontSize: "clamp(26px,2.6vw,34px)", letterSpacing: "-.026em", marginTop: 16 }}>Print once. Ever.</div>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: TEXT2, margin: "12px 0 0", maxWidth: "40ch" }}>The code encodes a link, never menu content. Raise a price, hide a dish, switch the whole theme. Every tent already standing on a table keeps working.</p>
              <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 22, padding: 16, border: `1px solid ${LINE}`, borderRadius: 10, background: SUNKEN }}>
                <svg width="76" height="76" viewBox="0 0 96 96" fill="none" stroke="rgba(201,166,103,.6)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
                  <path d="M22 78h52l-8-56H30z" />
                  <path d="M30 22 48 12l18 10" />
                  <path d="M48 12v10" stroke="rgba(201,166,103,.3)" />
                  <rect x="36" y="34" width="24" height="24" stroke="rgba(201,166,103,.85)" />
                  <rect x="40" y="38" width="6" height="6" fill="rgba(201,166,103,.85)" stroke="none" />
                  <rect x="50" y="38" width="6" height="6" fill="rgba(201,166,103,.5)" stroke="none" />
                  <rect x="40" y="48" width="6" height="6" fill="rgba(201,166,103,.5)" stroke="none" />
                  <rect x="50" y="48" width="6" height="6" fill="rgba(201,166,103,.85)" stroke="none" />
                  <path d="M38 66h20" stroke="rgba(201,166,103,.35)" />
                </svg>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontFamily: MONO, fontSize: 10, letterSpacing: "-.02em", color: TEXT2, wordBreak: "break-all" }}>platter.app/v/jin-canting?t=12</span>
                  <span style={{ display: "block", fontSize: 12.5, lineHeight: 1.55, color: TEXT3, marginTop: 8 }}>A6 table tents, an A4 sheet for up to 100 tables, plus PNG and SVG.</span>
                </span>
              </div>
            </div>
          </div>

          {/* the six supporting cards, revealed as one shelf */}
          <div data-reveal style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,255px),1fr))", gap: 16, marginTop: 16 }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="lp-feature" style={{ padding: 24 }}>
                <span style={{ display: "grid", placeItems: "center", width: 40, height: 40, background: "linear-gradient(158deg,#241f1c,#14100f)", boxShadow: "0 1px 0 rgba(246,242,234,.09) inset,0 -1px 2px rgba(0,0,0,.5) inset", clipPath: OCTAGON, fontFamily: CJK, fontSize: 16, color: "rgba(201,166,103,.72)" }}>{f.glyph}</span>
                <div style={{ fontSize: 17, fontWeight: 600, marginTop: 16 }}>{f.title}</div>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: TEXT2, margin: "9px 0 0" }}>{f.body}</p>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".02em", color: TEXT3, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${LINE}` }}>{f.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MID-SERVICE / SOLD OUT */}
      <section style={{ position: "relative", borderTop: `1px solid ${LINE}`, overflow: "hidden" }}>
        <img src="/images/marketing/interior.jpg" alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(100deg,rgba(8,7,10,.96) 0%,rgba(8,7,10,.9) 42%,rgba(8,7,10,.62) 100%)" }} />
        <div style={{ position: "relative", ...WRAP, padding: SECTION, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: "clamp(36px,4vw,64px)", alignItems: "center" }}>
          <div data-reveal>
            <h2 style={H2({ fontSize: "clamp(32px,4.2vw,62px)", maxWidth: "17ch" })}>The kitchen runs out. One tap.</h2>
            <p style={{ fontSize: 16.5, lineHeight: 1.6, color: TEXT2, margin: "20px 0 0", maxWidth: "40ch" }}>Mark a dish gone from your phone, standing on the floor. It sinks to the bottom of its section, dims, and stops being ordered. At 04:00 it comes back on its own.</p>
            <div style={{ display: "grid", gap: 12, marginTop: 26, maxWidth: "38ch" }}>
              {SERVICE_BULLETS.map((b) => (
                <span key={b} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ flex: "none", color: POS, fontSize: 13, marginTop: 2 }}>✓</span>
                  <span style={{ flex: 1, fontSize: 14.5, lineHeight: 1.55, color: TEXT2 }}>{b}</span>
                </span>
              ))}
            </div>
          </div>
          <div data-reveal style={{ display: "flex", justifyContent: "center", transitionDelay: "90ms" }}>
            <div className="lp-float" style={{ width: "min(100%,268px)", borderRadius: 22, border: `1px solid ${LINE2}`, background: BG, boxShadow: "0 46px 90px -30px #000", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 15px", borderBottom: `1px solid ${LINE}`, background: SURFACE }}>
                <span style={{ flex: "none", display: "grid", placeItems: "center", width: 28, height: 28, borderRadius: 6, border: `1px solid ${LINE}`, color: TEXT2, fontSize: 12 }}>≡</span>
                <span style={{ flex: 1, fontFamily: SERIF, fontSize: 16, letterSpacing: "-.018em" }}>Dinner</span>
                <span style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: 5, fontSize: 9, color: POS }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: POS }} />Saved</span>
              </div>
              {SOLD_ROWS.map((r) => (
                <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 15px", borderBottom: `1px solid ${LINE}`, opacity: r.out ? 0.5 : 1 }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</span>
                      {r.out && <span style={{ display: "inline-flex", alignItems: "center", height: 16, padding: "0 6px", borderRadius: 3, border: "1px solid rgba(217,164,65,.45)", background: "rgba(217,164,65,.12)", color: CAUTION, font: `600 7.5px ${SANS}`, letterSpacing: ".1em", textTransform: "uppercase" }}>Out</span>}
                    </span>
                    <span style={{ display: "block", fontFamily: MONO, fontSize: 9.5, letterSpacing: "-.03em", color: TEXT3, marginTop: 5 }}>{r.price}</span>
                  </span>
                  <span style={{ flex: "none", width: 36, height: 21, borderRadius: 999, border: `1px solid ${r.out ? "rgba(217,164,65,.55)" : "rgba(95,156,124,.6)"}`, background: r.out ? "rgba(246,242,234,.12)" : "rgba(95,156,124,.75)", padding: 2 }}>
                    <span style={{ display: "block", width: 15, height: 15, borderRadius: "50%", background: r.out ? TEXT3 : "#f6f2ea", transform: r.out ? "none" : "translateX(15px)" }} />
                  </span>
                </div>
              ))}
              <div style={{ padding: "13px 15px", fontSize: 10.5, lineHeight: 1.5, color: TEXT3 }}>Returns automatically at 04:00, so nobody has to remember before service.</div>
            </div>
          </div>
        </div>
      </section>

      {/* THEMES */}
      <section style={{ position: "relative", borderTop: `1px solid ${LINE}`, background: SURFACE, overflow: "hidden" }}>
        <Watermark glyph="色" size="clamp(300px,36vw,560px)" opacity={0.04} right="82%" bottom="-18%" color="rgb(201 166 103)" />
        <div style={{ ...REL, ...WRAP, padding: SECTION }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 40, alignItems: "end" }}>
            <h2 data-reveal style={H2({ fontSize: "clamp(34px,4.6vw,64px)", maxWidth: "18ch" })}>A wine list shouldn&rsquo;t read like a bubble-tea counter.</h2>
            <p data-reveal style={{ fontSize: 17, lineHeight: 1.6, color: TEXT2, margin: "0 0 8px", maxWidth: "40ch" }}>Each theme is a different set of typographic decisions, not a colour swap, and every one previews on your real dishes before you commit. <Link href="/themes" style={{ color: GILT }}>See all four →</Link></p>
          </div>
          <div data-reveal style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,210px),1fr))", gap: 14, marginTop: 40 }}>
            {THEME_PREVIEWS.map((t, i) => (
              <Link key={t.name} href="/themes" className="lp-theme" style={{ position: "relative", display: "block", overflow: "hidden", background: t.bg }}>
                {/* faint menu watermark */}
                <span aria-hidden style={{ position: "absolute", right: -12, bottom: -30, fontFamily: CJK, fontSize: 150, lineHeight: 1, color: t.text, opacity: 0.05, pointerEvents: "none" }}>餐</span>
                <span style={{ position: "relative", display: "block", padding: "20px 18px 15px", borderBottom: `1px solid ${t.hairline}` }}>
                  <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontFamily: t.font, fontSize: 19, letterSpacing: "-.02em", color: t.text }}>Jīn Cāntīng</span>
                    <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: ".08em", color: t.secondary }}>{`Nº 0${i + 1}`}</span>
                  </span>
                  <span style={{ display: "block", width: 26, height: 2, marginTop: 9, borderRadius: 2, background: t.accent }} />
                  <span style={{ display: "block", fontSize: 9.5, color: t.secondary, marginTop: 9 }}>Open until 22:00</span>
                </span>
                <span style={{ position: "relative", display: "block", padding: "14px 18px" }}>
                  {THEME_ROWS.map((r) => (
                    <span key={r.name} style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "5px 0" }}>
                      <span style={{ fontSize: 11, color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: t.font }}>{r.name}</span>
                      <span style={{ flex: 1, borderBottom: `1px dotted ${t.hairline}`, transform: "translateY(-3px)" }} />
                      <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "-.03em", color: t.accent }}>{r.price}</span>
                    </span>
                  ))}
                </span>
                <span style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "13px 18px", borderTop: `1px solid ${t.hairline}` }}>
                  <span style={{ fontFamily: SERIF, fontSize: 16, fontStyle: "italic", letterSpacing: "-.01em", color: t.text }}>{t.name}</span>
                  <span style={{ display: "flex", gap: 4 }}>
                    <span style={{ width: 11, height: 11, borderRadius: 2, background: t.accent }} />
                    <span style={{ width: 11, height: 11, borderRadius: 2, background: t.hairline }} />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* INSIGHTS */}
      <section style={{ borderTop: `1px solid ${LINE}` }}>
        <div style={{ ...WRAP, padding: SECTION, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: "clamp(36px,4vw,64px)", alignItems: "center" }}>
          <div data-reveal>
            <h2 style={H2({ fontSize: "clamp(32px,4.2vw,58px)", maxWidth: "19ch" })}>Find out what they searched for and couldn&rsquo;t find.</h2>
            <p style={{ fontSize: 16.5, lineHeight: 1.6, color: TEXT2, margin: "20px 0 0", maxWidth: "42ch" }}>Platter counts taps, not orders, so it never pretends to be revenue. What it does tell you is which dishes get opened, which never do, and what diners typed that returned nothing.</p>
          </div>
          <div data-reveal style={{ border: `1px solid ${LINE}`, borderRadius: 16, background: SURFACE, padding: 26, transitionDelay: "90ms" }}>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".15em", textTransform: "uppercase", color: TEXT3 }}>Searched for, not found · 30 days</div>
            <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
              {MISSES.map((m, i) => (
                <span key={m.term} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ flex: "none", width: 74, fontSize: 13.5, color: TEXT }}>&ldquo;{m.term}&rdquo;</span>
                  <span style={{ flex: 1, height: 7, borderRadius: 999, background: "rgba(246,242,234,.08)", overflow: "hidden" }}><span className="lp-bar" style={{ display: "block", height: "100%", borderRadius: 999, background: ACCENT, width: m.pct, transitionDelay: `${120 + i * 90}ms` }} /></span>
                  <span style={{ flex: "none", fontFamily: MONO, fontSize: 11, fontVariantNumeric: "tabular-nums", color: TEXT2 }}>{m.count}</span>
                </span>
              ))}
            </div>
            <p style={{ fontSize: 12.5, lineHeight: 1.6, color: TEXT3, margin: "18px 0 0", paddingTop: 16, borderTop: `1px solid ${LINE}` }}>Each one is either a dish to add, or a name to change. Jollof is on this menu, filed under Nigerian Dishes, where nobody looked.</p>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ position: "relative", borderTop: `1px solid ${LINE}`, background: SURFACE, overflow: "hidden" }}>
        <Watermark glyph="价" size="clamp(320px,40vw,600px)" opacity={0.045} right="-2%" bottom="-16%" color="rgb(201 166 103)" />
        <div style={{ ...REL, ...WRAP, padding: SECTION }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 40, alignItems: "end" }}>
            <h2 data-reveal style={H2({ fontSize: "clamp(34px,4.6vw,68px)" })}>Priced like<br /><span style={{ fontStyle: "italic", color: ACCENT_TEXT }}>a menu.</span></h2>
            <p data-reveal style={{ fontSize: 17, lineHeight: 1.6, color: TEXT2, margin: "0 0 8px", maxWidth: "40ch" }}>The right-hand column is the entire pricing page. Most of it is free, and stays free.</p>
          </div>
          <div data-reveal style={{ marginTop: 40, borderTop: `1px solid ${LINE2}` }}>
            {FARE.map((f) => (
              <div key={f.n} className="lp-price-row" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 86px", gap: 24, alignItems: "baseline", padding: "19px 0", borderBottom: `1px solid ${LINE}` }}>
                <div>
                  <div style={{ fontFamily: SERIF, fontSize: "clamp(20px,2.1vw,28px)", letterSpacing: "-.024em", lineHeight: 1.12 }}>{f.n}</div>
                  <p style={{ fontSize: 14, lineHeight: 1.55, color: TEXT2, margin: "7px 0 0", maxWidth: "58ch" }}>{f.d}</p>
                </div>
                <div style={{ textAlign: "right", fontFamily: MONO, fontSize: 12.5, letterSpacing: "-.03em", color: f.tier === "Pro" ? GILT : TEXT2 }}>{f.tier}</div>
              </div>
            ))}
          </div>
          <div data-reveal style={{ display: "flex", flexWrap: "wrap", gap: 48, alignItems: "flex-end", marginTop: 40 }}>
            <div>
              <div style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(46px,5.6vw,80px)", lineHeight: 0.9, letterSpacing: "-.05em", fontVariantNumeric: "tabular-nums" }}>₦0</div>
              <div style={{ fontSize: 14, color: TEXT2, marginTop: 14 }}>Free, forever, for one menu. No card.</div>
            </div>
            <div style={{ borderLeft: `1px solid ${LINE}`, paddingLeft: 30 }}>
              <div style={{ fontFamily: MONO, fontSize: "clamp(22px,2.4vw,32px)", letterSpacing: "-.05em", fontVariantNumeric: "tabular-nums", color: GILT }}>₦12,000</div>
              <div style={{ fontSize: 14, color: TEXT2, marginTop: 14, maxWidth: "30ch" }}>Pro, per month. Or ₦120,000 a year, which is two months free.</div>
            </div>
            <Link href="/admin/billing" className="lp-cta-ghost inline-flex items-center font-semibold" style={{ height: 50, padding: "0 22px", borderRadius: 9, border: `1px solid ${GILT}`, color: GILT, fontSize: 14.5 }}>Try Pro free for 14 days</Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ borderTop: `1px solid ${LINE}` }}>
        <div style={{ ...WRAP, padding: SECTION, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: "clamp(32px,4vw,56px)", alignItems: "start" }}>
          <h2 data-reveal style={H2({ fontSize: "clamp(34px,4.6vw,68px)" })}>Before<br />you <span style={{ fontStyle: "italic", color: ACCENT_TEXT }}>ask.</span></h2>
          <div data-reveal><LandingFaq items={QUESTIONS} /></div>
        </div>
      </section>

      {/* CTA: food, at last */}
      <section id="cta" style={{ position: "relative", borderTop: `1px solid ${LINE}`, overflow: "hidden" }}>
        <img src="/images/marketing/served-table.jpg" alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(8,7,10,.9),rgba(8,7,10,.82))" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(66% 60% at 24% 46%,rgba(168,47,44,.34),transparent 62%)" }} />
        <div style={{ position: "relative", ...WRAP, padding: "clamp(72px,9vw,150px) 32px" }}>
          <h2 data-reveal style={H2({ fontSize: "clamp(42px,8vw,132px)", lineHeight: 0.86, letterSpacing: "-.05em", maxWidth: "16ch" })}>Put your menu on a phone tonight.</h2>
          <div data-reveal style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 40, flexWrap: "wrap", transitionDelay: "90ms" }}>
            <Link href="/admin/signup" className="lp-cta-primary inline-flex items-center font-bold" style={{ height: 58, padding: "0 32px", borderRadius: 9, background: ACCENT, color: "#fff", fontSize: 16, boxShadow: "0 10px 36px -8px rgba(168,47,44,.75)" }}>Start free</Link>
            <Link href="/discover" className="lp-cta-ghost inline-flex items-center font-semibold" style={{ height: 58, padding: "0 26px", borderRadius: 9, border: `1px solid ${LINE2}`, fontSize: 16, backdropFilter: "blur(8px)" }}>See a live menu</Link>
            <span style={{ fontSize: 14.5, color: TEXT2, maxWidth: "32ch" }}>One menu free forever. The import, codes, print and insights included.</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${LINE}`, background: BG }}>
        <div style={{ ...WRAP, padding: 32, display: "flex", flexWrap: "wrap", gap: 28, alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 9, marginRight: "auto" }}>
            <img src="/brand/platter-mark-bone.png" alt="" style={{ height: 22, width: "auto", display: "block" }} />
            <span style={{ fontFamily: SERIF, fontSize: 17 }}>Platter</span>
          </span>
          <a href="#features" style={{ fontSize: 13, color: TEXT2 }}>Features</a>
          <Link href="/themes" style={{ fontSize: 13, color: TEXT2 }}>Themes</Link>
          <Link href="/discover" style={{ fontSize: 13, color: TEXT2 }}>Discover</Link>
          <a href="#pricing" style={{ fontSize: 13, color: TEXT2 }}>Pricing</a>
          <Link href="/admin/login" style={{ fontSize: 13, color: TEXT2 }}>Sign in</Link>
        </div>
      </footer>

      <RevealObserver />
    </div>
  );
}
