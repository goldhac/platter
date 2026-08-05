import Link from "next/link";
import { redirect } from "next/navigation";
import { MenuImport } from "@/components/admin/menu-import";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Post-signup setup. Provisions the tenant (idempotent) for whoever just
// authenticated — whether they got an immediate session or arrived via the
// email-confirmation link — then leads with the AI menu import.
export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { error } = await supabase.rpc("provision_tenant", {});

  if (error) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="font-display text-2xl text-porcelain">We couldn&apos;t finish setup</h1>
        <p className="mt-2 text-sm text-muted">{error.message}</p>
        <Link
          href="/admin/onboarding"
          className="tabular mt-5 inline-block rounded-card bg-accent px-4 py-2 text-xs uppercase tracking-wider text-porcelain hover:opacity-90"
        >
          Try again
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <header className="text-center">
        <span className="tabular text-[0.7rem] uppercase tracking-widest text-brass">Welcome to Platter</span>
        <h1 className="mt-2 font-display text-3xl text-porcelain">Let&apos;s get your menu online</h1>
        <p className="mt-2 text-sm text-muted">
          Snap a photo or upload a PDF of your existing menu — we&apos;ll turn it into an editable
          draft in seconds. You review everything before it goes live.
        </p>
      </header>

      <div className="mt-8">
        <MenuImport />
      </div>

      <div className="mt-8 border-t border-hairline/15 pt-5 text-center">
        <Link
          href="/admin"
          className="tabular rounded-card border border-hairline/30 px-4 py-2 text-xs uppercase tracking-wider text-muted hover:text-porcelain"
        >
          Skip for now — I&apos;ll add items myself
        </Link>
      </div>
    </div>
  );
}
