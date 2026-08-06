import { getCurrentStaff } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { limits } from "@/lib/plans";

export type TeamMember = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: string;
  isSelf: boolean;
};
export type TeamInvite = { id: string; email: string; role: string; expiresAt: string };

export type TeamData = {
  plan: string;
  seatsUsed: number;
  seatMax: number;
  canEdit: boolean;
  members: TeamMember[];
  invites: TeamInvite[];
};

const ROLE_RANK: Record<string, number> = { owner: 0, manager: 1, staff: 2 };

export async function getTeam(): Promise<TeamData | null> {
  const staff = await getCurrentStaff();
  if (!staff) return null;
  const supabase = await createClient();

  const { data: t } = await supabase
    .from("tenants")
    .select("plan")
    .eq("id", staff.tenantId)
    .maybeSingle();
  const plan = t?.plan ?? "free";

  const nowIso = new Date().toISOString();
  const [{ data: memberRows }, { data: inviteRows }] = await Promise.all([
    supabase
      .from("staff")
      .select("id, email, full_name, role")
      .eq("tenant_id", staff.tenantId)
      .eq("is_active", true),
    supabase
      .from("invites")
      .select("id, email, role, expires_at")
      .eq("tenant_id", staff.tenantId)
      .is("accepted_at", null)
      .gt("expires_at", nowIso)
      .order("created_at"),
  ]);

  const members: TeamMember[] = (memberRows ?? [])
    .map((m) => ({
      id: m.id,
      email: m.email,
      fullName: m.full_name,
      role: m.role,
      isSelf: m.id === staff.userId,
    }))
    .sort((a, b) => (ROLE_RANK[a.role] ?? 9) - (ROLE_RANK[b.role] ?? 9));

  const invites: TeamInvite[] = (inviteRows ?? []).map((i) => ({
    id: i.id,
    email: i.email,
    role: i.role,
    expiresAt: i.expires_at,
  }));

  return {
    plan,
    seatsUsed: members.length + invites.length,
    seatMax: limits(plan).teamSeats,
    canEdit: staff.role === "owner",
    members,
    invites,
  };
}
