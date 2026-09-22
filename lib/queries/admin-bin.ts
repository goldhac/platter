import { getCurrentStaff } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";

export type BinItem = { id: string; name: string; deletedAt: string; daysLeft: number };

/**
 * Soft-deleted items still inside the 30-day window (foundation §7 #14), newest first.
 * The screen three delete dialogs already promise — restore is `restoreItem`.
 * RLS scopes the read to the caller's tenant.
 */
export async function getBinItems(): Promise<BinItem[]> {
  const staff = await getCurrentStaff();
  if (!staff) return [];
  const supabase = await createClient();

  const { data } = await supabase
    .from("items")
    .select("id, name, deleted_at")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false })
    .limit(100);

  const now = Date.now();
  return (data ?? [])
    .filter((r): r is { id: string; name: string; deleted_at: string } => r.deleted_at != null)
    .map((r) => {
      const ageDays = (now - new Date(r.deleted_at).getTime()) / 86_400_000;
      return { id: r.id, name: r.name, deletedAt: r.deleted_at, daysLeft: Math.max(0, Math.ceil(30 - ageDays)) };
    });
}
