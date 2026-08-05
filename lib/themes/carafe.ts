// Platter — Carafe theme (M3a). Bar / wine / cocktail lists.
// The hardest case for the theme system: a layout with NO images (`ruled-list`) and no motif.
// If the component tree renders Carafe without a single `{image && …}` hack in a shared
// component, the abstraction is real (foundation.md §13; DESIGN-SPEC §1.5). It's also the
// hotel's Bar List — Dinner=Lacquer + Bar=Carafe is the live two-theme showcase.
//
// Distinct from Lacquer on purpose: cooler near-black ground, a restrained gold (not lacquer
// red), dotted-leader prices, no photography, no seal marks.

import type { ThemeManifest } from "./types";

export const carafe: ThemeManifest = {
  id: "carafe",
  name: "Carafe",
  tagline: "A printed drinks list — typographic, calm, no photography.",
  bestFor: ["Wine lists", "Cocktail bars", "Hotel bars", "Spirits menus"],

  tokens: {
    dark: {
      bg: "#0d0d0f", // near-black (cooler than Lacquer's warm ink)
      surface: "#17171b", // faint lift (Carafe barely uses cards)
      text: "#e9e5db", // bone
      textOnSurface: "#e9e5db",
      textSecondary: "#8b867d", // metadata line (vintage / ABV / region)
      accent: "#c2a06a", // restrained gold — the one metal
      onAccent: "#0d0d0f",
      hairline: "#4b463d", // dim gold-grey — the dotted leaders + rules
      positive: "#7a9885",
    },
  },

  typography: {
    // Reuses the loaded faces for now (per-theme font loading is the M3 optimization);
    // Fraunces carries the small-caps, list-like heads well.
    display: { var: "var(--font-fraunces)", fallback: "ui-serif, Georgia, serif" },
    body: { var: "var(--font-inter)", fallback: "ui-sans-serif, system-ui, sans-serif" },
    numeric: { var: "var(--font-plex-mono)", fallback: "ui-monospace, monospace" },
    cjk: { var: "var(--font-noto-serif-sc)", fallback: "ui-serif, serif" },
  },

  shape: {
    radius: "2px", // sharper than Lacquer
    radiusSeal: "2px",
    shadow: "none", // a printed list has no elevation
    hairlineWidth: "1px",
  },

  layouts: ["ruled-list"], // name → dot leaders → price; no images
  defaultLayout: "ruled-list",
  motif: "none", // no seal marks

  supports: {
    images: "none", // THE hard case
    schemes: ["dark"],
    heroStyles: ["mark", "none"],
  },

  accentChoices: ["#c2a06a", "#b8935a", "#d8c9a8", "#8b867d"],
  defaultScheme: "dark",
};
