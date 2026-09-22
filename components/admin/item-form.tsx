"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { type FieldErrors, useForm } from "react-hook-form";
import { toast } from "sonner";
import { createItem, updateItem } from "@/lib/mutations/items";
import { setItemModifierGroups } from "@/lib/mutations/modifiers";
import { setItemVariants } from "@/lib/mutations/variants";
import type { EditableItem } from "@/lib/queries/admin-menu";
import { cn } from "@/lib/utils";
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

type TabId = "basics" | "price" | "detail" | "status";

const TABS: { id: TabId; label: string }[] = [
  { id: "basics", label: "Basics" },
  { id: "price", label: "Price" },
  { id: "detail", label: "Detail" },
  { id: "status", label: "Status" },
];

// Which RHF fields live under each tab — drives the first-error jump + the tab error dot.
// (Photo, variants, and add-on groups are local state, not RHF, so they never fail validation.)
const TAB_FIELDS: Record<TabId, (keyof FormValues)[]> = {
  basics: ["category_id", "name", "name_zh", "description"],
  price: ["base_price", "compare_at_price"],
  detail: ["spice_level", "prep_time_minutes", "dietary_tags", "allergens_text"],
  status: ["is_featured", "is_available"],
};

const field =
  "w-full rounded-sm border border-hairline bg-surface-sunken px-3.5 py-2.5 text-sm text-text outline-none placeholder:text-text-tertiary focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40";
const label = "mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary";
const check = "accent-[var(--color-accent)]";

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
  const [tab, setTab] = useState<TabId>("basics");

  const {
    register,
    handleSubmit,
    watch,
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

  const tabHasError = (t: TabId) => TAB_FIELDS[t].some((f) => errors[f]);

  // On a blocked submit, jump to the first tab (in order) that holds an invalid field, so the
  // error the user can't see isn't a dead end — RHF validates every registered field regardless
  // of which panel is showing.
  function onInvalid(errs: FieldErrors<FormValues>) {
    const bad = TABS.find((t) => TAB_FIELDS[t.id].some((f) => errs[f]));
    if (bad) setTab(bad.id);
  }

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
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="max-w-2xl">
      {/* Chip-tabs — one section at a time; all fields stay mounted so switching never drops input. */}
      <div
        role="tablist"
        aria-label="Item details"
        className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          const bad = tabHasError(t.id);
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`itemtab-${t.id}`}
              aria-selected={active}
              aria-controls={`itempanel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-sm px-3.5 font-mono text-[11px] uppercase tracking-[0.14em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/50",
                active
                  ? "bg-accent text-on-accent"
                  : "border border-hairline text-text-secondary hover:border-hairline-strong hover:text-text",
              )}
            >
              {t.label}
              {bad && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-danger" />}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {/* ── Basics ── */}
        <div
          role="tabpanel"
          id="itempanel-basics"
          aria-labelledby="itemtab-basics"
          hidden={tab !== "basics"}
          className="space-y-4"
        >
          <div>
            <span className={label}>Photo</span>
            <ImageUpload
              tenantId={tenantId}
              value={imageUrl}
              onChange={setImageUrl}
              promptName={watch("name")}
              promptDesc={watch("description")}
            />
          </div>
          <div>
            <span className={label}>Category</span>
            <select className={field} {...register("category_id", { required: true })}>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-surface">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className={label}>Name</span>
            <input className={field} {...register("name", { required: true })} />
            {errors.name && <p className="mt-1 text-xs text-danger-on-soft">Name is required</p>}
          </div>
          <div>
            <span className={label}>Name (中文)</span>
            <input className={`${field} font-cjk`} {...register("name_zh")} />
          </div>
          <div>
            <span className={label}>Description</span>
            <textarea rows={3} className={field} {...register("description")} />
          </div>
        </div>

        {/* ── Price ── */}
        <div
          role="tabpanel"
          id="itempanel-price"
          aria-labelledby="itemtab-price"
          hidden={tab !== "price"}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <span className={label}>Price (₦)</span>
              <input
                className={`${field} font-mono`}
                inputMode="numeric"
                {...register("base_price", { required: true })}
              />
              {errors.base_price && <p className="mt-1 text-xs text-danger-on-soft">Price is required</p>}
            </div>
            <div>
              <span className={label}>Compare-at (₦)</span>
              <input className={`${field} font-mono`} inputMode="numeric" {...register("compare_at_price")} />
            </div>
          </div>
          <div>
            <span className={label}>Portions / variants (optional)</span>
            <p className="mb-2 text-xs text-text-secondary">
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
                    className={`${field} w-28 shrink-0 font-mono`}
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
                    className="shrink-0 rounded-sm border border-hairline px-3 text-text-secondary hover:text-danger-on-soft"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setVariants((arr) => [...arr, { label: "", price: "" }])}
              className="mt-2 rounded-sm border border-hairline px-3 py-1.5 text-xs text-text-secondary hover:border-hairline-strong hover:text-text"
            >
              + Add variant
            </button>
          </div>
        </div>

        {/* ── Detail ── */}
        <div
          role="tabpanel"
          id="itempanel-detail"
          aria-labelledby="itemtab-detail"
          hidden={tab !== "detail"}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <span className={label}>Spice level</span>
              <select className={field} {...register("spice_level")}>
                <option value="0" className="bg-surface">None</option>
                <option value="1" className="bg-surface">Mild</option>
                <option value="2" className="bg-surface">Medium</option>
                <option value="3" className="bg-surface">Hot</option>
              </select>
            </div>
            <div>
              <span className={label}>Prep time (min)</span>
              <input className={`${field} font-mono`} inputMode="numeric" {...register("prep_time_minutes")} />
            </div>
          </div>
          <div>
            <span className={label}>Dietary</span>
            <div className="flex flex-wrap gap-3">
              {DIETARY.map((d) => (
                <label key={d.value} className="flex items-center gap-1.5 text-sm text-text">
                  <input type="checkbox" value={d.value} {...register("dietary_tags")} className={check} />
                  {d.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <span className={label}>Allergens (comma-separated)</span>
            <input className={field} placeholder="gluten, soy, egg" {...register("allergens_text")} />
          </div>
          {modifierGroups.length > 0 && (
            <div>
              <span className={label}>Add-on groups</span>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {modifierGroups.map((g) => (
                  <label key={g.id} className="flex items-center gap-1.5 text-sm text-text">
                    <input
                      type="checkbox"
                      checked={modGroupIds.includes(g.id)}
                      onChange={(e) =>
                        setModGroupIds((ids) => (e.target.checked ? [...ids, g.id] : ids.filter((x) => x !== g.id)))
                      }
                      className={check}
                    />
                    {g.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Status ── */}
        <div
          role="tabpanel"
          id="itempanel-status"
          aria-labelledby="itemtab-status"
          hidden={tab !== "status"}
          className="space-y-4"
        >
          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm text-text">
              <input type="checkbox" {...register("is_featured")} className={check} /> Chef&apos;s pick
            </label>
            <label className="flex items-center gap-2 text-sm text-text">
              <input type="checkbox" {...register("is_available")} className={check} /> Available
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-sm bg-accent px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.08em] text-on-accent outline-none transition-colors hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : editing ? "Save changes" : "Create item"}
        </button>
        <button
          type="button"
          onClick={() => router.push(returnTo)}
          className="rounded-sm border border-hairline px-5 py-2.5 text-sm text-text-secondary outline-none transition-colors hover:border-hairline-strong hover:text-text focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
