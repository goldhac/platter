import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/admin/onboarding-wizard";

export const dynamic = "force-dynamic";

const PLATFORM_HOST = (
  process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "platter.goldhac.com"
)
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");

// Post-signup setup. Provisions the tenant (idempotent) for whoever just authenticated —
// whether they got an immediate session or arrived via the email-confirmation link — then
// runs the guided wizard (details → link → menu).
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

  const staff = await getCurrentStaff();
  const { data: rest } = staff
    ? await supabase
        .from("restaurants")
        .select("name, cuisine, currency, slug")
        .eq("tenant_id", staff.tenantId)
        .limit(1)
        .maybeSingle()
    : { data: null };

  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <header className="mb-8 text-center">
        <span className="tabular text-[0.7rem] uppercase tracking-widest text-brass">Welcome to Platter</span>
      </header>
      <OnboardingWizard
        initial={{
          name: rest?.name ?? "",
          cuisine: rest?.cuisine ?? "",
          currency: rest?.currency ?? "NGN",
          slug: rest?.slug ?? "",
          platformHost: PLATFORM_HOST,
        }}
      />
    </div>
  );
}
