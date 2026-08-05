import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// The venue shown on the apex host (the Railway URL today, platter.menu later),
// so the flagship's printed-QR links (`/menu/...`) never break. foundation §13 M7.
export const FLAGSHIP_SLUG = "jin-canting";

/**
 * The platform apex for subdomain venues, e.g. "platter.menu". Set via
 * NEXT_PUBLIC_PLATFORM_DOMAIN once the custom domain + wildcard are live on
 * Railway; until then it's unset and subdomain resolution is simply a no-op
 * (the Railway host has no venue subdomains), so nothing to resolve there.
 */
export function platformDomain(): string | null {
  const env = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN?.trim().toLowerCase();
  return env || null;
}

/** Reserved labels that can never be a venue subdomain (or claimed as a slug). */
export const RESERVED_SLUGS = new Set([
  "www",
  "app",
  "admin",
  "api",
  "auth",
  "mail",
  "smtp",
  "ftp",
  "cdn",
  "assets",
  "static",
  "img",
  "images",
  "help",
  "support",
  "docs",
  "blog",
  "status",
  "dashboard",
  "billing",
  "account",
  "login",
  "signup",
  "onboarding",
  "menu",
  "platter",
]);

/** Does a venue with this slug exist? (cached per request) — for the /v/<slug> 404 gate. */
export const venueExists = cache(async (slug: string): Promise<boolean> => {
  const supabase = await createClient();
  const { data } = await supabase.from("restaurants").select("slug").eq("slug", slug).maybeSingle();
  return !!data;
});

function normalizeHost(host: string | null | undefined): string | null {
  if (!host) return null;
  const h = host.split(":")[0].trim().toLowerCase();
  return h || null;
}

/**
 * Which venue a request host maps to, or null for the apex/unknown (the caller
 * falls back to the flagship). Order: exact custom-domain match → `<slug>.<apex>`
 * subdomain. Runs on the anon client — `anon_read_restaurants` is `true`, so any
 * venue resolves by slug/custom_domain (its menu still only shows once published).
 */
export const resolveVenueFromHost = cache(async (
  rawHost: string | null | undefined,
): Promise<string | null> => {
  const host = normalizeHost(rawHost);
  if (!host) return null;

  const apex = platformDomain();

  // A subdomain of the platform apex: the left-most label is the venue slug.
  if (apex && host !== apex && host.endsWith(`.${apex}`)) {
    const label = host.slice(0, host.length - apex.length - 1);
    if (!label || label === "www" || RESERVED_SLUGS.has(label)) return null;
    const supabase = await createClient();
    const { data } = await supabase
      .from("restaurants")
      .select("slug")
      .eq("slug", label)
      .maybeSingle();
    return data?.slug ?? null;
  }

  // A custom domain pointed at us (skip our own apex/subdomains).
  if (!apex || (host !== apex && !host.endsWith(`.${apex}`))) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("restaurants")
      .select("slug")
      .eq("custom_domain", host)
      .maybeSingle();
    if (data) return data.slug;
  }

  return null;
});
