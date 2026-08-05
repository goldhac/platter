"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Use a password of at least 8 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: {
        // Read back by provision_tenant() to name the venue on either auth path.
        data: { business_name: name.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin/onboarding`,
      },
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      // Email confirmation off → straight into onboarding (which provisions).
      router.push("/admin/onboarding");
      router.refresh();
    } else {
      // Confirmation required → they finish via the emailed link.
      setConfirmSent(true);
    }
  }

  const inputClass =
    "w-full rounded-card border border-hairline/30 bg-black/20 px-3 py-2.5 text-porcelain outline-none focus-visible:ring-2 focus-visible:ring-accent/70";

  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-display text-2xl text-porcelain">Platter</span>
          <h1 className="mt-3 font-display text-2xl text-porcelain">Put your menu online</h1>
          <p className="mt-1 text-sm text-muted">
            Snap a photo of your paper menu — live in minutes.
          </p>
        </div>

        {confirmSent ? (
          <div className="rounded-card border border-hairline/30 p-4 text-center text-sm text-muted">
            Almost there — check <span className="text-porcelain">{email}</span> and click the link to
            confirm your account, and you&apos;ll land right on setup.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                Restaurant name
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. La Trattoria"
                className={inputClass}
              />
            </label>
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
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
              {busy ? "Creating your account…" : "Create account"}
            </button>

            <p className="pt-1 text-center text-xs text-muted">
              Already have an account?{" "}
              <Link href="/admin/login" className="text-brass hover:text-porcelain">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
