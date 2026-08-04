"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { formatMoney, type MoneyOpts } from "@/lib/format/currency";
import {
  bulkAdjustPrice,
  bulkDelete,
  bulkMoveCategory,
  bulkSetAvailable,
  bulkSetStatus,
} from "@/lib/mutations/bulk";
import {
  duplicateItem,
  reorderItem,
  restoreItem,
  setItemStatus,
  softDeleteItem,
} from "@/lib/mutations/items";
import type { AdminCategory, AdminItem, AdminTree } from "@/lib/queries/admin-menu";
import { cn } from "@/lib/utils";
import { SoldOutToggle } from "./sold-out-toggle";

type Selection = { selected: Set<string>; toggle: (id: string) => void };
const SelectionCtx = createContext<Selection | null>(null);

export function MenuTree({ tree, money }: { tree: AdminTree; money: MoneyOpts }) {
  const [filter, setFilter] = useState("");
  const q = filter.trim().toLowerCase();

  const sections = [
    ...tree.groups.map((g) => ({ id: g.id, label: g.name, categories: g.categories })),
    ...(tree.ungrouped.length
      ? [{ id: "ungrouped", label: "Ungrouped", categories: tree.ungrouped }]
      : []),
  ];

  // Local item order per category, re-synced whenever the server tree changes.
  const [itemsByCat, setItemsByCat] = useState<Record<string, AdminItem[]>>({});
  useEffect(() => {
    const m: Record<string, AdminItem[]> = {};
    for (const s of sections) for (const c of s.categories) m[c.id] = c.items;
    setItemsByCat(m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = useCallback((id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);
  const categoryOptions = useMemo(() => {
    const opts: { id: string; name: string }[] = [];
    for (const s of sections) for (const c of s.categories) opts.push({ id: c.id, name: c.name });
    return opts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree]);

  return (
    <SelectionCtx.Provider value={{ selected, toggle }}>
      <div className={selected.size > 0 ? "pb-24" : undefined}>
        <div className="flex items-center gap-2 pb-4">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter items…"
          aria-label="Filter items"
          className="w-full rounded-card border border-hairline/30 bg-black/20 px-3 py-2 text-sm text-porcelain outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        />
        <Link
          href="/admin/categories"
          className="tabular shrink-0 rounded-card border border-hairline/30 px-3 py-2 text-xs uppercase tracking-wider text-muted hover:text-porcelain"
        >
          Categories
        </Link>
        <Link
          href="/admin/items/new"
          className="tabular shrink-0 rounded-card bg-accent px-3 py-2 text-xs uppercase tracking-wider text-porcelain"
        >
          + Item
        </Link>
      </div>

      {tree.totalItems === 0 && (
        <p className="rounded-card border border-hairline/20 p-4 text-sm text-muted">
          No items yet. Use <span className="text-porcelain">+ Item</span> to add the first one.
        </p>
      )}

      {sections.map((section) => {
        const count = section.categories.reduce((n, c) => n + c.items.length, 0);
        return (
          <details key={section.id} open className="mt-4">
            <summary className="flex cursor-pointer list-none items-center justify-between border-b border-hairline/15 py-2">
              <span className="font-display text-base text-porcelain">{section.label}</span>
              <span className="tabular text-[0.7rem] text-muted">{count}</span>
            </summary>
            {section.categories.map((cat) => (
              <CategoryBlock
                key={cat.id}
                cat={cat}
                items={itemsByCat[cat.id] ?? cat.items}
                money={money}
                q={q}
                onReorder={(next) => setItemsByCat((m) => ({ ...m, [cat.id]: next }))}
              />
            ))}
          </details>
        );
      })}
      </div>
      {selected.size > 0 && (
        <BulkBar
          ids={[...selected]}
          categories={categoryOptions}
          onDone={() => setSelected(new Set())}
        />
      )}
    </SelectionCtx.Provider>
  );
}

function CategoryBlock({
  cat,
  items,
  money,
  q,
  onReorder,
}: {
  cat: AdminCategory;
  items: AdminItem[];
  money: MoneyOpts;
  q: string;
  onReorder: (next: AdminItem[]) => void;
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const filtered = q
    ? items.filter((it) => it.name.toLowerCase().includes(q) || cat.name.toLowerCase().includes(q))
    : items;
  if (q && filtered.length === 0) return null;

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    const prev = reordered[newIndex - 1];
    const next = reordered[newIndex + 1];
    const newSort = !prev
      ? (next?.sort_order ?? 1000) - 1000
      : !next
        ? prev.sort_order + 1000
        : (prev.sort_order + next.sort_order) / 2;

    onReorder(reordered.map((it, idx) => (idx === newIndex ? { ...it, sort_order: newSort } : it)));
    const movedId = String(active.id);
    start(async () => {
      const res = await reorderItem(movedId, newSort);
      if (!res.ok) {
        toast.error(res.error);
        router.refresh();
      }
    });
  }

  return (
    <details open className="pl-1">
      <summary className="flex cursor-pointer list-none items-center justify-between py-2">
        <span className="tabular text-[0.72rem] uppercase tracking-[0.18em] text-brass">{cat.name}</span>
        <span className="tabular text-[0.7rem] text-muted">{filtered.length}</span>
      </summary>

      {q ? (
        <ul className="divide-y divide-hairline/10">
          {filtered.map((item) => (
            <PlainItemRow key={item.id} item={item} money={money} />
          ))}
        </ul>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="divide-y divide-hairline/10">
              {items.map((item) => (
                <SortableItemRow key={item.id} item={item} money={money} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </details>
  );
}

function SortableItemRow({ item, money }: { item: AdminItem; money: MoneyOpts }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 py-2.5",
        isDragging && "rounded-card bg-porcelain/5 opacity-80",
      )}
    >
      <button
        type="button"
        aria-label={`Reorder ${item.name}`}
        className="cursor-grab touch-none px-1 text-muted hover:text-porcelain"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <ItemBody item={item} money={money} />
    </li>
  );
}

function PlainItemRow({ item, money }: { item: AdminItem; money: MoneyOpts }) {
  return (
    <li className="flex items-center gap-2 py-2.5">
      <ItemBody item={item} money={money} />
    </li>
  );
}

function ItemBody({ item, money }: { item: AdminItem; money: MoneyOpts }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const published = item.status === "published";
  const selection = useContext(SelectionCtx);

  function togglePublish() {
    start(async () => {
      const res = await setItemStatus(item.id, published ? "draft" : "published");
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(published ? `${item.name} moved to draft` : `${item.name} published`);
      router.refresh();
    });
  }

  function dup() {
    start(async () => {
      const res = await duplicateItem(item.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Duplicated ${item.name}`);
      router.refresh();
    });
  }

  function del() {
    start(async () => {
      const res = await softDeleteItem(item.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.refresh();
      toast(`${item.name} deleted`, {
        action: {
          label: "Undo",
          onClick: () =>
            start(async () => {
              await restoreItem(item.id);
              router.refresh();
            }),
        },
      });
    });
  }

  return (
    <>
      {selection && (
        <input
          type="checkbox"
          checked={selection.selected.has(item.id)}
          onChange={() => selection.toggle(item.id)}
          aria-label={`Select ${item.name}`}
          className="accent-[var(--color-lacquer)]"
        />
      )}
      <div className={cn("min-w-0 flex-1", pending && "opacity-60")}>
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm text-porcelain">{item.name}</span>
          {item.is_featured && <span className="text-[0.65rem] text-accent">厨</span>}
        </div>
        <span className="tabular text-xs text-muted">{formatMoney(item.base_price, money)}</span>
      </div>

      <button
        type="button"
        onClick={togglePublish}
        disabled={pending}
        aria-label={published ? "Published — tap to unpublish" : "Draft — tap to publish"}
        className={cn(
          "tabular rounded-full px-2 py-0.5 text-[0.6rem] uppercase tracking-wider outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
          published ? "bg-positive/20 text-positive" : "bg-hairline/15 text-muted",
        )}
      >
        {published ? "Live" : "Draft"}
      </button>

      <SoldOutToggle itemId={item.id} itemName={item.name} available={item.is_available} />

      <Link
        href={`/admin/items/${item.id}`}
        className="tabular text-[0.65rem] uppercase tracking-wider text-muted hover:text-porcelain"
      >
        Edit
      </Link>
      <button
        type="button"
        onClick={dup}
        disabled={pending}
        className="tabular text-[0.65rem] uppercase tracking-wider text-muted hover:text-porcelain"
      >
        Dup
      </button>
      <button
        type="button"
        onClick={del}
        disabled={pending}
        className="tabular text-[0.65rem] uppercase tracking-wider text-muted hover:text-accent"
      >
        Del
      </button>
    </>
  );
}

function BulkBar({
  ids,
  categories,
  onDone,
}: {
  ids: string[];
  categories: { id: string; name: string }[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [priceMode, setPriceMode] = useState<"percent" | "flat">("percent");
  const [priceValue, setPriceValue] = useState("");

  function run(
    fn: () => Promise<{ ok: boolean; error?: string; count?: number }>,
    verb: string,
  ) {
    start(async () => {
      const res = await fn();
      if (!res.ok) {
        toast.error(res.error ?? "Failed");
        return;
      }
      const n = res.count ?? ids.length;
      toast.success(`${verb} ${n} item${n === 1 ? "" : "s"}`);
      router.refresh();
      onDone();
    });
  }

  const btn =
    "rounded-card border border-hairline/30 px-2.5 py-1.5 text-muted outline-none hover:text-porcelain disabled:opacity-50";

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline/25 bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 px-5 py-3 text-xs">
        <span className="tabular mr-1 text-porcelain">{ids.length} selected</span>
        <button type="button" disabled={pending} onClick={() => run(() => bulkSetAvailable(ids, false), "Marked sold out")} className={btn}>
          Sold out
        </button>
        <button type="button" disabled={pending} onClick={() => run(() => bulkSetAvailable(ids, true), "Marked available")} className={btn}>
          Available
        </button>
        <button type="button" disabled={pending} onClick={() => run(() => bulkSetStatus(ids, "published"), "Published")} className={btn}>
          Publish
        </button>
        <button type="button" disabled={pending} onClick={() => run(() => bulkSetStatus(ids, "draft"), "Moved to draft")} className={btn}>
          Draft
        </button>

        <select
          disabled={pending}
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value;
            e.target.value = "";
            if (v) run(() => bulkMoveCategory(ids, v), "Moved");
          }}
          className="rounded-card border border-hairline/30 bg-black/20 px-2 py-1.5 text-muted"
        >
          <option value="" className="bg-ink">Move to…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id} className="bg-ink">{c.name}</option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <select
            value={priceMode}
            onChange={(e) => setPriceMode(e.target.value as "percent" | "flat")}
            className="rounded-card border border-hairline/30 bg-black/20 px-1.5 py-1.5 text-muted"
          >
            <option value="percent" className="bg-ink">%</option>
            <option value="flat" className="bg-ink">₦</option>
          </select>
          <input
            value={priceValue}
            onChange={(e) => setPriceValue(e.target.value)}
            inputMode="numeric"
            placeholder="±"
            aria-label="Price adjustment"
            className="tabular w-16 rounded-card border border-hairline/30 bg-black/20 px-2 py-1.5 text-porcelain"
          />
          <button
            type="button"
            disabled={pending || priceValue.trim() === ""}
            onClick={() => run(() => bulkAdjustPrice(ids, priceMode, Number(priceValue)), "Repriced")}
            className={btn}
          >
            Apply
          </button>
        </div>

        <button type="button" disabled={pending} onClick={() => run(() => bulkDelete(ids), "Deleted")} className={cn(btn, "hover:text-accent")}>
          Delete
        </button>
        <button type="button" onClick={onDone} className="ml-auto rounded-card px-2.5 py-1.5 text-muted hover:text-porcelain">
          Clear
        </button>
      </div>
    </div>
  );
}
