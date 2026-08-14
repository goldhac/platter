import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// The "active venue" seam for the admin. A tenant can own several venues (restaurants);
// the admin operates on ONE at a time, chosen by the `platter_venue` cookie and resolved
// here. Single-venue tenants are unaffected — the active venue is simply their only one.
// Both helpers are React-cached, so a request resolves the venue once no matter how many
// admin queries ask for it.

export const VENUE_COOKIE = "platter_venue";

export type VenueLite = { id: string; name: string; slug: string };

/** All live venues the tenant owns, oldest first (so [0] is the originally-provisioned one). */
export const getTenantVenues = cache(async (tenantId: string): Promise<VenueLite[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurants")
    .select("id, name, slug")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("created_at");
  return (data ?? []) as VenueLite[];
});

/**
 * The active restaurant id for this request: the cookie if it names a venue the tenant
 * actually owns, else the tenant's first venue. Returns null only if the tenant has no
 * venues. Safe by construction — a stale/foreign cookie can never point outside the tenant.
 */
export const getActiveVenueId = cache(async (tenantId: string): Promise<string | null> => {
  const venues = await getTenantVenues(tenantId);
  if (venues.length === 0) return null;
  const jar = await cookies();
  const picked = jar.get(VENUE_COOKIE)?.value;
  if (picked && venues.some((v) => v.id === picked)) return picked;
  return venues[0].id;
});
