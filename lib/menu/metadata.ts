import type { Metadata } from "next";
import { formatMoney, type MoneyOpts } from "@/lib/format/currency";
import { getMenu } from "@/lib/queries/menu";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "";

/**
 * SEO/social metadata for a venue's menu (or a deep-linked item). `basePath` is
 * where this venue lives publicly ("/menu" on the apex/host, "/v/<slug>" on the
 * path route) so canonicals point at the right URL. OG images render the venue's
 * own name + theme via `/api/og?r=<slug>`.
 */
export async function buildMenuMetadata(
  restaurantSlug: string,
  itemPath: string[] | undefined,
  basePath: string,
): Promise<Metadata> {
  const menu = await getMenu(restaurantSlug);
  const r = menu.restaurant;
  const money: MoneyOpts = { currency: r.currency, locale: r.locale };
  const ogBase = `/api/og?r=${encodeURIComponent(restaurantSlug)}`;

  const itemSlug = itemPath && itemPath.length >= 2 ? itemPath[1] : null;
  const item = itemSlug ? menu.itemsBySlug[itemSlug] : null;

  if (item) {
    const price =
      item.from_price != null
        ? `from ${formatMoney(item.from_price, money)}`
        : formatMoney(item.base_price, money);
    const title = `${item.name} · ${r.name}`;
    const description = item.description ?? `${item.name} — ${price} at ${r.name}.`;
    const ogUrl = `${ogBase}&item=${encodeURIComponent(item.slug)}`;
    return {
      title,
      description,
      alternates: { canonical: `${SITE}${basePath}/${item.category_slug}/${item.slug}` },
      openGraph: {
        title,
        description,
        type: "website",
        images: [{ url: ogUrl, width: 1200, height: 630 }],
      },
      twitter: { card: "summary_large_image", title, description, images: [ogUrl] },
    };
  }

  const title = `${r.name} — Menu`;
  const description = `The menu at ${r.name}${r.address ? `, ${r.address}` : ""}. Browse dishes and prices.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE}${basePath}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: ogBase, width: 1200, height: 630 }],
    },
  };
}
