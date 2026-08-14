import Link from "next/link";

// Global 404 — unknown venue, item, or page.
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-5 text-center">
      <p className="tabular text-sm uppercase tracking-[0.3em] text-text-secondary">404</p>
      <h1 className="mt-3 font-display text-2xl text-text">Not found</h1>
      <p className="mt-2 text-sm text-text-secondary">This page or menu doesn&rsquo;t exist.</p>
      <Link
        href="/"
        className="mt-6 rounded-card border border-hairline/40 px-5 py-2.5 text-sm text-text no-underline outline-none hover:border-hairline focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        Go home
      </Link>
    </main>
  );
}
