// Platter — Counter theme (M3b). Fast-casual, photo-forward (QSR, bakeries, bubble tea).
// Proves the OTHER hard case from Carafe: a LIGHT scheme + `images:'required'` + the
// `card-grid` layout (density at 200+ items). DESIGN-SPEC §1.3.

import type { ThemeManifest } from "./types";

export const counter: ThemeManifest = {
  id: "counter",
  name: "Counter",
  tagline: "Bright, photo-forward, appetite-first.",
  bestFor: ["QSR", "Bakeries", "Bubble tea", "Food trucks"],

  tokens: {
    light: {
      bg: "#faf8f4", // bone-white ground
      surface: "#ffffff", // white cards
      text: "#1a1714", // near-black on the bone ground
      textOnSurface: "#1a1714", // dark text on the white card
      textSecondary: "#6b645c",
      accent: "#ff5a1f", // one saturated signal — hot tangerine
      onAccent: "#ffffff",
      hairline: "#e4ded4", // light hairline
      positive: "#2f8f5b",
    },
  },

  typography: {
    // tight grotesk (Inter, not the serif) + oversized tabular numerals
    display: { var: "var(--font-inter)", fallback: "ui-sans-serif, system-ui, sans-serif" },
    body: { var: "var(--font-inter)", fallback: "ui-sans-serif, system-ui, sans-serif" },
    numeric: { var: "var(--font-plex-mono)", fallback: "ui-monospace, monospace" },
    cjk: { var: "var(--font-noto-serif-sc)", fallback: "ui-serif, serif" },
  },

  shape: {
    radius: "10px", // softer, friendlier cards
    radiusSeal: "6px",
    shadow: "0 1px 3px rgb(0 0 0 / 0.08)",
    hairlineWidth: "1px",
  },

  layouts: ["card-grid"],
  defaultLayout: "card-grid",
  motif: "chip", // filled geometric chips, no illustration

  supports: {
    images: "required", // honest that it looks broken without photos
    schemes: ["light"],
    heroStyles: ["mark", "photo"],
  },

  accentChoices: ["#ff5a1f", "#e11d48", "#7c3aed", "#0891b2"],
  defaultScheme: "light",
};
