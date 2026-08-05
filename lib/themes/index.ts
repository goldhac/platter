// Platter — theme registry + resolver (M2).
// The registry is code (this file + the manifests); a tenant's choices are data
// (menus.theme_config). `resolveTheme` overlays config on the manifest and returns the
// CSS-var map the ThemeProvider injects at the menu root (SSR → no flash of unthemed content).

import type {
  Density,
  HeroId,
  LayoutId,
  ResolvedTheme,
  SchemeId,
  ThemeConfig,
  ThemeId,
  ThemeManifest,
} from "./types";
import { lacquer } from "./lacquer";
import { carafe } from "./carafe";
import { counter } from "./counter";
import { palm } from "./palm";

export * from "./types";
export { lacquer, carafe, counter, palm };

/** All four launch themes (DESIGN-SPEC §1): Lacquer · Carafe · Counter · Palm. */
export const THEMES = { lacquer, carafe, counter, palm } satisfies Partial<Record<ThemeId, ThemeManifest>>;

/** Unknown / not-yet-shipped theme ids fall back to Lacquer (never throw on the public path). */
export function getTheme(id: string | null | undefined): ThemeManifest {
  return (THEMES as Partial<Record<ThemeId, ThemeManifest>>)[id as ThemeId] ?? lacquer;
}

export function listThemes(): ThemeManifest[] {
  return Object.values(THEMES) as ThemeManifest[];
}

/**
 * Merge a menu's `theme_id` + `theme_config` into a fully-resolved theme.
 * Config values are validated against the manifest's declared capabilities — a tenant can
 * never select a scheme/layout/hero the theme doesn't support (defensive; the customiser
 * also validates at write time in M5).
 */
export function resolveTheme(themeId: string | null | undefined, config: ThemeConfig = {}): ResolvedTheme {
  const m = getTheme(themeId);

  const wantedScheme = config.scheme && config.scheme !== "system" ? config.scheme : m.defaultScheme;
  const scheme: SchemeId = m.supports.schemes.includes(wantedScheme) ? wantedScheme : m.defaultScheme;
  const tokens = m.tokens[scheme] ?? m.tokens[m.defaultScheme]!;

  const accent = config.accent ?? tokens.accent;
  const layout: LayoutId = config.layout && m.layouts.includes(config.layout) ? config.layout : m.defaultLayout;
  const density: Density = config.density ?? "comfortable";
  const hero: HeroId =
    config.hero && m.supports.heroStyles.includes(config.hero) ? config.hero : m.supports.heroStyles[0] ?? "mark";
  const motifOn = config.motifOn ?? true;

  const t = m.typography;
  const cssVars: Record<string, string> = {
    "--color-bg": tokens.bg,
    "--color-surface": tokens.surface,
    "--color-text": tokens.text,
    "--color-text-on-surface": tokens.textOnSurface,
    "--color-text-secondary": tokens.textSecondary,
    "--color-accent": accent,
    "--color-on-accent": tokens.onAccent,
    "--color-hairline": tokens.hairline,
    "--color-positive": tokens.positive,
    "--font-display": `${t.display.var}, ${t.display.fallback}`,
    "--font-body": `${t.body.var}, ${t.body.fallback}`,
    "--font-mono": `${t.numeric.var}, ${t.numeric.fallback}`,
    "--radius": m.shape.radius,
    "--radius-seal": m.shape.radiusSeal,
    "--shadow-1": m.shape.shadow,
    "--hairline-width": m.shape.hairlineWidth,
  };
  if (t.cjk) cssVars["--font-cjk"] = `${t.cjk.var}, ${t.cjk.fallback}`;

  return { themeId: m.id, layout, scheme, density, hero, motif: m.motif, motifOn, cssVars };
}
