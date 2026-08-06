"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/browser";
import { acceptInvite } from "@/lib/mutations/team";

const inputClass =
  "w-full rounded-card border border-hairline/30 bg-black/20 px-3 py-2.5 text-porcelain outline-none focus-visible:ring-2 focus-visible:ring-accent/70";
const primary =
  "w-full rounded-card bg-accent py-2.5 text-sm font-medium text-porcelain outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-50";

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

  if (!token) {
    return <p className="text-center text-sm text-accent">This invite link is missing its token.</p>;
  }

  if (checking) {
    return <p className="text-center text-sm text-muted">Checking…</p>;
  }

  if (authedEmail) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted">
          Signed in as <span className="text-porcelain">{authedEmail}</span>. Accept this invite to
          join the team.
        </p>
        <button type="button" onClick={accept} disabled={busy} className={primary}>
          {busy ? "Joining…" : "Accept invite"}
        </button>
        <p className="text-xs text-muted">
          The invite must be for this email. Wrong account?{" "}
          <button
            type="button"
            className="text-brass hover:text-porcelain"
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
      <p className="text-center text-sm text-muted">
        {mode === "signup" ? "Create your account" : "Sign in"} with the email your invite was sent
        to.
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
      <p className="text-center text-xs text-muted">
        {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
        <button
          type="button"
          className="text-brass hover:text-porcelain"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
        >
          {mode === "signup" ? "Sign in" : "Create account"}
        </button>
      </p>
    </form>
  );
}
