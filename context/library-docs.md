# Platter — Library Docs

> The stack, **as used in this project** — not general documentation (link out for that). For *why* each choice, see `foundation.md §7` (cited below); for conventions, see [`code-standards.md`](code-standards.md). When this file and `foundation.md` disagree, foundation wins.
>
> **The rule:** do not install any package that isn't in the Approved Dependencies table (§ bottom) without adding it here first — name, purpose, why, and gotchas — and weighing it against the 120KB initial-JS budget (`foundation.md §7 #6`).

**Status key:** ✅ locked · 🕗 TBD (decide before use) · ⬜ planned (later phase)

---

## Framework & language

### Next.js 16 — App Router ✅ (`§7 #1`)
*Version note: the PRD said 15; `create-next-app@latest` installs **16.3** (Turbopack, React 19.2). Adopted latest-stable at M1 (`progress-log.md` 2026-08-04). App Router / RSC / server actions / `next/font` / `next/og` / `revalidateTag` are unchanged.*
- **How here:** one app, two route groups — `(public)` menu (RSC, statically rendered, tag-cached) and `(admin)` manager (RSC + server actions). Reads in `lib/queries`, writes in `lib/mutations`. Per-item OG via `opengraph-image.tsx`.
- **Gotchas:** Server Components are the default — every `'use client'` is JS shipped to the phone; justify each against the budget. `revalidateTag` only works if fetches/queries are tagged. Server actions must re-validate input and re-check auth server-side — never trust the client. Keep the service-role client out of anything reachable from a client component.

### TypeScript (strict) ✅
- **How here:** `strict: true`, no `any`. Entity types are `z.infer<>` off the zod schemas, never hand-written twins.
- **Gotchas:** Supabase returns `any`-ish rows — parse with zod at the boundary rather than casting.

## Styling & UI

### Tailwind CSS v4 ✅ (`§7 #17`)
- **How here:** utility styling bound to **CSS-variable design tokens** (not hardcoded Tailwind theme values) because the theme accent is tenant-settable. The token layer is owned by [`ui-tokens.md`](ui-tokens.md); Tailwind consumes them via `@theme`.
- **Gotchas:** v4 is CSS-first config (`@theme` in CSS, not `tailwind.config.js`). Don't put raw hex in components — only token vars (`ui-tokens.md` invariant).

### shadcn/ui + Radix primitives ✅
- **How here:** Sheet (the item bottom-sheet, P4), Command (search palette), Dialog, Sonner (undo toasts on sold-out). Radix underneath gives accessible focus/keyboard behavior for free (WCAG 2.2 AA, PRD §5.4).
- **Gotchas:** shadcn components are *copied into the repo*, not a dependency — they live in `components/ui` and are ours to edit. Register each in [`ui-registry.md`](ui-registry.md). Keep the item sheet keyboard- and reduced-motion-correct.

### Fonts via `next/font` ✅ (`§7 #17`, `§7 #20`)
- **Faces:** **Fraunces** (variable — display: restaurant name, category headings), **Noto Serif SC** (all CJK / `*_zh`), **Inter** (body: item names 600, descriptions 400), **IBM Plex Mono** (tabular figures — every price and small-caps eyebrow). Max 3 families / 5 weights total, `font-display: swap`, subset.
- **Gotchas:** CJK subsetting is heavy — load Noto Serif SC carefully (it may only be needed once `*_zh` content exists; keep it out of the critical path until then). Prices depend on **tabular** figures for the ledger-column alignment — enable the tabular numeral feature. Loading these inside `next/og` (edge) is an open build-time decision (`architecture.md`).

## Data / backend

### Supabase — `@supabase/ssr` + `supabase-js` ✅ (`§7 #2, #3`)
- **How here:** `lib/supabase/server.ts` (cookie-bound, RLS session client) and `browser.ts`. A separate **service-role** server client for trusted jobs only. Auth = email+password + magic link. Storage for dish photos (tenant-scoped paths). Realtime reserved for the Phase-2 order board.
- **Gotchas:** **RLS is the security boundary** — every tenant table needs a policy (`security.md §1`); a table with RLS off is wide open. The **service-role key bypasses RLS and is server-only** (`security.md §3`). `@supabase/ssr` cookie handling differs between Server Components (read) and server actions/route handlers (write) — follow the SSR client pattern exactly or sessions silently break.

### Postgres (via Supabase) ✅
- **How here:** schema per `architecture.md → Data & tenancy` (PRD §8 + the tenant seam). Fractional `sort_order double precision`, soft deletes (`deleted_at`), GIN/trigram indexes for admin search, denormalized `tenant_id` for flat RLS.
- **Gotchas:** keep migrations in `supabase/migrations` and forward-only. Denormalized `tenant_id` must be set on insert for every child row — a null tenant_id is an isolation hole.

## Validation & forms

### Zod ✅ (`§7 #15`) — triple-duty
- **How here:** one schema per entity in `lib/schemas`, imported by (1) the react-hook-form client form, (2) the server action, (3) the CSV importer. THE source of truth for shape.
- **Gotchas:** keep schemas framework-free so all three consumers can share them. Coerce/transform at the edge (e.g. CSV strings → numbers) inside the schema, not in three places.

### react-hook-form ✅
- **How here:** admin item/category/settings forms, resolved by the matching zod schema (`@hookform/resolvers/zod`).
- **Gotchas:** phone-first forms — large touch targets (44px, PRD §5.4), minimal re-renders.

## Interaction

### dnd-kit ✅ (`§7 #16`)
- **How here:** drag-reorder items within a category and categories within a group; persists a fractional `sort_order` (one-row write). Touch **and** keyboard.
- **Gotchas:** chosen over `@hello-pangea/dnd` specifically for keyboard accessibility — don't regress that. Compute the new fractional order between neighbors; occasionally rebalance if values get pathologically close.

### `next/image` ✅
- **How here:** every menu image — AVIF/WebP, explicit dims, `sizes`, lazy below fold, LQIP blur from `image_blurhash`.
- **Gotchas:** missing image is **not** a broken `next/image` — it's the seal-mark fallback (`foundation.md §7 #18`). Don't render an empty image slot.

## Generation / output

### `qrcode` ✅
- **How here:** menu QR as SVG (+ PNG/PDF); per-table variant appends `?t=12`. The QR **destination is stable** even as the menu changes (`foundation.md §7 #10`).
- **Gotchas:** encode a stable URL, never menu content.

### `@react-pdf/renderer` ✅
- **How here:** printable A6 table-tent PDF with the brand mark (A14).
- **Gotchas:** its layout engine is a subset of CSS (flexbox-only, no Tailwind) — build the tent layout with its own primitives.

### Recharts ⬜ (admin analytics, M6)
- **How here:** menu views, top items, no-result searches (A18). Admin-only, so its weight doesn't hit the public budget.

## Testing

### Vitest ✅ — units (currency util, zod schemas, slug logic)
### Playwright ✅ — browse, item sheet + shareable URL, sold-out live, publish, tenant isolation
- **Gotcha:** the tenant-isolation test (A can't touch B) is mandatory once tenancy lands (`code-standards.md §9`).

## To decide before first use

- 🕗 **Fuzzy search** — `fuse.js` vs `match-sorter` for client search (P5, <100ms over ~400 items). Pick the lighter one that clears the budget.
- 🕗 **Image cropper** — `react-easy-crop` vs hand-rolled canvas for square-crop→WebP (A7).

---

## Approved Dependencies

**Do not install anything outside this list without adding it here first.**

| Package | Purpose | Status |
|---|---|---|
| `next`, `react`, `react-dom` | Framework | ✅ |
| `typescript`, `@types/*` | Types | ✅ |
| `tailwindcss` (v4), `@tailwindcss/postcss` | Styling | ✅ |
| shadcn/ui (copied components) + `@radix-ui/*` as pulled | UI primitives | ✅ |
| `@supabase/supabase-js`, `@supabase/ssr` | DB/Auth/Storage/Realtime | ✅ |
| `zod` | Validation (triple-duty) | ✅ |
| `react-hook-form`, `@hookform/resolvers` | Admin forms | ✅ |
| `@dnd-kit/core`, `@dnd-kit/sortable` | Reordering | ✅ |
| `qrcode` | QR generation | ✅ |
| `@react-pdf/renderer` | Table-tent PDF | ✅ |
| `recharts` | Admin analytics charts | ⬜ M6 |
| `vitest`, `@playwright/test` | Testing | ✅ |
| fuzzy-search lib (`fuse.js` \| `match-sorter`) | Client search | 🕗 pick one |
| image cropper (`react-easy-crop` \| custom) | Photo crop | 🕗 pick one |
| Payments SDK (Paystack) | Checkout | ⬜ Phase 3 |
