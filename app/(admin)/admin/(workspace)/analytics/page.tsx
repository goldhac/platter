import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { getActiveVenueId } from "@/lib/venue/active";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;

type RankRow = { item_id: string; views: number };
type ItemRow = { id: string; name: string; image_url: string | null; categories: { name: string } | { name: string }[] | null };

// Insights: which dishes diners open most. Popularity comes from the same SECURITY
// DEFINER `popular_items` RPC that powers the public "Most popular" shelf; the headline
// counts read menu_events directly (auth_read_events scopes them to this tenant).
export default async function AnalyticsPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/login");

  const supabase = await createClient();
  const { data: rest } = await supabase
    .from("restaurants")
    .select("id, name, slug")
    .eq("id", (await getActiveVenueId(staff.tenantId)) ?? "")
    .maybeSingle();
  if (!rest) redirect("/admin");

  const since30 = new Date(Date.now() - 30 * DAY).toISOString();
  const since7 = new Date(Date.now() - 7 * DAY).toISOString();

  const [{ data: rankData }, { count: total30 }, { count: total7 }] = await Promise.all([
    supabase.rpc("popular_items", { p_restaurant_id: rest.id, p_days: 30, p_limit: 20 }),
    supabase
      .from("menu_events")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", rest.id)
      .eq("event", "item_view")
      .gte("created_at", since30),
    supabase
      .from("menu_events")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", rest.id)
      .eq("event", "item_view")
      .gte("created_at", since7),
  ]);

  const ranked = (rankData ?? []) as RankRow[];
  const ids = ranked.map((r) => r.item_id);
  const { data: itemData } = ids.length
    ? await supabase.from("items").select("id, name, image_url, categories(name)").in("id", ids)
    : { data: [] as ItemRow[] };
  const itemById = new Map((itemData ?? []).map((it) => [it.id, it as ItemRow]));

  // Join counts → names, drop any ranked id whose item was since removed.
  const rows = ranked
    .map((r) => ({ ...r, item: itemById.get(r.item_id) }))
    .filter((r): r is RankRow & { item: ItemRow } => !!r.item);
  const maxViews = rows.length ? rows[0].views : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="tabular text-[0.7rem] uppercase tracking-widest text-brass">Insights</p>
          <h1 className="font-display text-2xl text-porcelain">{rest.name}</h1>
        </div>
        <Link
          href={`/v/${rest.slug}`}
          target="_blank"
          rel="noopener"
          className="tabular rounded-card border border-hairline/30 px-3 py-2 text-xs uppercase tracking-wider text-muted outline-none hover:text-porcelain focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          View live site ↗
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Item views · 30 days" value={total30 ?? 0} />
        <Stat label="Item views · 7 days" value={total7 ?? 0} />
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg text-porcelain">Most viewed dishes</h2>
        <p className="text-xs text-muted">
          How many times diners opened each dish for a closer look, over the last 30 days. The busiest
          three surface automatically as a “Most popular” shelf on your live menu.
        </p>

        {rows.length === 0 ? (
          <p className="rounded-card border border-hairline/20 p-6 text-center text-sm text-muted">
            No views yet. Once diners start browsing your menu, your top dishes will appear here — and a
            “Most popular” shelf will build itself on your live site.
          </p>
        ) : (
          <ol className="space-y-1.5">
            {rows.map((r, i) => {
              const cat = r.item.categories;
              const catName = (Array.isArray(cat) ? cat[0]?.name : cat?.name) ?? "";
              const pct = maxViews ? Math.max(4, Math.round((r.views / maxViews) * 100)) : 0;
              return (
                <li key={r.item_id}>
                  <Link
                    href={`/admin/items/${r.item_id}`}
                    className="group relative flex items-center gap-3 overflow-hidden rounded-card border border-hairline/20 px-3 py-2.5 outline-none hover:border-hairline/40 focus-visible:ring-2 focus-visible:ring-accent/70"
                  >
                    <div
                      aria-hidden
                      className="absolute inset-y-0 left-0 bg-accent/10 transition-[width]"
                      style={{ width: `${pct}%` }}
                    />
                    <span className="tabular relative z-10 w-5 shrink-0 text-center text-xs text-brass">
                      {i + 1}
                    </span>
                    <span className="relative z-10 min-w-0 flex-1">
                      <span className="block truncate text-sm text-porcelain">{r.item.name}</span>
                      {catName && (
                        <span className="tabular block text-[0.65rem] uppercase tracking-wider text-muted">
                          {catName}
                        </span>
                      )}
                    </span>
                    <span className="tabular relative z-10 shrink-0 text-sm text-porcelain">
                      {r.views}
                      <span className="ml-1 text-[0.65rem] uppercase tracking-wider text-muted">
                        view{r.views === 1 ? "" : "s"}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <p className="border-t border-hairline/10 pt-4 text-[0.7rem] text-muted">
        Counts reflect item detail views (a diner tapping a dish to see its full card). Staff previews
        aren’t counted. Data updates live.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card border border-hairline/25 p-4">
      <p className="tabular text-2xl text-porcelain">{value.toLocaleString()}</p>
      <p className="tabular text-[0.65rem] uppercase tracking-wider text-muted">{label}</p>
    </div>
  );
}
