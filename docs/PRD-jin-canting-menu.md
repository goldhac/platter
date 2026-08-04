<!--
════════════════════════════════════════════════════════════════════════
  ORIGIN BRIEF — preserved as-authored. This is the document the project
  started from; it holds detail the context system defers to (wireframes,
  full SQL schema, the D1–D12 defect audit, the migration plan).

  ⚠️ NOT the current source of truth. `context/foundation.md` supersedes
  this file wherever they differ — most importantly:

    • Tenancy: this PRD lists "Multi-tenant SaaS" as a NON-GOAL. That was
      overridden on 2026-08-04. The product is now a multi-tenant PLATFORM
      (codename "Platter") whose v1 ships a single tenant (Jīn Cāntīng).
      The data model carries a tenant seam (`tenants` + denormalized
      `tenant_id` + RLS) from day one. See foundation.md §7 #11/#12,
      architecture.md → Data & tenancy, and security.md.

  When this file and foundation.md disagree, foundation.md wins.
════════════════════════════════════════════════════════════════════════
-->

# PRD — Jīn Cāntīng Digital Menu & Menu Manager

**Product:** Custom-built online menu + admin CMS for Jīn Cāntīng (金餐厅), the Chinese restaurant at De Geogold Hotel.
**Replaces:** Instalacarte QR-menu SaaS (`menu.instalacarte.com/menu/s/en/DE-GEOGOLD-HOTEL`)
**Owner:** Gold Nwobu
**Status:** Ready to build
**Intended reader:** Claude Code (this document is the build spec — implement against it section by section)

---

## 1. Why we're rebuilding

The restaurant currently rents a page on a shared QR-menu platform. It works, but it is a rented template with real defects, and every meaningful improvement is behind a $20–$40/month paywall (branding, custom domain, translations, multi-outlet).

### 1.1 Audit of the current menu — confirmed defects

| # | Defect | Evidence | Impact |
|---|---|---|---|
| D1 | **Currency renders as `$`, amounts are Naira** | `CHICKEN SAMOSA — 6,000.00 $` | A guest reads "six thousand dollars." Catastrophic for trust; worst bug on the page. |
| D2 | **Category URLs are template leftovers** | APPETIZERS → `/burgers/`, NOODLES → `/salads/`, CHICKEN DISHES → `/deserts/`, SOUP → `/k/` | Unshareable links, zero SEO, looks unmaintained if a guest glances at the URL bar. |
| D3 | **Price printed twice on every card** | `...6,000.00 $ ...6,000.00 $` | Sloppy. |
| D4 | **Descriptions hard-truncated mid-word** | "These golden parcels of delight ar..." | Copy that was written well is wasted. |
| D5 | **Generic emoji PNGs as category art** | 🥡 🍝 🍗 🐖 | Reads as a free tool, not a hotel restaurant. |
| D6 | **19 flat categories, no hierarchy, no search** | Full list below | Guests thumb-scroll a wall of chips to find soup. |
| D7 | **Portion counts baked into item names** | "FRIED JUMBO SHRIMP 6 PIECES", "HOT CHICKEN WINGS", "Deep Fried Butterfly King Prawn(2pcs)" | No real variant support; can't offer 6pc/12pc without duplicate items. |
| D8 | **Inconsistent naming** | `ALL CAPS` vs `Title Case` vs `De-Geogold Cripsy Beef` (typo: "Cripsy") | Uneven, unedited. |
| D9 | **No dietary / spice / allergen data** | — | Hotel guests, especially international ones, ask; staff answer by memory. |
| D10 | **No sold-out state** | — | Kitchen runs out of lobster; menu keeps selling it. |
| D11 | **Identity is muddled** | Chinese + Nigerian + Cafe Pizza + Shawarma + Wines + Smoothies under one "Chinese Restaurant" header | The Chinese offer, which is the premium part, is buried among 19 equal-weight tiles. |
| D12 | **No ownership** | "powered by instalacarte" footer, no data export, no analytics, no domain | Zero brand equity, zero insight into what guests actually browse. |

### 1.2 What the current system does right (keep these)

- Dynamic QR — the printed code never changes when the menu changes. **Non-negotiable for v1.**
- Zero-install: camera scan → web page. No app.
- Genuinely good item descriptions already written (reuse them verbatim in migration).
- Ordering exists for dine-in / takeaway / delivery.
- Menu-only mode (ordering can be switched off).

### 1.3 Current category inventory (migrate all of it)

`APPETIZERS · NOODLES · CHICKEN DISHES · SOUP · PORK DISHES · BEEF DISHES · SEA FOOD DISHES · NIGERIAN DISHES · FISH DISHES · RICE DISHES · CAFE PIZZA · SALAD · SHAWARMA · SMOOTHIES · MOCKTAILS · SNACKS AND ICE CREAM · DRINKS · WINES · SPIRITS / CREAM LIQUOR`

Note "SHAWAMA" and "DRNKS" are misspelled in the live menu — fix on migration.

---

## 2. Goals

**G1.** Own the menu: own domain, own database, own design, no third-party footer, no per-feature paywall.
**G2.** Ship a menu that looks like it belongs to a hotel restaurant, not a free QR generator.
**G3.** Give non-technical staff a manager where adding, editing, reordering, hiding, and deleting items takes seconds on a phone — this is the core requirement, not an afterthought.
**G4.** Fix all D1–D12.
**G5.** Load fast on a mid-range Android on Nigerian mobile data — the entire product is worthless if it doesn't.

### Non-goals (v1)

- Online payment capture (Paystack/Flutterwave comes in Phase 3).
- POS integration.
- Native iOS/Android apps (PWA only).
- Delivery-driver dispatch/logistics.
- Multi-tenant SaaS. This is single-restaurant with a multi-outlet-capable schema, not a product for other restaurants.
  <!-- SUPERSEDED 2026-08-04 — now a multi-tenant platform; see foundation.md §7 #11/#12. -->

### Success metrics

| Metric | Target |
|---|---|
| Lighthouse mobile performance | ≥ 90 |
| LCP on Moto G Power / Slow 4G | < 2.0s |
| Time for a manager to mark an item sold out | < 10 seconds from phone lock screen |
| Time to add a full new item with photo | < 90 seconds |
| Menu pages with correct, shareable slugs | 100% |
| Item detail views per session | ≥ 3 (baseline unknown — instrument from day 1) |

---

## 3. Users

| Role | Who | Needs |
|---|---|---|
| **Guest** | Hotel guest, walk-in diner, someone sent a link on WhatsApp | Browse, search, understand what a dish is, see a real price in ₦, maybe order to their room |
| **Manager** | Restaurant manager / supervisor | Full CRUD on menu, pricing, photos, availability, QR codes, view analytics |
| **Staff** | Waiter, bar, kitchen | Toggle availability only; view incoming orders (Phase 2) |
| **Owner/Admin** | Gold | Everything, plus staff accounts, settings, outlets, audit log |

RBAC: `owner > manager > staff`. Enforce in Postgres RLS **and** in the app layer. Never rely on hiding UI.

---

## 4. Scope

### Phase 1 — MVP (build this first, ship it, then stop and review)

Public menu + Menu Manager + QR. **No ordering.** The current menu's ordering is barely used; a beautiful, correct, fast menu with a real manager is the whole win.

### Phase 2 — Ordering

Cart, dine-in (table no.) / room service (room no.) / takeaway, order board with sound alert, WhatsApp handoff.

### Phase 3 — Growth

Paystack payments, 中文 + French translations, guest feedback, second outlet (hotel bar / cafe) under the same account, marketing/QR campaign tracking.

---

## 5. Public menu — requirements

### 5.1 Information architecture

Two-level, not flat. This directly fixes D6 and D11.

```
JĪN CĀNTĪNG
├── Chinese Kitchen        ← the house identity, first and largest
│   ├── Appetizers · Soup · Dim Sum
│   ├── Noodles · Rice
│   └── Chicken · Beef · Pork · Seafood · Fish
├── Local Kitchen
│   └── Nigerian Dishes
├── Grill & Fast
│   └── Pizza · Shawarma · Snacks & Ice Cream · Salad
└── Drinks
    └── Smoothies · Mocktails · Soft Drinks · Wines · Spirits & Liqueurs
```

Groups are a display device only — every category remains an independently manageable row in the DB, and the manager can reassign a category to a different group.

### 5.2 Functional requirements

| ID | Requirement | Acceptance criteria |
|---|---|---|
| P1 | **Menu landing** shows restaurant name, bilingual mark (金餐厅 / Jīn Cāntīng), hours, open/closed pill, and the group → category navigation | Renders server-side; no layout shift on load |
| P2 | **Sticky category rail** — horizontally scrollable chips, active chip syncs with scroll position | Scrollspy accurate within ±40px; tapping a chip smooth-scrolls; rail auto-scrolls the active chip into view |
| P3 | **Item row** shows name, 1-line clamped description with `…`, price, thumbnail, and tag pills | Description clamps by CSS line-clamp — never truncated server-side (fixes D4). Price appears **once** (fixes D3) |
| P4 | **Item detail** opens as a bottom sheet, not a page navigation | URL updates to `/menu/[category]/[item]` via shallow routing so the link is shareable and back-button closes the sheet |
| P5 | **Search** across item name + description + tags | Client-side, fuzzy, results in <100ms on a 400-item menu; empty state suggests categories |
| P6 | **Filters** — Vegetarian, Contains pork, Seafood, Spicy, Chef's picks | Multi-select chips; result count shown; state in URL query |
| P7 | **Prices in ₦ with en-NG grouping** | `₦6,000` — no decimals for whole amounts, `₦19,500` not `19,500.00 $` (fixes D1). Currency is a restaurant setting, not hardcoded |
| P8 | **Sold-out state** | Item renders at 50% opacity with a "Sold out today" pill, is not tappable to order, and sorts to the bottom of its category (fixes D10) |
| P9 | **Variants** | Item detail shows size/portion options as a segmented control with per-variant price; card shows "from ₦6,000" (fixes D7) |
| P10 | **Spice level** | 0–3 rendered as chili glyphs with a text label for accessibility |
| P11 | **Allergens** | Listed in the item sheet under a collapsed "Allergens & dietary" row |
| P12 | **Language toggle EN / 中文** | Phase 3, but ship the schema and the toggle-ready layout in Phase 1. Latin and CJK type must both be specified from day one |
| P13 | **PWA** | Installable, menu cached offline via service worker, "Last updated" timestamp shown when serving stale |
| P14 | **Share** | Native share sheet on item and category; OG image generated per item |
| P15 | **Call / WhatsApp / Directions** | Persistent footer actions with the restaurant's numbers |

### 5.3 SEO & metadata

- Slugs derived from the actual name: `/menu/appetizers/chicken-samosa` (fixes D2). Slug is stored, editable, and immutable-by-default once published; changing it writes a 301 into a `redirects` table.
- JSON-LD: `Restaurant` + `Menu` + `MenuSection` + `MenuItem` with `offers.price` and `priceCurrency: "NGN"`.
- Per-item OG images rendered at the edge (`next/og`) — brand frame + dish photo + name + price.
- `sitemap.xml` regenerated on publish.

### 5.4 Budgets (hard gates in CI)

- Initial JS ≤ 120KB gzipped. Fail the build above it.
- LCP < 2.0s, CLS < 0.05, INP < 200ms on Slow 4G / 4× CPU throttle.
- Every image `next/image`, AVIF+WebP, explicit dimensions, `sizes` set, lazy below the fold, LQIP blur placeholder.
- Fonts: `next/font`, subset, `font-display: swap`, max 3 families / 5 weights total.
- WCAG 2.2 AA: 4.5:1 text contrast, visible focus rings, 44×44px minimum touch targets, `prefers-reduced-motion` respected, full keyboard operation of the sheet and rail.

---

## 6. Menu Manager (admin) — requirements

This is the part the current system does worst and the part that decides whether the rebuild was worth it. Design it phone-first: the manager will use it standing in the kitchen, one-handed.

| ID | Requirement | Acceptance criteria |
|---|---|---|
| A1 | **Auth** — email + password and magic link | Supabase Auth. Session persists 30 days. Rate-limited. |
| A2 | **Roles** — owner / manager / staff | Enforced by RLS policies; a staff token cannot write to `items` except the `is_available` column |
| A3 | **Menu tree** — groups → categories → items in one screen | Collapsible; item counts per node; search filters the tree live |
| A4 | **Create / edit / delete item** | Single form: name, name_zh, description, price, variants, category, photo, tags, allergens, spice, prep time. Delete is a **soft delete** with a 30-day undo window; a "Deleted" tab lists them |
| A5 | **Sold-out toggle** | One tap from the tree, no confirmation dialog, optimistic UI, toast with Undo. Auto-clears at the configured daily reset time (default 06:00 WAT) |
| A6 | **Reorder** | Drag-and-drop within a category, and categories within a group. Persist as fractional `sort_order` (avoid full-table rewrites). Works with touch and keyboard |
| A7 | **Photo upload** | Pick from camera or gallery → square crop → auto-convert to WebP/AVIF → upload to Supabase Storage. Max 5MB in, ≤200KB out. Show upload progress |
| A8 | **Draft vs published** | Every edit lands in draft. A "Publish changes" bar shows the count of pending changes and a diff summary. Publishing revalidates the public cache. Optional scheduled publish |
| A9 | **Bulk actions** | Multi-select → change category, adjust price by %  or flat amount, mark unavailable, delete. Price changes preview before/after |
| A10 | **Duplicate item** | Copies everything, appends "(copy)", opens in draft |
| A11 | **CSV import / export** | Export all items as CSV. Import with column mapping, dry-run preview, and per-row validation errors. This is how the existing 19 categories get migrated |
| A12 | **Category management** | Create, rename, re-slug, set icon/photo, set group, set availability window (e.g. Breakfast 07:00–11:00), hide, delete (blocked if it has items — offer "move items to…") |
| A13 | **Modifier groups** | Reusable across items: "Choice of rice" (required, pick 1), "Extras" (optional, pick many, each with a price delta) |
| A14 | **QR codes** | Generate and download the menu QR as SVG/PNG/PDF. Per-table QR variant appends `?t=12`. Printable A6 table-tent PDF with the brand mark |
| A15 | **Settings** | Restaurant name (EN/ZH), logo, hours per weekday + holiday overrides, phone, WhatsApp, address, currency, timezone (Africa/Lagos), theme accent, ordering on/off |
| A16 | **Staff accounts** | Owner/manager invite by email, assign role, revoke |
| A17 | **Audit log** | Who changed what, when, before/after value. Filterable by user and entity |
| A18 | **Analytics** | Menu views, unique sessions, top 20 viewed items, category drop-off, search terms with no results (a direct list of what guests want that you don't have), sold-out frequency. 30/7/1-day ranges |

---

## 7. Ordering (Phase 2 — spec now, build later)

- Cart persists in `localStorage`, survives refresh, badge in the footer.
- Checkout collects: **service mode** (Dine-in → table no. · Room service → room no. + guest name · Takeaway → phone + pickup time), order notes, and a per-item note field.
- On submit: write `orders` row, push a realtime event to the order board, and fire a WhatsApp deep link to the restaurant number as a fallback so nothing is lost if nobody is watching the board.
- **Order board:** columns New → Preparing → Ready → Served/Collected. Realtime via Supabase channels. Audible + vibrate alert on new order. Kitchen-friendly: large type, high contrast, works on a cheap tablet.
- Order numbers: daily-resetting, human-readable (`#014`), never expose UUIDs to staff.
- No payment in Phase 2 — guests pay at the table / on the room bill.

---

## 8. Data model

Postgres (Supabase). All tables have `id uuid pk default gen_random_uuid()`, `created_at`, `updated_at`, and `deleted_at timestamptz null` for soft deletes.

> **⚠️ Tenancy delta (2026-08-04):** the current build adds a `tenants` table above `restaurants` and a denormalized `tenant_id` on every tenant-owned table, with RLS scoped by `tenant_id`. See `context/architecture.md → Data & tenancy` for the exact delta. The schema below is otherwise implemented as written.

```sql
-- Multi-outlet-ready but single-row in practice for v1
create table restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_zh text,
  slug text unique not null,
  logo_url text,
  hero_image_url text,
  currency char(3) not null default 'NGN',
  locale text not null default 'en-NG',
  timezone text not null default 'Africa/Lagos',
  phone text, whatsapp text, address text,
  theme jsonb not null default '{}'::jsonb,
  ordering_enabled boolean not null default false,
  sold_out_reset_time time not null default '06:00',
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table opening_hours (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens time, closes time, is_closed boolean default false
);

create table menu_groups (            -- "Chinese Kitchen", "Drinks"
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants on delete cascade,
  name text not null, name_zh text, slug text not null,
  sort_order double precision not null default 1000,
  is_active boolean not null default true,
  unique (restaurant_id, slug)
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants on delete cascade,
  group_id uuid references menu_groups on delete set null,
  name text not null, name_zh text, description text,
  slug text not null,
  image_url text,
  sort_order double precision not null default 1000,
  is_active boolean not null default true,
  available_from time, available_to time,   -- daypart, null = always
  deleted_at timestamptz,
  unique (restaurant_id, slug)
);

create table items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories on delete restrict,
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
  unique (category_id, slug)
);

create table item_variants (          -- "6 pieces" / "12 pieces", "Small" / "Large"
  id uuid primary key default gen_random_uuid(),
  item_id uuid references items on delete cascade,
  label text not null, label_zh text,
  price numeric(12,2) not null,       -- absolute, not a delta
  sort_order double precision not null default 1000,
  is_available boolean not null default true
);

create table modifier_groups (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants on delete cascade,
  name text not null, name_zh text,
  min_select smallint not null default 0,
  max_select smallint not null default 1,
  is_required boolean not null default false
);

create table modifiers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references modifier_groups on delete cascade,
  name text not null, name_zh text,
  price_delta numeric(12,2) not null default 0,
  sort_order double precision not null default 1000,
  is_available boolean not null default true
);

create table item_modifier_groups (
  item_id uuid references items on delete cascade,
  group_id uuid references modifier_groups on delete cascade,
  sort_order double precision not null default 1000,
  primary key (item_id, group_id)
);

create table staff (
  id uuid primary key references auth.users on delete cascade,
  restaurant_id uuid references restaurants on delete cascade,
  full_name text, email text,
  role text not null check (role in ('owner','manager','staff')),
  is_active boolean not null default true
);

create table redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text unique not null, to_path text not null
);

create table audit_log (
  id bigserial primary key,
  actor_id uuid, entity text not null, entity_id uuid,
  action text not null, before jsonb, after jsonb,
  created_at timestamptz default now()
);

create table menu_events (            -- analytics, append-only
  id bigserial primary key,
  restaurant_id uuid, session_id text,
  event text not null,                -- view_menu | view_category | view_item | search | filter
  entity_id uuid, payload jsonb,
  created_at timestamptz default now()
);

-- Phase 2
create table orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants,
  daily_number int not null,
  service_mode text not null check (service_mode in ('dine_in','room_service','takeaway')),
  table_number text, room_number text,
  guest_name text, guest_phone text, notes text,
  status text not null default 'new' check (status in ('new','preparing','ready','served','cancelled')),
  subtotal numeric(12,2) not null default 0,
  created_at timestamptz default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders on delete cascade,
  item_id uuid references items,
  variant_id uuid references item_variants,
  name_snapshot text not null,        -- never join to items for history
  unit_price numeric(12,2) not null,
  quantity smallint not null default 1,
  modifiers jsonb not null default '[]'::jsonb,
  notes text
);
```

**Indexes:** `items(category_id, sort_order)`, `items(status, deleted_at)`, `categories(restaurant_id, sort_order)`, GIN on `items(dietary_tags)`, GIN trigram on `items(name)` for admin search, `menu_events(created_at)`, `orders(status, created_at)`.

**RLS:**
- Public (anon): `select` on published, non-deleted items/categories/groups/variants/modifiers only.
- `staff`: `update items.is_available`, `update item_variants.is_available`, read orders, update order status.
- `manager`: full CRUD on menu entities within their `restaurant_id`.
- `owner`: all of the above plus `staff` and `restaurants`.

---

## 9. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15, App Router, TypeScript strict** | RSC for a fast, mostly-static public menu; one repo for public + admin |
| Styling | **Tailwind CSS v4** + CSS variables for the theme tokens | Theme accent must be settings-driven, so tokens live in CSS vars, not Tailwind config |
| Components | **shadcn/ui** (Sheet, Command, Dialog, Sonner) + **Radix** primitives | Accessible sheet/dialog behaviour out of the box |
| DB / Auth / Storage / Realtime | **Supabase** | Postgres + RLS + Storage + Realtime + Auth in one; Gold already runs Supabase |
| Drag & drop | **dnd-kit** | Touch and keyboard support; `@hello-pangea/dnd` is not keyboard-clean enough |
| Forms | **react-hook-form + zod** | One zod schema per entity, shared by client form, server action, and CSV import validation |
| Images | `next/image` + Supabase Storage transforms | |
| QR | **`qrcode`** (SVG out) + **`@react-pdf/renderer`** for table tents | |
| Charts (admin) | **Recharts** | |
| Hosting | **Vercel** | Edge caching, ISR, `next/og` |
| Testing | Vitest (unit + zod schemas), Playwright (menu browse, item sheet, sold-out toggle, publish flow) | |
| CI | GitHub Actions: typecheck → lint → test → bundle-size gate → Lighthouse CI | |

### Repo structure

```
/app
  /(public)/menu/[[...slug]]/page.tsx      # menu, category, item — one route, shallow-routed sheet
  /(public)/menu/opengraph-image.tsx
  /(admin)/admin/{menu,items,categories,modifiers,qr,analytics,staff,settings}/
  /(admin)/admin/orders/                   # Phase 2
  /api/events/route.ts                     # analytics beacon
/components/{menu,admin,ui}
/lib/{supabase,queries,mutations,schemas,format,slug,rbac}
/supabase/migrations/*.sql
/supabase/seed.sql
/scripts/import-legacy-menu.ts
```

### Caching

- Public menu is statically rendered and tagged: `revalidateTag('menu')` fires on publish.
- `is_available` toggles bypass the publish flow and revalidate immediately — sold-out must be live within 5 seconds.

### Environment

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # server only, never in a client component
NEXT_PUBLIC_SITE_URL=
RESTAURANT_WHATSAPP=
```

---

## 10. Design direction

The brief the design has to answer: *a Chinese restaurant inside a Nigerian hotel, read on a phone, at a table, in low light, by someone deciding what to eat in about forty seconds.* Not a lifestyle site. Density and legibility beat mood.

### 10.1 Tokens

**Palette — "lacquer, brass, porcelain"**

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#14110F` | Page background — deep warm black, the lacquer box |
| `--porcelain` | `#F7F4EE` | Card surface, primary text on ink |
| `--lacquer` | `#8E1D1D` | The single strong accent: chef's picks, seal marks, active chip |
| `--brass` | `#B08D4F` | Hairlines, dividers, category eyebrows — never fills, only 1px lines and small caps |
| `--jade` | `#3F6B58` | Vegetarian tag, "Open now" |
| `--ash` | `#8A827A` | Secondary text, descriptions |

Dark-first, because the room is dark and the phone is at the table. Cards are porcelain-on-ink so each dish reads as a plate set down on a lacquer table. Explicitly **not** the cream-background/terracotta-accent default.

**Type**

| Role | Face | Notes |
|---|---|---|
| Display | **Fraunces** (variable, `opsz` 72, `SOFT` 40, `WONK` 1) | Restaurant name, category headings only |
| CJK | **Noto Serif SC** | Pairs with Fraunces' vertical stress; used for 金餐厅 and all `*_zh` fields |
| Body | **Inter** | Item names (600), descriptions (400) |
| Numerals / labels | **IBM Plex Mono**, tabular figures | Every price, every small-caps eyebrow. Prices align in a column like a ledger — this is what makes the menu read as *edited* rather than *generated* |

**Signature element:** the **seal mark (印章)** — a small lacquer-red rounded square carrying a single character. `厨` on chef's picks, `辣` on spicy, `素` on vegetarian, `售` (struck through) on sold out. It replaces every generic icon and pill on the page, it's drawn from the subject's own material vocabulary rather than applied to it, and it's the one place the design spends boldness. Everything else stays quiet: hairline brass rules, no gradients, no shadows deeper than `0 1px 2px`, radius `4px` throughout except the seal (`6px`).

Motion: one orchestrated moment only — the item sheet springs up from the tap point with the dish image scaling from the thumbnail's position (shared-element transition via View Transitions API). No scroll-triggered reveals, no ambient animation.

### 10.2 Wireframes

```
MENU                                  ITEM SHEET
┌──────────────────────────────┐      ┌──────────────────────────────┐
│  金餐厅                       │      │            ▁▁▁▁               │
│  JĪN CĀNTĪNG                 │      │  ┌────────────────────────┐  │
│  ● Open until 22:00          │      │  │      dish photo        │  │
│ ┌──────────────────────────┐ │      │  └────────────────────────┘  │
│ │ 🔎 Search the menu       │ │      │  BUTTERFLY KING PRAWN   [厨] │
│ └──────────────────────────┘ │      │  蝴蝶大虾                     │
│ [Chinese][Local][Grill][Bar] │      │  ──────────────────────────  │
│ ─ APPETIZERS ─────────────── │      │  A sumptuous feast for the   │
│                              │      │  senses, carefully selected  │
│ CHICKEN SAMOSA        ┌────┐ │      │  for size and sweetness.     │
│ Golden parcels of…    │IMG │ │      │                              │
│ ₦6,000            [素]└────┘ │      │  PORTION                     │
│ ────────────────────────────  │      │  ┌────────┐┌────────┐        │
│ HOT CHICKEN WINGS     ┌────┐ │      │  │ 2 pcs  ││ 4 pcs  │        │
│ Turn up the heat…     │IMG │ │      │  │ ₦14,000││ ₦26,000│        │
│ from ₦6,000       [辣]└────┘ │      │  └────────┘└────────┘        │
│ ────────────────────────────  │      │  Allergens & dietary      ▾  │
│ FRIED LOBSTER    (sold out)  │      └──────────────────────────────┘
│ ₦19,500           [售]        │
└──────────────────────────────┘
```

### 10.3 References worth studying (structure, not skin)

- **Mott 32 / Hakkasan** — how a premium Chinese room handles bilingual dish naming without looking like a translation exercise.
- **Din Tai Fung's order sheet** — portion counts as first-class variants, the exact D7 fix.
- **Deliveroo / Rappi item sheets** — the bottom-sheet + segmented-variant pattern, already learned by every phone user.
- **Toast and Owner.com menu templates** — the density baseline for a menu with 400 items; both correctly choose list rows over card grids.

---

## 11. Content migration

1. Scrape the live Instalacarte menu (19 categories, all items) into `legacy-menu.csv` via `scripts/import-legacy-menu.ts`.
2. **Clean during import, not after:**
   - Convert every `X,XXX.00 $` to a numeric NGN value.
   - Strip portion counts from names into `item_variants` ("FRIED JUMBO SHRIMP 6 PIECES" → name `Fried Jumbo Shrimp`, variant `6 pieces`).
   - Normalise all names to Title Case.
   - Fix `Cripsy` → `Crispy`, `SHAWAMA` → `Shawarma`, `DRNKS` → `Drinks`.
   - Keep existing descriptions verbatim — they're good.
   - Map the 19 flat categories to the four groups in §5.1.
3. Import everything as `status = 'draft'`. Manager reviews, adds photos, then publishes once.
4. Point the printed QR's destination at the new domain — since the existing QR is dynamic and the printed codes stay valid, decide whether to keep the Instalacarte account alive with a redirect page for one printing cycle. **Recommended: yes, keep it for 60 days, redirect it to the new menu.**

---

## 12. Assumptions made (change these if wrong, they're load-bearing)

| # | Assumption |
|---|---|
| 1 | Currency is **NGN**, locale `en-NG`, timezone `Africa/Lagos` |
| 2 | Ordering is **off in v1** — menu-only. Phase 2 turns it on |
| 3 | Photography exists for maybe 20% of items; the design must look intentional with a **missing image** (fallback = seal mark on a brass hairline frame, not a grey box) |
| 4 | The hotel has other outlets (bar, cafe) that will want their own menu later → schema is multi-outlet from day one, UI is single-outlet in v1 |
| 5 | One or two non-technical people manage the menu; there is no IT staff |
| 6 | Chinese translation is desirable but not blocking; ship the `*_zh` columns empty |
| 7 | Deploy on Vercel free/Pro; Supabase free tier is sufficient at this volume |

---

## 13. Build order for Claude Code

Work in this sequence. Do not start a milestone until the previous one runs.

**M1 — Foundation.** Next.js 15 + TS strict + Tailwind v4 + shadcn. Supabase project, all migrations from §8, RLS policies, seed with three real categories and ten real items. Zod schemas in `lib/schemas` first — every other layer imports from them.

**M2 — Public menu, read-only.** Route `/menu/[[...slug]]`, RSC data fetch, item rows, sticky category rail with scrollspy, bottom sheet with shallow routing, NGN formatting util with unit tests. Design tokens from §10.1 wired as CSS variables. Ship this and look at it on a real phone before continuing.

**M3 — Menu Manager core.** Auth, RBAC + RLS enforcement, menu tree, item create/edit/soft-delete, category CRUD, sold-out toggle with optimistic UI, image upload + crop + WebP. This is the milestone that matters most — over-invest here.

**M4 — Manager depth.** dnd-kit reordering, draft/publish with change count and cache revalidation, bulk actions, duplicate, CSV import/export with dry-run, modifier groups, variants UI.

**M5 — Migration.** Run the legacy import, review, publish. The old menu's content is now fully in the new system.

**M6 — Search, filters, variants, tags on the public side.** Then QR generator + table-tent PDF. Then analytics beacon and the admin analytics screen.

**M7 — Polish gate.** Lighthouse ≥ 90 mobile, bundle gate green, Playwright suite green, axe clean, View Transitions sheet animation, PWA manifest + service worker, JSON-LD + OG images + sitemap. **Ship.**

**M8 — Phase 2.** Cart, checkout, orders, realtime order board, WhatsApp fallback.

### Suggested first prompt to Claude Code

> Read `PRD-jin-canting-menu.md` in full. Implement **M1 only**: scaffold Next.js 15 (App Router, TypeScript strict, Tailwind v4, shadcn/ui), set up the Supabase client for server and browser, write every migration in §8 including indexes and RLS policies, define the zod schemas for restaurant, group, category, item, variant, and modifier in `lib/schemas`, and seed the database with the Appetizers, Noodles, and Soup categories and ten real items from §11. Add the CSS variable token block from §10.1 to the global stylesheet and wire the four fonts via `next/font`. Do not build any UI beyond a bare page that proves the data fetch works. When M1 runs, stop and report before starting M2.
