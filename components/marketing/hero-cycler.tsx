"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { listThemes, resolveTheme } from "@/lib/themes";

// The product's headline trick: the same menu, restyled. Cycles the four themes
// in a phone frame so the landing shows — not tells — what Platter does.
const SAMPLE = [
  { name: "Seared Scallops", note: "citrus butter, sea herbs", price: "£18" },
  { name: "Wild Mushroom Risotto", note: "aged parmesan, truffle", price: "£15" },
  { name: "Aged Ribeye", note: "bone marrow, watercress", price: "£29" },
  { name: "Dark Chocolate Tart", note: "salted caramel", price: "£9" },
];

export function HeroCycler() {
  const themes = listThemes();
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % themes.length), 2800);
    return () => clearInterval(t);
  }, [themes.length]);

  const theme = themes[i];
  const resolved = resolveTheme(theme.id, {});
  const vars = resolved.cssVars as unknown as CSSProperties;

  return (
    <div className="mx-auto w-full max-w-[300px]">
      {/* phone frame */}
      <div className="rounded-[2.2rem] border border-hairline/30 bg-black/40 p-2 shadow-2xl">
        <div
          style={vars}
          data-theme={theme.id}
          className="h-[520px] overflow-hidden rounded-[1.7rem] bg-bg px-5 py-6 text-text transition-colors duration-700"
        >
          <div className="flex items-baseline justify-between border-b border-hairline/25 pb-3">
            <span className="font-display text-xl text-text">La Maison</span>
            <span className="tabular text-[0.6rem] uppercase tracking-widest text-accent">
              {theme.name}
            </span>
          </div>
          <p className="tabular mt-4 text-[0.65rem] uppercase tracking-[0.2em] text-accent">Dinner</p>
          <ul className="mt-2">
            {SAMPLE.map((it) => (
              <li key={it.name} className="border-b border-hairline/15 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-[0.95rem] text-text">{it.name}</span>
                  <span className="tabular text-sm text-text">{it.price}</span>
                </div>
                <p className="text-xs text-text/60">{it.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* theme dots */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {themes.map((t, n) => (
          <button
            key={t.id}
            type="button"
            aria-label={`Show ${t.name}`}
            onClick={() => setI(n)}
            className={`h-2 rounded-full transition-all ${n === i ? "w-6 bg-brass" : "w-2 bg-hairline/30"}`}
          />
        ))}
      </div>
    </div>
  );
}
