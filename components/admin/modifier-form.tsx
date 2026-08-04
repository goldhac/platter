"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { saveModifierGroup } from "@/lib/mutations/modifiers";
import type { EditableModifierGroup } from "@/lib/queries/admin-modifiers";

const field =
  "w-full rounded-card border border-hairline/30 bg-black/20 px-3 py-2.5 text-sm text-porcelain outline-none focus-visible:ring-2 focus-visible:ring-accent/70";
const label = "mb-1 block text-xs uppercase tracking-wider text-muted";

export function ModifierForm({ initial }: { initial?: EditableModifierGroup }) {
  const router = useRouter();
  const editing = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [nameZh, setNameZh] = useState(initial?.name_zh ?? "");
  const [required, setRequired] = useState(initial?.is_required ?? false);
  const [minSelect, setMinSelect] = useState(String(initial?.min_select ?? 0));
  const [maxSelect, setMaxSelect] = useState(String(initial?.max_select ?? 1));
  const [options, setOptions] = useState<{ name: string; price_delta: string }[]>(
    initial?.options.map((o) => ({ name: o.name, price_delta: String(o.price_delta) })) ?? [],
  );
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await saveModifierGroup(initial?.id ?? null, {
      name,
      name_zh: nameZh || undefined,
      is_required: required,
      min_select: Number(minSelect) || 0,
      max_select: Number(maxSelect) || 1,
      options: options.map((o) => ({ name: o.name, price_delta: Number(o.price_delta) || 0 })),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(editing ? "Group saved" : "Group created");
    router.push("/admin/modifiers");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className={label}>Group name</span>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Choice of rice" />
        </div>
        <div>
          <span className={label}>Name (中文)</span>
          <input className={`${field} font-cjk`} value={nameZh} onChange={(e) => setNameZh(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-3 items-end gap-3">
        <label className="flex items-center gap-2 text-sm text-porcelain">
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="accent-[var(--color-lacquer)]" />
          Required
        </label>
        <div>
          <span className={label}>Min select</span>
          <input className={`${field} tabular`} inputMode="numeric" value={minSelect} onChange={(e) => setMinSelect(e.target.value)} />
        </div>
        <div>
          <span className={label}>Max select</span>
          <input className={`${field} tabular`} inputMode="numeric" value={maxSelect} onChange={(e) => setMaxSelect(e.target.value)} />
        </div>
      </div>

      <div>
        <span className={label}>Options</span>
        <div className="space-y-2">
          {options.map((o, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={field}
                placeholder="Option (e.g. Fried rice)"
                value={o.name}
                onChange={(e) => setOptions((arr) => arr.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
              />
              <input
                className={`${field} tabular w-28 shrink-0`}
                inputMode="numeric"
                placeholder="+₦"
                value={o.price_delta}
                onChange={(e) => setOptions((arr) => arr.map((x, j) => (j === i ? { ...x, price_delta: e.target.value } : x)))}
              />
              <button
                type="button"
                onClick={() => setOptions((arr) => arr.filter((_, j) => j !== i))}
                aria-label="Remove option"
                className="shrink-0 rounded-card border border-hairline/30 px-3 text-muted hover:text-accent"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOptions((arr) => [...arr, { name: "", price_delta: "" }])}
          className="mt-2 rounded-card border border-hairline/30 px-3 py-1.5 text-xs text-muted hover:text-porcelain"
        >
          + Add option
        </button>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={saving} className="rounded-card bg-accent px-4 py-2.5 text-sm font-medium text-porcelain hover:opacity-90 disabled:opacity-50">
          {saving ? "Saving…" : editing ? "Save group" : "Create group"}
        </button>
        <button type="button" onClick={() => router.push("/admin/modifiers")} className="rounded-card border border-hairline/30 px-4 py-2.5 text-sm text-muted hover:text-porcelain">
          Cancel
        </button>
      </div>
    </form>
  );
}
