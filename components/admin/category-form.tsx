"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createCategory, updateCategory } from "@/lib/mutations/categories";
import type { EditableCategory } from "@/lib/queries/admin-categories";

type FormValues = {
  name: string;
  name_zh: string;
  description: string;
  slug: string;
  group_id: string;
  available_from: string;
  available_to: string;
  is_active: boolean;
};

const field =
  "w-full rounded-card border border-hairline/30 bg-black/20 px-3 py-2.5 text-sm text-porcelain outline-none focus-visible:ring-2 focus-visible:ring-accent/70";
const label = "mb-1 block text-xs uppercase tracking-wider text-muted";

export function CategoryForm({
  groups,
  initial,
  menuSlug,
}: {
  groups: { id: string; name: string }[];
  initial?: EditableCategory;
  /** When set, this category is being created inside a menu's editor — return there. */
  menuSlug?: string;
}) {
  const router = useRouter();
  const editing = !!initial;
  const returnTo = menuSlug ? `/admin/menu?m=${menuSlug}` : "/admin/categories";
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: initial?.name ?? "",
      name_zh: initial?.name_zh ?? "",
      description: initial?.description ?? "",
      slug: initial?.slug ?? "",
      group_id: initial?.group_id ?? (menuSlug ? (groups[0]?.id ?? "") : ""),
      available_from: initial?.available_from?.slice(0, 5) ?? "",
      available_to: initial?.available_to?.slice(0, 5) ?? "",
      is_active: initial?.is_active ?? true,
    },
  });

  async function onSubmit(v: FormValues) {
    const payload = {
      name: v.name.trim(),
      name_zh: v.name_zh.trim() || undefined,
      description: v.description.trim() || undefined,
      slug: v.slug.trim() || undefined,
      group_id: v.group_id || undefined,
      available_from: v.available_from || undefined,
      available_to: v.available_to || undefined,
      is_active: v.is_active,
    };
    const res = editing ? await updateCategory(initial!.id, payload) : await createCategory(payload);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(editing ? "Category saved" : "Category created");
    router.push(returnTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <span className={label}>Name</span>
        <input className={field} {...register("name", { required: true })} />
        {errors.name && <p className="mt-1 text-xs text-accent">Name is required</p>}
      </div>

      <div>
        <span className={label}>Name (中文)</span>
        <input className={`${field} font-cjk`} {...register("name_zh")} />
      </div>

      <div>
        <span className={label}>Group</span>
        <select className={field} {...register("group_id")}>
          <option value="" className="bg-ink">
            — None —
          </option>
          {groups.map((g) => (
            <option key={g.id} value={g.id} className="bg-ink">
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className={label}>Slug (leave blank to auto-generate)</span>
        <input className={`${field} tabular`} placeholder="appetizers" {...register("slug")} />
      </div>

      <div>
        <span className={label}>Description</span>
        <textarea rows={2} className={field} {...register("description")} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className={label}>Available from</span>
          <input type="time" className={`${field} tabular`} {...register("available_from")} />
        </div>
        <div>
          <span className={label}>Available to</span>
          <input type="time" className={`${field} tabular`} {...register("available_to")} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-porcelain">
        <input type="checkbox" {...register("is_active")} className="accent-[var(--color-lacquer)]" /> Visible on the menu
      </label>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-card bg-accent px-4 py-2.5 text-sm font-medium text-porcelain outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : editing ? "Save changes" : "Create category"}
        </button>
        <button
          type="button"
          onClick={() => router.push(returnTo)}
          className="rounded-card border border-hairline/30 px-4 py-2.5 text-sm text-muted hover:text-porcelain"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
