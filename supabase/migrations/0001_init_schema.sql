-- Platter — 0001 init schema
-- Source: docs/PRD-jin-canting-menu.md §8 + the tenant seam (context/architecture.md → Data & tenancy).
-- Every tenant-owned table carries a denormalized tenant_id for flat RLS (foundation.md §7 #12).

create extension if not exists pg_trgm;

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- ─────────────────────────── tenancy ───────────────────────────
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  custom_domain text unique,                    -- SaaS phase; null in v1
  plan text not null default 'free',            -- plan tiers, SaaS phase
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants on delete cascade,
  name text not null,
  name_zh text,
  slug text not null,
  logo_url text,
  hero_image_url text,
  currency char(3) not null default 'NGN',
  locale text not null default 'en-NG',
  timezone text not null default 'Africa/Lagos',
  phone text, whatsapp text, address text,
  theme jsonb not null default '{}'::jsonb,      -- only --color-accent is honored in v1 (ui-tokens.md §2)
  ordering_enabled boolean not null default false,
  sold_out_reset_time time not null default '06:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create table public.opening_hours (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants on delete cascade,
  restaurant_id uuid not null references public.restaurants on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens time, closes time,
  is_closed boolean not null default false
);

-- ─────────────────────────── menu tree ───────────────────────────
create table public.menu_groups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants on delete cascade,
  restaurant_id uuid not null references public.restaurants on delete cascade,
  name text not null, name_zh text, slug text not null,
  sort_order double precision not null default 1000,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, slug)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants on delete cascade,
  restaurant_id uuid not null references public.restaurants on delete cascade,
  group_id uuid references public.menu_groups on delete set null,
  name text not null, name_zh text, description text,
  slug text not null,
  image_url text,
  sort_order double precision not null default 1000,
  is_active boolean not null default true,
  available_from time, available_to time,        -- daypart, null = always
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, slug)
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants on delete cascade,
  restaurant_id uuid not null references public.restaurants on delete cascade,
  category_id uuid not null references public.categories on delete restrict,
  name text not null, name_zh text,
  description text, description_zh text,
  slug text not null,
  base_price numeric(12,2) not null check (base_price >= 0),
  compare_at_price numeric(12,2),
  image_url text, image_blurhash text,
  sort_order double precision not null default 1000,
  is_available boolean not null default true,
  is_featured boolean not null default false,     -- "Chef's pick"
  spice_level smallint not null default 0 check (spice_level between 0 and 3),
  dietary_tags text[] not null default '{}',      -- vegetarian, vegan, contains_pork, seafood, gluten_free
  allergens text[] not null default '{}',
  prep_time_minutes smallint,
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, slug)
);

create table public.item_variants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants on delete cascade,
  item_id uuid not null references public.items on delete cascade,
  label text not null, label_zh text,
  price numeric(12,2) not null check (price >= 0),  -- absolute, not a delta
  sort_order double precision not null default 1000,
  is_available boolean not null default true
);

create table public.modifier_groups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants on delete cascade,
  restaurant_id uuid not null references public.restaurants on delete cascade,
  name text not null, name_zh text,
  min_select smallint not null default 0,
  max_select smallint not null default 1,
  is_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.modifiers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants on delete cascade,
  group_id uuid not null references public.modifier_groups on delete cascade,
  name text not null, name_zh text,
  price_delta numeric(12,2) not null default 0,
  sort_order double precision not null default 1000,
  is_available boolean not null default true
);

create table public.item_modifier_groups (
  tenant_id uuid not null references public.tenants on delete cascade,
  item_id uuid not null references public.items on delete cascade,
  group_id uuid not null references public.modifier_groups on delete cascade,
  sort_order double precision not null default 1000,
  primary key (item_id, group_id)
);

-- ─────────────────────────── people & ops ───────────────────────────
create table public.staff (
  id uuid primary key references auth.users on delete cascade,
  tenant_id uuid not null references public.tenants on delete cascade,
  restaurant_id uuid references public.restaurants on delete set null,
  full_name text, email text,
  role text not null check (role in ('owner','manager','staff')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.redirects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants on delete cascade,
  from_path text unique not null,
  to_path text not null,
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  tenant_id uuid,
  actor_id uuid, entity text not null, entity_id uuid,
  action text not null, before jsonb, after jsonb,
  created_at timestamptz not null default now()
);

create table public.menu_events (            -- analytics, append-only
  id bigint generated always as identity primary key,
  tenant_id uuid,
  restaurant_id uuid, session_id text,
  event text not null,                        -- view_menu | view_category | view_item | search | filter
  entity_id uuid, payload jsonb,
  created_at timestamptz not null default now()
);

-- ─────────────────────────── Phase 2 (spec'd now, unused in v1) ───────────────────────────
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants on delete cascade,
  restaurant_id uuid not null references public.restaurants on delete cascade,
  daily_number int not null,
  service_mode text not null check (service_mode in ('dine_in','room_service','takeaway')),
  table_number text, room_number text,
  guest_name text, guest_phone text, notes text,
  status text not null default 'new' check (status in ('new','preparing','ready','served','cancelled')),
  subtotal numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants on delete cascade,
  order_id uuid not null references public.orders on delete cascade,
  item_id uuid references public.items on delete set null,
  variant_id uuid references public.item_variants on delete set null,
  name_snapshot text not null,                -- never join to items for history
  unit_price numeric(12,2) not null,
  quantity smallint not null default 1,
  modifiers jsonb not null default '[]'::jsonb,
  notes text
);

-- ─────────────────────────── indexes ───────────────────────────
create index idx_items_category_sort       on public.items (category_id, sort_order);
create index idx_items_status_deleted      on public.items (status, deleted_at);
create index idx_items_tenant              on public.items (tenant_id);
create index idx_items_restaurant          on public.items (restaurant_id);
create index idx_items_dietary_gin         on public.items using gin (dietary_tags);
create index idx_items_name_trgm           on public.items using gin (name gin_trgm_ops);
create index idx_categories_restaurant_sort on public.categories (restaurant_id, sort_order);
create index idx_categories_tenant         on public.categories (tenant_id);
create index idx_menu_groups_restaurant_sort on public.menu_groups (restaurant_id, sort_order);
create index idx_item_variants_item        on public.item_variants (item_id, sort_order);
create index idx_opening_hours_restaurant  on public.opening_hours (restaurant_id);
create index idx_staff_tenant              on public.staff (tenant_id);
create index idx_menu_events_created       on public.menu_events (created_at);
create index idx_menu_events_tenant        on public.menu_events (tenant_id, created_at);
create index idx_orders_status_created     on public.orders (status, created_at);

-- ─────────────────────────── updated_at triggers ───────────────────────────
create trigger trg_tenants_updated       before update on public.tenants       for each row execute function public.set_updated_at();
create trigger trg_restaurants_updated   before update on public.restaurants   for each row execute function public.set_updated_at();
create trigger trg_menu_groups_updated   before update on public.menu_groups   for each row execute function public.set_updated_at();
create trigger trg_categories_updated    before update on public.categories    for each row execute function public.set_updated_at();
create trigger trg_items_updated         before update on public.items         for each row execute function public.set_updated_at();
create trigger trg_modifier_groups_updated before update on public.modifier_groups for each row execute function public.set_updated_at();
create trigger trg_staff_updated         before update on public.staff         for each row execute function public.set_updated_at();
