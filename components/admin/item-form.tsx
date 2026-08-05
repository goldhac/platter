"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createItem, updateItem } from "@/lib/mutations/items";
import { setItemModifierGroups } from "@/lib/mutations/modifiers";
import { setItemVariants } from "@/lib/mutations/variants";
import type { EditableItem } from "@/lib/queries/admin-menu";
import { ImageUpload } from "./image-upload";

const DIETARY = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "contains_pork", label: "Contains pork" },
  { value: "seafood", label: "Seafood" },
  { value: "gluten_free", label: "Gluten-free" },
] as const;

type FormValues = {
  category_id: string;
  name: string;
  name_zh: string;
  description: string;
  base_price: string;
  compare_at_price: string;
  spice_level: string;
  dietary_tags: string[];
  allergens_text: string;
  prep_time_minutes: string;
  is_featured: boolean;
  is_available: boolean;
};

const field =
  "w-full rounded-card border border-hairline/30 bg-black/20 px-3 py-2.5 text-sm text-porcelain outline-none focus-visible:ring-2 focus-visible:ring-accent/70";
const label = "mb-1 block text-xs uppercase tracking-wider text-muted";

export function ItemForm({
  categories,
  initial,
  tenantId,
  modifierGroups,
  initialModifierGroupIds,
  menuSlug,
}: {
  categories: { id: string; name: string }[];
  initial?: EditableItem;
  tenantId: string;
  modifierGroups: { id: string; name: string }[];
  initialModifierGroupIds: string[];
  /** Which menu's editor to return to after save/cancel. */
  menuSlug?: string;
}) {
  const router = useRouter();
  const editing = !!initial;
  const returnTo = menuSlug ? `/admin/menu?m=${menuSlug}` : "/admin/menu";
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.image_url ?? null);
  const [variants, setVariants] = useState<{ label: string; price: string }[]>(
    initial?.variants.map((v) => ({ label: v.label, price: String(v.price) })) ?? [],
  );
  const [modGroupIds, setModGroupIds] = useState<string[]>(initialModifierGroupIds);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      category_id: initial?.category_id ?? categories[0]?.id ?? "",
      name: initial?.name ?? "",
      name_zh: initial?.name_zh ?? "",
      description: initial?.description ?? "",
      base_price: initial ? String(initial.base_price) : "",
      compare_at_price: initial?.compare_at_price != null ? String(initial.compare_at_price) : "",
      spice_level: String(initial?.spice_level ?? 0),
      dietary_tags: initial?.dietary_tags ?? [],
      allergens_text: (initial?.allergens ?? []).join(", "),
      prep_time_minutes: initial?.prep_time_minutes != null ? String(initial.prep_time_minutes) : "",
      is_featured: initial?.is_featured ?? false,
      is_available: initial?.is_available ?? true,
    },
  });

  async function onSubmit(v: FormValues) {
    const payload = {
      category_id: v.category_id,
      name: v.name.trim(),
      name_zh: v.name_zh.trim() || undefined,
      description: v.description.trim() || undefined,
      base_price: Number(v.base_price),
      compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : undefined,
      spice_level: Number(v.spice_level),
      dietary_tags: v.dietary_tags,
      allergens: v.allergens_text
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
      prep_time_minutes: v.prep_time_minutes ? Number(v.prep_time_minutes) : undefined,
      is_featured: v.is_featured,
      is_available: v.is_available,
      image_url: imageUrl,
    };

    const res = editing ? await updateItem(initial!.id, payload) : await createItem(payload);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    const itemId = res.id ?? initial?.id;
    if (itemId) {
      const vres = await setItemVariants(
        itemId,
        variants.map((v) => ({ label: v.label, price: Number(v.price) })),
      );
      if (!vres.ok) {
        toast.error(`Item saved, but variants failed: ${vres.error}`);
        return;
      }
      const mres = await setItemModifierGroups(itemId, modGroupIds);
      if (!mres.ok) {
        toast.error(`Item saved, but add-ons failed: ${mres.error}`);
        return;
      }
    }
    toast.success(editing ? "Item saved" : "Item created (draft)");
    router.push(returnTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <span className={label}>Photo</span>
        <ImageUpload tenantId={tenantId} value={imageUrl} onChange={setImageUrl} />
      </div>

      <div>
        <span className={label}>Category</span>
        <select className={field} {...register("category_id", { required: true })}>
          {categories.map((c) => (
            <option key={c.id} value={c.id} className="bg-ink">
              {c.name}
            </option>
          ))}
        </select>
      </div>

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
        <span className={label}>Description</span>
        <textarea rows={3} className={field} {...register("description")} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className={label}>Price (₦)</span>
          <input
            className={`${field} tabular`}
            inputMode="numeric"
            {...register("base_price", { required: true })}
          />
        </div>
        <div>
          <span className={label}>Compare-at (₦)</span>
          <input className={`${field} tabular`} inputMode="numeric" {...register("compare_at_price")} />
        </div>
      </div>

      <div>
        <span className={label}>Portions / variants (optional)</span>
        <p className="mb-2 text-xs text-muted">
          e.g. &ldquo;6 pieces&rdquo; — the card then shows &ldquo;from ₦…&rdquo; (fixes D7).
        </p>
        <div className="space-y-2">
          {variants.map((v, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={field}
                placeholder="Label (e.g. 6 pieces)"
                value={v.label}
                onChange={(e) =>
                  setVariants((arr) => arr.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                }
              />
              <input
                className={`${field} tabular w-28 shrink-0`}
                inputMode="numeric"
                placeholder="₦"
                value={v.price}
                onChange={(e) =>
                  setVariants((arr) => arr.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))
                }
              />
              <button
                type="button"
                onClick={() => setVariants((arr) => arr.filter((_, j) => j !== i))}
                aria-label={`Remove variant ${v.label || i + 1}`}
                className="shrink-0 rounded-card border border-hairline/30 px-3 text-muted hover:text-accent"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setVariants((arr) => [...arr, { label: "", price: "" }])}
          className="mt-2 rounded-card border border-hairline/30 px-3 py-1.5 text-xs text-muted hover:text-porcelain"
        >
          + Add variant
        </button>
      </div>

      {modifierGroups.length > 0 && (
        <div>
          <span className={label}>Add-on groups</span>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {modifierGroups.map((g) => (
              <label key={g.id} className="flex items-center gap-1.5 text-sm text-porcelain">
                <input
                  type="checkbox"
                  checked={modGroupIds.includes(g.id)}
                  onChange={(e) =>
                    setModGroupIds((ids) =>
                      e.target.checked ? [...ids, g.id] : ids.filter((x) => x !== g.id),
                    )
                  }
                  className="accent-[var(--color-lacquer)]"
                />
                {g.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className={label}>Spice level</span>
          <select className={field} {...register("spice_level")}>
            <option value="0" className="bg-ink">
              None
            </option>
            <option value="1" className="bg-ink">
              Mild
            </option>
            <option value="2" className="bg-ink">
              Medium
            </option>
            <option value="3" className="bg-ink">
              Hot
            </option>
          </select>
        </div>
        <div>
          <span className={label}>Prep time (min)</span>
          <input className={`${field} tabular`} inputMode="numeric" {...register("prep_time_minutes")} />
        </div>
      </div>

      <div>
        <span className={label}>Dietary</span>
        <div className="flex flex-wrap gap-3">
          {DIETARY.map((d) => (
            <label key={d.value} className="flex items-center gap-1.5 text-sm text-porcelain">
              <input type="checkbox" value={d.value} {...register("dietary_tags")} className="accent-[var(--color-lacquer)]" />
              {d.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <span className={label}>Allergens (comma-separated)</span>
        <input className={field} placeholder="gluten, soy, egg" {...register("allergens_text")} />
      </div>

      <div className="flex flex-wrap gap-5 pt-1">
        <label className="flex items-center gap-2 text-sm text-porcelain">
          <input type="checkbox" {...register("is_featured")} className="accent-[var(--color-lacquer)]" /> Chef&apos;s pick
        </label>
        <label className="flex items-center gap-2 text-sm text-porcelain">
          <input type="checkbox" {...register("is_available")} className="accent-[var(--color-lacquer)]" /> Available
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-card bg-accent px-4 py-2.5 text-sm font-medium text-porcelain outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : editing ? "Save changes" : "Create item"}
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
