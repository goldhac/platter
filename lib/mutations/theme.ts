"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import type { Json, TablesUpdate } from "@/lib/supabase/database.types";
import { accentReadable, isHex } from "@/lib/themes/contrast";
import { getTheme, resolveTheme, type ThemeConfig } from "@/lib/themes";
import { canUseTheme, upgradeMessage } from "@/lib/plans";

export type ThemeResult = { ok: true } | { ok: false; error: string };

/** Keep only config the theme actually supports (defensive; the customiser also gates at write time). */
function sanitize(themeId: string, config: ThemeConfig): { themeId: string; config: ThemeConfig } {
  const m = getTheme(themeId);
  const out: ThemeConfig = {};
  if (config.accent && isHex(config.accent)) out.accent = config.accent;
  if (config.scheme && (config.scheme === "system" || m.supports.schemes.includes(config.scheme)))
    out.scheme = config.scheme;
  if (config.layout && m.layouts.includes(config.layout)) out.layout = config.layout;
  if (config.density) out.density = config.density;
  if (config.hero && m.supports.heroStyles.includes(config.hero)) out.hero = config.hero;
  if (typeof config.motifOn === "boolean") out.motifOn = config.motifOn;
  return { themeId: m.id, config: out };
}

async function writeMenu(
  menuId: string,
  patch: TablesUpdate<"menus">,
  guardThemeId?: string,
): Promise<ThemeResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };
  const supabase = await createClient();

  // Plan gate (server-authoritative; the UI also locks Pro themes, and the 0010
  // trigger backstops the DB). A Free tenant can't apply a Pro theme.
  if (guardThemeId) {
    const { data: t } = await supabase
      .from("tenants")
      .select("plan")
      .eq("id", staff.tenantId)
      .maybeSingle();
    if (!canUseTheme(t?.plan, guardThemeId)) {
      return { ok: false, error: upgradeMessage(`The ${getTheme(guardThemeId).name} theme`) };
    }
  }

  const { error: uErr } = await supabase
    .from("menus")
    .update(patch)
    .eq("id", menuId)
    .eq("tenant_id", staff.tenantId); // + RLS: auth_can_manage(tenant_id)
  if (uErr) return { ok: false, error: uErr.message };
  revalidatePath("/menu");
  revalidatePath("/admin/theme");
  return { ok: true };
}

/** Publish: promote the choice to the live `theme_id`/`theme_config` and clear the draft. */
export async function publishMenuTheme(
  menuId: string,
  themeId: string,
  config: ThemeConfig,
): Promise<ThemeResult> {
  const s = sanitize(themeId, config);
  // Blocking readability guard: a custom accent must keep its label legible (§13 P3).
  const resolved = resolveTheme(s.themeId, s.config);
  const accent = resolved.cssVars["--color-accent"];
  const onAccent = resolved.cssVars["--color-on-accent"];
  if (accent && onAccent && !accentReadable(accent, onAccent)) {
    return { ok: false, error: "That accent is too low-contrast to publish — pick a darker or lighter shade." };
  }
  return writeMenu(
    menuId,
    { theme_id: s.themeId, theme_config: s.config as Json, theme_config_draft: null },
    s.themeId,
  );
}

/** Save a draft (`theme_config_draft`) without going live. */
export async function saveMenuThemeDraft(
  menuId: string,
  themeId: string,
  config: ThemeConfig,
): Promise<ThemeResult> {
  const s = sanitize(themeId, config);
  return writeMenu(menuId, { theme_config_draft: { themeId: s.themeId, ...s.config } as Json }, s.themeId);
}
