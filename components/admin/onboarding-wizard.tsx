"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { updateSubdomain } from "@/lib/mutations/domains";
import { saveOnboardingBasics } from "@/lib/mutations/onboarding";
import { cn } from "@/lib/utils";
import { MenuImport } from "./menu-import";

const field =
  "mt-1 h-[52px] w-full rounded-sm border border-hairline bg-surface-sunken px-3.5 text-base text-text outline-none placeholder:text-text-tertiary focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40";
const label = "font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary";
const primary =
  "inline-flex h-[50px] items-center justify-center rounded-sm bg-accent px-5 text-sm font-semibold uppercase tracking-[0.08em] text-on-accent outline-none transition-colors hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50";
const ghost =
  "inline-flex h-[50px] items-center justify-center rounded-sm border border-hairline px-4 text-sm text-text-secondary outline-none transition-colors hover:border-hairline-strong hover:text-text focus-visible:ring-2 focus-visible:ring-accent/50";

const STEPS = ["Details", "Your link", "Your menu"];

export function OnboardingWizard({
  initial,
}: {
  initial: { name: string; cuisine: string; currency: string; slug: string; platformHost: string };
}) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(initial.name);
  const [cuisine, setCuisine] = useState(initial.cuisine);
  const [currency, setCurrency] = useState(initial.currency || "NGN");
  const [slug, setSlug] = useState(initial.slug);

  async function saveDetails() {
    setBusy(true);
    const r = await saveOnboardingBasics({ name, cuisine, currency });
    setBusy(false);
    if (!r.ok) return void toast.error(r.error);
    setStep(1);
  }

  async function saveLink() {
    setBusy(true);
    const r = await updateSubdomain(slug);
    setBusy(false);
    if (!r.ok) return void toast.error(r.error);
    toast.success("Link claimed");
    setStep(2);
  }

  return (
    <div>
      {/* progress */}
      <div className="mb-6">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className={cn("h-1 flex-1 rounded-pill", i <= step ? "bg-accent" : "bg-text/15")} />
          ))}
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-hairline-strong">
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </p>
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <h1 className="font-display text-[26px] leading-tight tracking-[-0.02em] text-text">Tell us about your venue</h1>
          <label className="block">
            <span className={label}>Venue name</span>
            <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jīn Cāntīng" />
          </label>
          <label className="block">
            <span className={label}>Cuisine</span>
            <input className={field} value={cuisine} onChange={(e) => setCuisine(e.target.value)} placeholder="e.g. Chinese, Nigerian, Café" />
          </label>
          <label className="block">
            <span className={label}>Currency</span>
            <input
              className={cn(field, "w-28 font-mono")}
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 3))}
              placeholder="NGN"
            />
          </label>
          <div className="flex justify-end pt-2">
            <button type="button" className={primary} onClick={saveDetails} disabled={busy || !name.trim()}>
              {busy ? "Saving…" : "Continue"}
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h1 className="font-display text-[26px] leading-tight tracking-[-0.02em] text-text">Claim your link</h1>
          <p className="text-sm text-text-secondary">This is where diners will find your menu. You can change it later.</p>
          <label className="block">
            <span className={label}>Your address</span>
            <div className="mt-1 flex items-center overflow-hidden rounded-sm border border-hairline bg-surface-sunken focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/40">
              <span className="shrink-0 py-3 pl-3.5 font-mono text-sm text-text-tertiary">{initial.platformHost}/v/</span>
              <input
                className="h-[52px] w-full bg-transparent pr-3.5 text-base text-text outline-none"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                placeholder="your-venue"
              />
            </div>
          </label>
          <div className="flex justify-between pt-2">
            <button type="button" className={ghost} onClick={() => setStep(0)}>
              Back
            </button>
            <button type="button" className={primary} onClick={saveLink} disabled={busy || !slug.trim()}>
              {busy ? "Claiming…" : "Continue"}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h1 className="font-display text-[26px] leading-tight tracking-[-0.02em] text-text">Add your menu</h1>
          <p className="text-sm text-text-secondary">
            Snap a photo or upload a PDF of your existing menu — we&apos;ll turn it into an editable draft in seconds.
            You review everything before it goes live.
          </p>
          <MenuImport />
          <div className="flex items-center justify-between border-t border-hairline pt-4">
            <button type="button" className={ghost} onClick={() => setStep(1)}>
              Back
            </button>
            <Link href="/admin" className={primary}>
              Go to dashboard →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
