import type { MoneyOpts } from "@/lib/format/currency";
import { getAdminMenuTree } from "@/lib/queries/admin-menu";
import { getCurrentStaff } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { MenuTree } from "@/components/admin/menu-tree";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
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
    getAdminMenuTree(),
  ]);

  const money: MoneyOpts = {
    currency: restaurant?.currency ?? "NGN",
    locale: restaurant?.locale ?? "en-NG",
  };

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-2xl text-porcelain">Menu</h1>
        <span className="tabular text-xs text-muted">{tree.totalItems} items</span>
      </div>
      <div className="mt-4">
        <MenuTree tree={tree} money={money} />
      </div>
    </div>
  );
}
