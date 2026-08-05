-- Platter — 0007 Phase 2: RLS rewrite for the membership model
-- Authority: context/security.md + foundation.md §13 (P4, P8, C1).
-- Replaces 0002's staff-based single-tenant scoping with membership-based, multi-tenant,
-- role-aware scoping. Key swap: auth_tenant_id() (one tenant, off `staff`) →
-- auth_tenant_ids() (array, off `memberships`). Roles are PER-TENANT now.
--
-- Invariants preserved: (a) every authenticated read/write is tenant-scoped; (b) staff may
-- change ONLY is_available (column-guard triggers); (c) GUEST reads NEVER gate on plan_status (§13 C1);
-- (d) SECURITY DEFINER helpers avoid RLS recursion. Venue-level scoping of managers (venue_ids)
-- is enforced app-side for now; the P0 boundary (tenant isolation) is enforced here.

-- ═══════════════ membership-based helpers (SECURITY DEFINER → bypass RLS, no recursion) ═══════════════
create or replace function public.auth_tenant_ids() returns uuid[]
  language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(tenant_id), '{}')
  from public.memberships where user_id = auth.uid() and accepted_at is not null
$$;

create or replace function public.auth_role_in(tid uuid) returns text
  language sql stable security definer set search_path = public as $$
  select role from public.memberships
  where user_id = auth.uid() and tenant_id = tid and accepted_at is not null
$$;

create or replace function public.auth_can_manage(tid uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select public.auth_role_in(tid) in ('owner','admin','manager')
$$;

create or replace function public.auth_is_admin(tid uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select public.auth_role_in(tid) in ('owner','admin')
$$;

-- helpers are for authenticated only; never callable by anon (advisor hardening, cf. 0004)
revoke execute on function public.auth_tenant_ids(), public.auth_role_in(uuid),
  public.auth_can_manage(uuid), public.auth_is_admin(uuid) from anon, public;
grant execute on function public.auth_tenant_ids(), public.auth_role_in(uuid),
  public.auth_can_manage(uuid), public.auth_is_admin(uuid) to authenticated;

-- ═══════════════ staff column-guard triggers → per-tenant role ═══════════════
create or replace function public.enforce_staff_item_availability_only()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.auth_role_in(new.tenant_id) = 'staff' then
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
    then raise exception 'staff role may modify only is_available on items'; end if;
  end if;
  return new;
end; $$;

create or replace function public.enforce_staff_variant_availability_only()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.auth_role_in(new.tenant_id) = 'staff' then
    if row(new.tenant_id, new.item_id, new.label, new.label_zh, new.price, new.sort_order)
       is distinct from
       row(old.tenant_id, old.item_id, old.label, old.label_zh, old.price, old.sort_order)
    then raise exception 'staff role may modify only is_available on item_variants'; end if;
  end if;
  return new;
end; $$;

-- ═══════════════ drop every existing public policy, then recreate against the new helpers ═══════════════
do $$
declare r record;
begin
  for r in select tablename, policyname from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- enable RLS on the new tables (existing tables already have it from 0002)
alter table public.memberships         enable row level security;
alter table public.menus               enable row level security;
alter table public.menu_schedules      enable row level security;
alter table public.invites             enable row level security;
alter table public.qr_codes            enable row level security;
alter table public.qr_scans            enable row level security;
alter table public.subscriptions       enable row level security;
alter table public.imports             enable row level security;
alter table public.domain_verifications enable row level security;

-- ═══════════════════════════ ANON (public menu) — published/live only, NEVER plan-gated (§13 C1) ═══════════════════════════
create policy anon_read_restaurants   on public.restaurants   for select to anon using (true);
create policy anon_read_opening_hours on public.opening_hours for select to anon using (true);
create policy anon_read_menus         on public.menus         for select to anon using (status = 'live' and deleted_at is null);
create policy anon_read_schedules     on public.menu_schedules for select to anon using (true);
create policy anon_read_groups        on public.menu_groups   for select to anon using (is_active);
create policy anon_read_categories    on public.categories    for select to anon using (is_active and deleted_at is null);
create policy anon_read_items         on public.items         for select to anon using (status = 'published' and deleted_at is null);
create policy anon_read_variants      on public.item_variants for select to anon
  using (is_available and exists (select 1 from public.items i
    where i.id = item_variants.item_id and i.status = 'published' and i.deleted_at is null));
create policy anon_read_modgroups on public.modifier_groups     for select to anon using (true);
create policy anon_read_modifiers on public.modifiers           for select to anon using (is_available);
create policy anon_read_item_mods on public.item_modifier_groups for select to anon using (true);
create policy anon_read_redirects on public.redirects          for select to anon using (true);
-- analytics beacons: anon may append, never read
create policy anon_write_events   on public.menu_events for insert to anon with check (true);
create policy anon_write_scans    on public.qr_scans   for insert to anon with check (true);

-- ═══════════════════════════ AUTHENTICATED — tenant-scoped via auth_tenant_ids() ═══════════════════════════
-- tenants: read own; owner updates
create policy auth_read_tenant  on public.tenants for select to authenticated using (id = any(public.auth_tenant_ids()));
create policy owner_upd_tenant  on public.tenants for update to authenticated
  using (public.auth_role_in(id) = 'owner') with check (public.auth_role_in(id) = 'owner');

-- memberships: see your own + coworkers in-tenant; owner/admin manage
create policy auth_read_members on public.memberships for select to authenticated
  using (user_id = auth.uid() or tenant_id = any(public.auth_tenant_ids()));
create policy admin_write_members on public.memberships for all to authenticated
  using (public.auth_is_admin(tenant_id)) with check (public.auth_is_admin(tenant_id));

-- restaurants (venues): public info readable to all authenticated; owner/admin write
create policy auth_read_restaurants on public.restaurants for select to authenticated using (true);
create policy admin_write_restaurants on public.restaurants for all to authenticated
  using (public.auth_is_admin(tenant_id)) with check (public.auth_is_admin(tenant_id));

-- opening_hours: read in-tenant; manager+ write
create policy auth_read_hours on public.opening_hours for select to authenticated using (tenant_id = any(public.auth_tenant_ids()));
create policy mgr_write_hours on public.opening_hours for all to authenticated
  using (public.auth_can_manage(tenant_id)) with check (public.auth_can_manage(tenant_id));

-- menus: read in-tenant; manager+ write
create policy auth_read_menus on public.menus for select to authenticated using (tenant_id = any(public.auth_tenant_ids()));
create policy mgr_write_menus on public.menus for all to authenticated
  using (public.auth_can_manage(tenant_id)) with check (public.auth_can_manage(tenant_id));

-- menu_schedules
create policy auth_read_schedules on public.menu_schedules for select to authenticated using (tenant_id = any(public.auth_tenant_ids()));
create policy mgr_write_schedules on public.menu_schedules for all to authenticated
  using (public.auth_can_manage(tenant_id)) with check (public.auth_can_manage(tenant_id));

-- menu_groups
create policy auth_read_groups on public.menu_groups for select to authenticated using (tenant_id = any(public.auth_tenant_ids()));
create policy mgr_ins_groups   on public.menu_groups for insert to authenticated with check (public.auth_can_manage(tenant_id));
create policy mgr_upd_groups   on public.menu_groups for update to authenticated using (public.auth_can_manage(tenant_id)) with check (public.auth_can_manage(tenant_id));
create policy mgr_del_groups   on public.menu_groups for delete to authenticated using (public.auth_can_manage(tenant_id));

-- categories
create policy auth_read_categories on public.categories for select to authenticated using (tenant_id = any(public.auth_tenant_ids()));
create policy mgr_ins_categories   on public.categories for insert to authenticated with check (public.auth_can_manage(tenant_id));
create policy mgr_upd_categories   on public.categories for update to authenticated using (public.auth_can_manage(tenant_id)) with check (public.auth_can_manage(tenant_id));
create policy mgr_del_categories   on public.categories for delete to authenticated using (public.auth_can_manage(tenant_id));

-- items: read in-tenant; insert/delete manager+; UPDATE open to any in-tenant (staff column-guarded by trigger)
create policy auth_read_items on public.items for select to authenticated using (tenant_id = any(public.auth_tenant_ids()));
create policy mgr_ins_items   on public.items for insert to authenticated with check (public.auth_can_manage(tenant_id));
create policy any_upd_items   on public.items for update to authenticated using (tenant_id = any(public.auth_tenant_ids())) with check (tenant_id = any(public.auth_tenant_ids()));
create policy mgr_del_items   on public.items for delete to authenticated using (public.auth_can_manage(tenant_id));

-- item_variants: same staff/manager split
create policy auth_read_variants on public.item_variants for select to authenticated using (tenant_id = any(public.auth_tenant_ids()));
create policy mgr_ins_variants   on public.item_variants for insert to authenticated with check (public.auth_can_manage(tenant_id));
create policy any_upd_variants   on public.item_variants for update to authenticated using (tenant_id = any(public.auth_tenant_ids())) with check (tenant_id = any(public.auth_tenant_ids()));
create policy mgr_del_variants   on public.item_variants for delete to authenticated using (public.auth_can_manage(tenant_id));

-- modifier_groups / modifiers / item_modifier_groups: read in-tenant; manager+ write
create policy auth_read_modgroups on public.modifier_groups for select to authenticated using (tenant_id = any(public.auth_tenant_ids()));
create policy mgr_write_modgroups on public.modifier_groups for all to authenticated using (public.auth_can_manage(tenant_id)) with check (public.auth_can_manage(tenant_id));
create policy auth_read_modifiers on public.modifiers for select to authenticated using (tenant_id = any(public.auth_tenant_ids()));
create policy mgr_write_modifiers on public.modifiers for all to authenticated using (public.auth_can_manage(tenant_id)) with check (public.auth_can_manage(tenant_id));
create policy auth_read_item_mods on public.item_modifier_groups for select to authenticated using (tenant_id = any(public.auth_tenant_ids()));
create policy mgr_write_item_mods on public.item_modifier_groups for all to authenticated using (public.auth_can_manage(tenant_id)) with check (public.auth_can_manage(tenant_id));

-- staff (legacy table; memberships is the source of truth now): read in-tenant; admin manage
create policy auth_read_staff on public.staff for select to authenticated using (tenant_id = any(public.auth_tenant_ids()));
create policy admin_write_staff on public.staff for all to authenticated using (public.auth_is_admin(tenant_id)) with check (public.auth_is_admin(tenant_id));

-- redirects: read in-tenant; manager+ write
create policy auth_read_redirects on public.redirects for select to authenticated using (tenant_id = any(public.auth_tenant_ids()));
create policy mgr_write_redirects on public.redirects for all to authenticated using (public.auth_can_manage(tenant_id)) with check (public.auth_can_manage(tenant_id));

-- audit_log / menu_events: read in-tenant (inserts via service role / triggers, which bypass RLS)
create policy auth_read_audit  on public.audit_log  for select to authenticated using (tenant_id = any(public.auth_tenant_ids()));
create policy auth_read_events on public.menu_events for select to authenticated using (tenant_id = any(public.auth_tenant_ids()));

-- qr_codes / qr_scans: read in-tenant; manager+ write codes
create policy auth_read_qr    on public.qr_codes for select to authenticated using (tenant_id = any(public.auth_tenant_ids()));
create policy mgr_write_qr    on public.qr_codes for all to authenticated using (public.auth_can_manage(tenant_id)) with check (public.auth_can_manage(tenant_id));
create policy auth_read_scans on public.qr_scans for select to authenticated using (tenant_id = any(public.auth_tenant_ids()));

-- invites / imports / domain_verifications: admin/manager scoped
create policy admin_rw_invites on public.invites for all to authenticated using (public.auth_is_admin(tenant_id)) with check (public.auth_is_admin(tenant_id));
create policy mgr_rw_imports   on public.imports for all to authenticated using (public.auth_can_manage(tenant_id)) with check (public.auth_can_manage(tenant_id));
create policy admin_rw_domains on public.domain_verifications for all to authenticated using (public.auth_is_admin(tenant_id)) with check (public.auth_is_admin(tenant_id));

-- subscriptions: read by admin+; writes only via service role (bypasses RLS) — no authenticated write policy
create policy admin_read_subs on public.subscriptions for select to authenticated using (public.auth_is_admin(tenant_id));

-- orders / order_items (Phase 3): read + advance in-tenant
create policy auth_rw_orders      on public.orders      for all to authenticated using (tenant_id = any(public.auth_tenant_ids())) with check (tenant_id = any(public.auth_tenant_ids()));
create policy auth_rw_order_items on public.order_items for all to authenticated using (tenant_id = any(public.auth_tenant_ids())) with check (tenant_id = any(public.auth_tenant_ids()));
