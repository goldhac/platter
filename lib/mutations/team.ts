"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { sendInviteEmail } from "@/lib/notify/email";
import { requireOwner } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { getActiveVenueId, getTenantVenues } from "@/lib/venue/active";
import { canAddTeamMember, limits, upgradeMessage } from "@/lib/plans";

export type TeamResult =
  | { ok: true; joinPath?: string; emailed?: boolean }
  | { ok: false; error: string };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

/** Owner invites a teammate. Link-based (no email infra): returns a join path to share. */
export async function inviteTeammate(emailRaw: unknown, roleRaw: unknown): Promise<TeamResult> {
  const { staff, error } = await requireOwner();
  if (!staff) return { ok: false, error };

  const email = String(emailRaw ?? "").trim().toLowerCase();
  const role = roleRaw === "manager" ? "manager" : "staff";
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email address." };

  const supabase = await createClient();

  // Plan/seat gate: seats = active members + pending invites.
  const { data: t } = await supabase
    .from("tenants")
    .select("plan")
    .eq("id", staff.tenantId)
    .maybeSingle();
  const nowIso = new Date().toISOString();
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
  const seats = (memberCount ?? 0) + (pendingCount ?? 0);
  if (!canAddTeamMember(t?.plan, seats)) {
    return {
      ok: false,
      error: `${upgradeMessage("Adding teammates")} Free is owner-only; Pro includes ${limits("pro").teamSeats} seats.`,
    };
  }

  // No duplicate pending invite for the same email.
  const { data: dupe } = await supabase
    .from("invites")
    .select("id")
    .eq("tenant_id", staff.tenantId)
    .eq("email", email)
    .is("accepted_at", null)
    .maybeSingle();
  if (dupe) return { ok: false, error: "There's already a pending invite for that email." };

  const token = randomBytes(24).toString("base64url");
  const { error: iErr } = await supabase.from("invites").insert({
    tenant_id: staff.tenantId,
    email,
    role,
    token,
    invited_by: staff.userId,
    expires_at: new Date(Date.now() + INVITE_TTL_MS).toISOString(),
  });
  if (iErr) return { ok: false, error: iErr.message };

  const joinPath = `/admin/join?token=${token}`;

  // Best-effort invite email — the share-link still works if mail isn't configured or fails.
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || "https://platter.goldhac.com").replace(/\/$/, "");
  const venues = await getTenantVenues(staff.tenantId);
  const activeId = await getActiveVenueId(staff.tenantId);
  const venueName = venues.find((v) => v.id === activeId)?.name ?? venues[0]?.name ?? "your venue";
  const mail = await sendInviteEmail({
    to: email,
    inviterName: staff.fullName ?? staff.email ?? "A teammate",
    venueName,
    role,
    joinUrl: `${origin}${joinPath}`,
  });

  revalidatePath("/admin/team");
  return { ok: true, joinPath, emailed: mail.ok };
}

/** Owner cancels a pending invite. */
export async function revokeInvite(id: string): Promise<TeamResult> {
  const { staff, error } = await requireOwner();
  if (!staff) return { ok: false, error };
  const supabase = await createClient();
  const { error: dErr } = await supabase
    .from("invites")
    .delete()
    .eq("id", id)
    .eq("tenant_id", staff.tenantId); // + RLS: auth_is_admin
  if (dErr) return { ok: false, error: dErr.message };
  revalidatePath("/admin/team");
  return { ok: true };
}

/** Owner removes a member (deactivate staff + drop membership). Never the owner. */
export async function removeMember(userId: string): Promise<TeamResult> {
  const { staff, error } = await requireOwner();
  if (!staff) return { ok: false, error };
  if (userId === staff.userId) return { ok: false, error: "You can't remove yourself." };

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("staff")
    .select("role")
    .eq("id", userId)
    .eq("tenant_id", staff.tenantId)
    .maybeSingle();
  if (!target) return { ok: false, error: "Member not found." };
  if (target.role === "owner") return { ok: false, error: "You can't remove an owner." };

  const { error: sErr } = await supabase
    .from("staff")
    .update({ is_active: false })
    .eq("id", userId)
    .eq("tenant_id", staff.tenantId);
  if (sErr) return { ok: false, error: sErr.message };
  await supabase.from("memberships").delete().eq("user_id", userId).eq("tenant_id", staff.tenantId);

  revalidatePath("/admin/team");
  return { ok: true };
}

/** The invitee accepts (must be signed in as the invited email). */
export async function acceptInvite(token: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in with the invited email first." };

  const { error } = await supabase.rpc("accept_invite", { p_token: token });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}
