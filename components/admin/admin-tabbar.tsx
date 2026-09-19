"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { OCTAGON } from "@/components/menu/seal-mark";
import { createClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

// Five tabs; the daily-driver routes get their own tab, the rest live in More (§3.2).
const TABS = [
  { href: "/admin", label: "Home" },
  { href: "/admin/menu", label: "Editor" },
  { href: "/admin/analytics", label: "Insights" },
  { href: "/admin/qr", label: "QR" },
];
const GROUPS: { title: string; links: [string, string][] }[] = [
  { title: "Build", links: [["/admin/categories", "Categories"], ["/admin/modifiers", "Add-ons"], ["/admin/theme", "Theme"]] },
  { title: "Reach", links: [["/admin/menus", "Menus"], ["/admin/domains", "Public address"]] },
  {
    title: "Manage",
    links: [
      ["/admin/team", "Team"],
      ["/admin/import", "Data and export"],
      ["/admin/settings", "Settings"],
      ["/admin/billing", "Plan and billing"],
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Mobile-only bottom tab bar + a full-height "More" sheet for the remaining sections. */
export function AdminTabBar({ who, role, venue }: { who: string; role: string; venue: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // A navigation closes the sheet.
  useEffect(() => setOpen(false), [pathname]);

  // While open: Esc closes, body scroll locks, focus moves in and returns to the trigger.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheetRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      triggerRef.current?.focus();
    };
  }, [open]);

  const moreActive =
    open || isActive(pathname, "/admin/menus") || GROUPS.some((g) => g.links.some(([h]) => isActive(pathname, h)));

  const pip = (on: boolean) => (
    <span className={cn("h-[9px] w-[9px]", on ? "bg-accent" : "bg-text/20")} style={{ clipPath: OCTAGON }} />
  );

  return (
    <div className="md:hidden">
      <nav
        aria-label="Manager"
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-hairline bg-surface-sunken/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg"
      >
        {TABS.map((t) => {
          const a = isActive(pathname, t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={a ? "page" : undefined}
              className="flex h-14 flex-1 flex-col items-center justify-center gap-1.5 outline-none focus-visible:bg-text/[0.06]"
            >
              {pip(a)}
              <span
                className={cn(
                  "font-body text-[10.5px] font-semibold uppercase tracking-[0.1em]",
                  a ? "text-text" : "text-text-tertiary",
                )}
              >
                {t.label}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          ref={triggerRef}
          aria-expanded={open}
          aria-controls="admin-more-sheet"
          onClick={() => setOpen((v) => !v)}
          className="flex h-14 flex-1 flex-col items-center justify-center gap-1.5 outline-none focus-visible:bg-text/[0.06]"
        >
          {pip(moreActive)}
          <span
            className={cn(
              "font-body text-[10.5px] font-semibold uppercase tracking-[0.1em]",
              moreActive ? "text-text" : "text-text-tertiary",
            )}
          >
            More
          </span>
        </button>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" id="admin-more-sheet" aria-label="More sections">
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-overlay" />
          <div
            ref={sheetRef}
            tabIndex={-1}
            className="absolute inset-x-0 bottom-0 top-[34px] flex flex-col overflow-hidden rounded-t-[18px] border-t border-hairline bg-surface shadow-e3 outline-none"
          >
            <div className="flex items-center gap-3 border-b border-hairline px-5 py-4">
              <span
                className="grid h-10 w-10 flex-none place-items-center bg-accent font-display text-base text-on-accent"
                style={{ clipPath: OCTAGON }}
              >
                {(who || "?").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-text">{who}</div>
                <div className="truncate font-mono text-[9px] uppercase tracking-[0.16em] text-hairline-strong">
                  <span className="capitalize">{role}</span> · {venue}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-11 w-11 flex-none place-items-center rounded-sm text-text-secondary outline-none hover:text-text focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {GROUPS.map((g) => (
                <div key={g.title} className="mb-5 last:mb-0">
                  <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.18em] text-hairline-strong">{g.title}</div>
                  <div className="flex flex-col">
                    {g.links.map(([href, label]) => (
                      <Link
                        key={href}
                        href={href}
                        className="flex h-[54px] items-center border-b border-hairline text-[15px] text-text outline-none last:border-0 focus-visible:text-accent-text"
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-hairline bg-bg px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4">
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await createClient().auth.signOut();
                  router.push("/admin/login");
                  router.refresh();
                }}
                className="h-[50px] w-full rounded-sm border border-accent text-[13px] font-semibold uppercase tracking-[0.13em] text-accent-text outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50"
              >
                {busy ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
