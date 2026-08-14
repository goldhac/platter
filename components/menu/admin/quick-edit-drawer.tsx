"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { quickUpdateItem, setItemStatus, toggleItemAvailability } from "@/lib/mutations/items";
import { cn } from "@/lib/utils";
import { useAdmin } from "./admin-context";

const field =
  "mt-1 w-full rounded-card border border-hairline/30 bg-black/20 px-3 py-2.5 text-sm text-text outline-none focus-visible:ring-2 focus-visible:ring-accent/70";
const chip =
  "flex-1 rounded-card border border-hairline/40 px-3 py-2 text-xs font-medium text-text outline-none hover:border-hairline focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-50";

/** The quick-edit slide-over for the admin-on-menu layer: name + price + availability +
 * publish/hide, without leaving the menu. Deeper edits go to the full item editor. */
export function QuickEditDrawer() {
  const { admin, editSlug, closeEdit, itemsBySlug } = useAdmin();
  const item = editSlug ? (itemsBySlug[editSlug] ?? null) : null;
  const router = useRouter();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (item) {
      setName(item.name);
      setPrice(String(item.base_price));
    }
  }, [item]);

  if (!admin || !item) return null;

  // Optimistic feel: the interaction responds instantly (drawer closes / toast fires); the
  // server action + menu re-fetch happen in the background via toast.promise.
  const run = (p: Promise<{ ok: boolean; error?: string }>, msgs: { loading: string; success: string }) =>
    toast.promise(
      p.then((r) => {
        if (!r.ok) throw new Error(r.error || "Something went wrong");
        router.refresh();
      }),
      { loading: msgs.loading, success: msgs.success, error: (e: Error) => e.message },
    );

  const save = () => {
    closeEdit();
    run(quickUpdateItem(item.id, { name, base_price: Number(price) }), { loading: "Saving…", success: "Saved" });
  };

  const toggleAvail = () => {
    const next = !item.is_available;
    run(toggleItemAvailability(item.id, next), {
      loading: "Updating…",
      success: next ? "Back in stock" : "Marked sold out",
    });
  };

  const togglePublish = () => {
    const next = item.status === "published" ? "draft" : "published";
    run(setItemStatus(item.id, next), {
      loading: "Updating…",
      success: next === "published" ? "Published — now live" : "Hidden from customers",
    });
  };

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={`Edit ${item.name}`}>
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/50" onClick={closeEdit} />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-xl rounded-t-2xl border-t border-hairline/30 bg-bg p-5 pb-8 shadow-2xl">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-hairline/40" />
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-text">Quick edit</h2>
          <Link
            href={`${admin.itemHrefBase}${item.id}`}
            className="text-xs text-accent underline-offset-2 hover:underline"
          >
            Full editor →
          </Link>
        </div>

        <label className="mt-4 block text-[0.7rem] uppercase tracking-wider text-text-secondary">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </label>
        <label className="mt-3 block text-[0.7rem] uppercase tracking-wider text-text-secondary">
          Price
          <input
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={cn(field, "tabular")}
          />
        </label>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={toggleAvail} className={chip}>
            {item.is_available ? "Mark sold out" : "Mark available"}
          </button>
          <button type="button" onClick={togglePublish} className={chip}>
            {item.status === "published" ? "Hide from menu" : "Publish"}
          </button>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={closeEdit}
            className="rounded-card border border-hairline/40 px-4 py-2.5 text-sm text-text-secondary hover:text-text"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
                       className="flex-1 rounded-card bg-accent px-4 py-2.5 text-sm font-semibold text-bg outline-none focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-60"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
