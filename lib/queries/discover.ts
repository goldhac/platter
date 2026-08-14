import { createClient } from "@/lib/supabase/server";

export type DiscoverVenue = {
  id: string;
  name: string;
  name_zh: string | null;
  slug: string;
  cuisine: string | null;
  description: string | null;
  address: string | null;
  image_url: string | null;
};

/**
 * The public directory: venues that opted into listing (`is_listed`) and are live.
 * Anon-readable (anon_read_restaurants → true); we scope to listed + active here.
 */
export async function getListedVenues(): Promise<DiscoverVenue[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurants")
    .select("id, name, name_zh, slug, cuisine, description, address, cover_url, hero_image_url, logo_url")
    .eq("is_listed", true)
    .eq("status", "active")
    .order("name");

  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    name_zh: r.name_zh,
    slug: r.slug,
    cuisine: r.cuisine,
    description: r.description,
    address: r.address,
    image_url: r.cover_url ?? r.hero_image_url ?? r.logo_url ?? null,
  }));
}
