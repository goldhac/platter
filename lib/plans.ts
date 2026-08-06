// The ONE source of truth for what each plan allows (foundation §13 M8, "one
// module"). Pure + isomorphic — the server mutations enforce it, a Postgres
// trigger backstops the paywall, and the UI reads it to show locks/upgrade
// prompts. Keep the SQL trigger (0010) in sync with `free` here.
import { THEMES } from "@/lib/themes";

export type PlanId = "free" | "pro";

export type PlanLimits = {
  /** Max live+draft menus per venue. */
  maxMenus: number;
  /** Allowed theme ids, or "all". */
  themes: "all" | readonly string[];
  /** May connect a custom domain / choose a subdomain. */
  customDomain: boolean;
  /** Total members incl. the owner. */
  teamSeats: number;
  /** Show the "Powered by Platter" mark on the public menu. */
  branding: boolean;
};

export const PLANS: Record<PlanId, PlanLimits> = {
  free: { maxMenus: 1, themes: ["lacquer"], customDomain: false, teamSeats: 1, branding: true },
  pro: { maxMenus: Infinity, themes: "all", customDomain: true, teamSeats: 10, branding: false },
};

export const PLAN_LABEL: Record<PlanId, string> = { free: "Free", pro: "Pro" };

export function planOf(plan: string | null | undefined): PlanId {
  return plan === "pro" ? "pro" : "free";
}

export function limits(plan: string | null | undefined): PlanLimits {
  return PLANS[planOf(plan)];
}

/** The concrete set of theme ids this plan may use. */
export function allowedThemes(plan: string | null | undefined): Set<string> {
  const t = limits(plan).themes;
  return t === "all" ? new Set(Object.keys(THEMES)) : new Set(t);
}

export function canUseTheme(plan: string | null | undefined, themeId: string): boolean {
  return allowedThemes(plan).has(themeId);
}

export function canAddMenu(plan: string | null | undefined, currentMenuCount: number): boolean {
  return currentMenuCount < limits(plan).maxMenus;
}

export function canUseCustomDomain(plan: string | null | undefined): boolean {
  return limits(plan).customDomain;
}

export function canAddTeamMember(plan: string | null | undefined, currentSeatCount: number): boolean {
  return currentSeatCount < limits(plan).teamSeats;
}

/** Standard message when a gate blocks a Free tenant. */
export function upgradeMessage(what: string): string {
  return `${what} is a Pro feature — upgrade to unlock it.`;
}
