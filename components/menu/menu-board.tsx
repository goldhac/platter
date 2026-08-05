"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MoneyOpts } from "@/lib/format/currency";
import type { MenuItem } from "@/lib/queries/menu";
import { cn } from "@/lib/utils";
import type { LayoutId } from "@/lib/themes";
import { CategoryRail } from "./category-rail";
import { layoutSpec } from "./layouts";
import { ItemSheet } from "./item-sheet";

const FILTERS: { key: string; label: string; test: (it: MenuItem) => boolean }[] = [
  { key: "vegetarian", label: "Vegetarian", test: (it) => it.dietary_tags.includes("vegetarian") },
  {
    key: "contains_pork",
    label: "Contains pork",
    test: (it) => it.dietary_tags.includes("contains_pork"),
  },
  { key: "seafood", label: "Seafood", test: (it) => it.dietary_tags.includes("seafood") },
  { key: "spicy", label: "Spicy", test: (it) => it.spice_level > 0 },
  { key: "featured", label: "Chef's picks", test: (it) => it.is_featured },
];

/**
 * Owns the interactive menu chrome: the item-detail sheet + shallow routing (P4),
 * plus search (P5) and filters (P6). Rows are server-rendered `<a>` links passed
 * as `children` (fast, no hydration); a delegated click opens the sheet. When a
 * search/filter is active it renders a client-filtered results list instead of
 * the grouped view — those result rows are the same `<a>` links, so the delegation
 * opens their sheet too.
 */
export function MenuBoard({
  itemsBySlug,
  money,
  initialItemSlug,
  railCategories,
  layout,
  basePath = "/menu",
  children,
}: {
  itemsBySlug: Record<string, MenuItem>;
  money: MoneyOpts;
  initialItemSlug: string | null;
  railCategories: { id: string; name: string; slug: string }[];
  layout: LayoutId;
  /** Where this venue lives publicly ("/menu" or "/v/<slug>") — item deep-links hang off it. */
  basePath?: string;
  children: React.ReactNode;
}) {
  const { Item, listClassName } = layoutSpec(layout);
  const [openSlug, setOpenSlug] = useState<string | null>(
    initialItemSlug && itemsBySlug[initialItemSlug] ? initialItemSlug : null,
  );
  const openItem = openSlug ? (itemsBySlug[openSlug] ?? null) : null;

  const open = useCallback(
    (slug: string) => {
      const item = itemsBySlug[slug];
      if (!item) return;
      setOpenSlug(slug);
      window.history.pushState(null, "", `${basePath}/${item.category_slug}/${slug}`);
    },
    [itemsBySlug, basePath],
  );

  const close = useCallback(() => {
    setOpenSlug((current) => {
      if (current) window.history.pushState(null, "", basePath);
      return null;
    });
  }, [basePath]);

  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname;
      // Relative to basePath, the URL is /<category>/<item>; the item is the 2nd segment.
      const rest = path.startsWith(basePath) ? path.slice(basePath.length) : "";
      const seg = rest.split("/").filter(Boolean);
      const slug = seg.length >= 2 ? seg[1] : null;
      setOpenSlug(slug && itemsBySlug[slug] ? slug : null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [itemsBySlug, basePath]);

  const onBoardClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        return;
      }
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-item-slug]");
      if (!el) return;
      const slug = el.dataset.itemSlug;
      if (!slug) return;
      const item = itemsBySlug[slug];
      if (!item) return;
      e.preventDefault();
      if (!item.is_available) return; // sold-out: not tappable (P8)
      open(slug);
    },
    [itemsBySlug, open],
  );

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Set<string>>(new Set());
  const q = query.trim().toLowerCase();
  const searching = q !== "" || filters.size > 0;

  const results = useMemo(() => {
    if (!searching) return [];
    const active = FILTERS.filter((f) => filters.has(f.key));
    return Object.values(itemsBySlug)
      .filter((it) => {
        for (const f of active) if (!f.test(it)) return false;
        if (q) {
          const hay = `${it.name} ${it.description ?? ""} ${it.dietary_tags.join(" ")}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => Number(b.is_available) - Number(a.is_available) || a.name.localeCompare(b.name));
  }, [searching, itemsBySlug, filters, q]);

  return (
    <div onClick={onBoardClick}>
      <div className="sticky top-0 z-20 -mx-5 border-b border-hairline/15 bg-bg/95 px-5 pb-2 pt-2 backdrop-blur">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the menu"
          aria-label="Search the menu"
          className="w-full rounded-card border border-hairline/30 bg-black/20 px-3 py-2.5 text-sm text-text outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        />
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => {
            const on = filters.has(f.key);
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setFilters((s) => {
                    const n = new Set(s);
                    if (n.has(f.key)) n.delete(f.key);
                    else n.add(f.key);
                    return n;
                  })
                }
                className={cn(
                  "tabular shrink-0 rounded-card px-3 py-1.5 text-[0.7rem] uppercase tracking-wider outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
                  on ? "bg-accent text-text" : "border border-hairline/30 text-text-secondary hover:text-text",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        {!searching && <CategoryRail categories={railCategories} />}
      </div>

      {searching ? (
        <div className="pb-28 pt-4">
          <div className="tabular mb-3 flex items-center justify-between text-[0.7rem] uppercase tracking-[0.2em] text-hairline">
            <span>
              {results.length} result{results.length === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilters(new Set());
              }}
              className="tracking-wider text-text-secondary hover:text-text"
            >
              Clear
            </button>
          </div>
          {results.length === 0 ? (
            <p className="text-sm text-text-secondary">
              No dishes match. Try a different search or clear the filters.
            </p>
          ) : (
            <ul className={listClassName}>
              {results.map((item) => (
                <li key={item.id}>
                  <Item item={item} money={money} basePath={basePath} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        children
      )}

      <ItemSheet item={openItem} money={money} onClose={close} />
    </div>
  );
}
