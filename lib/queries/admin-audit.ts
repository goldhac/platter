import { getCurrentStaff } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";

export type ActivityEntry = {
  id: number;
  actor: string;
  action: string; // human verb: created · updated · published · removed · marked sold out …
  entity: string; // item · category · menu · group
  name: string | null;
  at: string;
};

const ENTITY_LABEL: Record<string, string> = {
  items: "item",
  categories: "category",
  menus: "menu",
  menu_groups: "group",
};

type Row = {
  id: number;
  action: string;
  entity: string;
  actor_id: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  created_at: string;
};

/** Turn a raw INSERT/UPDATE/DELETE into a human verb, reading the before/after snapshot. */
function verb(r: Row): string {
  if (r.action === "INSERT") return "created";
  if (r.action === "DELETE") return "deleted";
  const b = r.before ?? {};
  const a = r.after ?? {};
  if (!b.deleted_at && a.deleted_at) return "removed";
  if (b.deleted_at && !a.deleted_at) return "restored";
  if (b.status !== a.status) {
    if (a.status === "published" || a.status === "live") return "published";
    if (a.status === "draft") return "unpublished";
    if (a.status === "archived") return "archived";
  }
  if (b.is_available !== a.is_available) return a.is_available ? "marked available" : "marked sold out";
  return "updated";
}

/**
 * Recent menu-editing activity for the current tenant (audit_log, staff-read via RLS).
 * Populated by the 0014 audit triggers on items/categories/menus/menu_groups.
 */
export async function getRecentActivity(limit = 8): Promise<ActivityEntry[]> {
  const staff = await getCurrentStaff();
  if (!staff) return [];
  const supabase = await createClient();

  const { data } = await supabase
    .from("audit_log")
    .select("id, action, entity, actor_id, before, after, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  const rows = (data ?? []) as unknown as Row[];
  if (rows.length === 0) return [];

  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))] as string[];
  const nameById = new Map<string, string>();
  if (actorIds.length) {
    const { data: staffRows } = await supabase
      .from("staff")
      .select("id, full_name, email")
      .in("id", actorIds);
    for (const s of staffRows ?? []) nameById.set(s.id, s.full_name ?? s.email ?? "A teammate");
  }

  return rows.map((r) => ({
    id: r.id,
    actor: r.actor_id ? (nameById.get(r.actor_id) ?? "A teammate") : "System",
    action: verb(r),
    entity: ENTITY_LABEL[r.entity] ?? r.entity,
    name: (r.after?.name as string) ?? (r.before?.name as string) ?? null,
    at: r.created_at,
  }));
}
