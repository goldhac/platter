"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteModifierGroup } from "@/lib/mutations/modifiers";
import type { ModifierGroupRow } from "@/lib/queries/admin-modifiers";
import { cn } from "@/lib/utils";

export function ModifierList({ groups }: { groups: ModifierGroupRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function del(g: ModifierGroupRow) {
    start(async () => {
      const res = await deleteModifierGroup(g.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`${g.name} deleted`);
      router.refresh();
    });
  }

  if (groups.length === 0) {
    return (
      <p className="rounded-card border border-hairline/20 p-4 text-sm text-muted">
        No add-on groups yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-hairline/10">
      {groups.map((g) => (
        <li key={g.id} className={cn("flex items-center gap-3 py-3", pending && "opacity-60")}>
          <div className="min-w-0 flex-1">
            <span className="text-sm text-porcelain">{g.name}</span>
            <span className="tabular ml-2 text-xs text-muted">
              {g.option_count} option{g.option_count === 1 ? "" : "s"} ·{" "}
              {g.is_required ? "required" : "optional"} · pick {g.min_select}–{g.max_select}
            </span>
          </div>
          <Link
            href={`/admin/modifiers/${g.id}`}
            className="tabular text-[0.65rem] uppercase tracking-wider text-muted hover:text-porcelain"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={() => del(g)}
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
