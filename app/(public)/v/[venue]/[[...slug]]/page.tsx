import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MenuScreen } from "@/components/menu/menu-screen";
import { buildMenuMetadata } from "@/lib/menu/metadata";
import { venueExists } from "@/lib/venue/resolve";

// Path-based venue access: /v/<slug>/[category]/[item]. Works on any host — this
// is the shareable public URL a new venue gets before it claims a subdomain /
// custom domain (which route through /menu by host). foundation §13 M7.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ venue: string; slug?: string[] }>;
}): Promise<Metadata> {
  const { venue, slug } = await params;
  if (!(await venueExists(venue))) return { title: "Menu not found" };
  return buildMenuMetadata(venue, slug, `/v/${venue}`);
}

export default async function VenueMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string; slug?: string[] }>;
  searchParams: Promise<{ theme?: string; m?: string }>;
}) {
  const { venue, slug } = await params;
  const { theme, m } = await searchParams;
  if (!(await venueExists(venue))) notFound();

  return (
    <MenuScreen
      restaurantSlug={venue}
      itemPath={slug}
      theme={theme}
      m={m}
      basePath={`/v/${venue}`}
    />
  );
}
