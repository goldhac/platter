import dynamic from "next/dynamic";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { MoneyOpts } from "@/lib/format/currency";
import { getMenu } from "@/lib/queries/menu";
import { getCurrentStaff } from "@/lib/rbac";
import { layoutSpec } from "@/components/menu/layouts";
import { ItemAdminControls } from "@/components/menu/admin/item-controls";
import { MenuBoard } from "@/components/menu/menu-board";
import { MenuHeader } from "@/components/menu/menu-header";
import { MenuSwitcher } from "@/components/menu/menu-switcher";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { getTheme, resolveTheme } from "@/lib/themes";

// Admin-only client layer — dynamically imported so customers never download it.
const AdminLayer = dynamic(() => import("@/components/menu/admin/admin-layer"));
// Diner concierge — code-split off the critical first-load (loads after hydration).
const Concierge = dynamic(() => import("@/components/menu/concierge"));

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "";

/**
 * The public menu for one venue, fully assembled. Shared by the host-resolved
 * `/menu` route and the path-based `/v/<slug>` route — `basePath` is where this
 * venue lives publicly, threaded into the item deep-links so shallow routing and
 * canonicals stay under the right URL.
 */
export async function MenuScreen({
  restaurantSlug,
  itemPath,
  theme,
  m,
  basePath,
}: {
  restaurantSlug: string;
  itemPath: string[] | undefined;
  theme?: string;
  m?: string;
  basePath: string;
}) {
  // /menu/[category]/[item] → the item slug is the second segment
  const initialItemSlug = itemPath && itemPath.length >= 2 ? itemPath[1] : null;

  const menu = await getMenu(restaurantSlug, m);
  const money: MoneyOpts = {
    currency: menu.restaurant.currency,
    locale: menu.restaurant.locale,
    secondary: menu.restaurant.secondary_currency,
  };

  // The viewer is an admin of THIS venue only if they're signed-in staff of its tenant.
  // Skip the auth round-trip entirely for logged-out visitors (the common case) — only look
  // up staff when a Supabase session cookie is actually present.
  const cookieStore = await cookies();
  const hasSession = cookieStore.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("auth"));
  const staff = hasSession ? await getCurrentStaff() : null;
  const isAdmin = !!staff && staff.tenantId === menu.restaurant.tenant_id;
  const adminInfo =
    isAdmin && staff
      ? {
          role: staff.role,
          venueName: menu.restaurant.name,
          dashboardHref: "/admin",
          editMenuHref: "/admin/menu",
          addItemHref: "/admin/items/new",
          itemHrefBase: "/admin/items/",
        }
      : null;

  // Theme is data-driven (the active menu's record); `?theme=` previews another
  // shipped theme — the same override the customiser uses.
  const themeId = theme ? getTheme(theme).id : menu.themeId;
  const themeConfig = theme ? {} : menu.themeConfig;
  const layout = resolveTheme(themeId, themeConfig).layout;
  const { Item, listClassName } = layoutSpec(layout);

  // A shared deep link to an item that no longer exists → 404, not a broken sheet.
  if (initialItemSlug && !menu.itemsBySlug[initialItemSlug]) notFound();

  const railCategories = menu.categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: menu.restaurant.name,
    ...(menu.restaurant.address ? { address: menu.restaurant.address } : {}),
    ...(menu.restaurant.phone ? { telephone: menu.restaurant.phone } : {}),
    ...(SITE ? { url: `${SITE}${basePath}` } : {}),
    hasMenu: {
      "@type": "Menu",
      hasMenuSection: menu.categories.map((cat) => ({
        "@type": "MenuSection",
        name: cat.name,
        hasMenuItem: cat.items.map((it) => ({
          "@type": "MenuItem",
          name: it.name,
          ...(it.description ? { description: it.description } : {}),
          offers: {
            "@type": "Offer",
            price: it.from_price ?? it.base_price,
            priceCurrency: menu.restaurant.currency,
          },
        })),
      })),
    },
  };

  const body = (
    <main className="mx-auto max-w-xl px-5">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <MenuHeader
          restaurant={menu.restaurant}
          openState={menu.openState}
          shareUrl={`${SITE}${basePath}`}
          printHref={`/v/${menu.restaurant.slug}/print`}
        />
        <MenuSwitcher menus={menu.menus} activeSlug={menu.activeMenuSlug} />

        <MenuBoard
          itemsBySlug={menu.itemsBySlug}
          money={money}
          initialItemSlug={initialItemSlug}
          railCategories={railCategories}
          layout={layout}
          basePath={basePath}
          admin={isAdmin}
          whatsapp={menu.restaurant.whatsapp}
          venueName={menu.restaurant.name}
        >
          <div className="pb-28">
            {menu.popular.length >= 3 && (
              <section className="menu-section pt-8" aria-labelledby="pop-heading">
                <div className="flex items-center gap-2.5 pb-3.5">
                  <span id="pop-heading" className="font-mono text-[10px] uppercase tracking-[0.2em] text-hairline-strong">
                    Most ordered
                  </span>
                  <span
                    aria-hidden
                    className="h-px flex-1"
                    style={{ background: "color-mix(in srgb, var(--color-hairline-strong) 28%, transparent)" }}
                  />
                </div>
                <ul className={listClassName}>
                  {menu.popular.map((item) => (
                    <li key={`pop-${item.id}`} className={isAdmin ? "group relative" : undefined}>
                      <Item item={item} money={money} basePath={basePath} />
                      {isAdmin && <ItemAdminControls item={item} />}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {menu.groups.map((group) => (
              <div key={group.id}>
                <div className="mt-9 flex items-center gap-2 first:mt-6">
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-tertiary">{group.name}</span>
                  {group.name_zh && <span className="font-cjk text-[11px] text-text-tertiary/80">{group.name_zh}</span>}
                </div>

                {group.categories.map((cat) => (
                  <section key={cat.id} id={`cat-${cat.slug}`} className="menu-section pt-8">
                    <div className="flex items-baseline gap-3">
                      <h2 className="font-display text-[31px] font-normal leading-none tracking-[-0.022em] text-text">
                        {cat.name}
                      </h2>
                      {cat.name_zh && <span className="font-cjk text-[15px] text-text-tertiary">{cat.name_zh}</span>}
                    </div>
                    <div
                      className="mt-4 h-px"
                      style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--color-hairline-strong) 45%, transparent), color-mix(in srgb, var(--color-hairline-strong) 4%, transparent))" }}
                    />
                    <ul className={listClassName}>
                      {cat.items.map((item) => (
                        <li
                          key={item.id}
                          className={isAdmin ? "group relative" : undefined}
                          data-draft-item={
                            isAdmin && item.status !== "published" ? "" : undefined
                          }
                        >
                          <Item item={item} money={money} basePath={basePath} />
                          {isAdmin && <ItemAdminControls item={item} />}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            ))}
          </div>
        </MenuBoard>
    </main>
  );

  return (
    <ThemeProvider themeId={themeId} config={themeConfig} className="min-h-screen">
      {adminInfo ? (
        <AdminLayer admin={adminInfo} itemsBySlug={menu.itemsBySlug}>
          {body}
        </AdminLayer>
      ) : (
        body
      )}
      {!isAdmin && (
        <Concierge venue={menu.restaurant.slug} m={menu.activeMenuSlug} venueName={menu.restaurant.name} />
      )}
    </ThemeProvider>
  );
}
