"use client";

/* eslint-disable @next/next/no-img-element -- venue art on a marketing directory */
import Link from "next/link";
import { useMemo, useState } from "react";
import type { DiscoverVenue } from "@/lib/queries/discover";

const SERIF = "var(--font-display)";
const SANS = "var(--font-body)";
const MONO = "var(--font-mono)";
const SEAL = "polygon(29% 0,71% 0,100% 29%,100% 71%,71% 100%,29% 100%,0 71%,0 29%)";

// v2 Discover directory grid — search + cuisine chips filtering the real listed venues.
// No-photo venues get the chamfered-octagon seal (never a grey box).
export function DiscoverGrid({ venues }: { venues: DiscoverVenue[] }) {
  const [q, setQ] = useState("");
  const [cuisine, setCuisine] = useState<string | null>(null);

  const cuisines = useMemo(() => {
    const set = new Set<string>();
    for (const v of venues) for (const c of (v.cuisine ?? "").split(/[·,/]/)) if (c.trim()) set.add(c.trim());
    return [...set].slice(0, 6);
  }, [venues]);

  const query = q.trim().toLowerCase();
  const results = venues.filter((v) => {
    if (cuisine && !(v.cuisine ?? "").toLowerCase().includes(cuisine.toLowerCase())) return false;
    if (query) {
      const hay = `${v.name} ${v.cuisine ?? ""} ${v.description ?? ""}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
  const filtered = query !== "" || cuisine !== null;

  return (
    <>
      {/* sticky search + chips */}
      <div style={{ position: "sticky", top: 64, zIndex: 50, backdropFilter: "blur(20px)", background: "rgba(10,8,7,.9)", borderTop: "1px solid var(--color-hairline)", borderBottom: "1px solid var(--color-hairline)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "14px 32px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ position: "relative", flex: 1, minWidth: 220, maxWidth: 380 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.8" strokeLinecap="round" style={{ position: "absolute", left: 14, top: 14 }}>
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a place or a dish"
              style={{ width: "100%", height: 44, padding: "0 14px 0 40px", borderRadius: 999, border: "1px solid var(--color-hairline-strong)", background: "var(--color-surface)", color: "var(--color-text)", font: "400 14.5px var(--font-body)", outline: "none" }}
            />
          </span>
          <span style={{ display: "flex", gap: 8, overflowX: "auto", flex: 1, minWidth: 0 }} className="no-scrollbar">
            {cuisines.map((c) => {
              const on = cuisine === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCuisine(on ? null : c)}
                  style={{ flex: "none", height: 36, padding: "0 15px", borderRadius: 999, whiteSpace: "nowrap", cursor: "pointer", font: "600 12.5px var(--font-body)", border: on ? "1px solid var(--color-accent-hover)" : "1px solid var(--color-hairline)", background: on ? "var(--color-accent-soft)" : "transparent", color: on ? "var(--color-text)" : "var(--color-text-secondary)" }}
                >
                  {c}
                </button>
              );
            })}
          </span>
        </div>
      </div>

      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "26px 32px clamp(60px,7vw,110px)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--color-text-secondary)" }}>
            {results.length} place{results.length === 1 ? "" : "s"}
          </span>
          {filtered && (
            <button type="button" onClick={() => { setQ(""); setCuisine(null); }} style={{ height: 32, padding: "0 13px", borderRadius: 7, border: "1px solid var(--color-hairline-strong)", background: "transparent", color: "var(--color-text-secondary)", font: "600 11.5px var(--font-body)", cursor: "pointer" }}>
              Clear
            </button>
          )}
        </div>

        {results.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,300px),1fr))", gap: 18, marginTop: 20 }}>
            {results.map((v) => (
              <Link key={v.id} href={`/v/${v.slug}`} style={{ display: "flex", flexDirection: "column", borderRadius: 16, overflow: "hidden", border: "1px solid var(--color-hairline)", background: "var(--color-surface)" }}>
                <span style={{ position: "relative", display: "block", aspectRatio: "16/10", overflow: "hidden", background: "var(--color-surface-sunken)" }}>
                  {v.image_url ? (
                    <img src={v.image_url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                      <span style={{ display: "grid", placeItems: "center", width: 64, height: 64, background: "linear-gradient(158deg,#241f1c,#14100f)", boxShadow: "0 1px 0 rgb(246 242 234 / .09) inset, 0 -1px 2px rgb(0 0 0 / .5) inset", clipPath: SEAL, fontFamily: SERIF, fontSize: 25, color: "rgb(201 166 103 / .62)" }}>
                        {v.name.slice(0, 1)}
                      </span>
                    </span>
                  )}
                  <span style={{ position: "absolute", left: 12, top: 12, display: "inline-flex", alignItems: "center", gap: 7, height: 26, padding: "0 11px", borderRadius: 999, border: "1px solid rgba(95,156,124,.5)", background: "rgba(10,8,7,.72)", backdropFilter: "blur(8px)", fontSize: 11.5, color: "var(--color-positive)" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--color-positive)" }} />
                    Live
                  </span>
                </span>
                <span style={{ display: "flex", flexDirection: "column", flex: 1, padding: 17 }}>
                  <span style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: SERIF, fontSize: 21, letterSpacing: "-.02em" }}>{v.name}</span>
                    {v.name_zh && <span style={{ fontFamily: "var(--font-cjk)", fontSize: 13, color: "var(--color-hairline-strong)" }}>{v.name_zh}</span>}
                  </span>
                  {v.cuisine && (
                    <span style={{ marginTop: 7, fontFamily: MONO, fontSize: 9.5, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--color-text-tertiary)" }}>{v.cuisine}</span>
                  )}
                  {v.description && <span style={{ display: "block", fontSize: 13.5, lineHeight: 1.55, color: "var(--color-text-secondary)", marginTop: 10 }}>{v.description}</span>}
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: "auto", paddingTop: 14, borderTop: "1px solid var(--color-hairline)" }}>
                    <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.address ?? ""}</span>
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".13em", textTransform: "uppercase", color: "var(--color-hairline-strong)", whiteSpace: "nowrap" }}>View menu →</span>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: 24, border: "1px solid var(--color-hairline)", borderRadius: 16, background: "var(--color-surface)", padding: "72px 32px", textAlign: "center" }}>
            <span style={{ display: "inline-grid", placeItems: "center", width: 76, height: 76, background: "linear-gradient(158deg,#241f1c,#14100f)", boxShadow: "0 1px 0 rgb(246 242 234 / .09) inset, 0 -1px 2px rgb(0 0 0 / .5) inset", clipPath: SEAL, fontFamily: "var(--font-cjk)", fontSize: 27, color: "rgb(201 166 103 / .7)" }}>
              空
            </span>
            <div style={{ fontFamily: SERIF, fontSize: 28, letterSpacing: "-.022em", marginTop: 22 }}>Nothing matches.</div>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--color-text-secondary)", margin: "11px auto 0", maxWidth: "40ch" }}>Try a shorter word, or clear the filters.</p>
            <button type="button" onClick={() => { setQ(""); setCuisine(null); }} style={{ height: 44, padding: "0 20px", marginTop: 24, borderRadius: 9, border: "1px solid var(--color-hairline-strong)", background: "transparent", color: "var(--color-text)", font: "600 14px var(--font-body)", cursor: "pointer" }}>
              Show everything
            </button>
          </div>
        )}
      </section>
    </>
  );
}
