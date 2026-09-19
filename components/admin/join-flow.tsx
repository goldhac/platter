"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { OCTAGON } from "@/components/menu/seal-mark";
import { createClient } from "@/lib/supabase/browser";
import { acceptInvite } from "@/lib/mutations/team";

const inputClass =
  "h-[52px] w-full rounded-sm border border-hairline bg-surface-sunken px-3.5 text-base text-text outline-none placeholder:text-text-tertiary focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40";
const primary =
  "h-[52px] w-full rounded-sm bg-accent text-sm font-semibold uppercase tracking-[0.08em] text-on-accent outline-none transition-colors hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50";

export function JoinFlow({ token }: { token: string | null }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authedEmail, setAuthedEmail] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        setAuthedEmail(data.user?.email ?? null);
        setChecking(false);
      });
  }, []);

  async function accept() {
    if (!token) return;
    setBusy(true);
    const res = await acceptInvite(token);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("You're in!");
    router.push("/admin");
    router.refresh();
  }

  async function authThenAccept(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const supabase = createClient();
    const { data, error } =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      // signup with email confirmation on
      setBusy(false);
      toast.info("Check your email to confirm, then open this invite link again.");
      return;
    }
    const res = await acceptInvite(token ?? "");
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("You're in!");
    router.push("/admin");
    router.refresh();
  }

  // Likeliest real failure: the link was pasted into a message and truncated.
  if (!token) {
    return (
      <div className="text-center">
        <p className="text-sm leading-relaxed text-text-secondary">
          This link is incomplete. Invite links are long and can get cut off when copied by hand or wrapped across a
          message — ask whoever invited you for a fresh one.
        </p>
        <Link
          href="/admin/login"
          className="mt-5 inline-flex h-[50px] w-full items-center justify-center rounded-sm border border-hairline text-sm text-text-secondary outline-none transition-colors hover:border-hairline-strong hover:text-text focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  // A skeleton in the shape of what loads — nothing shifts when it resolves.
  if (checking) {
    return (
      <div className="space-y-3" aria-hidden>
        <div className="h-4 w-3/4 animate-pulse rounded-sm bg-text/[0.06]" />
        <div className="h-[52px] w-full animate-pulse rounded-sm bg-text/[0.06]" />
        <div className="h-4 w-1/2 animate-pulse rounded-sm bg-text/[0.06]" />
      </div>
    );
  }

  if (authedEmail) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-sm border border-hairline bg-surface-sunken px-4 py-3">
          <span
            className="grid h-9 w-9 flex-none place-items-center bg-positive/15 font-display text-base text-positive"
            style={{ clipPath: OCTAGON }}
            aria-hidden
          >
            {authedEmail.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-text">{authedEmail}</span>
        </div>
        <button type="button" onClick={accept} disabled={busy} className={primary}>
          {busy ? "Joining…" : "Accept invite"}
        </button>
        <p className="text-center text-xs text-text-tertiary">
          The invite must be for this email. Wrong account?{" "}
          <button
            type="button"
            className="text-hairline-strong hover:text-text"
            onClick={() =>
              createClient()
                .auth.signOut()
                .then(() => {
                  setAuthedEmail(null);
                })
            }
          >
            Sign out
          </button>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={authThenAccept} className="space-y-3">
      <p className="rounded-sm border border-hairline-strong/30 bg-hairline-strong/[0.07] px-4 py-3 text-center text-[13px] leading-relaxed text-text-secondary">
        Use the email address your invite was sent to.
      </p>
      <input
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        className={inputClass}
      />
      <input
        type="password"
        required
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={mode === "signup" ? "Create a password (8+ chars)" : "Password"}
        className={inputClass}
      />
      <button type="submit" disabled={busy} className={primary}>
        {busy ? "…" : mode === "signup" ? "Create account & join" : "Sign in & join"}
      </button>
      <p className="text-center text-xs text-text-secondary">
        {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
        <button
          type="button"
          className="text-hairline-strong hover:text-text"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
        >
          {mode === "signup" ? "Sign in" : "Create account"}
        </button>
      </p>
    </form>
  );
}
