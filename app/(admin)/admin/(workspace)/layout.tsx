import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav, type AdminNavItem } from "@/components/admin/admin-nav";
import { AdminTabBar } from "@/components/admin/admin-tabbar";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { VenueSwitcher } from "@/components/admin/venue-switcher";
import { getCurrentStaff } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { getActiveVenueId, getTenantVenues } from "@/lib/venue/active";

// Pattern 01: one shell, thirteen text-only sections in one fixed order. Only the
// active item and the two count badges (Editor · Categories) change per screen.
const NAV: { href: string; label: string; count?: "items" | "categories" }[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/menus", label: "Menus" },
  { href: "/admin/menu", label: "Editor", count: "items" },
  { href: "/admin/analytics", label: "Insights" },
  { href: "/admin/categories", label: "Categories", count: "categories" },
  { href: "/admin/modifiers", label: "Add-ons" },
  { href: "/admin/theme", label: "Theme" },
  { href: "/admin/qr", label: "QR" },
  { href: "/admin/domains", label: "Address" },
  { href: "/admin/import", label: "Data" },
  { href: "/admin/team", label: "Team" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/billing", label: "Billing" },
];

// The authoritative auth gate (the proxy does only an optimistic redirect).
// A signed-in user with no staff row has no tenant → not allowed in.
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/login");

  const supabase = await createClient();
  const [venues, activeVenueId, itemCount, categoryCount] = await Promise.all([
    getTenantVenues(staff.tenantId),
    getActiveVenueId(staff.tenantId),
    supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .then((r) => r.count ?? 0),
    supabase
      .from("categories")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .then((r) => r.count ?? 0),
  ]);

  const activeVenueName = venues.find((v) => v.id === activeVenueId)?.name ?? venues[0]?.name ?? "Venue";
  const who = staff.fullName ?? staff.email ?? "Signed in";
  const items: AdminNavItem[] = NAV.map((n) => ({
    href: n.href,
    label: n.label,
    count: n.count === "items" ? itemCount : n.count === "categories" ? categoryCount : undefined,
  }));

  return (
    <div className="min-h-dvh md:mx-auto md:grid md:max-w-[1560px] md:grid-cols-[236px_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-hairline bg-surface md:flex">
        <div className="border-b border-hairline px-5 pb-4 pt-5">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- fixed brand mark, matches marketing shell */}
            <img src="/brand/platter-mark-bone.png" alt="" className="h-[22px] w-auto" />
            <span className="font-display text-[19px] tracking-[-0.014em] text-text">Platter</span>
            <span className="pt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-hairline-strong">Manager</span>
          </Link>
          <div className="mt-3.5 flex items-center gap-2 rounded-sm border border-hairline bg-surface-sunken px-2.5 py-2">
            <span className="min-w-0 flex-1 truncate text-[13px] text-text">{activeVenueName}</span>
            {venues.length > 1 ? (
              <VenueSwitcher venues={venues} activeId={activeVenueId ?? venues[0]?.id ?? ""} />
            ) : (
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-tertiary">1 venue</span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <AdminNav items={items} />
        </div>

        <div className="border-t border-hairline px-5 pb-5 pt-4">
          <div className="truncate text-[12.5px] text-text-secondary">{who}</div>
          <div className="mt-1 font-mono text-[9px] uppercase capitalize tracking-[0.16em] text-hairline-strong">
            {staff.role}
          </div>
          <SignOutButton className="mt-3.5 h-9 w-full rounded-sm border border-hairline text-[11px] font-semibold uppercase tracking-[0.13em] text-text-secondary outline-none transition-colors hover:border-hairline-strong hover:text-text focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50" />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between gap-3 border-b border-hairline bg-surface px-5 py-3 md:hidden">
        <Link href="/admin" className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed brand mark */}
          <img src="/brand/platter-mark-bone.png" alt="" className="h-5 w-auto" />
          <span className="font-display text-base text-text">Platter</span>
        </Link>
        <span className="min-w-0 truncate text-[13px] text-text-secondary">{activeVenueName}</span>
      </header>

      <main className="min-w-0 px-5 pb-28 pt-6 md:px-7 md:pb-16 md:pt-8">{children}</main>

      {/* Mobile tab bar + More sheet */}
      <AdminTabBar who={who} role={staff.role} venue={activeVenueName} />
    </div>
  );
}
