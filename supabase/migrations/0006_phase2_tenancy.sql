-- Platter — 0006 Phase 2: tenancy seam (structural)
-- Authority: foundation.md §13. Runs on a non-prod DB first (§13 C2).
--
-- Adds the platform's real shape WITHOUT the cosmetic restaurants→venues rename
-- (deferred; `restaurants` IS the venue — architecture.md). The load-bearing change is
-- the NEW `menus` layer between a venue and its groups, plus `memberships` (multi-tenant,
-- multi-role, venue-scoped) which replaces staff-based single-tenant scoping in 0007.
--
-- Order: new tables → column adds → backfill → tighten (set not null). One transaction.

-- ─────────────── memberships: user × tenant, multi-role, venue-scoped ───────────────
create table public.memberships (
  user_id uuid not null references auth.users on delete cascade,
  tenant_id uuid not null references public.tenants on delete cascade,
  role text not null check (role in ('owner','admin','manager','staff')),
  venue_ids uuid[],                       -- null = all venues in the tenant
  invited_by uuid references auth.users on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, tenant_id)
);
create index idx_memberships_tenant on public.memberships (tenant_id);
create trigger trg_memberships_updated before update on public.memberships
  for each row execute function public.set_updated_at();

-- ─────────────── tenants: plan_status + billing (Phase 2) ───────────────
alter table public.tenants
  add column plan_status text not null default 'active',   -- gates FEATURES, never menu visibility (§13 C1)
  add column billing_provider text check (billing_provider in ('paystack','stripe')),
  add column billing_customer_id text,
  add column trial_ends_at timestamptz;

-- ─────────────── venue identity (restaurants = the venue; add Phase-2 fields) ───────────────
alter table public.restaurants
  add column cuisine text,
  add column description text,
  add column cover_url text,
  add column custom_domain text unique,                    -- per-venue; Pro+ (was on tenants, unused)
  add column domain_verified_at timestamptz,
  add column is_listed boolean not null default false,     -- /discover opt-in
  add column lat numeric,
  add column lng numeric,
  add column status text not null default 'active' check (status in ('active','paused'));
-- venue slug is the public subdomain → globally unique
create unique index uq_restaurants_slug_global on public.restaurants (slug);

-- ─────────────── menus: NEW layer (venue → menu → group) ───────────────
create table public.menus (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants on delete cascade,
  restaurant_id uuid not null references public.restaurants on delete cascade,   -- the venue
  name text not null, name_zh text,
  slug text not null,
  description text,
  theme_id text not null default 'lacquer',
  theme_config jsonb not null default '{}'::jsonb,         -- layout lives in here (§13 C4)
  theme_config_draft jsonb,
  is_default boolean not null default false,
  status text not null default 'draft' check (status in ('draft','live','archived')),
  hidden_when_unavailable boolean not null default false,
  sort_order double precision not null default 1000,
  published_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, slug)
);
create index idx_menus_restaurant_status on public.menus (restaurant_id, status);
create index idx_menus_tenant on public.menus (tenant_id);
create trigger trg_menus_updated before update on public.menus
  for each row execute function public.set_updated_at();

-- ─────────────── menu_schedules (per-weekday availability window) ───────────────
create table public.menu_schedules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants on delete cascade,
  menu_id uuid not null references public.menus on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  starts_at time, ends_at time,
  all_day boolean not null default false
);
create index idx_menu_schedules_menu on public.menu_schedules (menu_id);

-- ─────────────── re-parent groups under a menu ───────────────
-- (modifier_groups already carry restaurant_id + tenant_id in v1 — §13 C5 was already satisfied.)
alter table public.menu_groups add column menu_id uuid references public.menus on delete cascade;
create index idx_menu_groups_menu_sort on public.menu_groups (menu_id, sort_order);

-- ─────────────── platform tables ───────────────
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants on delete cascade,
  email text not null,
  role text not null check (role in ('owner','admin','manager','staff')),
  venue_ids uuid[],
  token text unique not null,
  invited_by uuid references auth.users on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_invites_tenant on public.invites (tenant_id);

create table public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants on delete cascade,
  restaurant_id uuid not null references public.restaurants on delete cascade,
  menu_id uuid references public.menus on delete set null,
  label text, table_number text,
  target_path text not null,
  style jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_qr_codes_restaurant on public.qr_codes (restaurant_id);

create table public.qr_scans (
  id bigint generated always as identity primary key,
  tenant_id uuid,
  qr_code_id uuid references public.qr_codes on delete cascade,
  session_id text,
  created_at timestamptz not null default now()
);
create index idx_qr_scans_code_created on public.qr_scans (qr_code_id, created_at);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid unique not null references public.tenants on delete cascade,
  provider text check (provider in ('paystack','stripe')),
  external_id text,
  plan text not null default 'free',
  status text not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table public.imports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants on delete cascade,
  restaurant_id uuid references public.restaurants on delete set null,
  source text check (source in ('pdf','image','csv','text')),
  file_url text, status text, result jsonb, accuracy_score numeric,
  created_at timestamptz not null default now()
);

create table public.domain_verifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants on delete cascade,
  restaurant_id uuid not null references public.restaurants on delete cascade,
  domain text not null,
  token text not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

-- ═══════════════ backfill (idempotent; no-ops on the empty local DB, real work on prod) ═══════════════
-- 1. one default 'Menu' per venue (carries the live status so existing menus stay live)
insert into public.menus (tenant_id, restaurant_id, name, slug, is_default, status, published_at)
select r.tenant_id, r.id, 'Menu', 'menu', true, 'live', now()
from public.restaurants r;

-- 2. attach every existing group to its venue's default menu
update public.menu_groups g
set menu_id = m.id
from public.menus m
where m.restaurant_id = g.restaurant_id and m.is_default = true;

-- 3. memberships from existing staff (owner/manager/staff carry over; 'admin' is new). §13 C3.
insert into public.memberships (user_id, tenant_id, role, venue_ids, accepted_at, created_at)
select s.id, s.tenant_id, s.role, null, now(), s.created_at
from public.staff s
on conflict (user_id, tenant_id) do nothing;

-- 4. one subscriptions row per tenant mirroring its current plan
insert into public.subscriptions (tenant_id, plan, status)
select t.id, t.plan, 'active' from public.tenants t
on conflict (tenant_id) do nothing;

-- ═══════════════ tighten: groups must belong to a menu now that they're backfilled ═══════════════
alter table public.menu_groups alter column menu_id set not null;
