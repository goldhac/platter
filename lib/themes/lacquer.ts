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
    // v2 redesign (2026-08): dark-first oxblood/gilt/bone. Surfaces are now DARK (not porcelain);
    // the extra v2 roles a menu uses — surface-raised, hairline-strong (gilt), text-tertiary,
    // accent-hover — fall through to the @theme defaults, which carry these same Lacquer values.
    dark: {
      bg: "#0a0807", // near-black ground
      surface: "#151110", // dark plate / card
      text: "#f6f2ea", // bone — primary text
      textOnSurface: "#f6f2ea", // surfaces are dark → light text
      textSecondary: "#948b81", // ash — descriptions, meta
      accent: "#8d2020", // oxblood — chef's-pick, seal, active chip
      onAccent: "#f6f2ea", // bone glyph on an accent fill
      hairline: "rgb(246 242 234 / 0.10)", // 10% bone — structural lines (gilt → hairline-strong)
      positive: "#5f9c7c", // sage — veg tag, open pill
    },
  },

  typography: {
    display: { var: "var(--font-bodoni)", fallback: "ui-serif, Georgia, serif" },
    body: { var: "var(--font-public-sans)", fallback: "ui-sans-serif, system-ui, sans-serif" },
    numeric: { var: "var(--font-martian)", fallback: "ui-monospace, monospace" },
    cjk: { var: "var(--font-noto-serif-sc)", fallback: "ui-serif, serif" },
  },

  shape: {
    radius: "6px",
    radiusSeal: "6px",
    shadow: "0 1px 2px rgb(0 0 0 / 0.45)", // e1
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
