import Link from "next/link";
import type { MoneyOpts } from "@/lib/format/currency";
import { getAdminMenuTree } from "@/lib/queries/admin-menu";
import { getCurrentStaff } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { MenuTree } from "@/components/admin/menu-tree";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const { m } = await searchParams;
  const staff = await getCurrentStaff();
  if (!staff) return null; // the layout already gates; this satisfies the type

  const supabase = await createClient();
  const [{ data: restaurant }, tree] = await Promise.all([
    supabase
      .from("restaurants")
      .select("currency, locale")
      .eq("tenant_id", staff.tenantId)
      .limit(1)
      .maybeSingle(),
    getAdminMenuTree(m),
  ]);

  const money: MoneyOpts = {
    currency: restaurant?.currency ?? "NGN",
    locale: restaurant?.locale ?? "en-NG",
  };

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-2xl text-porcelain">{tree.activeName}</h1>
        <span className="tabular text-xs text-muted">{tree.totalItems} items</span>
      </div>

      {tree.menus.length > 1 && (
        <nav aria-label="Choose menu to edit" className="mt-3 flex flex-wrap gap-1">
          {tree.menus.map((mo) => {
            const isActive = mo.slug === tree.activeSlug;
            return (
              <Link
                key={mo.id}
                href={`/admin/menu?m=${mo.slug}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "tabular rounded-card px-3 py-1.5 text-xs uppercase tracking-wider outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
                  isActive
                    ? "bg-accent text-porcelain"
                    : "border border-hairline/30 text-muted hover:text-porcelain",
                )}
              >
                {mo.name}
                {mo.status !== "live" && <span className="ml-1 opacity-60">· {mo.status}</span>}
              </Link>
            );
          })}
        </nav>
      )}

      <div className="mt-4">
        <MenuTree tree={tree} money={money} activeSlug={tree.activeSlug} />
      </div>
    </div>
  );
}
