"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Chip = { id: string; name: string; slug: string };

/**
 * Sticky, horizontally-scrollable category chips with scrollspy (P2). The active
 * chip syncs to scroll position, taps smooth-scroll to the section, and the active
 * chip auto-centers. Keyboard-operable (real buttons); sticky-anchor offset is
 * handled by `.menu-section { scroll-margin-top }`.
 */
export function CategoryRail({ categories }: { categories: Chip[] }) {
  const [active, setActive] = useState(categories[0]?.slug ?? "");
  const railRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (categories.length === 0) return;
    const sections = categories
      .map((c) => document.getElementById(`cat-${c.slug}`))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const topmost = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (topmost) setActive(topmost.target.id.replace("cat-", ""));
      },
      { rootMargin: "-136px 0px -60% 0px", threshold: 0 },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [categories]);

  useEffect(() => {
    railRef.current
      ?.querySelector<HTMLElement>(`[data-chip="${active}"]`)
      ?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  if (categories.length < 2) return null;

  return (
    <nav
      ref={railRef}
      aria-label="Menu categories"
      className="no-scrollbar mt-2 flex gap-2 overflow-x-auto"
    >
      {categories.map((c) => {
        const isActive = active === c.slug;
        return (
          <button
            key={c.id}
            type="button"
            data-chip={c.slug}
            aria-current={isActive ? "true" : undefined}
            onClick={() => {
              document
                .getElementById(`cat-${c.slug}`)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
              setActive(c.slug);
            }}
            className={cn(
              "tabular shrink-0 rounded-card px-3 py-2 text-xs uppercase tracking-wider outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-accent/70",
              isActive ? "bg-accent text-porcelain" : "text-muted hover:text-porcelain",
            )}
          >
            {c.name}
          </button>
        );
      })}
    </nav>
  );
}
