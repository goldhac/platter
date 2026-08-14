// Generic admin content skeleton — shown while a workspace page's data loads.
function Bar({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-white/5 ${className ?? ""}`} aria-hidden="true" />;
}

export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Bar className="h-7 w-48" />
        <Bar className="h-3 w-72" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 rounded-lg border border-white/5 p-4">
            <div className="min-w-0 flex-1 space-y-2">
              <Bar className="h-4 w-40" />
              <Bar className="h-3 w-24" />
            </div>
            <Bar className="h-8 w-8 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
