"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { inviteTeammate, removeMember, revokeInvite } from "@/lib/mutations/team";
import type { TeamData } from "@/lib/queries/admin-team";
import { cn } from "@/lib/utils";

const field =
  "rounded-card border border-hairline/30 bg-black/20 px-3 py-2.5 text-sm text-porcelain outline-none focus-visible:ring-2 focus-visible:ring-accent/70";
const btn =
  "tabular shrink-0 rounded-card bg-accent px-3 py-2.5 text-xs uppercase tracking-wider text-porcelain outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-50";
const ghost =
  "tabular shrink-0 rounded-card border border-hairline/30 px-2.5 py-1.5 text-[0.65rem] uppercase tracking-wider text-muted outline-none hover:text-porcelain focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-50";

const roleLabel: Record<string, string> = { owner: "Owner", manager: "Manager", staff: "Staff" };

export function TeamManager({ data }: { data: TeamData }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"manager" | "staff">("staff");
  const [link, setLink] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const atCapacity = data.seatsUsed >= data.seatMax;
  const seatText = data.seatMax === Infinity ? `${data.seatsUsed} used` : `${data.seatsUsed} / ${data.seatMax} seats`;

  function invite() {
    const e = email.trim();
    if (!e) return;
    start(async () => {
      const res = await inviteTeammate(e, role);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const url = `${window.location.origin}${res.joinPath}`;
      setLink(url);
      setEmail("");
      navigator.clipboard?.writeText(url).catch(() => {});
      toast.success(
        res.emailed
          ? `Invite emailed to ${e} — link also copied.`
          : "Invite created — link copied. Share it with your teammate.",
      );
      router.refresh();
    });
  }

  function revoke(id: string) {
    start(async () => {
      const res = await revokeInvite(id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Invite revoked");
      router.refresh();
    });
  }

  function remove(id: string, label: string) {
    start(async () => {
      const res = await removeMember(id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Removed ${label}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between">
        <span className="tabular text-[0.72rem] uppercase tracking-[0.2em] text-brass">Members</span>
        <span className="tabular text-xs text-muted">{seatText}</span>
      </div>

      {/* Members */}
      <ul className="divide-y divide-hairline/10">
        {data.members.map((m) => (
          <li key={m.id} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-porcelain">
                {m.fullName ?? m.email ?? "—"}
                {m.isSelf && <span className="ml-1 text-xs text-muted">(you)</span>}
              </div>
              {m.fullName && m.email && <div className="truncate text-xs text-muted">{m.email}</div>}
            </div>
            <span className="tabular text-[0.65rem] uppercase tracking-wider text-muted">
              {roleLabel[m.role] ?? m.role}
            </span>
            {data.canEdit && !m.isSelf && m.role !== "owner" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => remove(m.id, m.email ?? "member")}
                className={cn(ghost, "hover:text-accent")}
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* Pending invites */}
      {data.invites.length > 0 && (
        <div className="space-y-2">
          <span className="tabular text-[0.72rem] uppercase tracking-[0.2em] text-brass">Pending invites</span>
          <ul className="divide-y divide-hairline/10">
            {data.invites.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1 truncate text-sm text-porcelain">{i.email}</div>
                <span className="tabular text-[0.65rem] uppercase tracking-wider text-muted">
                  {roleLabel[i.role] ?? i.role}
                </span>
                {data.canEdit && (
                  <button type="button" disabled={pending} onClick={() => revoke(i.id)} className={ghost}>
                    Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Invite form */}
      {data.canEdit && (
        <div className="space-y-3 border-t border-hairline/15 pt-6">
          <span className="tabular text-[0.72rem] uppercase tracking-[0.2em] text-brass">Invite a teammate</span>
          {atCapacity ? (
            <p className="rounded-card border border-hairline/20 p-3 text-sm text-muted">
              {data.seatMax === 1
                ? "Team members are a Pro feature — upgrade to invite staff and managers."
                : "You've used all your seats. Remove a member or upgrade for more."}
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teammate@email.com"
                  className={cn(field, "min-w-0 flex-1")}
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "manager" | "staff")}
                  className={field}
                >
                  <option value="staff" className="bg-ink">Staff</option>
                  <option value="manager" className="bg-ink">Manager</option>
                </select>
                <button type="button" onClick={invite} disabled={pending} className={btn}>
                  {pending ? "…" : "Invite"}
                </button>
              </div>
              <p className="text-xs text-muted">
                Staff can toggle sold-out; managers can edit the menu. We&apos;ll give you a link to
                share — they join by signing in with that email.
              </p>
            </>
          )}

          {link && (
            <div className="rounded-card border border-hairline/25 bg-black/10 p-3">
              <p className="text-xs text-muted">Share this join link:</p>
              <div className="mt-1 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate text-xs text-porcelain">{link}</code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(link).then(
                      () => toast.success("Copied"),
                      () => toast.error("Couldn’t copy"),
                    );
                  }}
                  className={ghost}
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
