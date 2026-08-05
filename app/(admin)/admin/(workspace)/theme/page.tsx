import { redirect } from "next/navigation";
import { getMenu } from "@/lib/queries/menu";
import { getCurrentStaff } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { ThemeCustomiser } from "@/components/admin/theme-customiser";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const RESTAURANT_SLUG = "jin-canting";

export default async function ThemePage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/login");

  const { m } = await searchParams;
  const menu = await getMenu(RESTAURANT_SLUG, m);
  const active = menu.menus.find((mm) => mm.slug === menu.activeMenuSlug) ?? menu.menus[0] ?? null;

  const supabase = await createClient();
  const { data: t } = await supabase
    .from("tenants")
    .select("plan")
    .eq("id", staff.tenantId)
    .maybeSingle();
  const plan = t?.plan ?? "free";

  const previewItems = menu.categories.flatMap((c) => c.items).slice(0, 6);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-porcelain">Theme</h1>
          <p className="text-sm text-muted">Pick a look and tune it against your real menu, then publish.</p>
        </div>
        {menu.menus.length > 1 && (
          <nav aria-label="Menu" className="flex gap-1.5">
            {menu.menus.map((mm) => (
              <a
                key={mm.id}
                href={`/admin/theme?m=${mm.slug}`}
                aria-current={active && mm.slug === active.slug ? "page" : undefined}
                className={cn(
                  "rounded-card px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
                  active && mm.slug === active.slug
                    ? "bg-accent text-porcelain"
                    : "border border-hairline/30 text-muted hover:text-porcelain",
                )}
              >
                {mm.name}
              </a>
            ))}
          </nav>
        )}
      </div>

      {active && previewItems.length > 0 ? (
        <ThemeCustomiser
          menuId={active.id}
          menuName={active.name}
          restaurantName={menu.restaurant.name}
          previewItems={previewItems}
          money={{ currency: menu.restaurant.currency, locale: menu.restaurant.locale }}
          initialThemeId={menu.themeId}
          initialConfig={menu.themeConfig}
          plan={plan}
        />
      ) : (
        <p className="text-sm text-muted">
          {active ? "Add a few published items to this menu to preview a theme." : "No menu to theme yet."}
        </p>
      )}
    </div>
  );
}
