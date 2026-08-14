"use client";

import { useState } from "react";

// Landing FAQ: one open at a time (the design's accordion), animated grid-rows 0fr to 1fr at 320ms.
// A client island so the rest of the landing stays server-rendered.
export function LandingFaq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState(-1);

  return (
    <div style={{ borderTop: "1px solid rgba(246,242,234,.16)" }}>
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={it.q} style={{ borderBottom: "1px solid rgba(246,242,234,.09)" }}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              style={{
                display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 22, width: "100%", textAlign: "left",
                padding: isOpen ? "20px 0 0" : "20px 0", background: "none", border: 0, cursor: "pointer",
                fontFamily: "var(--font-body)", fontSize: 16.5, color: isOpen ? "#e0655a" : "#f6f2ea",
              }}
            >
              <span>{it.q}</span>
              <span style={{ flex: "none", fontFamily: "var(--font-mono)", fontSize: 14, color: isOpen ? "#e0655a" : "#a49c95" }}>{isOpen ? "−" : "+"}</span>
            </button>
            <div className="lp-faq-panel" style={{ display: "grid", gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
              <div style={{ overflow: "hidden" }}>
                <p style={{ fontSize: 15, lineHeight: 1.62, color: "#a49c95", margin: "12px 0 22px", maxWidth: "58ch" }}>{it.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
