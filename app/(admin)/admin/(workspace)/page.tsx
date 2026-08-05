import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminMenus } from "@/lib/queries/admin-menus";
import { getCurrentStaff } from "@/lib/rbac";
import { NewMenuButton } from "@/components/admin/new-menu-button";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="tabular text-[0.7rem] uppercase tracking-widest text-brass">Venue</p>
          <h1 className="font-display text-2xl text-porcelain">{data.restaurantName}</h1>
        </div>
        <Link href={`/v/${data.restaurantSlug}`} target="_blank" rel="noopener" className={action}>
          View live site ↗
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Menus" value={data.menus.length} />
        <Stat label="Items" value={totalItems} />
        <Stat label="Live" value={liveCount} sub={draftCount ? `${draftCount} draft` : undefined} />
      </div>

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

      <section className="space-y-3">
        <h2 className="font-display text-lg text-porcelain">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/items/new" className={action}>
            + Add item
          </Link>
          <Link href="/admin/qr" className={action}>
            QR codes
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
