"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type AdminNavItem = { href: string; label: string; count?: number };

/** A section is active on exact match, or when the path is nested under it —
 * except Dashboard ("/admin"), which is exact so it doesn't own every child route. */
function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The desktop sidebar nav (pattern 01: one fixed order, text-only, no icons). */
export function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Manager sections" className="flex flex-col gap-0.5 px-2">
      {items.map((it) => {
        const active = isActive(pathname, it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center justify-between gap-2.5 rounded-sm border px-3 py-2.5 font-body text-[11px] font-semibold uppercase tracking-[0.13em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/60",
              active
                ? "border-accent/50 bg-accent-soft text-text"
                : "border-transparent text-text-secondary hover:bg-text/[0.04] hover:text-text",
            )}
          >
            <span>{it.label}</span>
            {it.count != null && (
              <span className="font-mono text-[10px] font-normal tracking-normal text-text-tertiary">{it.count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
