"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleItemAvailability } from "@/lib/mutations/items";
import { cn } from "@/lib/utils";

/**
 * The one-tap sold-out toggle (A5) — the <10-second flow. Optimistic: flips
 * instantly, reconciles on the server response, and offers Undo. Any staff role
 * can use it (RLS + trigger allow only is_available to change).
 */
export function SoldOutToggle({
  itemId,
  itemName,
  available: initial,
}: {
  itemId: string;
  itemName: string;
  available: boolean;
}) {
  const [available, setAvailable] = useState(initial);
  const [pending, start] = useTransition();

  function set(next: boolean, silent = false) {
    setAvailable(next); // optimistic
    start(async () => {
      const res = await toggleItemAvailability(itemId, next);
      if (!res.ok) {
        setAvailable(!next); // revert
        toast.error(`Couldn't update ${itemName}: ${res.error}`);
        return;
      }
      if (!silent) {
        toast(next ? `${itemName} is back on` : `${itemName} marked sold out`, {
          action: { label: "Undo", onClick: () => set(!next, true) },
        });
      }
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={available}
      aria-label={`${itemName}: ${available ? "available" : "sold out"}`}
      disabled={pending}
      onClick={() => set(!available)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-60",
        available ? "bg-positive/80" : "bg-hairline/30",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-porcelain transition-transform",
          available ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}
