import { createClient } from "@/lib/supabase/server";

// Fire-and-forget: a diner tapped an item to open its detail sheet. We log one
// `item_view` event so the menu can surface a "Most popular" shelf and staff get
// analytics. tenant_id + restaurant_id are DERIVED from the item server-side
// (never trusted from the client), so events can't be spoofed into another tenant.
// Always returns 204 — analytics must never surface an error to the diner.
export async function POST(req: Request) {
  let itemId: string | null = null;
  try {
    const body = (await req.json()) as { itemId?: unknown };
    if (typeof body?.itemId === "string") itemId = body.itemId;
  } catch {
    itemId = null;
  }
  if (!itemId) return new Response(null, { status: 204 });

  const supabase = await createClient();

  // Anon RLS returns the row only for a published item; drafts (admin preview) → no event.
  const { data: item } = await supabase
    .from("items")
    .select("id, restaurant_id, restaurants(tenant_id)")
    .eq("id", itemId)
    .maybeSingle();
  if (!item?.restaurant_id) return new Response(null, { status: 204 });

  const rel = item.restaurants as { tenant_id: string } | { tenant_id: string }[] | null;
  const tenantId = (Array.isArray(rel) ? rel[0]?.tenant_id : rel?.tenant_id) ?? null;

  await supabase.from("menu_events").insert({
    tenant_id: tenantId,
    restaurant_id: item.restaurant_id,
    event: "item_view",
    entity_id: item.id,
  });

  return new Response(null, { status: 204 });
}
