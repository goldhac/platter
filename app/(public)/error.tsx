"use client";

// Graceful error boundary for the public menu — replaces the raw framework error screen.
export default function MenuError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-hairline/40 text-text-secondary">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      </div>
      <h1 className="mt-4 font-display text-xl text-text">Something went off</h1>
      <p className="mt-2 text-sm text-text-secondary">The menu couldn&rsquo;t load. Give it another go.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-card bg-accent px-5 py-2.5 text-sm font-semibold text-bg outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        Reload
      </button>
    </main>
  );
}
