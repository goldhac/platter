// Platter — Lacquer theme (M2). The Jīn Cāntīng look, extracted verbatim from the v1
// design system (ui-tokens.md §1–§5 · app/globals.css). This is theme "row one": the
// pioneer venue runs it, and it's the first entry in the gallery.
//
// Values here are IDENTICAL to the v1 @theme block → a Lacquer menu renders with zero
// visual regression (the M2 ⛔ gate). Proves: dark schemes, motif packs, bilingual type.

import type { ThemeManifest } from "./types";

export const lacquer: ThemeManifest = {
  id: "lacquer",
  name: "Lacquer",
  tagline: "Dark, quiet, and precise — porcelain plates on a lacquer table.",
  bestFor: ["Fine dining", "Pan-Asian", "Hotel restaurants"],

  tokens: {
    // dark is the designed scheme (ui-tokens.md §6: v1 is dark-only; light deferred).
    dark: {
      bg: "#14110f", // ink — the lacquer box
      surface: "#f7f4ee", // porcelain — card / plate
      text: "#f7f4ee", // porcelain — primary text on ink
      textOnSurface: "#14110f", // ink — text on a porcelain card
      textSecondary: "#8a827a", // ash — descriptions, meta
      accent: "#8e1d1d", // lacquer — chef's-pick, seal, active chip
      onAccent: "#f7f4ee", // porcelain glyph on an accent fill
      hairline: "#b08d4f", // brass — 1px lines + small marks only, never fills
      positive: "#3f6b58", // jade — veg tag, open pill
    },
  },

  typography: {
    display: { var: "var(--font-fraunces)", fallback: "ui-serif, Georgia, serif" },
    body: { var: "var(--font-inter)", fallback: "ui-sans-serif, system-ui, sans-serif" },
    numeric: { var: "var(--font-plex-mono)", fallback: "ui-monospace, monospace" },
    cjk: { var: "var(--font-noto-serif-sc)", fallback: "ui-serif, serif" },
  },

  shape: {
    radius: "4px",
    radiusSeal: "6px",
    shadow: "0 1px 2px rgb(0 0 0 / 0.3)", // the deepest shadow allowed (ui-tokens.md §4)
    hairlineWidth: "1px",
  },

  layouts: ["list-dense"], // row + right thumbnail (the v1 layout)
  defaultLayout: "list-dense",
  motif: "seal", // the 印章 seal-mark pack (厨 辣 素 售)

  supports: {
    images: "optional", // missing image → seal mark on a brass hairline frame
    schemes: ["dark"],
    heroStyles: ["mark", "photo"],
  },

  // Curated on-brand accents (default first). The customiser (M5) also allows a
  // contrast-checked custom hex. All are lacquer-family reds + a couple of restrained metals.
  accentChoices: ["#8e1d1d", "#7a2e2e", "#a23a2a", "#b08d4f", "#3f6b58"],
  defaultScheme: "dark",
};
