"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  async function sendMagicLink() {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMagicSent(true);
  }

  const inputClass =
    "w-full rounded-card border border-hairline/30 bg-black/20 px-3 py-2.5 text-porcelain outline-none focus-visible:ring-2 focus-visible:ring-accent/70";

  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="font-cjk text-xl text-accent">金餐厅</div>
          <h1 className="mt-1 font-display text-3xl text-porcelain">Platter Manager</h1>
          <p className="mt-1 text-sm text-muted">Sign in to manage the menu</p>
        </div>

        {magicSent ? (
          <div className="rounded-card border border-hairline/30 p-4 text-center text-sm text-muted">
            Check <span className="text-porcelain">{email}</span> for a sign-in link.
          </div>
        ) : (
          <form onSubmit={signInWithPassword} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Password</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </label>

            {error && (
              <p role="alert" className="text-sm text-accent">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-card bg-accent py-2.5 text-sm font-medium text-porcelain outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-50"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>

            <button
              type="button"
              onClick={sendMagicLink}
              disabled={busy}
              className="w-full rounded-card border border-hairline/30 py-2.5 text-sm text-muted outline-none transition-colors hover:text-porcelain focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-50"
            >
              Email me a magic link instead
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
