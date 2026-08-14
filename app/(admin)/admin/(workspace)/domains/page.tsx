import { redirect } from "next/navigation";
import { DomainsForm } from "@/components/admin/domains-form";
import { getCurrentStaff } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { getActiveVenueId } from "@/lib/venue/active";

export const dynamic = "force-dynamic";

export default async function DomainsPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/login");

  const supabase = await createClient();
  const { data: r } = await supabase
    .from("restaurants")
    .select("slug, custom_domain")
    .eq("id", (await getActiveVenueId(staff.tenantId)) ?? "")
    .maybeSingle();
  if (!r) redirect("/admin/login");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN?.trim().toLowerCase() || null;

  return (
    <div>
      <h1 className="font-display text-2xl text-porcelain">Public address</h1>
      <p className="mt-1 text-sm text-muted">Where diners find your menu.</p>
      <div className="mt-5">
        <DomainsForm
          slug={r.slug}
          customDomain={r.custom_domain}
          siteUrl={siteUrl}
          platformDomain={platformDomain}
          canEdit={staff.role === "owner"}
        />
      </div>
    </div>
  );
}
