# Platter — Foundation

> **Status:** v1 — **built & deployed** (2026-08-04, Railway: `platter-production-946c.up.railway.app`). Phase 2 (the platform: multi-tenant venues/menus + the theme system) is **spec'd in §13, not started.** Changes from v0 (the PRD): reframed from a single-restaurant build into a **multi-tenant menu platform** whose v1 ships one tenant (Jīn Cāntīng); folded the tenancy seam into the data model and elevated tenant isolation to a first-class risk.
> **Source of truth.** Every other file references this; none restate it. If any file disagrees with this one, this one wins.
> Codename **`Platter`** is a placeholder for the *platform* until the name is locked — find-and-replace when it is. **`Jīn Cāntīng` (金餐厅)** is the real name of the first tenant, not a placeholder.
> Origin brief: [`docs/PRD-jin-canting-menu.md`](../docs/PRD-jin-canting-menu.md) — preserved for detail (wireframes, full SQL, the defect audit). Where the PRD and this file disagree (notably the PRD's "multi-tenant = non-goal"), **this file wins.**
> Phase 2 spec: [`docs/PRD-platter-platform-phase2.md`](../docs/PRD-platter-platform-phase2.md) — the platform direction. Its reconciled decisions + corrections live in **§13** below; where that PRD and this file disagree, **this file wins.**

**Status key:** ✅ locked/built · 🕗 TBD (decide later) · ⬜ planned · 🟡 in progress · **[LOCKED]** settled decision · ⏳ external lead time

---

## §0 Build constraints

<!-- The forcing function. Scope discipline follows from these. -->

| Constraint | Reality | Implication |
|---|---|---|
| **Team** | **Solo builder** — Gold, building with Claude Code. The "one or two non-technical people" in the brief are *menu managers who use the admin UI*, not parallel coders. | **Solo mode** context system: one `progress-log.md`, no `COLLAB.md`/branch-lock layer. |
| **Budget** | Vercel free/Pro + Supabase free tier for v1 (Assumption 7). | Every choice must live inside those tiers at single-tenant volume. Revisit tier limits before onboarding tenant #2. |
| **Skills** | Gold already runs Supabase. Comfortable directing an AI coding agent; not shipping hand-written infra. | Lean on Supabase's managed primitives (Auth/RLS/Storage/Realtime) over self-rolled equivalents. This is a deliberate delta from the usual self-rolled-auth default (§7 #3). |
| **Hours/week** | 🕗 Not stated. | Scope is protected by phasing (§8), not by hours. Ship M1→M7 for one tenant before any SaaS surface. |
| **The forcing function** | v1 must **replace a working rented menu** without regressing what it does right (dynamic QR, good copy, menu-only mode). | "Better than Instalacarte on a phone" is the bar, not "feature-complete SaaS." Cut everything that doesn't serve that. |

## §1 What it is

**One-liner:** Platter is a **multi-tenant digital-menu platform** — a fast, beautiful, phone-first QR menu plus a kitchen-usable menu manager — that any food business can host its menu on. **v1 is a single tenant:** Jīn Cāntīng (金餐厅), the Chinese restaurant at De Geogold Hotel, replacing its rented Instalacarte QR-menu page.

**The wedge:** the incumbent (Instalacarte and its class) is a *rented template* — it ships real defects (prices show `$` on Naira amounts; category URLs read `/burgers/`; descriptions truncate mid-word) and puts branding, custom domains, and translations behind a per-feature paywall. Platter's wedge is **ownership + correctness + speed**: own domain, own data, own design, no third-party footer, no paywalled basics, and a build that actually loads on a mid-range Android on Nigerian mobile data.

**The moat (why it compounds later):** the *manager* is the moat, not the menu. A menu is easy to clone; a manager that a non-technical supervisor will actually use one-handed in a dark kitchen — sold-out in <10s, new item in <90s — is what makes a venue stay. Multi-tenancy turns that single good manager into a product other businesses pay for.

## §2 Who it's for

**Per-tenant roles** (RBAC `owner > manager > staff`, enforced in both Postgres RLS *and* the app layer — §7 #9):

| Role | Who | Needs |
|---|---|---|
| **Guest** | Hotel guest, walk-in, someone sent a WhatsApp link | Browse, search, understand a dish, see a real ₦ price, (later) order to their room |
| **Manager** | Restaurant manager/supervisor | Full menu CRUD, pricing, photos, availability, QR, analytics |
| **Staff** | Waiter, bar, kitchen | Toggle availability only; (Phase 3) see incoming orders |
| **Owner/Admin** | Gold (as venue owner) | Everything, plus staff accounts, settings, outlets, audit log |

**Platform-level (new, for the SaaS direction):**

| Role | Who | Needs |
|---|---|---|
| **Platform operator** | Gold (as Platter) | Onboard tenants, oversee billing/plans, platform health. 🕗 Surfaces deferred to Phase 2 (the platform — §8/§13). |

## §3 Success & stage

- **Type:** a **business**. v1 is a real deployment for one paying venue; the platform is the asset being built underneath it.
- **Stage:** greenfield. Nothing built yet. A complete PRD exists; this foundation supersedes it on tenancy.
- **What prompted it:** the live rented menu has a catastrophic trust bug (Naira shown as `$`) and no path to the improvements the venue wants without paying per feature to a landlord who owns the data.

**v1 success metrics** (from PRD §2; these are the gates):

| Metric | Target |
|---|---|
| Lighthouse mobile performance | ≥ 90 |
| LCP on Moto G Power / Slow 4G | < 2.0s |
| Manager: mark an item sold out | < 10s from phone lock screen |
| Manager: add a full item with photo | < 90s |
| Menu pages with correct shareable slugs | 100% |
| Item detail views / session | ≥ 3 (instrument from day 1) |

## §4 Guiding principles

Each settles arguments later.

1. **The manager is the product.** [LOCKED] The public menu is table stakes; the rebuild is justified only if managing the menu is dramatically faster and simpler than the tool it replaces. When in doubt, over-invest in the admin (M3).
2. **Speed is a feature, and it's a hard gate.** [LOCKED] Mid-range Android + Nigerian mobile data is the reference device. A slow menu is a broken menu. Perf budgets fail the build (§7 #6).
3. **Own the whole stack.** [LOCKED] Own domain, data, design. No "powered by" footer, no paywalled basics, full data export.
4. **Tenant isolation is sacred.** [LOCKED] The instant there are two tenants, one seeing another's data is an extinction-level bug. Every menu query is tenant-scoped; an unscoped query is a security defect, not a style nit. Authority: [`security.md`](security.md).
5. **The design signals "hotel restaurant," not "free QR tool."** [LOCKED] Density and legibility over mood; one bold element (the seal mark 印章), everything else quiet. See [`ui-rules.md`](ui-rules.md).
6. **Ship menu-only first.** [LOCKED] Ordering is off in v1. A correct, fast menu with a real manager is the entire first win. Don't drag ordering (Phase 3) forward.
7. **Explicit over magic.** [LOCKED] Visible failure modes over hidden cleverness — especially at the tenancy boundary. See §9.

## §5 Core model

Two intertwined models: the **tenancy hierarchy** (who owns what) and the **menu tree** (the thing being managed).

### Tenancy hierarchy (top → bottom)

```
tenant  (a business / account — the Platter customer; owns branding, staff, billing)
  └── restaurant  (a venue / outlet — a physical location & menu context)
        └── menu_group  (display band: "Chinese Kitchen", "Drinks")
              └── category  ("Appetizers", "Soup")
                    └── item  ("Butterfly King Prawn")
                          ├── item_variant  ("2 pcs" / "4 pcs" — absolute prices)
                          └── modifier_group → modifier  (reusable add-ons)
```

- **Tenant** = the account that signs up and (later) pays. **v1: one row.** New seam vs. the PRD; see §9.
- **Restaurant** = the PRD's `restaurants` table, kept by that name = a venue/outlet. **v1: one row** (Jīn Cāntīng). The hotel's bar/cafe become sibling rows under the same tenant later (Assumption 4).
- **Group** is a *display device only* — every category is still an independently manageable row and can be reassigned to another group.
- Everything below `tenant` carries a `tenant_id` (denormalized for RLS — §9).

### Item lifecycle (the central state machine)

```
                 create (always draft)
                        │
                        ▼
   ┌────────── draft ───────────┐  edit → back to draft (pending change)
   │            │ publish        │
   │            ▼                │
   │        published ───────────┘
   │            │
   │   is_available toggle  ← LIVE, bypasses publish, revalidates in <5s (§7 #8)
   │            │
   │        soft delete (deleted_at set) ── 30-day undo window ──► hard purge
   └────────────────────────────────────────────────────────────►
```

- **Draft vs published** is the editing safety net: edits land in draft; a "Publish changes" step revalidates the public cache. [LOCKED]
- **`is_available` is orthogonal to publish** — sold-out is an operational toggle that must go live immediately without a publish. [LOCKED] This is the single most important behavioral rule in the manager.
- **Delete is always soft** (`deleted_at`), 30-day undo, "Deleted" tab. [LOCKED]

### Identity & slugs

- Human-facing URLs use **stored, editable slugs derived from the real name** (`/menu/appetizers/chicken-samosa`), never template leftovers. Changing a published slug writes a 301 into `redirects`. [LOCKED] (Fixes PRD D2.)
- Staff/records never expose UUIDs; order numbers (Phase 3) are daily-resetting human numbers (`#014`).

## §6 Core flows & surfaces

**Surfaces:** (1) **Public menu** — PWA, mostly-static, guest-facing. (2) **Menu Manager** — authenticated admin, phone-first. (3) **Order board** — Phase 3. (4) **Platform/tenant onboarding** — Phase 2 (§13).

**Flow A — Guest browses (the flow the product lives or dies on):**
scan QR / open link → menu landing (name, bilingual mark, open/closed pill, group→category nav) → scroll categories with sticky rail + scrollspy → tap item → **bottom sheet** springs up (shallow-routed URL `/menu/[category]/[item]`, shareable, back closes it) → read description, pick variant, see allergens → share / call / WhatsApp / directions. Search + filters cut across all of it.

**Flow B — Manager updates the menu (the flow that justifies the rebuild):**
log in → menu tree (groups→categories→items, counts, live filter) → one-tap **sold-out toggle** (optimistic, no dialog, undo toast, auto-clears at daily reset) *or* create/edit item (name, price, variants, photo via camera→crop→WebP, tags, allergens, spice) → edit lands in **draft** → "Publish changes" bar shows pending count + diff → publish revalidates public cache.

**Flow C — QR:** manager generates/downloads menu QR (SVG/PNG/PDF, per-table `?t=12` variant, A6 table-tent). Printed codes are **dynamic** — they never change when the menu changes (§7 #10).

## §7 Locked decisions

The heart of the file. Other files cite these as `foundation.md §7 #N`.

| # | Decision | Reasoning | Rejected alternative |
|---|---|---|---|
| 1 | **Framework: Next.js 16, App Router, TS strict** | The public menu genuinely needs SSR/SEO, ISR, per-item OG images (`next/og`), and edge caching — the exact case that overrides the usual "React+Vite, Next rejected by default" stance. One repo serves public + admin. *(PRD said "15"; `create-next-app@latest` ships 16 — adopted latest-stable at M1, `progress-log.md` 2026-08-04.)* | React + Vite SPA (loses SSR/SEO/OG, the whole point of a shareable menu) |
| 2 | **DB/Auth/Storage/Realtime: Supabase (Postgres + RLS)** | One managed platform gives Postgres, row-level security, file storage, realtime, and auth — and Gold already runs it. RLS is the tenancy enforcement mechanism. | Self-rolled Passport+JWT+argon2id (the usual default) — more infra to own, no RLS, no free Storage/Realtime |
| 3 | **Auth: Supabase Auth (email+password & magic link)** | Comes with #2; 30-day sessions, rate-limited, integrates with RLS via `auth.uid()`. | Self-rolled auth — rejected with #2 |
| 4 | **Hosting: Railway** *(changed from Vercel, 2026-08-04, Gold's call)* | Gold chose Railway. Next runs as a long-lived Node server (`next start`, binds `$PORT`); v1 is entirely dynamically-rendered so Vercel's edge/ISR edge isn't in play. `next/og` runs on the Node runtime. **Phase 2 stays on Railway too** — custom + wildcard domains are done there at M7 (`§13 P-Q2`, **reconsidered 2026-08-05**; the earlier Vercel cutover was dropped as an unneeded migration). | Vercel (original) — better Next edge/ISR, but unused while the menu is force-dynamic |
| 5 | **Currency is a per-tenant setting, formatted `₦6,000` (en-NG, no decimals on whole amounts), shown once** | The incumbent's worst bug is rendering Naira as `$` (D1) and printing the price twice (D3). Currency must never be hardcoded — it's a platform setting so tenant #2 in another currency just works. | Hardcoded `$`/symbol (the exact bug being replaced) |
| 6 | **Performance budgets are CI gates: ≤215KB initial JS, Lighthouse ≥90, LCP<2s / CLS<0.05 / INP<200ms on Slow 4G / 4× CPU** | The reference user is on a mid-range Android on Nigerian data; the product is worthless if slow (§4 #2). Gates that fail the build are the only ones that hold. **JS budget re-baselined 2026-08-06 from 120KB→215KB:** measured live, the React 19 / Next 16 (Turbopack) framework floor alone is ~174KB gzipped first-load (a blank page); app code is lean (menu = 204KB, only +~30KB, cleanly split). 215KB = floor + lean app + headroom; enforced by `scripts/measure-bundle.sh`. A number the stack can't hit isn't a gate. | "Optimize later" — perf debt is unrepayable once features pile on |
| 7 | **Two-level IA (groups → categories), not 19 flat chips** | Fixes D6/D11 — surfaces the premium Chinese offer first instead of burying it among 19 equal tiles. Groups are display-only over independently-managed categories. | Flat category list (the incumbent's wall of chips) |
| 8 | **Draft/publish for edits; `is_available` bypasses publish and revalidates live (<5s)** | Editing needs a safety net (draft) but sold-out is operational and must be instant. `revalidateTag('menu')` on publish; availability toggles revalidate immediately. | One-mode "every save is live" (unsafe edits) *or* "everything needs publish" (sold-out too slow — kitchen keeps selling lobster) |
| 9 | **RBAC enforced in BOTH Postgres RLS and the app layer; never rely on hiding UI** | Defense in depth at the security boundary. A staff token physically cannot write anything but `is_available`; a manager token is DB-scoped to its tenant. | UI-only role gating (trivially bypassed; useless for a multi-tenant SaaS) |
| 10 | **Keep the dynamic QR contract: printed codes never change when the menu changes** | The one thing the incumbent does that must not regress — reprinting table tents on every menu edit is a non-starter. | Static/regenerated QR that invalidates print runs |
| 11 | **Multi-tenant-ready data model now; single-tenant product surface in v1** | Retrofitting `tenant_id` + RLS across every table later is painful and risky; adding it now is one column + one RLS predicate everything needs anyway. But signup/billing/subdomains are real product surface — defer them. | (a) Hardcode single-tenant, retrofit later (painful migration + isolation-bug risk). (b) Build full SaaS now (blows v1 scope) |
| 12 | **Row-level multi-tenancy (shared DB/schema + `tenant_id` + RLS)** | Scales to many tenants on one Postgres, one migration path, cheapest to operate on the free tier; RLS makes isolation declarative. | Schema-per-tenant / DB-per-tenant — ops burden that doesn't pay off for a menu workload |
| 13 | **Portion counts are variants, not name suffixes** | Fixes D7 — "FRIED JUMBO SHRIMP 6 PIECES" → item `Fried Jumbo Shrimp` + variant `6 pieces`. Card shows "from ₦6,000". Real 6pc/12pc without duplicate items. | Baking counts into item names (no variant support, duplicate items) |
| 14 | **Soft delete everywhere (`deleted_at`), 30-day undo** | Non-technical managers will fat-finger deletes; recovery must be trivial. | Hard delete (unrecoverable; scary for the target user) |
| 15 | **Zod schemas are the single source of truth for shape, used triple-duty** | One schema per entity validates the client form, the server action, and CSV import — the migration path. Everything imports from `lib/schemas`. Build these first. | Ad-hoc validation per layer (drift between form, API, import) |
| 16 | **Fractional `sort_order` (double precision) for ordering** | Drag-and-drop reordering writes one row, not a full-table renumber. | Integer positions (O(n) rewrites on every reorder) |
| 17 | **Design system: dark-first "lacquer/brass/porcelain" + the seal-mark (印章)** | The design has to say "hotel restaurant" in a dark room in ~40s. One bold element (seal marks replace every generic pill/icon), everything else hairline-quiet. Theme accent is tenant-settable via CSS variables. | Generic cream-bg/terracotta template look (reads as a free tool) |
| 18 | **Missing image = seal mark on a brass hairline frame, not a grey box** | ~80% of items have no photo (Assumption 3); the fallback must look intentional. | Grey placeholder box (reads as broken/unfinished) |
| 19 | **Ordering OFF in v1 (menu-only), spec'd now, built in a later phase (Phase 3)** | The incumbent's ordering is barely used; a correct fast menu + real manager is the whole v1 win (§4 #6). | Building cart/checkout/order-board in v1 (scope blowout) |
| 20 | **`*_zh` columns and toggle-ready bilingual layout ship in v1, content empty; translation is Phase 2 (PB7)** | Latin + CJK type must both be specified from day one so adding Chinese later is content, not a rebuild. | Retrofitting bilingual layout later (touches every component) |

## §8 Scope

### In (v1) — one tenant, menu + manager + QR
- Public menu: landing, sticky category rail + scrollspy, item rows, bottom-sheet item detail (shallow routing), search, filters, ₦ formatting, sold-out state, variants, spice/allergen display, PWA, share, call/WhatsApp/directions. (PRD §5, P1–P15.)
- Menu Manager: auth + RBAC, menu tree, item/category CRUD, sold-out toggle, dnd reorder, photo upload+crop+WebP, draft/publish, bulk actions, duplicate, CSV import/export, modifier groups, variants UI, QR generator + table-tent PDF, settings, staff accounts, audit log, analytics. (PRD §6, A1–A18.)
- SEO/metadata: real slugs, JSON-LD, per-item OG, sitemap.
- The **multi-tenant data model** (tenant seam + `tenant_id` + RLS) — schema only.

### Out / cut (the forcing function)
- **Online payments** (Paystack/Flutterwave) — Phase 3.
- **POS integration** — not planned.
- **Native iOS/Android apps** — PWA only.
- **Delivery-driver dispatch/logistics** — not planned.
- **The SaaS product surface** — tenant self-signup, billing/plans, subdomain/custom-domain routing, tenant-admin console, per-tenant theming UI. Schema is ready (§7 #11); the *surface* is deferred.

### Deferred (later phases) — renumbered 2026-08-04 to match the Phase 2 PRD
> **Phase naming (authoritative):** **Phase 2 = the Platform** (multi-tenant venues/menus + theme system — [`docs/PRD-platter-platform-phase2.md`](../docs/PRD-platter-platform-phase2.md), reconciled in §13). **Phase 3 = Ordering + Growth.** This flips the v0 numbering (where ordering was "Phase 2"); earlier "built Phase 2" phrasing for ordering in §7 #19 now reads as "a later phase."
- **Phase 2 — Platform:** the tenancy seam made real (venue + menu layers, `memberships`, `auth_tenant_ids()`), the **theme system** (registry + 4 themes + customiser), signup + PDF/photo-import onboarding, subdomain + custom-domain routing, QR Studio, billing (Paystack + Stripe) + plan tiers, team/roles, marketing site + discover. Full spec + build order (M1–M10) in the Phase 2 PRD; decisions + corrections in §13.
- **Phase 3 — Ordering:** cart, dine-in/room-service/takeaway checkout, realtime order board with sound alert, WhatsApp fallback handoff. (v1 PRD §7.)
- **Phase 3 — Growth:** payments on orders, guest feedback, loyalty, reservations, POS, public API, theme marketplace, second outlet under a tenant. **Note:** i18n moves *earlier* — it's a Phase 2 public-menu addition (PB7), not Phase 3.
- **Feature backlog** — 7 scoped candidate features (WhatsApp sold-out · in-theme print PDFs · no-result-search → one-tap add · auto menu-engineering · guest LLM concierge · dual-currency display · social kit) in [`docs/FEATURE-BACKLOG.md`](../docs/FEATURE-BACKLOG.md), each with phase placement + effort/leverage. Not yet scheduled into M1–M10; several are cheap wins riding existing infra (`@react-pdf`, `next/og`, the no-result-search event, `§7 #5` currency).

## §9 Architecture keystones

Decisions live here; mechanism detail lives in [`architecture.md`](architecture.md) and the isolation policy in [`security.md`](security.md).

- **Tenancy/isolation model [LOCKED §7 #11, #12]:** row-level multi-tenancy. Every tenant-owned table carries `tenant_id uuid`; RLS policies scope every read/write to the caller's tenant via a `staff`→`tenant_id` lookup. `tenant_id` is **denormalized onto child tables** (items, categories, …) so RLS predicates don't need multi-join climbs — the explicit-over-magic call: a visible column and a simple policy beat a clever recursive one. v1 seeds exactly one tenant.
- **The keystone unlock:** the **zod schemas + Postgres migrations + RLS policies**, together. Once the data model and its isolation are real and the schemas exist in `lib/schemas`, every other layer (public queries, server actions, admin forms, CSV import) is a consumer of a settled contract. This is Layer 0; nothing real is built before it. See [`build-graph.md`](build-graph.md).
- **Explicit-over-magic calls:** (a) denormalized `tenant_id` + hand-written RLS over ORM-magic scoping; (b) fractional `sort_order` over position-shuffling triggers; (c) `is_available` as a plain column that bypasses the publish/cache flow, not an event-sourced state machine.
- **Caching:** public menu statically rendered and tagged; `revalidateTag('menu')` on publish; availability toggles revalidate immediately (must be live <5s). Detail in `architecture.md`.

## §10 Known scale seams

Honest about what is *not* built to scale yet, and what replaces it when it breaks.

| Seam | v1 reality | Replace with, when it breaks |
|---|---|---|
| **Tenant surface** | Data model is multi-tenant; there is no signup/billing/routing UI. Onboarding tenant #2 is a manual DB insert. | Build the SaaS surface (§8) once a second real venue is committed. |
| **Search** | Client-side fuzzy search over the loaded menu (fine to ~400 items). | Server-side / Postgres trigram or a search service when a menu or catalog outgrows a single client payload. |
| **Free-tier limits** | Supabase free tier + Vercel free/Pro sized for one tenant. | Paid tiers before multi-tenant load; revisit at tenant #2. |
| **Images** | Supabase Storage transforms; no dedicated CDN pipeline. | Dedicated image CDN if transform latency/volume bites at multi-tenant scale. |
| **Analytics** | Append-only `menu_events` table queried directly. | Rollup tables / a warehouse if event volume outgrows on-the-fly queries. |

## §11 The deepest risk

**The bet the product dies on if wrong — two faces of one bet:**

1. **v1 (the venue):** that a non-technical supervisor will *actually use* the manager (sold-out in <10s, item in <90s) **and** that the menu is *genuinely fast* on a cheap Android on bad data. If either fails, the rebuild is a downgrade from a working rented tool — the whole justification collapses. Everything routes back to §4 #1 and #2.
2. **The platform:** that **tenant isolation is airtight.** The first cross-tenant data leak ends the SaaS before it starts. This is why isolation is a locked principle (§4 #4) with its own authority file, not a code-review afterthought.

Name it once, here: **usable-and-fast for the venue; provably isolated for the platform.** Every other file points at this.

## §12 Open questions

Honest gaps. None block building the context system or M1; each carries a recommendation.

| # | Question | Recommendation / default | Status |
|---|---|---|---|
| 1 | **Platform brand name** (currently codename `Platter`) | Ship v1 under Jīn Cāntīng's own brand/domain; name the platform before onboarding tenant #2. Keep `Platter` as the code-level placeholder until then. | 🕗 |
| 2 | **Confirm the tenancy model** — row-level + `tenant_id` seam now, single-tenant surface (§7 #11/#12). This is the one architectural call made *for* Gold. | Proceed as recommended; cheap insurance now, expensive to add later. | ✅ **Locked** (Gold, 2026-08-04) — schema carries the tenant seam; SaaS surface deferred |
| 3 | **Who is the "tenant"** — the hotel (De Geogold, multiple F&B outlets) or the restaurant (Jīn Cāntīng)? | Model tenant = the **account holder**; for v1 make it *De Geogold Hotel* with Jīn Cāntīng as its first `restaurant`, so the bar/cafe slot in as sibling outlets (Assumption 4). Cheap to relabel if wrong. | 🕗 (default assumed for M1 seed) |
| 4 | **Supabase project** — create a fresh one via MCP, or wire an existing project Gold runs? | Create a dedicated new project for clean RLS/migrations; needs URL + anon key + service-role key. | ✅ **Locked** (Gold, 2026-08-04) — **create a fresh project** |
| 5 | **M1 seed data** — 10 real items from the live menu (scrape now) or faithful reconstructions from the PRD wireframe? | Seed from the PRD's real items + a few fill-ins for M1; run the full legacy scrape at M5. | ✅ **Locked** (Gold, 2026-08-04) — **reconstruct from the PRD now**, scrape at M5 |
| 6 | **Domain** for v1. | Register a real domain before publishing; decide whether to keep the Instalacarte account alive 60 days as a redirect (PRD §11.4 recommends yes). | 🕗 (M7) |
| 7 | **SaaS pricing model** | Out of scope until Phase-1 proves out; note it exists so architecture doesn't preclude plan tiers/feature gating. | 🕗 (SaaS) |
| 8 | **Phase 2 open questions** (sequencing fork · hosting/domains · brand · pricing) | Detailed with recommendations in **§13 → Phase 2 open questions**. Two are foundation-level and blocking. | 🕗 (Phase 2) |

---

## §13 Phase 2 — platform direction (spec'd, not started)

> Source spec: [`docs/PRD-platter-platform-phase2.md`](../docs/PRD-platter-platform-phase2.md). This section is the **reconciled truth**: the PRD's decisions folded in, plus the **corrections found in review** (2026-08-04) which *override* the PRD text. Nothing here is built — v1 (§1–§12) is the deployed reality. As M1+ land, built parts graduate into §5/§7/§8 and this section shrinks to what's still open.

### The reframe (three lies to fix)

| Today (v1, deployed) | Phase 2 |
|---|---|
| One restaurant, implicit | Many **tenants**, each with many **venues** |
| One menu per restaurant | Many **menus** per venue (Dinner · Bar · Room Service · Brunch), independently scheduled + published |
| One hardcoded design | A **theme registry** — the Jīn Cāntīng look becomes **"Lacquer"**, one of several tenants pick + tune |

**Test for the whole phase:** seed a second tenant selling coffee in Lagos and a third selling wine in Abuja, and no code needs a new branch. Jīn Cāntīng stops being *the product* and becomes *row one*.

### Target domain model (re-parents §5's tree)

```
tenant  └── venue  └── menu  └── group  └── category  └── item → variants, modifier_groups
```

- **`restaurant` → `venue`** (rename, keep the id so nothing dangles). Venue owns identity (name, currency, timezone, address, domain).
- **NEW `menu` layer** between venue and group. Menu owns presentation + schedule: its own theme, layout, weekday availability window, and publish state. Two menus on one venue can look different and be live at different hours.
- **staff table → `memberships`** (owner/admin/manager/staff, scoped by `venue_ids`).
- **design-as-global → theme registry** (per-menu `theme_id` + `theme_config`).

### §13 decisions (Phase 2) — cite as `foundation.md §13 Pn`

| # | Decision | Reasoning |
|---|---|---|
| **P1** | **Theme system = code-in-repo + config-in-db.** A `ThemeManifest` registry (`lib/themes`) ships tokens/typography/layouts/motif per theme; the DB stores only *what a tenant chose* (`menu.theme_config`). SSR-injected CSS-variable block, **no flash of unthemed content**. **Never** accept tenant CSS/JS. | This is the wedge (§13 risk). Config-not-code keeps it a bounded, safe surface. |
| **P2** | **Four launch themes: Lacquer (the extracted v1 look), Counter, Palm, Carafe.** No tenant-authored themes. | Four excellent > twelve mediocre; the gallery is the sales page. Each proves a capability (dark/motif; light/image-required; non-Western; images:'none'). |
| **P3** | **Tunable vs locked is the product.** Tunable: accent (curated 8, or hex with a **blocking** 4.5:1 contrast check), scheme, layout (only from the theme's declared set), density, hero, motif on/off, logo. Locked: typeface pairing, spacing/radius/shadow scales, component structure, arbitrary CSS. | Every tunable makes it *theirs*; every lock stops them making it ugly. |
| **P4** | **RBAC = owner>admin>manager>staff via `memberships`.** `auth_tenant_ids()` SECURITY DEFINER helper reads `memberships` (**never trust `tenant_id` in the JWT** — a stale token would outlive a revoked membership). Manager scoped by `venue_ids`; staff limited to `is_available` by a **column grant**, not just a trigger. | Extends §7 #9/#12 to the venue-scoped, multi-role world. |
| **P5** | **Plan tiers (free/pro/business) in ONE module (`lib/plans.ts`), enforced in THREE layers** (zod + Postgres trigger + UI). Downgrade = excess goes **read-only, never deleted**. | Matches §7 pattern (schema is source of truth). UI-only limits are theatre. |
| **P6** | **Dual billing: Paystack (NGN) + Stripe (else), normalized into one `subscriptions` row.** Idempotent, signature-verified webhooks. 14-day Pro trial, no card. | Emerging-market fit (§2 secondary wedge); Paystack is the realistic Nigerian rail. |
| **P7** | **Routing: `platter.app` (marketing) · `app.platter.app` (app) · `{slug}.platter.menu` + custom domains (Pro+).** Legacy `/menu/...` **301s forever** (§7 #10). Reserved-subdomain blocklist at signup. | The dynamic-QR contract now spans hosts; the subdomain must always resolve even behind a custom domain. |
| **P8** | **Six CI gates, build-failing** (extends §7 #6): cross-tenant leak (`tests/isolation.spec.ts`, every scoped table × 4 roles × 2 tenants), per-theme JS ≤215KB (re-baselined — see §7 #6), per-theme Lighthouse ≥90, axe-clean, **no raw color outside `lib/themes`**, **no unscoped query in `lib/queries`/`lib/mutations`**. | Isolation + perf + the theme-honesty lint are what keep the system real at scale. |

### Corrections to the PRD (review 2026-08-04 — these **override** the PRD text)

| # | Correction | Why |
|---|---|---|
| **C1** | **Guest menu reads must NEVER gate on `plan_status`.** PRD §5.2 (guest sees rows only if "tenant's plan is active") directly contradicts §10 ("never take a live menu down over a failed card"). Guest visibility keys only on published/live/not-deleted; plan gates **features** (custom domain, badge, theme count), never availability. | A dunning event would 404 a paying restaurant's live menu — the worst possible failure. |
| **C2** | **Run the M1 migration on a Supabase branch first.** Clone prod (`create_branch`), run migration + backfill + isolation suite there, verify every existing URL + the printed QR resolve, *then* apply to prod, with a rollback plan. **Drop the `restaurants`-as-a-view shim** — do a clean rename + one-PR code update (same codebase, one client). | Re-parenting a *live, deployed* schema is the highest-risk act of the phase; a view can't carry v1's writes. |
| **C3** | **The backfill must mint the tenant + owner `membership`** for the existing account. | Otherwise the current owner locks out of admin the moment RLS flips to `memberships`. |
| **C4** | **`menu.layout` is single-source inside `theme_config`** (validated against the theme's declared `layouts`) — not both a column and a config key. | Two sources of truth drift. |
| **C5** | ✅ **Already satisfied** (confirmed applying 0006) — v1 `modifier_groups` already carry `restaurant_id` (+ `tenant_id`). No change needed. | The Phase-2 PRD's DDL omitted it, but the built v1 schema has it. |
| **C6** | **Import sells the *review table*, not raw accuracy.** ≥90%/≥70% is an internal instrument; the public promise is "we do the typing, you fix the last rows." Always lands as draft. | A mediocre auto-import at first-impression damages trust; the correct-and-confirm UX is the actual product. |
| **C7** | **`/discover` is scope-creep for Phase 2** — ship as a manually-curated page or defer to Phase 3. | The self-serve directory drags in a moderation/abuse surface off the wedge. |

### Phase 2 deepest risk (extends §11)

Two bets: **(a) the wedge** — that "a menu that looks *designed*" converts (target: ≥40% of tenants change theme). Validate it **cheaply** by shipping Lacquer + Carafe on the real hotel's Dinner + Bar menus *before* building the other two themes + the customiser. **(b) isolation** — one cross-tenant leak ends the SaaS (§11.2); hence the CI gate (P8). The PRD's build order front-loads (a)'s *cost* (4 themes + customiser, M2–M5) before any *revenue* (M8) — see P-Q1.

### Phase 2 open questions

| # | Question | Recommendation | Status |
|---|---|---|---|
| **P-Q1** | **Sequencing — LOCKED 2026-08-04: validation-first.** Build order: **M1 → Lacquer (extracted) → Carafe → prove on the hotel's Dinner + Bar menus → then** Counter/Palm, customiser, import, billing. The *full* product is designed up-front (`docs/DESIGN-SPEC.md`); only the *build* is staged. | Halves the M2–M8 spend before the "themes sell" bet is tested; uses the real hotel (two menus, two themes) as the live sales proof for tenant #2. | ✅ **Locked (Gold)** |
| **P-Q2** | **Hosting — RECONSIDERED 2026-08-05: stay on Railway** (Gold). M7 does custom **and** wildcard domains **on Railway** (CNAME + wildcard cert), not a Vercel cutover. Supersedes the 2026-08-04 Vercel lock. | Railway is proven across M1–M6 and supports custom domains + wildcard subdomains (`*.platter.menu`); staying avoids a migration, a second host, and the Vercel Pro spend. Vercel's only real edge — global edge-latency for the public menus + a slicker programmatic domain-attach/TLS API — is an **optimization, deferred** (revisit only if menu latency bites at scale). The original Vercel case (edge middleware for host→venue, ISR/tag-cache) still holds technically; it's just not worth a migration now. | ✅ **Reconsidered (Gold, 2026-08-05)** |
| **P-Q3** | Platform **brand name** (still codename `Platter`). | Lock before the marketing site (M9). Same as §12 #1. | 🕗 |
| **P-Q4** | **Launch pricing** (Free · Pro $9/₦9k · Business $29/₦29k). | Validate against Menubly/MenuTiger; not settled. | 🕗 |
