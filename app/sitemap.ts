import type { MetadataRoute } from "next";
import { getMenu } from "@/lib/queries/menu";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const RESTAURANT_SLUG = "jin-canting";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const menu = await getMenu(RESTAURANT_SLUG);
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE}/menu`, lastModified: now, changeFrequency: "weekly", priority: 1 },
  ];

  for (const cat of menu.categories) {
    entries.push({
      url: `${SITE}/menu/${cat.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    });
    for (const item of cat.items) {
      entries.push({
        url: `${SITE}/menu/${cat.slug}/${item.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  }

  return entries;
}
