"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createVenue, setActiveVenue } from "@/lib/mutations/venues";
import type { VenueLite } from "@/lib/venue/active";

/** Header dropdown to switch the active venue. Hidden for single-venue tenants. */
export function VenueSwitcher({ venues, activeId }: { venues: VenueLite[]; activeId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  if (venues.length < 2) return null;

  return (
    <label className="flex items-center gap-1.5">
      <span className="sr-only">Active venue</span>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brass" aria-hidden>
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <select
        value={activeId}
        disabled={pending}
        onChange={(e) => {
          const id = e.target.value;
          start(async () => {
            const r = await setActiveVenue(id);
            if (!r.ok) return void toast.error(r.error);
            router.refresh();
          });
        }}
        aria-label="Active venue"
        className="tabular rounded-card border border-hairline/30 bg-ink px-2 py-1 text-xs text-porcelain outline-none focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-50"
      >
        {venues.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Owner action: spin up a new venue (restaurant + default live menu), then switch to it. */
export function AddVenueButton({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <button type="button" className={className} onClick={() => setOpen(true)}>
        + Add venue
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const n = name.trim();
        if (!n) return;
        start(async () => {
          const r = await createVenue(n);
          if (!r.ok) return void toast.error(r.error);
          toast.success(`“${n}” created`);
          setOpen(false);
          setName("");
          router.push("/admin");
          router.refresh();
        });
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New venue name"
        className="rounded-card border border-hairline/30 bg-ink px-3 py-2 text-sm text-porcelain outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      />
      <button
        type="submit"
        disabled={pending || !name.trim()}
        className="tabular rounded-card bg-accent px-3 py-2 text-xs uppercase tracking-wider text-porcelain outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="tabular rounded-card border border-hairline/30 px-3 py-2 text-xs uppercase tracking-wider text-muted outline-none hover:text-porcelain focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        Cancel
      </button>
    </form>
  );
}
