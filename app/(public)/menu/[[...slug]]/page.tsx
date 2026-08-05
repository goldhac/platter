import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatMoney, type MoneyOpts } from "@/lib/format/currency";
import { getMenu } from "@/lib/queries/menu";
import { layoutSpec } from "@/components/menu/layouts";
import { MenuBoard } from "@/components/menu/menu-board";
import { MenuHeader } from "@/components/menu/menu-header";
import { MenuSwitcher } from "@/components/menu/menu-switcher";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { getTheme, resolveTheme } from "@/lib/themes";

// v1 single-tenant; per-tenant routing + real tag caching arrive later
// (foundation.md §12 #3, §9). Dynamic for now so sold-out/edits show immediately.
export const dynamic = "force-dynamic";

const RESTAURANT_SLUG = "jin-canting";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const menu = await getMenu(RESTAURANT_SLUG);
  const r = menu.restaurant;
  const money: MoneyOpts = { currency: r.currency, locale: r.locale };

  const itemSlug = slug && slug.length >= 2 ? slug[1] : null;
  const item = itemSlug ? menu.itemsBySlug[itemSlug] : null;

  if (item) {
    const price =
      item.from_price != null
        ? `from ${formatMoney(item.from_price, money)}`
        : formatMoney(item.base_price, money);
    const title = `${item.name} · ${r.name}`;
    const description = item.description ?? `${item.name} — ${price} at ${r.name}.`;
    return {
      title,
      description,
      alternates: { canonical: `${SITE}/menu/${item.category_slug}/${item.slug}` },
      openGraph: {
        title,
        description,
        type: "website",
        images: [{ url: `/api/og?item=${encodeURIComponent(item.slug)}`, width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [`/api/og?item=${encodeURIComponent(item.slug)}`],
      },
    };
  }

  const title = `${r.name} — Menu`;
  const description = `The menu at ${r.name}${r.address ? `, ${r.address}` : ""}. Browse dishes and prices.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE}/menu` },
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: "/api/og", width: 1200, height: 630 }],
    },
  };
}

export default async function MenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ theme?: string; m?: string }>;
}) {
  const { slug } = await params;
  const { theme, m } = await searchParams;
  // /menu/[category]/[item] → the item slug is the second segment
  const initialItemSlug = slug && slug.length >= 2 ? slug[1] : null;

  const menu = await getMenu(RESTAURANT_SLUG, m);
  const money: MoneyOpts = {
    currency: menu.restaurant.currency,
    locale: menu.restaurant.locale,
  };

  // Theme comes from the active menu's record (data-driven). `?theme=` previews another
  // shipped theme — the same override the M5 customiser will use.
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
    servesCuisine: "Chinese",
    ...(menu.restaurant.address ? { address: menu.restaurant.address } : {}),
    ...(menu.restaurant.phone ? { telephone: menu.restaurant.phone } : {}),
    ...(SITE ? { url: `${SITE}/menu` } : {}),
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
                        <Item item={item} money={money} />
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
