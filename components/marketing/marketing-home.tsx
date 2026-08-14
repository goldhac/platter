/* eslint-disable @next/next/no-img-element -- marketing hero art; decorative, not LCP-optimized */
import Link from "next/link";

// Platter v2 marketing landing (redesign 2026-08). Cinematic, editorial: full-bleed food,
// Bodoni at display scale, a floating live-menu card, ledger pricing. Own chrome (dark),
// independent of the tenant theme tokens. Photos are free-licence stand-ins — swap for the
// flagship's own AI dish photos before launch.

const SERIF = "var(--font-display)";
const SANS = "var(--font-body)";
const MONO = "var(--font-mono)";
const CJK = "var(--font-cjk)";

const FARE: { n: string; d: string; tier: "Free" | "Pro" }[] = [
  { n: "One menu, always current", d: "Edit a price and the QR on the table is right in the same second.", tier: "Free" },
  { n: "AI import from a photo", d: "Photograph the sheet you already print; it reads the dishes and holds your sections.", tier: "Free" },
  { n: "QR codes + print-ready sheets", d: "Table tents and A4 sheets, generated from the same menu so they never disagree.", tier: "Free" },
  { n: "Your own web address", d: "A clean link to share today; nothing for a diner to download.", tier: "Free" },
  { n: "The four designer themes", d: "Preview every one against your real dishes. Publishing a theme is Pro.", tier: "Free" },
  { n: "More than one menu", d: "Dinner, bar, breakfast — each with its own look and QR.", tier: "Pro" },
  { n: "A custom domain", d: "menu.yourrestaurant.com, once you're ready.", tier: "Pro" },
  { n: "Your team", d: "Managers and staff, each with the right access.", tier: "Pro" },
];

const FAQ: { q: string; a: string }[] = [
  { q: "Do my diners need an app?", a: "No. It opens in any phone browser the moment they scan the QR or tap a link — nothing to download, works on bad signal." },
  { q: "What if the import misreads something?", a: "Whatever it gets wrong is yours to fix, and nothing reaches a diner until you publish. You review the whole menu first." },
  { q: "Can I change prices after the codes are printed?", a: "Yes — the QR points at your menu, so every edit shows instantly. The printed code never changes." },
  { q: "Is it really free?", a: "One menu, the import, QR codes and print — free, forever, no card. You only move to Pro when you want a second menu or your own domain." },
  { q: "What about photos?", a: "Add your own, or generate one per dish from its name and description with AI in about 25 seconds. Dishes without a photo fall back to your seal, never a grey box." },
];

function Btn({ href, children, kind = "accent" }: { href: string; children: React.ReactNode; kind?: "accent" | "ghost" | "bone" }) {
  const base = "inline-flex items-center font-semibold transition-transform";
  if (kind === "bone")
    return (
      <Link href={href} className={base} style={{ height: 38, padding: "0 18px", borderRadius: 7, background: "var(--color-text)", color: "#0d0b0f", fontFamily: SANS, fontSize: 13.5 }}>
        {children}
      </Link>
    );
  if (kind === "ghost")
    return (
      <Link href={href} className={base} style={{ height: 54, padding: "0 26px", borderRadius: 9, border: "1px solid var(--color-hairline)", background: "rgba(246,242,234,.04)", backdropFilter: "blur(8px)", fontFamily: SANS, fontSize: 15.5 }}>
        {children}
      </Link>
    );
  return (
    <Link href={href} className={base} style={{ height: 54, padding: "0 28px", borderRadius: 9, background: "var(--color-accent-hover)", color: "#fff", fontFamily: SANS, fontSize: 15.5, boxShadow: "0 8px 30px -8px rgba(168,47,44,.7)" }}>
      {children}
    </Link>
  );
}

const marquee = [
  ["Chicken Samosa", "₦6,000"],
  ["Kung Pao Chicken", "₦11,000"],
  ["Geogold Special Fried Rice", "₦9,000"],
  ["Wonton Soup", "₦6,500"],
  ["Chicken Chow Mein", "₦9,000"],
];

export function MarketingHome() {
  return (
    <div style={{ overflowX: "hidden", background: "var(--color-bg)", color: "var(--color-text)", fontFamily: SANS }}>
      {/* NAV */}
      <header style={{ position: "fixed", inset: "0 0 auto 0", zIndex: 60, backdropFilter: "blur(20px)", background: "rgba(10,8,7,.6)", borderBottom: "1px solid var(--color-hairline)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 32px", height: 64, display: "flex", alignItems: "center", gap: 32 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, marginRight: "auto" }}>
            <img src="/brand/platter-mark-bone.png" alt="" style={{ height: 26, width: "auto", display: "block" }} />
            <span style={{ fontFamily: SERIF, fontSize: 20, letterSpacing: "-.01em" }}>Platter</span>
          </Link>
          <nav style={{ display: "flex", gap: 26, fontSize: 14, color: "var(--color-text-secondary)" }} className="max-sm:hidden">
            <a href="#menu">The menu</a>
            <a href="#import">Import</a>
            <a href="#pricing">Pricing</a>
          </nav>
          <Link href="/admin/login" style={{ fontSize: 14, color: "var(--color-text-secondary)" }} className="max-sm:hidden">
            Sign in
          </Link>
          <Btn href="/admin/signup" kind="bone">Start free</Btn>
        </div>
      </header>

      {/* HERO */}
      <section id="top" style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
        <img src="https://images.unsplash.com/photo-1621494268492-d01b98eba7e4?auto=format&fit=crop&w=2400&q=80" alt="" className="m-fade" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", animation: "m-scale 1400ms var(--ease-out) both" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(10,8,7,.78) 0%,rgba(10,8,7,.66) 22%,rgba(10,8,7,.68) 60%,rgba(10,8,7,.94) 86%,var(--color-bg) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(70% 50% at 82% 22%,rgba(168,47,44,.32),transparent 62%)" }} />

        <div style={{ position: "relative", maxWidth: 1400, width: "100%", margin: "0 auto", padding: "0 32px 72px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 56, alignItems: "end" }}>
          <div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 9, height: 30, padding: "0 13px", borderRadius: 999, border: "1px solid var(--color-hairline-strong)", background: "rgba(10,8,7,.5)", backdropFilter: "blur(8px)", fontSize: 12.5, color: "var(--color-text-secondary)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-positive)" }} />
              Live at Jīn Cāntīng · 258 dishes
            </span>
            <h1 className="m-fade" style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(56px,9.4vw,148px)", lineHeight: 0.86, letterSpacing: "-.05em", margin: "22px 0 0", animation: "m-up 900ms 120ms var(--ease-out) both" }}>
              Make them
              <br />
              <span style={{ fontStyle: "italic" }}>hungry.</span>
            </h1>
            <p style={{ fontSize: "clamp(16px,1.3vw,19.5px)", lineHeight: 1.55, color: "rgba(246,242,234,.82)", margin: "26px 0 0", maxWidth: "40ch" }}>
              A diner decides in ninety seconds, looking at a phone. Photograph the menu you already print — Platter sets it properly and puts it in their hand.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 34, flexWrap: "wrap" }}>
              <Btn href="/admin/signup">Start free</Btn>
              <Btn href="/v/jin-canting" kind="ghost">See a live menu</Btn>
            </div>
          </div>

          {/* floating live-menu card */}
          <div className="max-md:hidden" style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: "min(100%,376px)", borderRadius: 20, border: "1px solid var(--color-hairline-strong)", background: "rgba(21,17,16,.82)", backdropFilter: "blur(24px)", boxShadow: "0 50px 110px -30px #000, 0 0 0 1px rgba(255,255,255,.04) inset", overflow: "hidden" }}>
              <div style={{ padding: "26px 22px 20px", textAlign: "center", borderBottom: "1px solid var(--color-hairline)" }}>
                <div style={{ fontFamily: CJK, fontSize: 11, letterSpacing: ".44em", color: "var(--color-hairline-strong)", paddingLeft: ".44em" }}>金餐厅</div>
                <div style={{ fontFamily: SERIF, fontSize: 29, letterSpacing: "-.028em", marginTop: 9 }}>Jīn Cāntīng</div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 13, fontSize: 11.5, color: "var(--color-text-secondary)" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--color-positive)" }} />
                  Open until 23:00
                </span>
              </div>
              {[
                { n: "Chicken Samosa", zh: "咖喱角", p: "₦6,000", s: "≈ $3.77", img: "https://images.unsplash.com/photo-1626627702449-e4aaf40372f9?auto=format&fit=crop&w=200&q=70" },
                { n: "Hot Chicken Wings", p: "₦6,000", pips: 3, img: "https://images.unsplash.com/photo-1663530761401-15eefb544889?auto=format&fit=crop&w=200&q=70" },
              ].map((it) => (
                <div key={it.n} style={{ display: "flex", gap: 13, alignItems: "center", padding: "14px 22px", borderBottom: "1px solid var(--color-hairline)" }}>
                  <img src={it.img} alt="" style={{ width: 56, height: 56, borderRadius: 9, objectFit: "cover", flex: "none" }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 500 }}>{it.n}</span>
                      {it.zh && <span style={{ fontFamily: CJK, fontSize: 11.5, color: "var(--color-text-tertiary)" }}>{it.zh}</span>}
                    </span>
                    <span style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 7 }}>
                      <span style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: "-.04em", fontVariantNumeric: "tabular-nums" }}>{it.p}</span>
                      {it.s && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "-.04em", color: "var(--color-text-tertiary)" }}>{it.s}</span>}
                      {it.pips && (
                        <span style={{ display: "flex", gap: 3 }}>
                          {Array.from({ length: it.pips }).map((_, i) => (
                            <span key={i} style={{ width: 8, height: 8, background: "var(--color-accent-hover)", clipPath: "polygon(29% 0,71% 0,100% 29%,100% 71%,71% 100%,29% 100%,0 71%,0 29%)" }} />
                          ))}
                        </span>
                      )}
                    </span>
                  </span>
                </div>
              ))}
              <div style={{ display: "flex", gap: 13, alignItems: "center", padding: "14px 22px", opacity: 0.4 }}>
                <span style={{ width: 56, height: 56, borderRadius: 9, background: "var(--color-surface-raised)", flex: "none" }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 500 }}>Vegetable Spring Rolls</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--color-text-tertiary)", marginTop: 6 }}>Sold out · back at 11:00</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div style={{ borderTop: "1px solid var(--color-hairline)", borderBottom: "1px solid var(--color-hairline)", overflow: "hidden", padding: "16px 0", background: "var(--color-surface)" }}>
        <div className="m-marquee" style={{ display: "flex", width: "max-content", animation: "m-slide 38s linear infinite" }}>
          {[0, 1].map((dup) => (
            <span key={dup} style={{ display: "flex", gap: 30, alignItems: "center", paddingRight: 30, fontFamily: SERIF, fontSize: "clamp(20px,2.1vw,32px)", letterSpacing: "-.02em", whiteSpace: "nowrap", color: "var(--color-text-secondary)" }}>
              {marquee.map(([n, p]) => (
                <span key={n} style={{ display: "flex", gap: 30, alignItems: "center" }}>
                  <span>
                    {n} <span style={{ fontFamily: MONO, fontSize: ".44em", letterSpacing: "-.04em", color: "var(--color-hairline-strong)" }}>{p}</span>
                  </span>
                  <span style={{ color: "var(--color-accent-hover)" }}>·</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* THE MENU — bento */}
      <section id="menu" style={{ maxWidth: 1400, margin: "0 auto", padding: "clamp(80px,9vw,140px) 32px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 40, alignItems: "end" }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(38px,5.4vw,82px)", lineHeight: 0.9, letterSpacing: "-.045em", margin: 0 }}>
            This is what
            <br />
            they <span style={{ fontStyle: "italic", color: "var(--color-accent-text)" }}>see.</span>
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: "var(--color-text-secondary)", margin: "0 0 10px", maxWidth: "44ch" }}>
            Not a pinch-to-zoom photograph of a laminated sheet. A menu that loads on bad signal, searches, and says what is vegetarian and what has run out.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, marginTop: 52 }}>
          {[
            { n: "Sizzling Fish in Hot Plate", p: "₦12,000", img: "https://images.unsplash.com/photo-1676471926534-d5c9771909fa?auto=format&fit=crop&w=800&q=75" },
            { n: "De-Geogold Crispy Beef", p: "₦6,000", img: "https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?auto=format&fit=crop&w=800&q=75" },
            { n: "Vegetable Fried Rice", p: "₦7,000", veg: true, img: "https://images.unsplash.com/photo-1616671276441-2f2c277b8bf9?auto=format&fit=crop&w=800&q=75" },
            { n: "Kung Pao Chicken", p: "₦11,000", img: "https://images.unsplash.com/photo-1689672235501-6dc1e56d454c?auto=format&fit=crop&w=800&q=75" },
          ].map((d) => (
            <div key={d.n} style={{ position: "relative", borderRadius: 16, overflow: "hidden", aspectRatio: "3/4", border: "1px solid var(--color-hairline)" }}>
              <img src={d.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <span style={{ position: "absolute", inset: "auto 0 0 0", padding: 20, background: "linear-gradient(0deg,rgba(10,8,7,.94),transparent)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>{d.n}</span>
                  {d.veg && <span style={{ display: "inline-flex", alignItems: "center", height: 19, padding: "0 7px", borderRadius: 4, border: "1px solid rgba(95,156,124,.45)", color: "var(--color-positive)", font: "600 9px/1 var(--font-body)", letterSpacing: ".08em", textTransform: "uppercase" }}>Veg</span>}
                </span>
                <span style={{ display: "block", fontFamily: MONO, fontSize: 12, letterSpacing: "-.04em", color: "var(--color-hairline-strong)", marginTop: 6 }}>{d.p}</span>
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 1, marginTop: 16, background: "var(--color-hairline)", border: "1px solid var(--color-hairline)", borderRadius: 16, overflow: "hidden" }}>
          {[
            ["01", "Loads on bad signal", "In a dark room, on an old phone, without a download."],
            ["02", "Searchable and filtered", "Vegetarian, seafood, spice level, allergens where they belong."],
            ["03", "Never disappoints", "Sold-out dishes sink and dim instead of being ordered."],
          ].map(([n, t, d]) => (
            <div key={n} style={{ background: "var(--color-surface)", padding: 28 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: "var(--color-accent-text)", letterSpacing: ".1em" }}>{n}</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 14 }}>{t}</div>
              <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--color-text-secondary)", margin: "8px 0 0" }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* IMPORT */}
      <section id="import" style={{ maxWidth: 1400, margin: "0 auto", padding: "clamp(80px,9vw,140px) 32px 0" }}>
        <div style={{ borderRadius: 24, border: "1px solid var(--color-hairline)", overflow: "hidden", background: "var(--color-surface)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))" }}>
          <div style={{ padding: "clamp(36px,4vw,64px)" }}>
            <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(36px,4.4vw,64px)", lineHeight: 0.92, letterSpacing: "-.042em", margin: 0 }}>
              Nobody types
              <br />
              it <span style={{ fontStyle: "italic", color: "var(--color-accent-text)" }}>in.</span>
            </h2>
            <p style={{ fontSize: 16.5, lineHeight: 1.6, color: "var(--color-text-secondary)", margin: "24px 0 0", maxWidth: "42ch" }}>
              Photograph the sheet. The importer reads the dishes, holds the sections in the order you wrote them, and keeps the prices in your currency.
            </p>
            <p style={{ fontSize: 16.5, lineHeight: 1.6, color: "var(--color-text-secondary)", margin: "14px 0 0", maxWidth: "42ch" }}>
              Whatever it misreads is yours to fix. Nothing reaches a diner until you publish.
            </p>
            <div style={{ marginTop: 30 }}>
              <Btn href="/admin/signup">Import your menu</Btn>
            </div>
          </div>
          <div style={{ position: "relative", minHeight: 360, background: "var(--color-surface-raised)", display: "grid", placeItems: "center", padding: 40 }}>
            <div style={{ width: "100%", maxWidth: 400 }}>
              <div style={{ justifySelf: "start", width: "min(100%,320px)", background: "#f4efe4", color: "#22201d", padding: "26px 22px", fontFamily: "'Courier New',ui-monospace,monospace", transform: "rotate(-3deg)", boxShadow: "0 30px 60px -26px #000", position: "relative", zIndex: 1 }}>
                <div style={{ textAlign: "center", fontSize: 11.5, fontWeight: 700, letterSpacing: ".16em" }}>APPETIZERS</div>
                <div style={{ height: 1, background: "#22201d", opacity: 0.28, margin: "12px 0" }} />
                <div style={{ display: "grid", gap: 8, fontSize: 11, lineHeight: 1.3 }}>
                  {[["Chicken Samosa", "6,000"], ["Hot Chicken Wings", "6,000"], ["Spring Rolls", "6,000"], ["Crispy Beef", "6,000"]].map(([n, p]) => (
                    <div key={n} style={{ display: "flex", gap: 6 }}>
                      <span>{n}</span>
                      <span style={{ flex: 1, borderBottom: "1px dotted #22201d", opacity: 0.42, transform: "translateY(-4px)" }} />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginLeft: "auto", width: "min(100%,290px)", marginTop: 14, borderRadius: 14, border: "1px solid var(--color-hairline-strong)", background: "rgba(21,17,16,.94)", backdropFilter: "blur(18px)", boxShadow: "0 34px 70px -26px #000", transform: "rotate(2deg)", position: "relative", zIndex: 2 }}>
                <div style={{ padding: "13px 17px", borderBottom: "1px solid var(--color-hairline)", fontFamily: MONO, fontSize: 9, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--color-hairline-strong)" }}>Draft · not yet live</div>
                <div style={{ display: "grid", gap: 13, padding: 17 }}>
                  {["Chicken Samosa", "Hot Chicken Wings", "Chicken Spring Rolls"].map((n) => (
                    <div key={n}>
                      <div style={{ fontSize: 13.5 }}>{n}</div>
                      <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "-.04em", fontVariantNumeric: "tabular-nums", color: "var(--color-text-secondary)", marginTop: 4 }}>₦6,000</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ maxWidth: 1400, margin: "0 auto", padding: "clamp(80px,9vw,140px) 32px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 40, alignItems: "end" }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(38px,5.4vw,82px)", lineHeight: 0.9, letterSpacing: "-.045em", margin: 0 }}>
            Priced like
            <br />
            <span style={{ fontStyle: "italic", color: "var(--color-accent-text)" }}>a menu.</span>
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: "var(--color-text-secondary)", margin: "0 0 10px", maxWidth: "42ch" }}>
            The right-hand column is the entire pricing page. There is no second one.
          </p>
        </div>
        <div style={{ marginTop: 48, borderTop: "1px solid var(--color-hairline-strong)" }}>
          {FARE.map((f) => (
            <div key={f.n} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 90px", gap: 24, alignItems: "baseline", padding: "20px 0", borderBottom: "1px solid var(--color-hairline)" }}>
              <div>
                <div style={{ fontFamily: SERIF, fontSize: "clamp(21px,2.2vw,29px)", letterSpacing: "-.025em", lineHeight: 1.12 }}>{f.n}</div>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--color-text-secondary)", margin: "7px 0 0", maxWidth: "56ch" }}>{f.d}</p>
              </div>
              <div style={{ textAlign: "right", fontFamily: MONO, fontSize: 12.5, letterSpacing: "-.03em", color: f.tier === "Pro" ? "var(--color-hairline-strong)" : "var(--color-text-secondary)" }}>{f.tier}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 52, alignItems: "flex-end", marginTop: 44 }}>
          <div>
            <div style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(48px,6vw,84px)", lineHeight: 0.9, letterSpacing: "-.05em", fontVariantNumeric: "tabular-nums" }}>₦0</div>
            <div style={{ fontSize: 14, color: "var(--color-text-secondary)", marginTop: 14 }}>Free, forever, for one menu.</div>
          </div>
          <div style={{ borderLeft: "1px solid var(--color-hairline)", paddingLeft: 30 }}>
            <div style={{ fontFamily: SERIF, fontSize: "clamp(26px,3vw,42px)", lineHeight: 1, letterSpacing: "-.03em", fontStyle: "italic", color: "var(--color-hairline-strong)" }}>Pro, soon</div>
            <div style={{ fontSize: 14, color: "var(--color-text-secondary)", marginTop: 14, maxWidth: "32ch" }}>Card checkout launches shortly. Start free and move over when it opens.</div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "clamp(80px,9vw,140px) 32px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 48, alignItems: "start" }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(38px,5.4vw,82px)", lineHeight: 0.9, letterSpacing: "-.045em", margin: 0 }}>
            Before
            <br />
            you <span style={{ fontStyle: "italic", color: "var(--color-accent-text)" }}>ask.</span>
          </h2>
          <div style={{ borderTop: "1px solid var(--color-hairline-strong)" }}>
            {FAQ.map((item) => (
              <details key={item.q} style={{ borderBottom: "1px solid var(--color-hairline)" }} className="m-faq">
                <summary style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 22, padding: "20px 0", cursor: "pointer", fontSize: 16.5, listStyle: "none" }}>
                  <span>{item.q}</span>
                  <span className="m-faq-plus" style={{ flex: "none", fontFamily: MONO, fontSize: 14, color: "var(--color-text-secondary)" }}>
                    +
                  </span>
                  <span className="m-faq-dash" style={{ flex: "none", fontFamily: MONO, fontSize: 14, color: "var(--color-accent-text)" }}>
                    −
                  </span>
                </summary>
                <p style={{ fontSize: 15, lineHeight: 1.62, color: "var(--color-text-secondary)", margin: "0 0 22px", maxWidth: "58ch" }}>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" style={{ position: "relative", marginTop: "clamp(90px,10vw,150px)", overflow: "hidden" }}>
        <img src="https://images.unsplash.com/photo-1731941465921-eb4285693713?auto=format&fit=crop&w=2400&q=80" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,var(--color-bg) 0%,rgba(10,8,7,.82) 40%,rgba(10,8,7,.9) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 60% at 26% 70%,rgba(168,47,44,.36),transparent 62%)" }} />
        <div style={{ position: "relative", maxWidth: 1400, margin: "0 auto", padding: "clamp(88px,10vw,170px) 32px" }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(50px,10vw,168px)", lineHeight: 0.84, letterSpacing: "-.05em", margin: 0 }}>
            Put it out
            <br />
            <span style={{ fontStyle: "italic" }}>tonight.</span>
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 44, flexWrap: "wrap" }}>
            <Link href="/admin/signup" className="inline-flex items-center font-semibold" style={{ height: 58, padding: "0 32px", borderRadius: 9, background: "var(--color-accent-hover)", color: "#fff", fontFamily: SANS, fontSize: 16, boxShadow: "0 10px 36px -8px rgba(168,47,44,.75)" }}>
              Start free
            </Link>
            <span style={{ fontSize: 14.5, color: "var(--color-text-secondary)", maxWidth: "36ch" }}>One menu, the import, QR codes and print. No card, and nothing expires.</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--color-hairline)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 32px", display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/brand/platter-mark-bone.png" alt="" style={{ height: 22, width: "auto" }} />
            <span style={{ fontFamily: SERIF, fontSize: 17 }}>Platter</span>
          </Link>
          <div style={{ display: "flex", gap: 22, fontSize: 13.5, color: "var(--color-text-secondary)" }}>
            <Link href="/discover">Discover</Link>
            <Link href="/themes">Themes</Link>
            <a href="#pricing">Pricing</a>
            <Link href="/admin/login">Sign in</Link>
          </div>
          <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "-.02em", color: "var(--color-text-tertiary)" }}>Digital menus for restaurants</span>
        </div>
      </footer>
    </div>
  );
}
