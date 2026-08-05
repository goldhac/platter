"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createMenu } from "@/lib/mutations/menus";

export function NewMenuButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  function submit() {
    const n = name.trim();
    if (!n) return;
    start(async () => {
      const res = await createMenu(n);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Created “${n}”`);
      setOpen(false);
      setName("");
      router.push(`/admin/theme?m=${res.slug}`); // straight to theming the new menu
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tabular rounded-card bg-accent px-3 py-2 text-xs uppercase tracking-wider text-porcelain outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        + New menu
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") {
            setOpen(false);
            setName("");
          }
        }}
        placeholder="Menu name (e.g. Room Service)"
        className="rounded-card border border-hairline/30 bg-black/20 px-3 py-2 text-sm text-porcelain outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      />
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="tabular rounded-card bg-accent px-3 py-2 text-xs uppercase tracking-wider text-porcelain outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-50"
      >
        {pending ? "…" : "Create"}
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setName("");
        }}
        className="tabular rounded-card border border-hairline/30 px-3 py-2 text-xs uppercase tracking-wider text-muted hover:text-porcelain"
      >
        Cancel
      </button>
    </div>
  );
}
