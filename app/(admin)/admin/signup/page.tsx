"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { OCTAGON } from "@/components/menu/seal-mark";
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

  async function resend() {
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.resend({ type: "signup", email });
    setBusy(false);
    if (error) setError(error.message);
  }

  const inputClass =
    "h-[52px] w-full rounded-sm border border-hairline bg-surface-sunken px-3.5 text-base text-text outline-none transition-shadow placeholder:text-text-tertiary focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40";

  if (confirmSent) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm text-center" role="status">
          <span
            className="mx-auto grid h-[72px] w-[72px] place-items-center bg-positive/15 font-cjk text-4xl text-positive"
            style={{ clipPath: OCTAGON }}
            aria-hidden
          >
            信
          </span>
          <h1 className="mt-6 font-display text-[31px] leading-none tracking-[-0.02em] text-text">Almost there.</h1>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            We sent a confirmation link to <span className="text-text">{email}</span>. Click it and you&apos;ll land
            right on setup.
          </p>
          <div className="mt-5 rounded-sm border border-hairline bg-surface-sunken px-4 py-3 text-left text-xs leading-relaxed text-text-secondary">
            Not there in a minute or two? Check spam, or the address may have a typo — you can resend or change it below.
          </div>
          {error && (
            <p role="alert" className="mt-4 text-sm text-danger-on-soft">
              {error}
            </p>
          )}
          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={resend}
              disabled={busy}
              className="h-[50px] w-full rounded-sm border border-hairline text-sm text-text-secondary outline-none transition-colors hover:border-hairline-strong hover:text-text focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send it again"}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmSent(false);
                setError(null);
              }}
              className="h-[50px] w-full rounded-sm text-sm text-text-tertiary outline-none transition-colors hover:text-text focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="mt-5 font-display text-[31px] leading-none tracking-[-0.02em] text-text">Put your menu online</h1>
          <p className="mt-3 text-sm text-text-secondary">Snap a photo of your paper menu — live in minutes.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary">
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            <span className="mt-1.5 block text-xs text-text-tertiary">At least 8 characters.</span>
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
            {busy ? "Creating your account…" : "Create account"}
          </button>

          <p className="pt-1 text-center text-xs text-text-secondary">
            Already have an account?{" "}
            <Link href="/admin/login" className="text-hairline-strong underline-offset-2 hover:text-text hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
