import { redirect } from "next/navigation";
import { QrStudio } from "@/components/admin/qr-studio";
import { getAdminMenus } from "@/lib/queries/admin-menus";

export const dynamic = "force-dynamic";

export default async function QrPage() {
  const data = await getAdminMenus();
  if (!data) redirect("/admin/login");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const venuePath = `/v/${data.restaurantSlug}`;
  const menus = data.menus.map((m) => ({ name: m.name, slug: m.slug }));

  return (
    <div>
      <h1 className="font-display text-2xl text-porcelain">QR Studio</h1>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Print-ready codes for your tables — point them at the whole venue or a specific menu, one at
        a time or a whole floor at once. The printed code never changes when the menu does. Once your
        custom domain is live, regenerate on the branded URL.
      </p>
      <div className="mt-5">
        <QrStudio
          siteUrl={siteUrl}
          venuePath={venuePath}
          venueName={data.restaurantName}
          menus={menus}
        />
      </div>
    </div>
  );
}
