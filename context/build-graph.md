# Platter — Build Graph

> **How to read this file:** this is a **map of what-requires-what**, not a timeline and not a prescribed order. It shows which capabilities are *blocked* until others exist so you can pick the next buildable thing without walking into a missing prerequisite. **Hard requirement** = cannot build without it. **Soft benefit** = easier/safer once it exists but not blocking. The milestone tags (M1–M8) mirror the PRD's build order (`docs/PRD-jin-canting-menu.md §13`) for reference — but sequence within a layer is yours to choose. For *why* the keystone is the keystone, see `foundation.md §9` / `architecture.md`.

**Status key:** ⬜ planned · 🟡 in progress · ✅ built

---

## Layer 0 — foundational prerequisites (nothing real ships before these)

Everything downstream is a hard requirement on all of Layer 0.

- **L0.1 Scaffold** — Next.js 16 (App Router, TS strict), Tailwind v4 + the token block (`ui-tokens.md`), shadcn init, the four fonts via `next/font`. `[M1]` ✅
- **L0.2 Supabase project** — created; env wired (`security.md §4`). `[M1]`
- **L0.3 Data model + migrations** — the PRD §8 schema **plus the tenant seam** (`architecture.md → Data & tenancy`): `tenants`, `tenant_id` on every tenant-owned table, indexes, soft-delete columns, fractional `sort_order`. `[M1]`
- **L0.4 RLS policies** — the isolation model (`security.md §1–§2`) for anon/staff/manager/owner. **Hard-paired with L0.3** — a table without its policy is a hole, so they land together. `[M1]`
- **L0.5 Zod schemas** (`lib/schemas`) — restaurant, group, category, item, variant, modifier (+ tenant). **The contract every other layer imports.** `[M1]`
- **L0.6 Seed** — one tenant, one restaurant, three categories, ten real items (`foundation.md §12 #5`). `[M1]`

> **L0.3 + L0.4 + L0.5 together are the keystone unlock** (below).

## The keystone unlock

**Data model + RLS + zod schemas.** Once these three exist and agree, the shape and the isolation of every entity are settled, and everything else is a *consumer* of that contract:

```
                 ┌───────────────────────────────────────────────┐
   L0.3 schema ──┤                                               ├── public queries (lib/queries)  [M2]
   L0.4 RLS   ───┤   KEYSTONE: settled, isolated data contract   ├── server actions (lib/mutations) [M3]
   L0.5 zod   ───┤                                               ├── admin forms (react-hook-form)  [M3]
                 └───────────────────────────────────────────────┴── CSV import validation          [M4/M5]
```

Nothing above the line should be built while the contract is still moving. This is why L0 comes first (`foundation.md §9`).

## Dependency edges (X needs Y)

- **Public menu read-only [M2]** *needs* L0.3 (data), L0.5 (types), L0.1 (tokens/fonts). *Soft:* real seed (L0.6) makes it look real on a phone.
- **`lib/format` currency util [M2]** — buildable at cold start (pure function + unit tests); *needs* only the tenant `currency`/`locale` shape from L0.5. Fixes D1/D3.
- **Item bottom-sheet + shallow routing [M2]** *needs* the public menu shell + shadcn Sheet (L0.1).
- **Auth + RBAC [M3]** *needs* L0.2 (Supabase Auth) + L0.4 (RLS) + `lib/rbac`.
- **Menu tree + item/category CRUD [M3]** *needs* the keystone + auth. **Hard requirement for everything else in the manager.**
- **Sold-out toggle [M3]** *needs* CRUD path + the immediate-revalidation cache wiring (`§7 #8`). *Soft:* optimistic-UI + Sonner toast polish.
- **Photo upload+crop+WebP [M3]** *needs* Storage (L0.2) + tenant-scoped paths (`security.md §6`) + a cropper (🕗 decide).
- **dnd reorder [M4]** *needs* CRUD + fractional `sort_order` (already in L0.3).
- **Draft/publish + cache revalidation [M4]** *needs* CRUD + the `revalidateTag('menu')` wiring. Public menu [M2] must exist to have something to revalidate.
- **Bulk actions / duplicate / modifiers / variants UI [M4]** *need* CRUD.
- **CSV import/export [M4]** *needs* L0.5 (the same zod schema validates rows) — **this is why schemas are the migration path.**
- **Legacy migration [M5]** *needs* CSV import [M4] + the scrape script. Produces the real menu content as drafts.
- **Search / filters / variant+tag display (public) [M6]** *need* the public menu [M2] + real content [M5] to be meaningful.
- **QR generator + table-tent PDF [M6]** *needs* a stable public menu URL [M2]; otherwise independent.
- **Analytics beacon + admin analytics [M6]** *needs* `menu_events` (L0.3) + the public menu emitting events; Recharts for the screen.
- **Polish gate [M7]** *needs* everything above — Lighthouse ≥90, bundle gate, Playwright green, axe clean, View-Transitions sheet, PWA, JSON-LD/OG/sitemap.
- **Ordering + order board [M8 / Phase 2]** *needs* the published menu + Realtime; spec'd, not built in v1.

## Buildable from a cold start (no prerequisites beyond L0.1)

- The `lib/format` currency util + its unit tests (pure; the D1 fix).
- The `lib/slug` derivation + tests.
- The design-token CSS block and font wiring (L0.1 itself).
- The zod schemas (L0.5) — depend only on the agreed data shapes.

## The one genuine tension

**Draft/publish [M4] vs. the sold-out toggle [M3].** They share the cache layer but pull in opposite directions: publish is *deliberate and batched* (`revalidateTag` on a publish action), while sold-out must be *instant and bypass publish* (revalidate immediately). If the cache wiring is built assuming "all menu changes flow through publish," the sold-out path breaks the <5s requirement (`foundation.md §7 #8`). **Resolve it by building the availability path as a separate, immediate revalidation from day one** — don't retrofit it through the publish flow later. Stated honestly rather than resolved by fiat: this is the sequencing trap most likely to bite.

## Explicitly out of scope of this graph

Payments, translations, the SaaS product surface (signup/billing/subdomains/tenant console), POS, native apps, delivery logistics — deferred phases (`foundation.md §8`). The **data model** already carries the tenant seam, so the SaaS surface is additive, not a re-migration.
