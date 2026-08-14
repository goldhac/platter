"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAdmin } from "./admin-context";

const btn =
  "tabular shrink-0 rounded-card px-2.5 py-1.5 text-xs font-medium no-underline outline-none focus-visible:ring-2 focus-visible:ring-accent/70";

/** Fixed bottom toolbar shown only inside a staff session (the front-of-house admin layer).
 * Bottom-anchored so it never fights the menu's sticky search header + is thumb-reachable. */
export function AdminBar() {
  const { admin, preview, setPreview } = useAdmin();
  if (!admin) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline/30 bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center gap-1.5 px-3 py-2">
        <span className="tabular mr-0.5 hidden shrink-0 text-[0.62rem] uppercase tracking-wider text-text-secondary sm:inline">
          Admin
        </span>
        {preview ? (
          <button
            type="button"
            onClick={() => setPreview(false)}
            className={cn(btn, "ml-auto bg-accent text-bg")}
          >
            ← Exit customer preview
          </button>
        ) : (
          <>
            <Link href={admin.addItemHref} className={cn(btn, "bg-accent text-bg")}>
              + Add item
            </Link>
            <Link href={admin.editMenuHref} className={cn(btn, "border border-hairline/40 text-text")}>
              Edit menu
            </Link>
            <Link
              href={admin.dashboardHref}
              className={cn(btn, "hidden border border-hairline/40 text-text xs:inline sm:inline")}
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => setPreview(true)}
              className={cn(btn, "ml-auto border border-hairline/40 text-text-secondary hover:text-text")}
            >
              Preview
            </button>
          </>
        )}
      </div>
    </div>
  );
}
