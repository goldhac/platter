-- 0013_popular_items.sql — the "Track + Popular section" foundation.
-- Customers write `item_view` events (anon_write_events already allows INSERT); staff read
-- their own events (auth_read_events). The PUBLIC menu needs the top items, but anon can't
-- read menu_events — so expose ONLY the aggregate (item id + count) via a SECURITY DEFINER
-- function. No PII, just popularity, safe for anon.

create index if not exists idx_menu_events_rest_event_created
  on public.menu_events (restaurant_id, event, created_at desc);

create or replace function public.popular_items(
  p_restaurant_id uuid,
  p_days int default 30,
  p_limit int default 6
) returns table (item_id uuid, views bigint)
language sql
stable
security definer
set search_path = public
as $$
  select entity_id, count(*)::bigint
  from public.menu_events
  where restaurant_id = p_restaurant_id
    and event = 'item_view'
    and entity_id is not null
    and created_at > now() - make_interval(days => greatest(1, least(365, p_days)))
  group by entity_id
  order by count(*) desc, entity_id
  limit greatest(1, least(20, p_limit));
$$;

revoke all on function public.popular_items(uuid, int, int) from public;
grant execute on function public.popular_items(uuid, int, int) to anon, authenticated;
