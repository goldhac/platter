import type { CSSProperties, ReactNode } from "react";
import { resolveTheme, type ThemeConfig } from "@/lib/themes";
import { cn } from "@/lib/utils";

/**
 * Injects a menu's resolved theme as CSS custom properties on an SSR-rendered wrapper
 * (foundation.md §13 P1). This is a **server component** — the vars are in the initial HTML,
 * so there's no flash of unthemed content. Children consume them through the semantic
 * Tailwind utilities (`bg-bg`, `text-text`, `text-accent`, `border-hairline`, …). An unknown
 * or not-yet-shipped `themeId` falls back to Lacquer, so the public path never throws.
 *
 * M2 ships Lacquer only; M3 adds Counter/Palm/Carafe with zero changes here — a new theme is
 * just a new manifest whose values flow through `resolveTheme`.
 */
export function ThemeProvider({
  themeId,
  config,
  className,
  children,
}: {
  themeId?: string | null;
  config?: ThemeConfig;
  className?: string;
  children: ReactNode;
}) {
  const t = resolveTheme(themeId, config ?? {});
  return (
    <div
      data-theme={t.themeId}
      data-scheme={t.scheme}
      data-layout={t.layout}
      style={t.cssVars as unknown as CSSProperties}
      className={cn("bg-bg text-text", className)}
    >
      {children}
    </div>
  );
}
