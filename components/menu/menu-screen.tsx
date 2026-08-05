import { notFound } from "next/navigation";
import type { MoneyOpts } from "@/lib/format/currency";
import { getMenu } from "@/lib/queries/menu";
import { layoutSpec } from "@/components/menu/layouts";
import { MenuBoard } from "@/components/menu/menu-board";
import { MenuHeader } from "@/components/menu/menu-header";
import { MenuSwitcher } from "@/components/menu/menu-switcher";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { getTheme, resolveTheme } from "@/lib/themes";

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
  const money: MoneyOpts = { currency: menu.restaurant.currency, locale: menu.restaurant.locale };

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

  return (
    <ThemeProvider themeId={themeId} config={themeConfig} className="min-h-screen">
      <div className="mx-auto max-w-xl px-5">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <MenuHeader restaurant={menu.restaurant} openState={menu.openState} />
        <MenuSwitcher menus={menu.menus} activeSlug={menu.activeMenuSlug} />

        <MenuBoard
          itemsBySlug={menu.itemsBySlug}
          money={money}
          initialItemSlug={initialItemSlug}
          railCategories={railCategories}
          layout={layout}
          basePath={basePath}
        >
          <div className="pb-28">
            {menu.groups.map((group) => (
              <div key={group.id}>
                <div className="mt-8 flex items-baseline gap-2 border-b border-hairline/20 pb-2">
                  <span className="font-display text-lg text-text/90">{group.name}</span>
                  {group.name_zh && (
                    <span className="font-cjk text-sm text-accent/80">{group.name_zh}</span>
                  )}
                </div>

                {group.categories.map((cat) => (
                  <section key={cat.id} id={`cat-${cat.slug}`} className="menu-section">
                    <h2 className="tabular pt-5 text-[0.72rem] uppercase tracking-[0.22em] text-hairline">
                      {cat.name}
                    </h2>
                    <ul className={listClassName}>
                      {cat.items.map((item) => (
                        <li key={item.id}>
                          <Item item={item} money={money} basePath={basePath} />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            ))}
          </div>
        </MenuBoard>
      </div>
    </ThemeProvider>
  );
}
