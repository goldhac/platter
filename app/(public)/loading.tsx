// Instant menu skeleton shown while getMenu runs — so navigating to a menu never
// feels frozen. Neutral base-theme tokens; the real themed menu swaps in on load.

function Bar({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-card bg-hairline/15 ${className ?? ""}`} aria-hidden="true" />;
}

export default function MenuLoading() {
  return (
    <main className="mx-auto max-w-xl px-5 pt-8" aria-busy="true" aria-label="Loading menu">
      <Bar className="h-4 w-14" />
      <Bar className="mt-3 h-9 w-56" />
      <Bar className="mt-3 h-3 w-28" />

      <div className="mt-5 flex gap-2">
        <Bar className="h-9 w-20" />
        <Bar className="h-9 w-20" />
      </div>

      <Bar className="mt-4 h-11 w-full" />
      <div className="no-scrollbar mt-3 flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <Bar key={i} className="h-7 w-24 shrink-0" />
        ))}
      </div>

      <div className="mt-8 space-y-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <Bar className="h-4 w-40" />
              <Bar className="h-3 w-full max-w-[15rem]" />
              <Bar className="h-3 w-16" />
            </div>
            <Bar className="h-[72px] w-[72px] shrink-0" />
          </div>
        ))}
      </div>
    </main>
  );
}
