import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { getCurrentStaff } from "@/lib/rbac";

const NAV = [
  { href: "/admin/menus", label: "Menus" },
  { href: "/admin/menu", label: "Editor" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/modifiers", label: "Add-ons" },
  { href: "/admin/theme", label: "Theme" },
  { href: "/admin/qr", label: "QR" },
  { href: "/admin/domains", label: "Address" },
  { href: "/admin/import", label: "Data" },
  { href: "/admin/settings", label: "Settings" },
];

// The authoritative auth gate (the proxy does only an optimistic redirect).
// A signed-in user with no staff row has no tenant → not allowed in.
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/login");

  return (
    <div className="mx-auto max-w-3xl px-5 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline/15 py-4">
        <div className="flex items-baseline gap-3">
          <Link href="/admin" className="font-display text-lg text-porcelain outline-none hover:text-brass focus-visible:ring-2 focus-visible:ring-accent/70">
            Platter
          </Link>
          <span className="tabular text-[0.7rem] uppercase tracking-widest text-brass">Manager</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">
            {staff.fullName ?? staff.email ?? "Signed in"} · {staff.role}
          </span>
          <SignOutButton />
        </div>
      </header>

      <nav className="flex gap-1 border-b border-hairline/10 py-2">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="tabular rounded-card px-3 py-1.5 text-xs uppercase tracking-wider text-muted outline-none transition-colors hover:text-porcelain focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {n.label}
          </Link>
        ))}
      </nav>

      <main className="pt-4">{children}</main>
    </div>
  );
}
