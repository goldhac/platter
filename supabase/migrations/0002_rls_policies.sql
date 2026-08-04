-- Platter — 0002 RLS policies
-- Authority: context/security.md. Two keys enforce tenant isolation; this is the hard (DB) one.
-- anon = public menu (published, non-deleted only). staff/manager/owner scoped to their tenant.

-- ─────────────────────────── helpers (security definer to avoid RLS recursion) ───────────────────────────
create or replace function public.auth_tenant_id()
returns uuid language sql stable security definer set search_path = public as $$
  select tenant_id from public.staff where id = auth.uid() and is_active limit 1
$$;

create or replace function public.auth_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.staff where id = auth.uid() and is_active limit 1
$$;

-- staff may change ONLY is_available on items / item_variants (RLS can't gate columns; a trigger can)
create or replace function public.enforce_staff_item_availability_only()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.auth_role() = 'staff' then
    if row(new.tenant_id, new.restaurant_id, new.category_id, new.name, new.name_zh,
            new.description, new.description_zh, new.slug, new.base_price, new.compare_at_price,
            new.image_url, new.image_blurhash, new.sort_order, new.is_featured, new.spice_level,
            new.dietary_tags, new.allergens, new.prep_time_minutes, new.status,
            new.published_at, new.deleted_at)
       is distinct from
       row(old.tenant_id, old.restaurant_id, old.category_id, old.name, old.name_zh,
            old.description, old.description_zh, old.slug, old.base_price, old.compare_at_price,
            old.image_url, old.image_blurhash, old.sort_order, old.is_featured, old.spice_level,
            old.dietary_tags, old.allergens, old.prep_time_minutes, old.status,
            old.published_at, old.deleted_at)
    then
      raise exception 'staff role may modify only is_available on items';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.enforce_staff_variant_availability_only()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.auth_role() = 'staff' then
    if row(new.tenant_id, new.item_id, new.label, new.label_zh, new.price, new.sort_order)
       is distinct from
       row(old.tenant_id, old.item_id, old.label, old.label_zh, old.price, old.sort_order)
    then
      raise exception 'staff role may modify only is_available on item_variants';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_items_staff_guard    before update on public.items         for each row execute function public.enforce_staff_item_availability_only();
create trigger trg_variants_staff_guard before update on public.item_variants for each row execute function public.enforce_staff_variant_availability_only();

-- ─────────────────────────── enable RLS everywhere ───────────────────────────
alter table public.tenants              enable row level security;
alter table public.restaurants          enable row level security;
alter table public.opening_hours        enable row level security;
alter table public.menu_groups          enable row level security;
alter table public.categories           enable row level security;
alter table public.items                enable row level security;
alter table public.item_variants        enable row level security;
alter table public.modifier_groups      enable row level security;
alter table public.modifiers            enable row level security;
alter table public.item_modifier_groups enable row level security;
alter table public.staff                enable row level security;
alter table public.redirects            enable row level security;
alter table public.audit_log            enable row level security;
alter table public.menu_events          enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;

-- ═══════════════════════════ PUBLIC (anon) — published, non-deleted menu only ═══════════════════════════
create policy anon_read_restaurants   on public.restaurants   for select to anon using (true);
create policy anon_read_opening_hours on public.opening_hours for select to anon using (true);
create policy anon_read_groups        on public.menu_groups   for select to anon using (is_active);
create policy anon_read_categories    on public.categories    for select to anon using (is_active and deleted_at is null);
create policy anon_read_items         on public.items         for select to anon using (status = 'published' and deleted_at is null);
create policy anon_read_variants      on public.item_variants for select to anon
  using (is_available and exists (
    select 1 from public.items i where i.id = item_variants.item_id and i.status = 'published' and i.deleted_at is null));
create policy anon_read_modgroups     on public.modifier_groups for select to anon using (true);
create policy anon_read_modifiers     on public.modifiers       for select to anon using (is_available);
create policy anon_read_item_mods     on public.item_modifier_groups for select to anon using (true);
create policy anon_read_redirects     on public.redirects       for select to anon using (true);
-- analytics beacon: anon may append events, never read them
create policy anon_write_events       on public.menu_events     for insert to anon with check (true);

-- ═══════════════════════════ AUTHENTICATED — everything scoped to the caller's tenant ═══════════════════════════
-- tenant match predicate: tenant_id = public.auth_tenant_id()

-- tenants: read/update own account
create policy auth_read_tenant   on public.tenants for select to authenticated using (id = public.auth_tenant_id());
create policy owner_update_tenant on public.tenants for update to authenticated
  using (id = public.auth_tenant_id() and public.auth_role() = 'owner')
  with check (id = public.auth_tenant_id() and public.auth_role() = 'owner');

-- restaurants: public info is readable to all authenticated; only owner writes, own tenant
create policy auth_read_restaurants   on public.restaurants for select to authenticated using (true);
create policy owner_write_restaurants on public.restaurants for all to authenticated
  using (tenant_id = public.auth_tenant_id() and public.auth_role() = 'owner')
  with check (tenant_id = public.auth_tenant_id() and public.auth_role() = 'owner');

-- opening_hours: read within tenant; manager/owner write
create policy auth_read_hours   on public.opening_hours for select to authenticated using (tenant_id = public.auth_tenant_id());
create policy mgr_write_hours   on public.opening_hours for all to authenticated
  using (tenant_id = public.auth_tenant_id() and public.auth_role() in ('manager','owner'))
  with check (tenant_id = public.auth_tenant_id() and public.auth_role() in ('manager','owner'));

-- helper note: menu tables share the same shape — read(tenant) for all roles; insert/delete manager+owner; update rules vary.

-- menu_groups
create policy auth_read_groups on public.menu_groups for select to authenticated using (tenant_id = public.auth_tenant_id());
create policy mgr_ins_groups   on public.menu_groups for insert to authenticated with check (tenant_id = public.auth_tenant_id() and public.auth_role() in ('manager','owner'));
create policy mgr_upd_groups   on public.menu_groups for update to authenticated using (tenant_id = public.auth_tenant_id() and public.auth_role() in ('manager','owner')) with check (tenant_id = public.auth_tenant_id() and public.auth_role() in ('manager','owner'));
create policy mgr_del_groups   on public.menu_groups for delete to authenticated using (tenant_id = public.auth_tenant_id() and public.auth_role() in ('manager','owner'));

-- categories
create policy auth_read_categories on public.categories for select to authenticated using (tenant_id = public.auth_tenant_id());
create policy mgr_ins_categories   on public.categories for insert to authenticated with check (tenant_id = public.auth_tenant_id() and public.auth_role() in ('manager','owner'));
create policy mgr_upd_categories   on public.categories for update to authenticated using (tenant_id = public.auth_tenant_id() and public.auth_role() in ('manager','owner')) with check (tenant_id = public.auth_tenant_id() and public.auth_role() in ('manager','owner'));
create policy mgr_del_categories   on public.categories for delete to authenticated using (tenant_id = public.auth_tenant_id() and public.auth_role() in ('manager','owner'));

-- items: staff may UPDATE (column-guarded by trigger); insert/delete manager+owner only
create policy auth_read_items on public.items for select to authenticated using (tenant_id = public.auth_tenant_id());
create policy mgr_ins_items   on public.items for insert to authenticated with check (tenant_id = public.auth_tenant_id() and public.auth_role() in ('manager','owner'));
create policy staff_upd_items on public.items for update to authenticated using (tenant_id = public.auth_tenant_id()) with check (tenant_id = public.auth_tenant_id());
create policy mgr_del_items   on public.items for delete to authenticated using (tenant_id = public.auth_tenant_id() and public.auth_role() in ('manager','owner'));

-- item_variants: same staff/manager split
create policy auth_read_variants on public.item_variants for select to authenticated using (tenant_id = public.auth_tenant_id());
create policy mgr_ins_variants   on public.item_variants for insert to authenticated with check (tenant_id = public.auth_tenant_id() and public.auth_role() in ('manager','owner'));
create policy staff_upd_variants on public.item_variants for update to authenticated using (tenant_id = public.auth_tenant_id()) with check (tenant_id = public.auth_tenant_id());
create policy mgr_del_variants   on public.item_variants for delete to authenticated using (tenant_id = public.auth_tenant_id() and public.auth_role() in ('manager','owner'));

-- modifier_groups / modifiers / item_modifier_groups: read within tenant; manager/owner write
create policy auth_read_modgroups on public.modifier_groups for select to authenticated using (tenant_id = public.auth_tenant_id());
create policy mgr_write_modgroups on public.modifier_groups for all to authenticated
  using (tenant_id = public.auth_tenant_id() and public.auth_role() in ('manager','owner'))
  with check (tenant_id = public.auth_tenant_id() and public.auth_role() in ('manager','owner'));
create policy auth_read_modifiers on public.modifiers for select to authenticated using (tenant_id = public.auth_tenant_id());
create policy mgr_write_modifiers on public.modifiers for all to authenticated
  using (tenant_id = public.auth_tenant_id() and public.auth_role() in ('manager','owner'))
  with check (tenant_id = public.auth_tenant_id() and public.auth_role() in ('manager','owner'));
create policy auth_read_item_mods on public.item_modifier_groups for select to authenticated using (tenant_id = public.auth_tenant_id());
create policy mgr_write_item_mods on public.item_modifier_groups for all to authenticated
  using (tenant_id = public.auth_tenant_id() and public.auth_role() in ('manager','owner'))
  with check (tenant_id = public.auth_tenant_id() and public.auth_role() in ('manager','owner'));

-- staff: see coworkers in tenant; owner/manager manage them (owner-only for role escalation is enforced app-side in M3)
create policy auth_read_staff  on public.staff for select to authenticated using (tenant_id = public.auth_tenant_id());
create policy mgr_write_staff  on public.staff for all to authenticated
  using (tenant_id = public.auth_tenant_id() and public.auth_role() in ('manager','owner'))
  with check (tenant_id = public.auth_tenant_id() and public.auth_role() in ('manager','owner'));

-- redirects: read within tenant; manager/owner write
create policy auth_read_redirects on public.redirects for select to authenticated using (tenant_id = public.auth_tenant_id());
create policy mgr_write_redirects on public.redirects for all to authenticated
  using (tenant_id = public.auth_tenant_id() and public.auth_role() in ('manager','owner'))
  with check (tenant_id = public.auth_tenant_id() and public.auth_role() in ('manager','owner'));

-- audit_log / menu_events: read own tenant; inserts happen via service role / triggers (bypass RLS)
create policy auth_read_audit  on public.audit_log  for select to authenticated using (tenant_id = public.auth_tenant_id());
create policy auth_read_events on public.menu_events for select to authenticated using (tenant_id = public.auth_tenant_id());

-- orders / order_items (Phase 2): read + advance within tenant; no anon
create policy auth_rw_orders on public.orders for all to authenticated
  using (tenant_id = public.auth_tenant_id())
  with check (tenant_id = public.auth_tenant_id());
create policy auth_rw_order_items on public.order_items for all to authenticated
  using (tenant_id = public.auth_tenant_id())
  with check (tenant_id = public.auth_tenant_id());
