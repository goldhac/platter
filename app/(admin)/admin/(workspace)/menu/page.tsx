import Link from "next/link";
import type { MoneyOpts } from "@/lib/format/currency";
import { getAdminMenuTree } from "@/lib/queries/admin-menu";
import { getCurrentStaff } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { getActiveVenueId } from "@/lib/venue/active";
import { MenuTree } from "@/components/admin/menu-tree";
import { PublishAllButton } from "@/components/admin/publish-all-button";
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
      .eq("id", (await getActiveVenueId(staff.tenantId)) ?? "")
      .maybeSingle(),
    getAdminMenuTree(m),
  ]);

  const money: MoneyOpts = {
    currency: restaurant?.currency ?? "NGN",
    locale: restaurant?.locale ?? "en-NG",
  };

  const activeMenuId = tree.menus.find((mo) => mo.slug === tree.activeSlug)?.id ?? null;
  const draftCount = [...tree.groups.flatMap((g) => g.categories), ...tree.ungrouped]
    .flatMap((c) => c.items)
    .filter((it) => it.status === "draft").length;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="font-display text-2xl text-porcelain">{tree.activeName}</h1>
        <div className="flex items-center gap-3">
          {activeMenuId && <PublishAllButton menuId={activeMenuId} draftCount={draftCount} />}
          <span className="tabular shrink-0 text-xs text-muted">{tree.totalItems} items</span>
        </div>
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
