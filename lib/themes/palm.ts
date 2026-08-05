// Platter — Palm theme (M3b). West-African casual dining + lounges.
// A non-Western design vocabulary — deep green ground, raffia-cream, warm ochre — proving
// Platter is built FOR this market, not localised into it. Uses the `editorial` layout
// (full-bleed bands) + `list-dense`. DESIGN-SPEC §1.4.

import type { ThemeManifest } from "./types";

export const palm: ThemeManifest = {
  id: "palm",
  name: "Palm",
  tagline: "Deep green and raffia-warm — generous and rooted.",
  bestFor: ["Nigerian kitchens", "Afro-Caribbean", "Lounges", "Buka-style"],

  tokens: {
    dark: {
      bg: "#123a2e", // deep green ground
      surface: "#efe6d2", // raffia-cream
      text: "#efe6d2", // cream on green
      textOnSurface: "#123a2e", // green on cream
      textSecondary: "#a7b3a0", // muted sage — reads on green
      accent: "#d98b3a", // warm ochre / terracotta
      onAccent: "#123a2e",
      hairline: "#3c5c4b", // green hairline (the woven-rule divider)
      positive: "#8fb89a",
    },
  },

  typography: {
    // chunky slab feel via Fraunces display; generous body
    display: { var: "var(--font-fraunces)", fallback: "ui-serif, Georgia, serif" },
    body: { var: "var(--font-inter)", fallback: "ui-sans-serif, system-ui, sans-serif" },
    numeric: { var: "var(--font-plex-mono)", fallback: "ui-monospace, monospace" },
    cjk: { var: "var(--font-noto-serif-sc)", fallback: "ui-serif, serif" },
  },

  shape: {
    radius: "6px",
    radiusSeal: "6px",
    shadow: "0 1px 2px rgb(0 0 0 / 0.25)",
    hairlineWidth: "1px",
  },

  layouts: ["editorial", "list-dense"],
  defaultLayout: "editorial",
  motif: "botanical", // hand-drawn leaf / pepper marks

  supports: {
    images: "optional",
    schemes: ["dark"],
    heroStyles: ["mark", "photo"],
  },

  accentChoices: ["#d98b3a", "#c2703a", "#e0a95a", "#8fb89a"],
  defaultScheme: "dark",
};
