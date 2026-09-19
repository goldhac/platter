"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setCategoryActive, softDeleteCategory } from "@/lib/mutations/categories";
import type { AdminCategoryRow } from "@/lib/queries/admin-categories";
import { cn } from "@/lib/utils";

const action =
  "font-mono text-[0.65rem] uppercase tracking-wider text-text-secondary outline-none hover:text-text focus-visible:text-text";

export function CategoryList({ categories }: { categories: AdminCategoryRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  // Which row is asking to confirm a delete (§11.2 — delete had no confirmation).
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function toggleActive(c: AdminCategoryRow) {
    start(async () => {
      const res = await setCategoryActive(c.id, !c.is_active);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  function del(c: AdminCategoryRow) {
    setConfirmId(null);
    start(async () => {
      const res = await softDeleteCategory(c.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`${c.name} deleted`);
      router.refresh();
    });
  }

  if (categories.length === 0) {
    return (
      <p className="rounded-md border border-hairline p-4 text-sm text-text-secondary">No categories yet.</p>
    );
  }

  return (
    <ul className="divide-y divide-hairline">
      {categories.map((c) => (
        <li key={c.id} className={cn("flex items-center gap-3 py-3", pending && "opacity-60")}>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("text-sm", c.is_active ? "text-text" : "text-text-tertiary line-through")}>
                {c.name}
              </span>
              {c.group_name && (
                <span className="font-mono text-[0.6rem] uppercase tracking-wider text-hairline-strong">
                  {c.group_name}
                </span>
              )}
              {!c.is_active && (
                <span className="font-mono text-[0.6rem] uppercase tracking-wider text-text-tertiary">hidden</span>
              )}
            </div>
            <span className="font-mono text-xs text-text-secondary">
              {c.item_count} item{c.item_count === 1 ? "" : "s"} · /{c.slug}
            </span>
          </div>

          {confirmId === c.id ? (
            <span className="flex items-center gap-2.5 font-mono text-[0.65rem] uppercase tracking-wider">
              <span className="text-text-secondary">Delete?</span>
              <button
                type="button"
                onClick={() => del(c)}
                disabled={pending}
                className="text-danger-on-soft outline-none hover:text-danger focus-visible:text-danger"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                className="text-text-secondary outline-none hover:text-text focus-visible:text-text"
              >
                No
              </button>
            </span>
          ) : (
            <>
              <button type="button" onClick={() => toggleActive(c)} disabled={pending} className={action}>
                {c.is_active ? "Hide" : "Show"}
              </button>
              <Link href={`/admin/categories/${c.id}`} className={action}>
                Edit
              </Link>
              <button
                type="button"
                onClick={() => setConfirmId(c.id)}
                disabled={pending}
                className="font-mono text-[0.65rem] uppercase tracking-wider text-text-secondary outline-none hover:text-danger-on-soft focus-visible:text-danger-on-soft"
              >
                Delete
              </button>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
