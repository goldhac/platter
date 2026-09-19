"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteModifierGroup } from "@/lib/mutations/modifiers";
import type { ModifierGroupRow } from "@/lib/queries/admin-modifiers";
import { cn } from "@/lib/utils";

const action =
  "font-mono text-[0.65rem] uppercase tracking-wider text-text-secondary outline-none hover:text-text focus-visible:text-text";

export function ModifierList({ groups }: { groups: ModifierGroupRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function del(g: ModifierGroupRow) {
    setConfirmId(null);
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
      <p className="rounded-md border border-hairline p-4 text-sm text-text-secondary">No add-on groups yet.</p>
    );
  }

  return (
    <ul className="divide-y divide-hairline">
      {groups.map((g) => (
        <li key={g.id} className={cn("flex items-center gap-3 py-3", pending && "opacity-60")}>
          <div className="min-w-0 flex-1">
            <span className="text-sm text-text">{g.name}</span>
            <span className="ml-2 font-mono text-xs text-text-secondary">
              {g.option_count} option{g.option_count === 1 ? "" : "s"} ·{" "}
              <span className={g.is_required ? "text-caution" : "text-text-tertiary"}>
                {g.is_required ? "required" : "optional"}
              </span>{" "}
              · pick {g.min_select}–{g.max_select}
            </span>
          </div>

          {confirmId === g.id ? (
            <span className="flex items-center gap-2.5 font-mono text-[0.65rem] uppercase tracking-wider">
              <span className="text-text-secondary">Delete?</span>
              <button
                type="button"
                onClick={() => del(g)}
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
              <Link href={`/admin/modifiers/${g.id}`} className={action}>
                Edit
              </Link>
              <button
                type="button"
                onClick={() => setConfirmId(g.id)}
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
