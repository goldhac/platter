"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { OCTAGON } from "@/components/menu/seal-mark";
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
    "h-[52px] w-full rounded-sm border border-hairline bg-surface-sunken px-3.5 text-base text-text outline-none transition-shadow placeholder:text-text-tertiary focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40";

  return (
    <div className="flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-9 text-center">
          <span
            className="mx-auto grid h-[52px] w-[52px] place-items-center bg-accent font-display text-2xl text-on-accent"
            style={{ clipPath: OCTAGON }}
            aria-hidden
          >
            P
          </span>
          <h1 className="mt-5 font-display text-[33px] leading-none tracking-[-0.02em] text-text">Platter Manager</h1>
          <p className="mt-3 text-sm text-text-secondary">Sign in to manage your menu.</p>
        </div>

        {magicSent ? (
          <div role="status" className="text-center">
            <span
              className="mx-auto grid h-[68px] w-[68px] place-items-center bg-positive/15 font-cjk text-3xl text-positive"
              style={{ clipPath: OCTAGON }}
              aria-hidden
            >
              信
            </span>
            <h2 className="mt-5 font-display text-[28px] leading-none tracking-[-0.02em] text-text">Check your inbox.</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              We sent a sign-in link to <span className="text-text">{email}</span>. It expires in about an hour.
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={sendMagicLink}
                disabled={busy}
                className="h-[50px] w-full rounded-sm border border-hairline text-sm text-text-secondary outline-none transition-colors hover:border-hairline-strong hover:text-text focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50"
              >
                {busy ? "Sending…" : "Send it again"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMagicSent(false);
                  setError(null);
                }}
                className="h-[50px] w-full rounded-sm text-sm text-text-tertiary outline-none transition-colors hover:text-text focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                Use a different email
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={signInWithPassword} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary">Email</span>
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
              <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary">Password</span>
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
              <p role="alert" className="text-sm text-danger-on-soft">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="h-[52px] w-full rounded-sm bg-accent text-sm font-semibold uppercase tracking-[0.08em] text-on-accent outline-none transition-colors hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>

            <div className="flex items-center gap-3 py-1" aria-hidden>
              <span className="h-px flex-1 bg-hairline" />
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-tertiary">or</span>
              <span className="h-px flex-1 bg-hairline" />
            </div>

            <button
              type="button"
              onClick={sendMagicLink}
              disabled={busy}
              className="h-[52px] w-full rounded-sm border border-hairline text-sm text-text-secondary outline-none transition-colors hover:border-hairline-strong hover:text-text focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50"
            >
              Email me a magic link
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-text-secondary">
          New to Platter?{" "}
          <Link href="/admin/signup" className="text-hairline-strong underline-offset-2 hover:text-text hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
