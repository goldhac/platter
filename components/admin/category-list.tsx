"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { setCategoryActive, softDeleteCategory } from "@/lib/mutations/categories";
import type { AdminCategoryRow } from "@/lib/queries/admin-categories";
import { cn } from "@/lib/utils";

export function CategoryList({ categories }: { categories: AdminCategoryRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

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
      <p className="rounded-card border border-hairline/20 p-4 text-sm text-muted">
        No categories yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-hairline/10">
      {categories.map((c) => (
        <li key={c.id} className={cn("flex items-center gap-3 py-3", pending && "opacity-60")}>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("text-sm", c.is_active ? "text-porcelain" : "text-muted line-through")}>
                {c.name}
              </span>
              {c.group_name && (
                <span className="tabular text-[0.6rem] uppercase tracking-wider text-brass">
                  {c.group_name}
                </span>
              )}
              {!c.is_active && (
                <span className="tabular text-[0.6rem] uppercase tracking-wider text-muted">hidden</span>
              )}
            </div>
            <span className="tabular text-xs text-muted">
              {c.item_count} item{c.item_count === 1 ? "" : "s"} · /{c.slug}
            </span>
          </div>
          <button
            type="button"
            onClick={() => toggleActive(c)}
            disabled={pending}
            className="tabular text-[0.65rem] uppercase tracking-wider text-muted hover:text-porcelain"
          >
            {c.is_active ? "Hide" : "Show"}
          </button>
          <Link
            href={`/admin/categories/${c.id}`}
            className="tabular text-[0.65rem] uppercase tracking-wider text-muted hover:text-porcelain"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={() => del(c)}
            disabled={pending}
            className="tabular text-[0.65rem] uppercase tracking-wider text-muted hover:text-accent"
          >
            Del
          </button>
        </li>
      ))}
    </ul>
  );
}
