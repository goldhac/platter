# Platter — Progress Log

> The living record of what has actually been built and decided. Newest entries first (prepend).

## ⚠️ Standing instruction for the AI agent

**After completing any work in this project, before ending your response, add a progress entry below.** This is mandatory — the same way reading the context files first is mandatory (`code-standards.md §1`).

**The drift rule:** if your entry is a `decision` that changes anything in `foundation.md` or another context file, **update that file too** and add a companion `docs` entry noting it. Context files must never drift from what was actually decided (`README.md` golden rule).

### Entry template

```
### YYYY-MM-DD · <category> · <short title>
- **area:** backend | apps/public | apps/admin | db | infra | context | lib/<x>
- **what:** one line (itemize parts if one prompt produced several)
- **notes:** gotchas, limitations, follow-ups
```

`category` ∈ `feature` · `fix` · `refactor` · `chore` · `decision` · `docs`

---

## Entries

### 2026-08-04 · feature · M6 — public search + filters, QR generator
- **area:** apps/public, apps/admin, lib
- **what:** **Search (P5) + filters (P6):** `MenuBoard` now owns a sticky header (search input + Vegetarian / Contains pork / Seafood / Spicy / Chef's-picks chips + the rail); when a search/filter is active it renders a client-filtered flat results list (the same `<a>` rows, so the sheet delegation still opens them) with a result count, Clear, and an empty state. Rail de-stickied (parent handles it); section scroll-offset widened. **QR generator (A14):** `/admin/qr` — branded QR preview, per-table `?t=` variant, download **SVG / PNG** + an **A6 table-tent PDF** (`@react-pdf`, code-split via `lib/table-tent`). New nav: QR.
- **notes:** Search + filters **verified live in-browser** (public, no login) — "soup" → 3 results; Chef's-picks → the 2 featured items; photos render; rail hides; Clear works. QR page builds; Gold tests the downloads. Substring match (not fuzzy) + local filter state (URL-state is a refinement). typecheck + build green. **Public menu is now feature-complete** (P1–P11, P14–P15 + search/filters).

### 2026-08-04 · feature · M4 — CSV import/export + modifier groups
- **area:** apps/admin, lib
- **what:** **CSV export** (`/api/export` — all items → CSV) + **import** (`/admin/import`: file or paste → client **dry-run preview** with per-row errors → `importItemsCsv` creates draft items, auto-creating categories by name). `lib/csv.ts` parser/serializer. **Modifier groups (A13):** full CRUD (`/admin/modifiers`, list/new/[id]) with an options editor; `saveModifierGroup`/`deleteModifierGroup` (cascade); **item assignment** via checkboxes in the item form (`setItemModifierGroups`). New nav: Add-ons, Data.
- **notes:** Verified via owner-session RLS SQL — modifier group + option insert and cascade-delete all work for owner. typecheck + build green (routes `/admin/import`, `/admin/modifiers[/new,/[id]]`, `/api/export`). Modifiers are *managed* now; public rendering of add-ons is Phase-2 (ordering). CSV import is the bridge to the deferred real-menu migration.

### 2026-08-04 · feature · M7 prep — SEO, OG images, sitemap
- **area:** apps/public
- **what:** Dynamic `generateMetadata` (menu + per-item deep-link title/description/canonical/OG/Twitter); **JSON-LD** (Restaurant + Menu + MenuItem with `offers`/`priceCurrency`); **`/sitemap.xml`** (menu + categories + items); **per-item OG image** at `/api/og` (`next/og`, brand frame, Latin-only for font safety) wired into `openGraph.images`; `metadataBase` in the root layout. `getMenu` wrapped in React `cache()` to dedupe the metadata + page + OG fetch.
- **notes:** Verified at runtime — OG image `200 image/png` (43KB), `sitemap.xml` `200` with correct URLs, JSON-LD present on `/menu`. OG co-location under the optional catch-all is disallowed by Next, so it's a plain `/api/og` route. Build green.

### 2026-08-04 · feature · M4 — bulk actions
- **area:** apps/admin, lib
- **what:** Multi-select in the menu tree (a checkbox per row via a React selection context) + a sticky **BulkBar**: mark sold out / available, publish / unpublish, **move to category**, **adjust price** (% or flat, rounded), delete, clear. Bulk mutations (`bulkSetAvailable`, `bulkSetStatus`, `bulkMoveCategory`, `bulkAdjustPrice`, `bulkDelete`) — manager+, tenant-scoped via `.in(ids)`.
- **notes:** typecheck + production build green. Selection clears after each action; price adjust affects `base_price` (variants are separate). Gold verifies interactively. **M4 so far:** variants, reorder, duplicate, bulk actions. Remaining M4: draft/publish batch + diff, CSV import/export, modifier groups.

### 2026-08-04 · feature · M4 (start) — drag-reorder + duplicate
- **area:** apps/admin, lib
- **what:** **dnd-kit** drag-to-reorder items within a category (a drag handle keeps the row's controls clickable; optimistic local order re-synced from the server; **fractional-midpoint** `sort_order` persisted via `reorderItem`, manager+; pointer + keyboard sensors). **Duplicate** button per row (`duplicateItem`, A10). `AdminItem` now carries `sort_order`; the tree component was rewritten (SortableItemRow / PlainItemRow / shared ItemBody).
- **notes:** typecheck + production build green (dnd-kit integrated cleanly). `reorderItem` is manager+ (the staff trigger also blocks any `sort_order` change). Reorder is within-category for now; category/group reorder + the rest of M4 (draft/publish batch + diff, bulk actions, CSV import/export, modifier groups) remain. Couldn't browser-test the drag myself (Gold's session is his own Chrome) — standard dnd-kit pattern, Gold verifies interactively.

### 2026-08-04 · feature · M3 — item variants + Settings page
- **area:** apps/admin, lib
- **what:** **Variants** (D7 completion): `getItemForEdit` now returns variants; `setItemVariants` mutation (replace-all, manager+); a variant editor in `ItemForm` (add/remove label + price rows). **Settings**: `getRestaurantSettings` + `saveSettings` (owner-only — restaurant name/中文/phone/whatsapp/address/currency/timezone/sold-out-reset/theme accent + 7-day opening hours); `SettingsForm` + `/admin/settings` page (nav link no longer 404s). Added `requireOwner` to `lib/rbac`.
- **notes:** Verified via owner-session RLS SQL — settings update (restaurants), variant insert **and** delete all allowed for owner. typecheck green. Skipped a production build this pass to avoid disrupting Gold's live dev session (Chrome, logged in); dev hot-reloads the new route/components. Gold confirmed the manager tree works in his browser. Remaining: staff accounts, audit log, analytics; the **M4** milestone (dnd reorder, draft/publish batch + diff, bulk actions, CSV import/export, modifier groups).

### 2026-08-04 · feature · M3 — category management (CRUD) — completes M3's defined scope
- **area:** apps/admin, lib
- **what:** Category mutations (`createCategory`, `updateCategory`, `setCategoryActive`, `softDeleteCategory` — blocked while it still has items, A12); queries (`getAdminCategories` with item counts + group name, `getGroupOptions`, `getCategoryForEdit`); `CategoryForm` (name, name_zh, description, slug, group picker, daypart from/to, visible toggle) + `CategoryList` (hide/show, edit, delete) at `/admin/categories`, `/new`, `/[id]`. Extracted `requireManager()` into `lib/rbac` (shared by item + category mutations).
- **notes:** Verified via owner-session RLS SQL — create → update → delete chain works; the non-empty guard has real data (appetizers = 4 items → delete blocked). Build green (all category routes). **M3's PRD-defined scope is now complete:** auth, RBAC (RLS + app layer), menu tree, item create/edit/soft-delete, category CRUD, sold-out toggle (optimistic), image upload (crop→WebP). Deferred admin extras (staff/settings/audit/analytics) + the **M4** milestone (dnd reorder, draft/publish batch + diff, bulk actions, CSV import/export, modifier groups, variants UI) remain.

### 2026-08-04 · feature · M3 — photo upload (Storage + crop → WebP)
- **area:** apps/admin, db, infra
- **what:** Storage bucket `menu-images` (migration `0005`): public-read, **tenant-scoped writes** for manager/owner via 4 RLS policies (path `{tenant_id}/{uuid}.webp`). Client pipeline: camera/gallery pick → **react-easy-crop** square crop → canvas → **WebP ≤200KB** (`lib/image.ts`) → upload via the browser Supabase client → public URL. `ImageUpload` (Radix crop dialog) wired into `ItemForm`; `image_url` added to `itemInsertSchema` + create/update mutations; `next.config.ts` `remotePatterns` for the Storage host.
- **notes:** Production build green (routes incl. `/admin/items/new` + `/admin/items/[id]`); bucket + **4 storage policies verified in SQL**. End-to-end upload needs a browser session — Gold tests it. Remaining in M3: category CRUD, staff/settings/audit/analytics.

### 2026-08-04 · feature · M3 Phase B — menu tree + sold-out toggle + item CRUD (verified via RLS)
- **area:** apps/admin, lib
- **what:** The core manager. Itemized:
  - Queries: `getAdminMenuTree` (RLS-scoped, drafts included), `getCategoryOptions`, `getItemForEdit`; `slugify` util.
  - Item mutations (server actions — role-checked, tenant-scoped, revalidating): `toggleItemAvailability`, `setItemStatus` (publish/unpublish), `softDeleteItem`/`restoreItem`, `createItem`, `updateItem`, `duplicateItem`.
  - UI: `MenuTree` (collapsible groups→categories via `<details>`, live filter, item counts, per-item Live/Draft toggle + sold-out switch + Edit + Del/undo); `SoldOutToggle` (optimistic + undo toast); `ItemForm` (react-hook-form — category, name, name_zh, description, price, compare-at, spice, prep time, dietary checkboxes, allergens, featured, available) at `/admin/items/new` and `/admin/items/[id]`.
- **notes:** Verified end-to-end via **owner-session RLS in SQL** (`set role authenticated` + jwt claims): read (owner sees 10 items / 3 categories), update (toggle + status, reverted), insert (draft item created), delete (owner delete allowed) — test row cleaned up. typecheck + production build green (Proxy active; routes `/admin`, `/admin/login`, `/admin/menu`, `/admin/items/new`, `/admin/items/[id]`). New items land as **draft**; the per-item publish toggle is the M3 precursor to M4's batch publish. **Remaining in M3:** category CRUD, **photo upload** (Storage + crop — item form has no image field yet), plus staff/settings/audit/analytics. Did not log in via the browser (verified through the API + SQL); Gold tests the UI.

### 2026-08-04 · feature · M3 Phase A — auth + RBAC foundation (verified)
- **area:** apps/admin, infra, db
- **what:** Supabase Auth login (password + magic link), **Next 16 `proxy.ts`** (middleware was renamed to Proxy in 16) that refreshes the session + does an optimistic `/admin` gate, RBAC (`lib/rbac` `getCurrentStaff` reading the staff row via RLS), the auth-gated admin workspace shell (nav + sign-out) at `app/(admin)/admin/(workspace)/`, a public `/admin/login`, and the `/auth/callback` route for magic links. Bootstrapped the owner: **gold.nwobu@gmail.com → owner of Jīn Cāntīng** (created via the signup API; confirmed + staff row inserted via MCP).
- **notes:** Verified — `/admin/menu` unauthed → 307 `/admin/login`; login page renders; owner credentials authenticate (token issued via the API). **Supabase confirmed to be in Gold's PERSONAL account** (org "goldhac's Org", project ref `bnyadozvvyzlzwnelrfu`) — not the company. Did **not** type the password into a form (verified auth via the token API instead). Next → Phase B: menu tree, item/category CRUD, the one-tap sold-out toggle, photo upload. Service-role key still only needed at M5.

### 2026-08-04 · feature · M2 public menu (read-only) — working & verified live
- **area:** apps/public, lib, db
- **what:** Built the real public menu at `/menu/[[...slug]]`. Itemized:
  - Data layer `getMenu()` assembles groups → categories → items (+variants) with a slug→item map; sold-out sinks to category bottom (P8); open/closed computed in the restaurant timezone.
  - Components: `MenuHeader` (bilingual mark + open/closed pill), `CategoryRail` (sticky, IntersectionObserver scrollspy, keyboard-operable), `ItemRow` (server `<a>`, seals, ledger price, thumb or seal-fallback), `ItemThumb`, `SealMark`, `ItemSheet` (Radix Dialog bottom sheet — focus-trap / Esc / aria-modal for free), `MenuBoard` (delegated click → `history.pushState` shallow routing + popstate sync). Root `/` → redirect to `/menu`.
  - Currency util unit-tested — 7 Vitest cases incl. the D1/D3 ("never a $") regression guard.
  - Real dish photos: generated 5 via the image tool (nano-banana), JPEG-optimized (~200KB) into `public/images`, wired to 5 items; the rest use the seal fallback (realistic mix, Assumption 3).
- **notes:** Verified live in-browser — thumbnails, sticky rail + scrollspy, bottom sheet with hero, and a **shareable shallow-routed URL** (`/menu/appetizers/hot-chicken-wings`, `role="dialog"`) all confirmed. typecheck + 7 tests green. Per Gold's steer this milestone prioritized **functionality + a11y + real examples**, not final visual polish (design overhaul is a later pass). Deferred: search/filters (M6); View-Transitions shared-element sheet + full axe/Lighthouse gate (M7); the manager photo-upload pipeline replaces the local `/images` seeds (M3/M5). Chow-mein image hit the image plan's daily grace limit → stays a fallback.

### 2026-08-04 · feature · M1 Foundation shipped (runs)
- **area:** infra, db, lib, apps/public
- **what:** Scaffolded the app and stood up the data layer end-to-end. Itemized:
  - Next.js 16.3 (App Router, TS strict, Turbopack) + Tailwind v4 + the design-token block; four fonts wired via `next/font` (Fraunces, Noto Serif SC [latin subset], Inter, IBM Plex Mono).
  - Supabase project **`platter`** created (ref `bnyadozvvyzlzwnelrfu`, region eu-west-2, $0/mo). Migrations `0001_init_schema` (PRD §8 + tenant seam, indexes), `0002_rls_policies` (RLS on all 16 tables, anon/staff/manager/owner, staff-availability-only trigger guard), `0003_advisor_hardening` applied.
  - `lib/schemas` (zod, the contract): restaurant, menu-group, category, item, variant, modifier + common. `lib/format/currency.ts` (the D1/D3 ₦ fix). `lib/supabase/{server,browser}.ts` typed with generated `database.types.ts`. `lib/queries/menu.ts`.
  - Seed: 1 tenant (De Geogold Hotel) → 1 restaurant (Jīn Cāntīng) → 3 categories → 10 published items (4 variants).
  - Proof page (`app/page.tsx`, force-dynamic): typecheck ✓, `next build` ✓, and a live server render showed all 10 items with correct `₦6,000` / `from ₦8,000` prices via anon RLS.
- **notes:** M1 done — **stopping before M2 per the PRD contract.** Service-role key is still blank in `.env.local` (not needed for M1; Gold pastes it from the dashboard before any admin work). Leftover create-next-app SVGs/favicon in `public/`+`app/` will be replaced in M2. Supabase security advisor: no ERRORs; residual WARNs are accepted/documented in `0003`. `.env.local` is git-ignored.

### 2026-08-04 · decision · Adopted Next.js 16 (PRD said 15)
- **area:** context
- **what:** `create-next-app@latest` installs Next 16.3 / React 19.2. Since this is greenfield and 16.3 is stable, adopted latest-stable rather than pinning back to 15.
- **notes:** Rippled into `foundation.md §7 #1`, `architecture.md` (diagram + stack table), `build-graph.md` L0.1, `library-docs.md`. App Router / RSC / server actions / `next/font` / `next/og` / `revalidateTag` are unchanged, so no design impact. Reversible (pin `next@15`) if a compat issue surfaces.

### 2026-08-04 · decision · M1 gating decisions locked
- **area:** context
- **what:** Gold confirmed the three M1 gates: (1) **tenancy** — lock in the multi-tenant schema / single-tenant surface (the `tenant_id` seam stays); (2) **Supabase** — create a **fresh** project; (3) **M1 seed** — **reconstruct from the PRD** now, scrape the legacy menu later at M5.
- **notes:** Updated `foundation.md §12` rows #2/#4/#5 to ✅ Locked. Cleared to begin M1. Still open (non-blocking): platform brand name (#1), exact "tenant" label (#3 — defaulting to *De Geogold Hotel* as the tenant with Jīn Cāntīng as its first restaurant for the seed), domain (#6), SaaS pricing (#7).

### 2026-08-04 · docs · Context system bootstrapped
- **area:** context
- **what:** Created the full source-of-truth context system for Platter: `foundation.md`, `project-overview.md`, `architecture.md`, `security.md`, `code-standards.md`, `library-docs.md`, `build-graph.md`, this log, the UI trio (`ui-tokens.md`, `ui-rules.md`, `ui-registry.md`), root `README.md` + `CLAUDE.md`. Preserved the origin PRD at `docs/PRD-jin-canting-menu.md`. Repo scaffolded and `git init`'d on `main`.
- **notes:** No application code yet — M1 has not started. Key decisions this session: (1) reframed the single-restaurant PRD into a **multi-tenant platform** (codename `Platter`) shipping one tenant (Jīn Cāntīng) in v1; (2) chose **row-level multi-tenancy** — a `tenants` seam + denormalized `tenant_id` + RLS — as schema-only in v1 (`foundation.md §7 #11/#12`); (3) split **tenant isolation** into its own authority file `security.md`; (4) drafted the UI trio directly from PRD §10 rather than from a Claude Design export, since the design system is already fully specified. Open items for Gold to confirm before/at M1: `foundation.md §12` (platform name, tenancy-model sign-off, who the "tenant" is, new-vs-existing Supabase project, M1 seed-data source, domain).

### 2026-08-04 · decision · Multi-tenant from the schema, single-tenant in the product
- **area:** context
- **what:** Overrode the PRD's "multi-tenant SaaS = non-goal." v1 still ships one venue, but the data model carries the tenant seam so the SaaS surface is additive later, not a re-migration.
- **notes:** Recorded in `foundation.md §7 #11/#12`, `§8` (SaaS deferred), `§9`, `§10`; mechanism in `architecture.md → Data & tenancy`; isolation policy in `security.md`. This is the one architectural call made *for* Gold — flagged for sign-off in `foundation.md §12 #2`.
