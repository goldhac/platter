"use client";

import { useState } from "react";

// Share + Print icon buttons for the v2 menu header. The public menu has no Toaster, so the
// "copied" feedback is a transient local swap to a check glyph.
export function MenuActions({
  shareUrl,
  shareTitle,
  printHref,
}: {
  shareUrl: string;
  shareTitle: string;
  printHref: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    if (nav && typeof nav.share === "function") {
      try {
        await nav.share({ title: shareTitle, url: shareUrl });
        return;
      } catch {
        /* cancelled — fall through to copy */
      }
    }
    try {
      await nav?.clipboard?.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* no clipboard */
    }
  }

  const btn =
    "grid h-[38px] w-[38px] place-items-center rounded-sm border border-hairline bg-transparent text-text-secondary outline-none transition-colors hover:text-text hover:border-hairline-strong focus-visible:ring-2 focus-visible:ring-hairline-strong/70";

  return (
    <span className="flex gap-2">
      <button type="button" onClick={share} aria-label={copied ? "Link copied" : "Share"} className={btn}>
        {copied ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" />
            <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
          </svg>
        )}
      </button>
      <a href={printHref} target="_blank" rel="noopener" aria-label="Print menu" className={btn}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="6 9 6 3 18 3 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="7" />
        </svg>
      </a>
    </span>
  );
}
