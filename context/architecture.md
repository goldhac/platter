# Platter — Architecture

> How the pieces fit. For *why* any choice was made, see [`foundation.md`](foundation.md) (cited as `§7 #N`); this file states the shape, not the reasoning. Conventions for writing the code live in [`code-standards.md`](code-standards.md); the data-isolation policy is owned by [`security.md`](security.md). When this file and `foundation.md` disagree, foundation wins.

**Status key:** ✅ built · 🟡 in progress · ⬜ planned · 🕗 TBD

---

## System shape

```
                         ┌──────────────────────────────────────────┐
   Guest phone ─ QR ───► │  Next.js 16 (App Router) on Vercel        │
                         │                                           │
                         │  (public)  /menu/[[...slug]]   RSC, static│──┐
   Manager phone ──────► │  (admin)   /admin/*            RSC + forms│  │  revalidateTag('menu')
                         │  /api/events  analytics beacon            │  │  on publish / availability
                         └───────────────┬───────────────────────────┘  │
                                         │  @supabase/ssr               │
                                         ▼                              │
                         ┌──────────────────────────────────────────┐  │
                         │  Supabase (one project)                   │◄─┘
                         │  Postgres + RLS  ·  Auth  ·  Storage      │
                         │  Realtime (Phase 2 order board)           │
                         └──────────────────────────────────────────┘
```

Single Next.js app, two route groups (`(public)`, `(admin)`) sharing one Supabase backend. No separate API server — data reads are RSC queries, writes are server actions. `§7 #1, #2`.

## Stack

| Layer | Choice | Notes / foundation ref |
|---|---|---|
| Framework | **Next.js 16** (Turbopack), App Router, TypeScript **strict** | RSC for a fast mostly-static public menu; one repo for public + admin. `§7 #1` |
| Styling | **Tailwind CSS v4** + CSS variables for theme tokens | Theme accent is tenant-settable → tokens live in CSS vars, not the Tailwind config. `§7 #17`. See [`ui-tokens.md`](ui-tokens.md) |
| Components | **shadcn/ui** (Sheet, Command, Dialog, Sonner) over **Radix** primitives | Accessible sheet/dialog/command out of the box |
| DB / Auth / Storage / Realtime | **Supabase** — Postgres + RLS + Auth + Storage + Realtime | One managed backend; RLS is the tenancy boundary. `§7 #2, #3` |
| DB access | `@supabase/ssr` (server + browser clients) | Service-role key **server-only**. See [`security.md`](security.md) |
| Drag & drop | **dnd-kit** | Touch + keyboard reordering; fractional `sort_order` writes. `§7 #16` |
| Forms | **react-hook-form + zod** | One zod schema per entity, shared by form, server action, CSV import. `§7 #15` |
| Images | `next/image` + Supabase Storage transforms | AVIF/WebP, explicit dims, LQIP blur, lazy below fold |
| QR | **`qrcode`** (SVG) + **`@react-pdf/renderer`** (table tents) | Per-table `?t=` variant; A6 tent PDF |
| Charts (admin) | **Recharts** | Analytics screen |
| Hosting | **Vercel** | Edge cache, ISR, `next/og`, tag revalidation. `§7 #4` |
| Testing | Vitest (units + zod), Playwright (browse, item sheet, sold-out, publish) | Perf gates via Lighthouse CI. `§7 #6` |

Deltas from the usual default stack (React+Vite / self-rolled auth / Railway) are deliberate and justified in `foundation.md §7 #1–#4`. Approved dependency list is owned by [`library-docs.md`](library-docs.md) — **do not add a package without adding it there first.**

## Repo layout

```
/app
  /(public)/menu/[[...slug]]/page.tsx      # menu, category, item — one route, shallow-routed sheet
  /(public)/menu/opengraph-image.tsx       # per-item OG at the edge
  /(admin)/admin/{menu,items,categories,modifiers,qr,analytics,staff,settings}/
  /(admin)/admin/orders/                   # Phase 2
  /api/events/route.ts                     # analytics beacon
/components/{menu,admin,ui}
/lib
  /supabase   # server + browser clients; service-role is server-only
  /queries    # RSC data reads (tenant-scoped)
  /mutations  # server actions (tenant-scoped writes)
  /schemas    # zod — THE source of truth for shape; everything imports here
  /format     # currency (₦), dates, numbers
  /slug       # slug derivation + 301 redirect handling
  /rbac       # role checks (app-layer half of §7 #9)
/supabase
  /migrations/*.sql
  /seed.sql
/scripts/import-legacy-menu.ts             # M5 migration
/context                                   # this system
```

## Module boundaries — what lives where

| Concern | Home | Rule |
|---|---|---|
| Shape / validation | `lib/schemas` (zod) | Single source of truth for types. Form, server action, and CSV import all import the *same* schema. Never redefine a shape. `§7 #15` |
| Data reads | `lib/queries` (RSC) | Every query is tenant-scoped and filters `deleted_at IS NULL` (+ `status='published'` for public). |
| Writes | `lib/mutations` (server actions) | Validate with the zod schema, check role via `lib/rbac`, write tenant-scoped, then revalidate the right cache tag. |
| Currency / dates | `lib/format` | `₦` formatting is here, driven by the tenant's `currency`/`locale` — never hardcode a symbol. `§7 #5` |
| Slugs / redirects | `lib/slug` | Derive from name; on slug change of a published item, write a `redirects` row. `§7`/D2 |
| Auth clients | `lib/supabase` | `server.ts` (cookies, RLS session) vs `browser.ts`. Service-role client is server-only and never imported by a client component. |
| UI | `components/{menu,admin,ui}` | `ui/` = shadcn primitives; `menu/` = public; `admin/` = manager. Check [`ui-registry.md`](ui-registry.md) before building a component. |

## Data & tenancy

The data model is the PRD's schema (`docs/PRD-jin-canting-menu.md §8`) **plus a tenant seam**. This is the delta to apply when writing migrations.

### The tenant seam (new vs. the PRD)

> **Phase 2 supersedes parts of this section.** What follows describes the **v1-built** seam. Phase 2 (`foundation.md §13`, `docs/PRD-platter-platform-phase2.md`) deepens it: a **`venue`** layer between tenant and menu, a new **`menu`** layer, **`memberships`** (venue-scoped roles) replacing single-tenant `staff` scoping, `auth_tenant_ids()` (array, reading `memberships`) replacing `auth_tenant_id()`, and slug/custom-domain moving onto **`venues`**. Where they differ, **§13 wins**; the notes below are v1 only.

```sql
-- NEW: the account layer above restaurants
create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,                 -- "De Geogold Hotel"
  slug text unique not null,          -- subdomain key for the SaaS phase
  custom_domain text unique,          -- SaaS phase; null in v1
  plan text not null default 'free',  -- plan tiers, SaaS phase
  is_active boolean not null default true,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
```

- `restaurants` gains `tenant_id uuid not null references tenants on delete cascade`. (The PRD's `restaurants` = a **venue/outlet**; a tenant owns one or more. `foundation.md §5`.)
- **Every tenant-owned table carries a denormalized `tenant_id`** — `menu_groups`, `categories`, `items`, `item_variants`, `modifier_groups`, `modifiers`, `item_modifier_groups`, `staff`, `redirects`, `audit_log`, `menu_events`, and (Phase 2) `orders`, `order_items`. Denormalized on purpose so RLS predicates are a single flat comparison, not a join climb (§7 #12, the explicit-over-magic call).
- Keep the PRD's `restaurant_id` FKs too — `tenant_id` is for *isolation*, `restaurant_id` is for *which outlet*. In v1 they collapse to one tenant + one restaurant.
- Everything else (soft-delete `deleted_at`, `sort_order double precision`, indexes, the item/variant/modifier tables) is exactly as the PRD §8 specifies.

### Isolation (RLS) — policy summary

Full policy is owned by [`security.md`](security.md); the mechanism:

- A SQL helper `auth_tenant_id()` returns the caller's tenant: `select tenant_id from staff where id = auth.uid()`.
- **anon (public menu):** `SELECT` only, only rows with `status='published' AND deleted_at IS NULL`, on menu entities. Public menu data is *meant* to be public; the query filters by the requested venue. No writes.
- **staff:** `UPDATE` only `items.is_available` / `item_variants.is_available`, and read/advance orders — all `WHERE tenant_id = auth_tenant_id()`.
- **manager:** full CRUD on menu entities `WHERE tenant_id = auth_tenant_id()`.
- **owner:** manager + `staff` + `restaurants` + `tenants` (own tenant only).
- **The invariant:** no policy is written without a `tenant_id = auth_tenant_id()` predicate on tenant-owned tables. An unscoped write policy is a security bug (`foundation.md §11`).

### Routing → tenant resolution

- **v1 (single tenant):** the public menu serves at the root domain; the one tenant is resolved by config/env. No subdomain logic needed.
- **Phase 2 (⬜):** middleware resolves the **venue** from the request host — `{venue-slug}.platter.menu` (`venues.slug`) or a venue `custom_domain` — and scopes every query to that `tenant_id`; marketing at `platter.app`, app at `app.platter.app`. (Revises the earlier `{tenant-slug}.platter.app` sketch — see `foundation.md §13 P7` + Phase 2 PRD §7.) The seam columns exist now so this is additive, not a migration.

## Caching model

- Public menu is **statically rendered and tag-cached**. Publishing a menu fires `revalidateTag('menu')`.
- **`is_available` toggles bypass the publish flow** and revalidate immediately — sold-out must be live within 5s (`§7 #8`).
- **Multi-tenant cache shape (⬜):** tags become per-tenant (`menu:{tenantId}`) so one tenant's publish never busts another's cache. v1 uses the flat `menu` tag; widen to per-tenant when tenant #2 lands. (Tracked as an open build-time decision.)

## The keystone unlock

**`lib/schemas` (zod) + `supabase/migrations` + RLS policies, built together, are Layer 0.** Once the data model and its isolation are real and the schemas exist, every other layer — public queries, server actions, admin forms, CSV import — is just a consumer of a settled, validated contract. Nothing real is built before this. Full dependency map: [`build-graph.md`](build-graph.md).

## Open build-time decisions

Record the resolution in [`progress-log.md`](progress-log.md) as a `decision` entry when made, and update the affected file.

- 🕗 **Client image cropper** — `react-easy-crop` vs. a hand-rolled canvas crop for the square-crop→WebP pipeline (A7).
- 🕗 **Client search lib** — `fuse.js` vs. `match-sorter` for the <100ms fuzzy search over ~400 items (P5); weigh against the 120KB JS budget (`§7 #6`).
- 🕗 **Edge OG font loading** — how Fraunces/Plex load inside `next/og` without blowing the edge bundle.
- 🕗 **Per-tenant cache-tag switch** — when to move from `menu` to `menu:{tenantId}` (at tenant #2).
- 🕗 **Realtime transport for the order board** (Phase 2) — Supabase channels vs. Postgres changes.
