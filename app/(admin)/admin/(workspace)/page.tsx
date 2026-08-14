import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminMenus } from "@/lib/queries/admin-menus";
import { getRecentActivity } from "@/lib/queries/admin-audit";
import { PLAN_LABEL, PLANS, planOf } from "@/lib/plans";
import { getCurrentStaff } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/format/time";
import { NewMenuButton } from "@/components/admin/new-menu-button";
import { AddVenueButton } from "@/components/admin/venue-switcher";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  live: "text-positive",
  draft: "text-muted",
  archived: "text-muted line-through",
};

const action =
  "tabular rounded-card border border-hairline/30 px-3 py-2 text-xs uppercase tracking-wider text-muted outline-none hover:text-porcelain focus-visible:ring-2 focus-visible:ring-accent/70";

export default async function DashboardPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/login");
  const data = await getAdminMenus();
  if (!data) redirect("/admin/login");

  const totalItems = data.menus.reduce((n, m) => n + m.itemCount, 0);
  const liveCount = data.menus.filter((m) => m.status === "live").length;
  const draftCount = data.menus.filter((m) => m.status === "draft").length;

  const supabase = await createClient();
  const { data: tenantRow } = await supabase
    .from("tenants")
    .select("plan")
    .eq("id", staff.tenantId)
    .single();
  const plan = planOf(tenantRow?.plan);
  const menuLimit = PLANS[plan].maxMenus;
  const menuPct = menuLimit === Infinity ? 0 : Math.min(100, (data.menus.length / menuLimit) * 100);
  const atMenuLimit = plan === "free" && data.menus.length >= menuLimit;

  const activity = await getRecentActivity(6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="tabular text-[0.7rem] uppercase tracking-widest text-brass">Venue</p>
          <h1 className="font-display text-2xl text-porcelain">{data.restaurantName}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {staff.role === "owner" && <AddVenueButton className={action} />}
          <Link href={`/v/${data.restaurantSlug}`} target="_blank" rel="noopener" className={action}>
            View live site ↗
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Menus" value={data.menus.length} />
        <Stat label="Items" value={totalItems} />
        <Stat label="Live" value={liveCount} sub={draftCount ? `${draftCount} draft` : undefined} />
      </div>

      <section className="rounded-card border border-hairline/25 p-4">
        <div className="flex items-center justify-between">
          <span className="font-display text-base text-porcelain">{PLAN_LABEL[plan]} plan</span>
          <Link href="/admin/billing" className={action}>
            Manage
          </Link>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Menus</span>
            <span className="tabular">
              {data.menus.length} / {menuLimit === Infinity ? "∞" : menuLimit}
            </span>
          </div>
          {menuLimit !== Infinity && (
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-hairline/20">
              <div className="h-full rounded-full bg-accent" style={{ width: `${menuPct}%` }} />
            </div>
          )}
        </div>
        {atMenuLimit && (
          <p className="mt-2 text-xs text-brass">
            You&rsquo;re at your menu limit —{" "}
            <Link href="/admin/billing" className="underline">
              upgrade to Pro
            </Link>{" "}
            for unlimited menus + all themes.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-porcelain">Menus</h2>
          <NewMenuButton />
        </div>
        {data.menus.length === 0 ? (
          <p className="rounded-card border border-hairline/20 p-4 text-sm text-muted">
            No menus yet — create one to get started.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.menus.map((m) => (
              <div key={m.id} className="rounded-card border border-hairline/25 p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-display text-base text-porcelain">{m.name}</span>
                  <span
                    className={cn(
                      "tabular text-[0.6rem] uppercase tracking-wider",
                      STATUS[m.status] ?? "text-muted",
                    )}
                  >
                    {m.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  <span className="capitalize">{m.themeId}</span> · {m.itemCount} item
                  {m.itemCount === 1 ? "" : "s"}
                  {m.isDefault && " · default"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/admin/menu?m=${m.slug}`} className={action}>
                    Edit
                  </Link>
                  <Link href={`/admin/theme?m=${m.slug}`} className={action}>
                    Theme
                  </Link>
                  <Link
                    href={`/v/${data.restaurantSlug}?m=${m.slug}`}
                    target="_blank"
                    rel="noopener"
                    className={action}
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {activity.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg text-porcelain">Recent activity</h2>
          <ul className="divide-y divide-hairline/10 rounded-card border border-hairline/20">
            {activity.map((a) => (
              <li key={a.id} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
                <span className="min-w-0 text-sm text-muted">
                  <span className="text-porcelain">{a.actor}</span> {a.action} {a.entity}
                  {a.name && (
                    <>
                      {" "}
                      <span className="text-porcelain">“{a.name}”</span>
                    </>
                  )}
                </span>
                <span className="tabular shrink-0 text-[0.65rem] uppercase tracking-wider text-hairline">
                  {timeAgo(a.at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-lg text-porcelain">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/items/new" className={action}>
            + Add item
          </Link>
          <Link href="/admin/qr" className={action}>
            QR codes
          </Link>
          <Link href="/admin/domains" className={action}>
            Public address
          </Link>
          <Link href="/admin/billing" className={action}>
            Plan &amp; billing
          </Link>
          <Link href="/admin/import" className={action}>
            Import
          </Link>
          <Link href="/admin/settings" className={action}>
            Settings
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-card border border-hairline/25 p-4">
      <p className="tabular text-2xl text-porcelain">{value}</p>
      <p className="tabular text-[0.65rem] uppercase tracking-wider text-muted">
        {label}
        {sub && <span className="ml-1 text-brass">· {sub}</span>}
      </p>
    </div>
  );
}
