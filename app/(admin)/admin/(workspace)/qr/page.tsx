import { redirect } from "next/navigation";
import { QrTools } from "@/components/admin/qr-tools";
import { getCurrentStaff } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function QrPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/login");

  const supabase = await createClient();
  const { data: r } = await supabase
    .from("restaurants")
    .select("slug")
    .eq("tenant_id", staff.tenantId)
    .limit(1)
    .maybeSingle();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  // This venue's public path. Once a subdomain / custom domain is live, regenerate
  // codes on the branded URL — the target is what's printed, so it must be final.
  const venuePath = r ? `/v/${r.slug}` : "/menu";

  return (
    <div>
      <h1 className="font-display text-2xl text-porcelain">QR codes</h1>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Print these for tables. They point at{" "}
        <span className="tabular text-porcelain">
          {siteUrl}
          {venuePath}
        </span>{" "}
        — your venue&apos;s public menu. Once your custom domain is live, regenerate them on the
        branded URL. The printed code never changes when the menu changes.
      </p>
      <div className="mt-5">
        <QrTools siteUrl={siteUrl} venuePath={venuePath} />
      </div>
    </div>
  );
}
