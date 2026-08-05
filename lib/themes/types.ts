// Platter — theme system contract (M2).
// A theme is CODE IN THE REPO (this manifest) + CONFIG IN THE DB (menus.theme_config).
// foundation.md §13 P1–P3 · ui-tokens.md §2 (the semantic token contract).
//
// The hard rule (enforced by the no-raw-color ESLint gate): components reference ONLY
// the semantic tokens below (via Tailwind utilities bound to these CSS vars) — never raw
// hex, never a raw-palette name. A theme is a complete set of values for this contract.

export type ThemeId = "lacquer" | "counter" | "palm" | "carafe";
export type SchemeId = "light" | "dark";
export type LayoutId = "list-dense" | "card-grid" | "editorial" | "ruled-list";
export type HeroId = "mark" | "photo" | "none";
export type Density = "comfortable" | "compact";
export type MotifKind = "chefs-pick" | "spicy" | "vegetarian" | "sold-out" | "new";
export type ImageSupport = "required" | "optional" | "none";

/**
 * The semantic token contract (ui-tokens.md §2). EVERY theme fills all of these, per
 * supported scheme. These are the only colors components may reference — each maps to a
 * `--color-*` CSS variable the ThemeProvider injects and Tailwind utilities consume.
 */
export type ThemeTokens = {
  bg: string; // page ground                          → --color-bg
  surface: string; // card / plate surface            → --color-surface
  text: string; // primary text on bg                 → --color-text
  textOnSurface: string; // text on a surface/card     → --color-text-on-surface
  textSecondary: string; // descriptions, meta         → --color-text-secondary
  accent: string; // active chip, chef's-pick, seal    → --color-accent  (tenant-settable)
  onAccent: string; // glyph/text on an accent fill    → --color-on-accent
  hairline: string; // dividers, eyebrows, frames      → --color-hairline
  positive: string; // veg tag, open pill              → --color-positive
};

/** A face binds to a `next/font` CSS var, with a system fallback stack. */
export type FontSpec = { var: string; fallback: string };

export type ThemeTypography = {
  display: FontSpec; // restaurant name, headings
  body: FontSpec; // item names + descriptions
  numeric: FontSpec; // prices — tabular figures (the ledger column)
  cjk?: FontSpec; // 金餐厅 and *_zh fields
};

export type ThemeShape = {
  radius: string; // --radius
  radiusSeal: string; // --radius-seal
  shadow: string; // --shadow-1 (the deepest shadow allowed)
  hairlineWidth: string; // e.g. "1px"
};

/** The badge/mark system, rendered in the active theme's idiom (seal marks, chips, …). */
export type MotifId = "seal" | "chip" | "botanical" | "none";

export type ThemeManifest = {
  id: ThemeId;
  name: string;
  tagline: string; // shown in the gallery
  bestFor: string[]; // ["Fine dining", "Pan-Asian", …]

  /** Token values per scheme. Only the schemes in `supports.schemes` are required. */
  tokens: Partial<Record<SchemeId, ThemeTokens>>;
  typography: ThemeTypography;
  shape: ThemeShape;

  layouts: LayoutId[]; // capabilities this theme supports
  defaultLayout: LayoutId;
  motif: MotifId;

  supports: {
    images: ImageSupport;
    schemes: SchemeId[];
    heroStyles: HeroId[];
  };

  /** Curated accent choices a tenant may pick; the customiser (M5) also allows a
   *  contrast-checked custom hex. First entry is the default accent. */
  accentChoices: string[];
  defaultScheme: SchemeId;
};

/**
 * What a tenant chose, stored in `menus.theme_config` (jsonb). Overlays the manifest
 * defaults. Everything is optional — an empty config renders the theme's defaults.
 */
export type ThemeConfig = {
  accent?: string; // overrides tokens.*.accent (curated set or contrast-checked hex)
  scheme?: SchemeId | "system";
  layout?: LayoutId; // validated against manifest.layouts at write time
  density?: Density;
  hero?: HeroId;
  motifOn?: boolean;
  logoUrl?: string;
  heroImageUrl?: string;
};

/** The resolved result the ThemeProvider injects + the menu renderer reads. */
export type ResolvedTheme = {
  themeId: ThemeId;
  layout: LayoutId;
  scheme: SchemeId;
  density: Density;
  hero: HeroId;
  motif: MotifId;
  motifOn: boolean;
  /** `--color-*`, `--font-*`, shape vars → value. The provider sets these as inline
   *  CSS custom properties on the menu root; utilities + components inherit them (SSR, no FOUC). */
  cssVars: Record<string, string>;
};
