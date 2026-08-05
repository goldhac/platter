import type { Metadata } from "next";
import { headers } from "next/headers";
import { MenuScreen } from "@/components/menu/menu-screen";
import { buildMenuMetadata } from "@/lib/menu/metadata";
import { FLAGSHIP_SLUG, resolveVenueFromHost } from "@/lib/venue/resolve";

// Per-venue routing by host: a `<slug>.<platform-domain>` subdomain or a custom
// domain resolves to that venue; the apex (Railway host today) falls back to the
// flagship so its printed-QR `/menu/...` links never break. Dynamic so sold-out /
// edits show immediately; real tag caching arrives with the domain work.
export const dynamic = "force-dynamic";

async function venueFromRequest(): Promise<string> {
  const host = (await headers()).get("host");
  return (await resolveVenueFromHost(host)) ?? FLAGSHIP_SLUG;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return buildMenuMetadata(await venueFromRequest(), slug, "/menu");
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
  return (
    <MenuScreen
      restaurantSlug={await venueFromRequest()}
      itemPath={slug}
      theme={theme}
      m={m}
      basePath="/menu"
    />
  );
}
