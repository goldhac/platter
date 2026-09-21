"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const DEFAULT_LINKS: [string, string][] = [
  ["/discover", "Discover"],
  ["/themes", "Themes"],
  ["/#pricing", "Pricing"],
  ["/admin/login", "Sign in"],
];

/** Mobile-only marketing nav: a hamburger that opens a full-screen sheet.
 * Below 640px the desktop nav is hidden, so without this there is no nav at all.
 * Each surface passes its own `links` (the landing uses in-page anchors). */
export function MobileNav({ links = DEFAULT_LINKS }: { links?: [string, string][] }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheetRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <div className="sm:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="mkt-mobile-nav"
        aria-label="Menu"
        onClick={() => setOpen((v) => !v)}
        className="grid h-11 w-11 place-items-center outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        <span className="relative block h-[13px] w-[22px]">
          <span
            className={cn(
              "absolute left-0 h-[1.5px] w-full bg-text transition-transform duration-200",
              open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0",
            )}
          />
          <span
            className={cn(
              "absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 bg-text transition-opacity duration-200",
              open && "opacity-0",
            )}
          />
          <span
            className={cn(
              "absolute left-0 h-[1.5px] w-full bg-text transition-transform duration-200",
              open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0",
            )}
          />
        </span>
      </button>

      {open &&
        createPortal(
        <div id="mkt-mobile-nav" role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-[70]">
          <div
            ref={sheetRef}
            tabIndex={-1}
            className="absolute inset-0 flex flex-col outline-none"
            style={{
              backgroundColor: "var(--color-bg)",
              backgroundImage: "radial-gradient(120% 55% at 88% 0%, rgba(141,32,32,.18), transparent 60%)",
            }}
          >
            <div className="flex h-16 items-center justify-between px-5">
              <span className="font-display text-xl text-text">Platter</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="grid h-11 w-11 place-items-center text-text outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                ✕
              </button>
            </div>
            <nav className="flex flex-col px-5">
              {links.map(([href, label], i) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between border-b border-hairline py-5 font-display text-[30px] text-text outline-none focus-visible:text-accent-text"
                >
                  <span>{label}</span>
                  <span className="font-mono text-xs text-hairline-strong">{String(i + 1).padStart(2, "0")}</span>
                </Link>
              ))}
            </nav>
            <div className="mt-auto p-5 pb-[calc(20px+env(safe-area-inset-bottom))]">
              <Link
                href="/admin/signup"
                onClick={() => setOpen(false)}
                className="flex h-[54px] items-center justify-center rounded-sm bg-accent-hover font-semibold uppercase tracking-[0.08em] text-on-accent outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                Start free
              </Link>
              <p className="mt-3 text-center text-xs text-text-tertiary">Free plan, no card needed.</p>
            </div>
          </div>
        </div>,
          document.body,
        )}
    </div>
  );
}
