"use client";

import { toast } from "sonner";
import { PLANS, PLAN_LABEL } from "@/lib/plans";
import type { BillingData } from "@/lib/queries/admin-billing";
import { cn } from "@/lib/utils";

function num(n: number): string {
  return n === Infinity ? "Unlimited" : String(n);
}

const FEATURES: { label: string; free: string; pro: string }[] = [
  { label: "Menus", free: num(PLANS.free.maxMenus), pro: num(PLANS.pro.maxMenus) },
  { label: "Themes", free: "Lacquer only", pro: "All 4 + customiser" },
  { label: "Custom domain", free: "—", pro: "Included" },
  { label: "Team seats", free: `${PLANS.free.teamSeats} (owner)`, pro: num(PLANS.pro.teamSeats) },
  { label: "Branding", free: "“Powered by Platter”", pro: "Removed" },
];

export function BillingView({ data }: { data: BillingData }) {
  const isPro = data.plan === "pro";
  const seatMax = PLANS[data.plan].teamSeats;
  const menuMax = PLANS[data.plan].maxMenus;

  return (
    <div className="space-y-8">
      {/* Current plan + usage */}
      <div className="rounded-card border border-hairline/25 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg text-porcelain">{PLAN_LABEL[data.plan]} plan</span>
            <span
              className={cn(
                "tabular rounded-full px-2 py-0.5 text-[0.6rem] uppercase tracking-wider",
                isPro ? "bg-positive/20 text-positive" : "bg-hairline/15 text-muted",
              )}
            >
              {isPro ? "Active" : "Current"}
            </span>
          </div>
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted">Menus</dt>
            <dd className="tabular text-porcelain">
              {data.usage.menus}
              {menuMax !== Infinity && <span className="text-muted"> / {menuMax}</span>}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Team</dt>
            <dd className="tabular text-porcelain">
              {data.usage.seats}
              {seatMax !== Infinity && <span className="text-muted"> / {seatMax}</span>}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Custom domain</dt>
            <dd className="tabular text-porcelain">{data.usage.customDomain ? "Set" : "—"}</dd>
          </div>
        </dl>
      </div>

      {/* Free vs Pro */}
      <div>
        <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2 border-b border-hairline/20 pb-2 text-[0.7rem] uppercase tracking-wider text-muted">
          <span />
          <span className={cn("tabular", !isPro && "text-porcelain")}>Free</span>
          <span className="tabular text-brass">Pro</span>
        </div>
        {FEATURES.map((f) => (
          <div
            key={f.label}
            className="grid grid-cols-[1.4fr_1fr_1fr] gap-2 border-b border-hairline/10 py-2.5 text-sm"
          >
            <span className="text-muted">{f.label}</span>
            <span className="tabular text-porcelain">{f.free}</span>
            <span className="tabular text-porcelain">{f.pro}</span>
          </div>
        ))}
      </div>

      {/* Upgrade / status */}
      {isPro ? (
        <p className="rounded-card border border-positive/25 bg-positive/5 p-4 text-sm text-porcelain">
          You&apos;re on <span className="text-positive">Pro</span> — every feature is unlocked.
        </p>
      ) : (
        <div className="rounded-card border border-hairline/25 p-4">
          <p className="text-sm text-porcelain">Ready for more menus, themes, and your own domain?</p>
          <p className="mt-1 text-xs text-muted">
            Card payments are launching soon. {data.isOwner ? "" : "Ask your owner to upgrade."}
          </p>
          {data.isOwner && (
            <button
              type="button"
              onClick={() => toast.info("Card checkout is coming soon — hang tight.")}
              className="tabular mt-3 rounded-card bg-accent px-4 py-2 text-xs uppercase tracking-wider text-porcelain outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              Go Pro
            </button>
          )}
        </div>
      )}
    </div>
  );
}
