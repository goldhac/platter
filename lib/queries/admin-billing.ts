import { getCurrentStaff } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { planOf } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

export type BillingData = {
  plan: PlanId;
  isOwner: boolean;
  usage: {
    menus: number;
    seats: number; // active members + pending invites
    customDomain: boolean;
  };
};

export async function getBilling(): Promise<BillingData | null> {
  const staff = await getCurrentStaff();
  if (!staff) return null;
  const supabase = await createClient();

  const { data: t } = await supabase
    .from("tenants")
    .select("plan")
    .eq("id", staff.tenantId)
    .maybeSingle();

  const { data: r } = await supabase
    .from("restaurants")
    .select("id, custom_domain")
    .eq("tenant_id", staff.tenantId)
    .limit(1)
    .maybeSingle();

  const nowIso = new Date().toISOString();
  let menus = 0;
  if (r) {
    const { count } = await supabase
      .from("menus")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", r.id)
      .is("deleted_at", null);
    menus = count ?? 0;
  }
  const [{ count: memberCount }, { count: pendingCount }] = await Promise.all([
    supabase
      .from("staff")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", staff.tenantId)
      .eq("is_active", true),
    supabase
      .from("invites")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", staff.tenantId)
      .is("accepted_at", null)
      .gt("expires_at", nowIso),
  ]);

  return {
    plan: planOf(t?.plan),
    isOwner: staff.role === "owner",
    usage: {
      menus,
      seats: (memberCount ?? 0) + (pendingCount ?? 0),
      customDomain: !!r?.custom_domain,
    },
  };
}
