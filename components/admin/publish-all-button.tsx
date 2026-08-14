"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { publishMenuDrafts } from "@/lib/mutations/items";

/** "Publish N drafts" — makes every draft item on the current menu live in one tap. Hidden
 * when there are no drafts. */
export function PublishAllButton({ menuId, draftCount }: { menuId: string; draftCount: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (draftCount <= 0) return null;

  function run() {
    if (busy) return;
    setBusy(true);
    const p = publishMenuDrafts(menuId).then((r) => {
      if (!r.ok) throw new Error(r.error);
      router.refresh();
    });
    toast.promise(p, {
      loading: "Publishing…",
      success: `Published ${draftCount} item${draftCount === 1 ? "" : "s"}`,
      error: (e: Error) => e.message,
    });
    p.catch(() => {}).finally(() => setBusy(false));
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      className="tabular rounded-card border border-accent/40 px-3 py-1.5 text-xs uppercase tracking-wider text-accent outline-none hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-50"
    >
      {busy ? "Publishing…" : `Publish ${draftCount} draft${draftCount === 1 ? "" : "s"}`}
    </button>
  );
}
