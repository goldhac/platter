/* eslint-disable @next/next/no-img-element -- brand mark, tiny */
import Link from "next/link";

// Platter v2 marketing chrome (redesign 2026-08) — sticky blur nav + footer, dark oxblood/bone.
// Used by the non-hero marketing pages (/themes, /discover, /pricing). The landing (/) carries
// its own hero-integrated nav.
const SERIF = "var(--font-display)";
const SANS = "var(--font-body)";
const MONO = "var(--font-mono)";

export function MarketingShell({ active, children }: { active?: "discover" | "themes" | "pricing"; children: React.ReactNode }) {
  const link = (href: string, label: string, key: string) => (
    <Link
      href={href}
      style={{ transition: "color 140ms var(--ease-standard)", color: active === key ? "var(--color-text)" : "var(--color-text-secondary)" }}
    >
      {label}
    </Link>
  );

  return (
    <div style={{ overflowX: "hidden", background: "var(--color-bg)", color: "var(--color-text)", fontFamily: SANS, minHeight: "100dvh" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 60, backdropFilter: "blur(20px)", background: "rgba(10,8,7,.62)", borderBottom: "1px solid var(--color-hairline)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 32px", height: 64, display: "flex", alignItems: "center", gap: 32 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, marginRight: "auto" }}>
            <img src="/brand/platter-mark-bone.png" alt="" style={{ height: 26, width: "auto", display: "block" }} />
            <span style={{ fontFamily: SERIF, fontSize: 20, letterSpacing: "-.01em" }}>Platter</span>
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 14 }} className="max-sm:hidden">
            {link("/discover", "Discover", "discover")}
            {link("/themes", "Themes", "themes")}
            {link("/#pricing", "Pricing", "pricing")}
            {link("/admin/login", "Sign in", "signin")}
          </nav>
          <Link
            href="/admin/signup"
            className="inline-flex items-center font-semibold"
            style={{ height: 38, padding: "0 18px", borderRadius: 7, background: "var(--color-accent-hover)", color: "var(--color-on-accent)", fontSize: 13.5 }}
          >
            Get started
          </Link>
        </div>
      </header>

      {children}

      <footer style={{ borderTop: "1px solid var(--color-hairline)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: 32, display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <img src="/brand/platter-mark-bone.png" alt="" style={{ height: 22, width: "auto" }} />
            <span style={{ fontFamily: SERIF, fontSize: 17 }}>Platter</span>
          </Link>
          <div style={{ display: "flex", gap: 22, fontSize: 13.5, color: "var(--color-text-secondary)" }}>
            <Link href="/discover">Discover</Link>
            <Link href="/themes">Themes</Link>
            <Link href="/#pricing">Pricing</Link>
            <Link href="/admin/login">Sign in</Link>
          </div>
          <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "-.02em", color: "var(--color-text-tertiary)" }}>Digital menus for restaurants</span>
        </div>
      </footer>
    </div>
  );
}
