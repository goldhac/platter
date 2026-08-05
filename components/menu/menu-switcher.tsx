import Link from "next/link";
import type { MenuSummary } from "@/lib/queries/menu";
import { cn } from "@/lib/utils";

/**
 * The public menu switcher (PB1/PB2). A segmented control over the venue's live menus; each
 * menu can carry its own theme, so switching re-themes the whole page (e.g. Dinner=Lacquer ↔
 * Bar=Carafe). Hidden entirely when the venue has one menu — never a switcher with one option.
 * Server-rendered `<a>` links so it works without JS; navigating refetches the selected menu.
 */
export function MenuSwitcher({ menus, activeSlug }: { menus: MenuSummary[]; activeSlug: string }) {
  if (menus.length <= 1) return null;

  return (
    <nav aria-label="Menus" className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 pt-3">
      {menus.map((m) => {
        const on = m.slug === activeSlug;
        return (
          <Link
            key={m.id}
            href={`/menu?m=${m.slug}`}
            aria-current={on ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-card px-3.5 py-1.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/70",
              on
                ? "bg-accent text-on-accent"
                : "border border-hairline/30 text-text-secondary hover:text-text",
            )}
          >
            {m.name}
            {m.name_zh && <span className="ml-1.5 font-cjk text-xs opacity-80">{m.name_zh}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
