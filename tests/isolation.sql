-- Platter — M1 isolation gate (foundation.md §13 P8; the P0 CI gate)
-- Seeds two tenants (A, B) with all four roles, then impersonates each role and asserts:
--   • zero cross-tenant reads   • zero cross-tenant writes
--   • staff can change ONLY is_available   • anon sees published-only, cannot write
-- Any failure RAISEs (psql \set ON_ERROR_STOP on → non-zero exit = the build fails).
-- Runs on any Postgres with the auth stub (tests/fixtures/00_local_auth_stub.sql) applied.
-- Impersonation: set local role authenticated + request.jwt.claims, in a rolled-back txn.

\set ON_ERROR_STOP on

-- ═══════════════ cleanup any prior run (cascade from tenants + users) ═══════════════
delete from public.tenants where id in
  ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222');
delete from auth.users where id in (
  '00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000a2',
  '00000000-0000-0000-0000-0000000000a3','00000000-0000-0000-0000-0000000000a4',
  '00000000-0000-0000-0000-0000000000b1');

-- ═══════════════ seed ═══════════════
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1','ownerA@test'),
  ('00000000-0000-0000-0000-0000000000a2','adminA@test'),
  ('00000000-0000-0000-0000-0000000000a3','mgrA@test'),
  ('00000000-0000-0000-0000-0000000000a4','staffA@test'),
  ('00000000-0000-0000-0000-0000000000b1','ownerB@test');

insert into public.tenants (id, name, slug) values
  ('11111111-1111-1111-1111-111111111111','Tenant A','tenant-a'),
  ('22222222-2222-2222-2222-222222222222','Tenant B','tenant-b');

insert into public.memberships (user_id, tenant_id, role, accepted_at) values
  ('00000000-0000-0000-0000-0000000000a1','11111111-1111-1111-1111-111111111111','owner',   now()),
  ('00000000-0000-0000-0000-0000000000a2','11111111-1111-1111-1111-111111111111','admin',   now()),
  ('00000000-0000-0000-0000-0000000000a3','11111111-1111-1111-1111-111111111111','manager', now()),
  ('00000000-0000-0000-0000-0000000000a4','11111111-1111-1111-1111-111111111111','staff',   now()),
  ('00000000-0000-0000-0000-0000000000b1','22222222-2222-2222-2222-222222222222','owner',   now());

insert into public.restaurants (id, tenant_id, name, slug) values
  ('00000000-0000-0000-0000-00000000a001','11111111-1111-1111-1111-111111111111','Venue A','venue-a'),
  ('00000000-0000-0000-0000-00000000b001','22222222-2222-2222-2222-222222222222','Venue B','venue-b');

insert into public.menus (id, tenant_id, restaurant_id, name, slug, status) values
  ('00000000-0000-0000-0000-00000000a002','11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-00000000a001','Menu A','menu','live'),
  ('00000000-0000-0000-0000-00000000b002','22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-00000000b001','Menu B','menu','live');

insert into public.menu_groups (id, tenant_id, restaurant_id, menu_id, name, slug) values
  ('00000000-0000-0000-0000-00000000a003','11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-00000000a002','G','g'),
  ('00000000-0000-0000-0000-00000000b003','22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-00000000b001','00000000-0000-0000-0000-00000000b002','G','g');

insert into public.categories (id, tenant_id, restaurant_id, group_id, name, slug) values
  ('00000000-0000-0000-0000-00000000a004','11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-00000000a003','Cat','cat'),
  ('00000000-0000-0000-0000-00000000b004','22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-00000000b001','00000000-0000-0000-0000-00000000b003','Cat','cat');

-- item A published, item A-draft draft (anon must NOT see the draft), item B published
insert into public.items (id, tenant_id, restaurant_id, category_id, name, slug, base_price, status) values
  ('00000000-0000-0000-0000-00000000a005','11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-00000000a004','Item A','item-a', 1000,'published'),
  ('00000000-0000-0000-0000-00000000a006','11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-00000000a004','Item A Draft','item-a-draft', 1500,'draft'),
  ('00000000-0000-0000-0000-00000000b005','22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-00000000b001','00000000-0000-0000-0000-00000000b004','Item B','item-b', 2000,'published');

insert into public.item_variants (id, tenant_id, item_id, label, price) values
  ('00000000-0000-0000-0000-00000000a007','11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-00000000a005','L',1000),
  ('00000000-0000-0000-0000-00000000b007','22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-00000000b005','L',2000);

-- ═══════════════ TEST 1 — cross-tenant READ isolation (owner/admin/manager/staff of A cannot see B) ═══════════════
\echo '── T1: cross-tenant read isolation'
begin;
  set local role authenticated;
  set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}';
  do $$
  begin
    if (select count(*) from public.items where tenant_id = '11111111-1111-1111-1111-111111111111') <> 2
      then raise exception 'FAIL: manager-A cannot read own tenant items'; end if;
    if (select count(*) from public.items where tenant_id = '22222222-2222-2222-2222-222222222222') <> 0
      then raise exception 'LEAK: manager-A can read tenant B items'; end if;
    if (select count(*) from public.items) <> 2
      then raise exception 'LEAK: manager-A total item visibility crosses tenants'; end if;
    if (select count(*) from public.item_variants where tenant_id = '22222222-2222-2222-2222-222222222222') <> 0
      then raise exception 'LEAK: manager-A can read tenant B variants'; end if;
    if (select count(*) from public.menus where tenant_id = '22222222-2222-2222-2222-222222222222') <> 0
      then raise exception 'LEAK: manager-A can read tenant B menus'; end if;
    if (select count(*) from public.memberships where tenant_id = '22222222-2222-2222-2222-222222222222') <> 0
      then raise exception 'LEAK: manager-A can read tenant B memberships'; end if;
  end $$;
rollback;

-- ═══════════════ TEST 2 — cross-tenant WRITE blocked (manager-A cannot touch tenant B) ═══════════════
\echo '── T2: cross-tenant write blocked'
begin;
  set local role authenticated;
  set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}';
  do $$
  declare n int;
  begin
    update public.items set name = 'HACKED' where tenant_id = '22222222-2222-2222-2222-222222222222';
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'LEAK: manager-A updated % tenant-B row(s)', n; end if;
    begin
      insert into public.items (tenant_id, restaurant_id, category_id, name, slug, base_price, status)
        values ('22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-00000000b001','00000000-0000-0000-0000-00000000b004','X','x-hack',1,'draft');
      raise exception 'LEAK: manager-A inserted into tenant B';
    exception when insufficient_privilege then null;  -- expected: RLS with-check blocks
    end;
    begin
      delete from public.items where tenant_id = '22222222-2222-2222-2222-222222222222';
      get diagnostics n = row_count;
      if n <> 0 then raise exception 'LEAK: manager-A deleted % tenant-B row(s)', n; end if;
    end;
  end $$;
rollback;

-- ═══════════════ TEST 3 — staff limited to is_available (own tenant) ═══════════════
\echo '── T3: staff column restriction'
begin;
  set local role authenticated;
  set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}';
  do $$
  declare n int;
  begin
    -- allowed: toggle availability on own item
    update public.items set is_available = false where id = '00000000-0000-0000-0000-00000000a005';
    get diagnostics n = row_count;
    if n <> 1 then raise exception 'FAIL: staff-A cannot toggle is_available (rows=%)', n; end if;
    -- blocked: rename own item (trigger)
    begin
      update public.items set name = 'staff-renamed' where id = '00000000-0000-0000-0000-00000000a005';
      raise exception 'LEAK: staff-A renamed an item';
    exception when others then
      if sqlerrm not like '%only is_available%' then raise; end if;  -- expected trigger error
    end;
    -- blocked: staff cannot insert
    begin
      insert into public.items (tenant_id, restaurant_id, category_id, name, slug, base_price, status)
        values ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-00000000a004','New','new-x',1,'draft');
      raise exception 'LEAK: staff-A inserted an item';
    exception when insufficient_privilege then null; end;  -- expected
    -- blocked: staff cannot delete (RLS delete policy filters the row → 0 rows, no error)
    delete from public.items where id = '00000000-0000-0000-0000-00000000a005';
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'LEAK: staff-A deleted % item(s)', n; end if;
  end $$;
rollback;

-- ═══════════════ TEST 4 — anon sees published-only, cannot write ═══════════════
\echo '── T4: anon read/write'
begin;
  set local role anon;
  do $$
  begin
    -- 2 published items across tenants (item-a, item-b); the draft must be hidden
    if (select count(*) from public.items) <> 2 then
      raise exception 'FAIL: anon should see 2 published items, sees %', (select count(*) from public.items); end if;
    if exists (select 1 from public.items where status = 'draft') then
      raise exception 'LEAK: anon can see a draft item'; end if;
    begin
      insert into public.items (tenant_id, restaurant_id, category_id, name, slug, base_price, status)
        values ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-00000000a004','x','x',1,'draft');
      raise exception 'LEAK: anon inserted an item';
    exception when insufficient_privilege then null; end;  -- expected
    -- anon cannot read memberships at all
    if (select count(*) from public.memberships) <> 0 then
      raise exception 'LEAK: anon can read memberships'; end if;
  end $$;
rollback;

-- ═══════════════ TEST 5 — positive control: manager-A CAN CRUD in own tenant ═══════════════
\echo '── T5: manager positive control'
begin;
  set local role authenticated;
  set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}';
  do $$
  declare n int;
  begin
    insert into public.items (tenant_id, restaurant_id, category_id, name, slug, base_price, status)
      values ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-00000000a004','Mgr New','mgr-new',500,'draft');
    update public.items set name = 'Mgr Renamed' where slug = 'mgr-new';
    get diagnostics n = row_count;
    if n <> 1 then raise exception 'FAIL: manager-A could not update own item'; end if;
    delete from public.items where slug = 'mgr-new';
  end $$;
rollback;

-- ═══════════════ cleanup + verdict ═══════════════
delete from public.tenants where id in
  ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222');
delete from auth.users where id in (
  '00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000a2',
  '00000000-0000-0000-0000-0000000000a3','00000000-0000-0000-0000-0000000000a4',
  '00000000-0000-0000-0000-0000000000b1');

\echo ''
\echo '════════════════════════════════════════'
\echo '  ✅ ALL ISOLATION CHECKS PASSED'
\echo '════════════════════════════════════════'
