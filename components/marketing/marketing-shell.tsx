import Link from "next/link";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-ink text-porcelain">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-display text-xl text-porcelain outline-none hover:text-brass">
          Platter
        </Link>
        <nav className="flex items-center gap-3 text-sm sm:gap-5">
          <Link href="/themes" className="hidden text-muted hover:text-porcelain sm:inline">
            Themes
          </Link>
          <Link href="/pricing" className="text-muted hover:text-porcelain">
            Pricing
          </Link>
          <Link href="/admin/login" className="text-muted hover:text-porcelain">
            Sign in
          </Link>
          <Link
            href="/admin/signup"
            className="rounded-card bg-accent px-3 py-1.5 text-porcelain outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            Get started
          </Link>
        </nav>
      </header>

      {children}

      <footer className="border-t border-hairline/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-xs text-muted">
          <Link href="/" className="font-display text-sm text-porcelain hover:text-brass">
            Platter
          </Link>
          <div className="flex gap-4">
            <Link href="/themes" className="hover:text-porcelain">Themes</Link>
            <Link href="/pricing" className="hover:text-porcelain">Pricing</Link>
            <Link href="/admin/login" className="hover:text-porcelain">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
