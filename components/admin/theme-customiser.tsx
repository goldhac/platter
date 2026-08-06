"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { CSSProperties } from "react";
import type { MoneyOpts } from "@/lib/format/currency";
import type { MenuItem, MenuSummary } from "@/lib/queries/menu";
import { layoutSpec } from "@/components/menu/layouts";
import { publishMenuTheme } from "@/lib/mutations/theme";
import { accentReadable, contrastRatio, isHex } from "@/lib/themes/contrast";
import {
  listThemes,
  resolveTheme,
  type LayoutId,
  type SchemeId,
  type ThemeConfig,
  type ThemeId,
} from "@/lib/themes";
import { allowedThemes } from "@/lib/plans";
import { cn } from "@/lib/utils";

const THEMES = listThemes();

export function ThemeCustomiser({
  menuId,
  menuName,
  restaurantName,
  previewItems,
  money,
  initialThemeId,
  initialConfig,
  plan,
}: {
  menuId: string;
  menuName: string;
  restaurantName: string;
  previewItems: MenuItem[];
  money: MoneyOpts;
  initialThemeId: string;
  initialConfig: ThemeConfig;
  plan: string;
}) {
  const [themeId, setThemeId] = useState<ThemeId>((initialThemeId as ThemeId) || "lacquer");
  const [accent, setAccent] = useState<string | undefined>(initialConfig.accent);
  const [scheme, setScheme] = useState<SchemeId | undefined>(
    initialConfig.scheme && initialConfig.scheme !== "system" ? initialConfig.scheme : undefined,
  );
  const [layout, setLayout] = useState<LayoutId | undefined>(initialConfig.layout);
  const [hexDraft, setHexDraft] = useState("");
  const [pending, start] = useTransition();

  const manifest = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  const config: ThemeConfig = {
    ...(accent ? { accent } : {}),
    ...(scheme ? { scheme } : {}),
    ...(layout ? { layout } : {}),
  };
  const resolved = resolveTheme(themeId, config);
  const { Item, listClassName } = layoutSpec(resolved.layout);

  const allowed = allowedThemes(plan);
  const isLocked = (id: string) => !allowed.has(id);

  const curAccent = resolved.cssVars["--color-accent"];
  const onAccent = resolved.cssVars["--color-on-accent"];
  const ratio = curAccent && onAccent ? contrastRatio(curAccent, onAccent) : 21;
  const accentOk = accentReadable(curAccent, onAccent);

  function pickTheme(id: ThemeId) {
    if (isLocked(id)) {
      toast.info(`${THEMES.find((t) => t.id === id)?.name} is a Pro theme — upgrade to use it.`);
      return;
    }
    setThemeId(id);
    setAccent(undefined);
    setScheme(undefined);
    setLayout(undefined);
    setHexDraft("");
  }

  function publish() {
    if (!accentOk) {
      toast.error("That accent is too low-contrast — pick a darker or lighter shade.");
      return;
    }
    start(async () => {
      const res = await publishMenuTheme(menuId, themeId, config);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`“${menuName}” is now ${manifest.name}.`);
    });
  }

  const dirty = themeId !== initialThemeId || Boolean(accent || scheme || layout);
  const eyebrow = "tabular text-[0.7rem] uppercase tracking-[0.18em] text-brass";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(300px,340px)]">
      {/* ── controls ── */}
      <div className="space-y-7">
        <section>
          <h2 className={eyebrow}>Theme</h2>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {THEMES.map((t) => {
              const tok = (t.tokens[t.defaultScheme] ?? Object.values(t.tokens)[0])!;
              const on = t.id === themeId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => pickTheme(t.id)}
                  aria-pressed={on}
                  className={cn(
                    "rounded-card border p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/70",
                    on ? "border-accent" : "border-hairline/30 hover:border-hairline/60",
                    isLocked(t.id) && "opacity-60",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-base text-porcelain">{t.name}</span>
                    {isLocked(t.id) && (
                      <span className="tabular rounded-sm bg-brass/20 px-1.5 text-[0.6rem] uppercase text-brass">
                        Pro
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted">{t.tagline}</p>
                  <div className="mt-2 flex gap-1">
                    {[tok.bg, tok.surface, tok.accent, tok.hairline].map((c, i) => (
                      <span
                        key={i}
                        className="h-4 w-4 rounded-sm border border-hairline/20"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* accent */}
        <section>
          <h2 className={eyebrow}>Accent</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {manifest.accentChoices.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => {
                  setAccent(c);
                  setHexDraft("");
                }}
                className={cn(
                  "h-8 w-8 rounded-full border-2 outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-accent/70",
                  (accent ?? manifest.tokens[manifest.defaultScheme]?.accent) === c
                    ? "border-porcelain"
                    : "border-transparent",
                )}
                style={{ background: c }}
              />
            ))}
            <input
              value={hexDraft}
              onChange={(e) => {
                const v = e.target.value;
                setHexDraft(v);
                if (isHex(v)) setAccent(v);
              }}
              placeholder="#hex"
              aria-label="Custom accent hex"
              className="tabular w-24 rounded-card border border-hairline/30 bg-black/20 px-2 py-1.5 text-sm text-porcelain outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            />
          </div>
          <p className={cn("mt-2 text-xs", accentOk ? "text-muted" : "text-lacquer")}>
            {accentOk
              ? `Contrast ${ratio.toFixed(1)}:1 — reads fine.`
              : `Contrast ${ratio.toFixed(1)}:1 — too low to publish (needs 4.5:1). Try a darker or lighter shade.`}
          </p>
        </section>

        {/* scheme */}
        {manifest.supports.schemes.length > 1 && (
          <section>
            <h2 className={eyebrow}>Scheme</h2>
            <div className="mt-2 flex gap-2">
              {manifest.supports.schemes.map((s) => (
                <Toggle key={s} on={resolved.scheme === s} onClick={() => setScheme(s)} label={s} />
              ))}
            </div>
          </section>
        )}

        {/* layout */}
        {manifest.layouts.length > 1 && (
          <section>
            <h2 className={eyebrow}>Layout</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {manifest.layouts.map((l) => (
                <Toggle key={l} on={resolved.layout === l} onClick={() => setLayout(l)} label={l} />
              ))}
            </div>
          </section>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={publish}
            disabled={pending || !accentOk}
            className="tabular rounded-card bg-accent px-5 py-2.5 text-sm font-medium uppercase tracking-wider text-porcelain outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-50"
          >
            {pending ? "Publishing…" : "Publish"}
          </button>
          {dirty && (
            <button
              type="button"
              onClick={() => {
                setThemeId((initialThemeId as ThemeId) || "lacquer");
                setAccent(initialConfig.accent);
                setScheme(undefined);
                setLayout(undefined);
                setHexDraft("");
              }}
              className="rounded-card border border-hairline/30 px-4 py-2.5 text-sm text-muted outline-none hover:text-porcelain focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              Discard
            </button>
          )}
        </div>
      </div>

      {/* ── live phone preview (the venue's real menu) ── */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <div className="mx-auto max-w-[340px] overflow-hidden rounded-[2rem] border-[6px] border-hairline/40 shadow-plate">
          <div
            style={resolved.cssVars as unknown as CSSProperties}
            className="pointer-events-none h-[540px] overflow-hidden bg-bg px-4 pb-6 pt-5 text-text"
          >
            <div className="font-cjk text-sm text-accent/90">{restaurantName}</div>
            <div className="font-display text-2xl leading-tight text-text">{menuName}</div>
            <h3 className="tabular mt-4 text-[0.7rem] uppercase tracking-[0.2em] text-hairline">Preview</h3>
            <ul className={cn(listClassName, "mt-1")}>
              {previewItems.slice(0, 5).map((it) => (
                <li key={it.id}>
                  <Item item={it} money={money} />
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-muted">Your real menu, live in {manifest.name}.</p>
      </div>
    </div>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "tabular rounded-card px-3 py-1.5 text-xs uppercase tracking-wider outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
        on ? "bg-accent text-porcelain" : "border border-hairline/30 text-muted hover:text-porcelain",
      )}
    >
      {label.replace("-", " ")}
    </button>
  );
}
