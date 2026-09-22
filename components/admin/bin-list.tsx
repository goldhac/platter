"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { restoreItem } from "@/lib/mutations/items";
import type { BinItem } from "@/lib/queries/admin-bin";

export function BinList({ items }: { items: BinItem[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (items.length === 0) {
    return (
      <p className="rounded-md border border-hairline p-4 text-sm text-text-secondary">
        Nothing deleted. Removed items land here for 30 days — restore them any time before then.
      </p>
    );
  }

  function restore(it: BinItem) {
    start(async () => {
      const res = await restoreItem(it.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`${it.name} restored`);
      router.refresh();
    });
  }

  return (
    <ul className="divide-y divide-hairline">
      {items.map((it) => (
        <li key={it.id} className="flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <span className="text-sm text-text line-through">{it.name}</span>
            <span className="ml-2 font-mono text-xs text-text-tertiary">
              {it.daysLeft} day{it.daysLeft === 1 ? "" : "s"} left
            </span>
          </div>
          <button
            type="button"
            onClick={() => restore(it)}
            disabled={pending}
            className="font-mono text-[0.65rem] uppercase tracking-wider text-text-secondary outline-none hover:text-positive focus-visible:text-positive disabled:opacity-50"
          >
            Restore
          </button>
        </li>
      ))}
    </ul>
  );
}
