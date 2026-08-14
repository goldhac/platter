"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MoneyOpts } from "@/lib/format/currency";
import type { MenuItem } from "@/lib/queries/menu";
import { cn } from "@/lib/utils";
import { waLink } from "@/lib/share";
import type { LayoutId } from "@/lib/themes";
import { useAdmin } from "./admin/admin-context";
import { ItemAdminControls } from "./admin/item-controls";
import { CategoryRail } from "./category-rail";
import { layoutSpec } from "./layouts";

// The detail sheet pulls in Radix Dialog (~several KB) but is empty until a diner taps a
// dish — so it's code-split off the critical first-load path and warmed on idle below, so
// the first tap stays instant. Keeps the anon menu bundle under the perf budget (§7 #6).
const ItemSheet = dynamic(() => import("./item-sheet").then((m) => m.ItemSheet), { ssr: false });

/** Best-effort "diner opened this item" ping → powers the Popular shelf + analytics. */
function trackView(itemId: string) {
  try {
    const body = JSON.stringify({ itemId });
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/track", { method: "POST", body, keepalive: true });
    }
  } catch {
    // analytics is best-effort; a failed ping must never disrupt the tap
  }
}

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
  admin = false,
  whatsapp,
  venueName,
  children,
}: {
  itemsBySlug: Record<string, MenuItem>;
  money: MoneyOpts;
  initialItemSlug: string | null;
  railCategories: { id: string; name: string; slug: string }[];
  layout: LayoutId;
  /** Where this venue lives publicly ("/menu" or "/v/<slug>") — item deep-links hang off it. */
  basePath?: string;
  /** True inside a staff session — enables the edit-pencil delegation + search-result pencils. */
  admin?: boolean;
  /** Venue contact for the "can't find it?" nudge on an empty search. */
  whatsapp?: string | null;
  venueName?: string;
  children: React.ReactNode;
}) {
  const { Item, listClassName } = layoutSpec(layout);
  const { openEdit, preview } = useAdmin();
  const [openSlug, setOpenSlug] = useState<string | null>(
    initialItemSlug && itemsBySlug[initialItemSlug] ? initialItemSlug : null,
  );
  const openItem = openSlug ? (itemsBySlug[openSlug] ?? null) : null;
  // Mount the lazy sheet from the first open onward (immediately for a deep-linked item);
  // never for a diner who only browses, so they never download Radix Dialog.
  const [everOpened, setEverOpened] = useState(!!openItem);

  const open = useCallback(
    (slug: string) => {
      const item = itemsBySlug[slug];
      if (!item) return;
      setEverOpened(true);
      setOpenSlug(slug);
      window.history.pushState(null, "", `${basePath}/${item.category_slug}/${slug}`);
      if (!admin) trackView(item.id); // don't inflate a venue's own analytics with staff taps
    },
    [itemsBySlug, basePath, admin],
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
      const valid = slug && itemsBySlug[slug] ? slug : null;
      if (valid) setEverOpened(true);
      setOpenSlug(valid);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [itemsBySlug, basePath]);

  // Warm the code-split sheet chunk once the browser is idle, so a diner's first tap opens
  // instantly even though Radix Dialog isn't on the critical first-load path.
  useEffect(() => {
    const warm = () => void import("./item-sheet");
    const ric = window.requestIdleCallback;
    if (ric) {
      const id = ric(warm);
      return () => window.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(warm, 800);
    return () => window.clearTimeout(id);
  }, []);

  const onBoardClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        return;
      }
      // Admin edit-pencil delegation — same interception pattern as item taps.
      if (admin && !preview) {
        const editEl = (e.target as HTMLElement).closest<HTMLElement>("[data-edit-slug]");
        if (editEl?.dataset.editSlug) {
          e.preventDefault();
          openEdit(editEl.dataset.editSlug);
          return;
        }
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
    [itemsBySlug, open, admin, preview, openEdit],
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
            <div className="rounded-card border border-hairline/20 px-4 py-6 text-center">
              <p className="text-sm text-text-secondary">
                No dishes match {q ? <span className="text-text">“{query.trim()}”</span> : "those filters"}.
              </p>
              {(() => {
                const href = q
                  ? waLink(whatsapp, `Hi${venueName ? ` ${venueName}` : ""}, do you have “${query.trim()}”?`)
                  : null;
                return href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-card bg-accent px-4 py-2 text-xs font-semibold text-on-accent outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/70"
                  >
                    Ask us on WhatsApp
                  </a>
                ) : (
                  <p className="mt-1 text-xs text-hairline">Try a different search or clear the filters.</p>
                );
              })()}
            </div>
          ) : (
            <ul className={listClassName}>
              {results.map((item) => (
                <li
                  key={item.id}
                  className={admin ? "group relative" : undefined}
                  data-draft-item={admin && item.status !== "published" ? "" : undefined}
                >
                  <Item item={item} money={money} basePath={basePath} />
                  {admin && <ItemAdminControls item={item} />}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        children
      )}

      {everOpened && <ItemSheet item={openItem} money={money} onClose={close} />}
    </div>
  );
}
