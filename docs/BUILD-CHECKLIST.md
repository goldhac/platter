# Platter — Build Checklist (Phase 2)

> The single actionable list of everything to be done, in the **locked validation-first order** (`foundation.md §13 P-Q1`). Check items off as they land. Guardrails reference the corrections in `foundation.md §13` (C1–C7). Full rationale: the Phase 2 PRD + `build-graph.md`.
>
> **Legend:** `[ ]` to do · `[x]` done · `[~]` in progress · **⛔ gate** = must pass before the next milestone.

---

## ✅ Pre-flight (done)
- [x] v1 built + deployed to Railway (`platter-production-946c.up.railway.app`)
- [x] Legacy menu scraped → `scripts/legacy-menu.csv` (258 items)
- [x] Phase 2 PRD folded into the context system (`foundation.md §13`, build-graph, this checklist, `DESIGN-SPEC.md`)
- [x] **P-Q1 locked:** validation-first (Lacquer + Carafe first)
- [x] **P-Q2 locked:** migrate to Vercel (before M7)

---

## M1 — Tenancy seam  ✅ *isolation green + LIVE on prod (app-layer polish folds into M4)*
> Test bed: **Railway Postgres dev DB** (service `Postgres`, reached headlessly via `railway connect` SSH tunnel — Supabase branching needs Pro). A local Postgres 17 (`.local-pg/`, gitignored, currently stopped) is the fallback. Satisfies `§13 C2`; apply to prod only when the isolation suite is green. No UI in this milestone.
- [x] git branch `phase2/m1-tenancy`
- [x] Dev DB — **Railway Postgres** (`railway connect` SSH tunnel) + `tests/fixtures/00_local_auth_stub.sql` (Supabase auth/roles) + v1 baseline (0001–0004); mirrored on a local pg fallback
- [x] **`0006_phase2_tenancy.sql`** — `memberships` (role + `venue_ids`), `menus`, `menu_schedules`, `menu_id` on `menu_groups`, tenant `plan_status`/billing, venue identity fields, platform tables (`invites`/`qr_codes`/`qr_scans`/`subscriptions`/`imports`/`domain_verifications`) + idempotent backfill. **Verified on harness (25 tables).**
- [x] `tenant_id` already on every table (v1); `modifier_groups` already had `restaurant_id` → **§13 C5 non-issue**
- [~] `restaurants`→`venues` rename **deferred** — cosmetic; would ripple through all code for zero isolation benefit. `restaurants` stays the venue table; rename is a later mechanical pass.
- [x] **`0007_phase2_rls.sql`** — `auth_tenant_ids()` (array, off `memberships`) + `auth_role_in()`/`auth_can_manage()`/`auth_is_admin()` + `admin` role; every policy rewritten (63); staff column-guard triggers updated. *(Manager `venue_ids` scoping deferred to the app layer — tenant isolation is the DB-enforced P0.)*
- [x] Guest reads key only on published/live/not-deleted — NOT `plan_status` (`§13 C1`)
- [x] Backfill mints the owner `membership` (`§13 C3`) — in 0006 (verify admin authenticates when applied to prod)
- [x] **⛔ isolation gate GREEN** — `tests/isolation.sql` (5 tests: cross-tenant read · cross-tenant write · staff column-lock · anon published-only · manager positive control) passes on the Railway dev DB. *(A vitest/CI wrapper reading `DATABASE_URL` is a small follow-up.)*
- [→] Update `lib/schemas/*` (+ `menu`, membership) and `lib/queries`/`lib/mutations` for the menu layer — **folded into M4** (v1 keeps working via RLS + the default menu; confirmed by the live-menu check)
- [x] Applied **0006 + 0007 + 0008** to **prod** (Supabase); backfill clean (1 live menu, 4 groups re-parented, owner membership + subscription, 10 items untouched); 63 policies
- [x] Verified: live `/menu` renders identically post-migration (200, 金餐厅, 20 ₦ prices, real dishes); owner impersonation resolves tenant + role `owner` + sees all their data; security advisor clean bar expected/pre-existing
- [ ] *(follow-up, minor)* isolation as a vitest/CI wrapper · move `pg_trgm` out of `public` · enable Auth leaked-password protection (dashboard toggle)

## M2 — Theme system + Lacquer  ✅ *core done — theme system live, Lacquer extracted, zero regression (other themes = M3)*
- [x] `ThemeManifest` types + registry (`lib/themes/{types,lacquer,index}.ts`) — `resolveTheme()` → CSS-var map; typechecks clean
- [x] `ThemeProvider` — SSR CSS-variable injection (`components/theme/theme-provider.tsx`); no FOUC (vars in the SSR HTML, verified at runtime)
- [~] Layout components — `list-dense` is the live layout; `card-grid`/`editorial`/`ruled-list` land with their themes in M3 (kept as N skins, not a mega-component)
- [~] Per-theme fonts — Lacquer's 4 faces load; loading *only the active theme's* faces is an M3 optimization (needs a 2nd theme to matter)
- [x] **⛔ no-raw-color gate** — `scripts/lint-tokens.sh` + `npm run lint:tokens`; green on the themed surface (public menu fully on the semantic contract; admin + OG are documented non-themed exceptions)
- [x] Ported v1 → **Lacquer** manifest **verbatim**; zero regression **verified at runtime** (SSR HTML carries `data-theme=lacquer` + resolved `--color-accent:#8e1d1d`; menu renders identical, 20 ₦ prices). Pixel screenshot-diff = nice-to-have follow-up.
- [~] Provider *consumes* `theme_id`/`theme_config` (hardcoded `lacquer` now); wiring from the real `menus` record → M4 (when menus surface)

## M3a — Carafe  ✅ *the abstraction proof — passed*
- [x] **Carafe** theme (`lib/themes/carafe.ts`) — `ruled-list`, `images:'none'`, motif `none`, near-black + gold; registered
- [x] `ruled-list` renders with **no `{image && …}` hacks** — `RuledItem` is a SEPARATE component (not a conditional in a shared row); `components/menu/layouts.ts` (`LAYOUTS` + `layoutItem()`) selects it; layout-driven in both the server grouped view + client `MenuBoard` filtered view
- [x] **Verified at runtime, same data → two themes:** `/menu` = list-dense/red/thumbs/0-dots; `/menu?theme=carafe` = ruled-list/gold/near-black/**20 dotted-leaders, no images**; both keep 金餐厅 + 20 ₦. Lacquer unchanged. `?theme=` preview added (also powers M5). *(Follow-up: the shared item-sheet could honor `images:'none'` too.)*

## ⭐ Validation gate — LIVE on the hotel (Dinner=Lacquer ↔ Bar=Carafe) ✅
- [x] Jīn Cāntīng has a **Dinner** menu (Lacquer) + a **Bar List** menu (Carafe) in prod — default renamed "Dinner"; Bar List = live/carafe
- [x] **Public menu switcher** (`components/menu/menu-switcher.tsx`) — hidden with 1 menu; `?m=` selects the menu → re-theme
- [x] **Deployed the new build to Railway** (interim, before the P-Q2 Vercel cutover) + **published the 4 Bar drinks**. **LIVE-verified** on `platter-production-946c.up.railway.app`: `/menu`=Dinner/Lacquer/red (0 bar leak), `/menu?m=bar-list`=Bar/**Carafe**/gold/ruled-list with the 4 drinks as a dotted-leader wine list. Screenshot-confirmed.
- [ ] *(follow-up)* import the full scraped bar list (58+ real drinks) → M5/M6 import
- [ ] **⛔ Decision point:** does "themes sell"? → then commit to customiser/import/billing

## M3b — Counter + Palm  ✅ *all 4 launch themes shipped (built early — cheap, and completes the gallery)*
- [x] **Counter** (`lib/themes/counter.ts` + `CardItem`) — `card-grid`, images-required, **light scheme**, bone-white + tangerine. Runtime: `data-layout=card-grid`, `data-scheme=light`, photo grids.
- [x] **Palm** (`lib/themes/palm.ts` + `EditorialItem`) — `editorial` (+ `list-dense`), deep-green + raffia + ochre, full-bleed bands. Runtime: `data-layout=editorial`.
- [x] Abstraction extended: each layout owns its **list wrapper** (divided list / grid / stacked bands) via `layoutSpec()`. **All 4 verified rendering the same data distinctly** — 4 layouts, dark + light, 4 palettes, 20 ₦ preserved throughout.
> Note: the plan slotted Counter/Palm *after* the ⭐ validation gate. Built now because they're cheap (a manifest + one layout component each) and complete the gallery/demo — the *expensive* work (customiser M5, import M6, billing M8) still waits on the gate, so validation-first logic holds.

## M4 — App shell + menus  ✅ *core landed (editor rescoped + dashboard); multi-venue UI deferred*
- [x] Data-driven theme (menu reads its theme from the DB) + public **menu switcher** (slices 1–2 — done, LIVE)
- [x] **Menus list** (`/admin/menus`, `lib/queries/admin-menus.ts`) — cards (theme · item count · status) + **New menu** (`createMenu` → draft menu + starter group → drops you into the customiser). Nav: Menus. *(Duplicate/import variants = follow-up.)*
- [x] **Editor rescoped per-menu** (`/admin/menu`): `getAdminMenuTree(menuSlug?)` scopes the tree by `group.menu_id`; menu picker + active-menu header. `+ Item`/`+ Category`/Edit and item/category save all carry `?m=<slug>`, so new rows land on the intended menu and navigation is sticky. Bulk "Move to…" scopes to the active menu; edit-item keeps the full category list so items can still move across menus.
- [x] **Dashboard** (`/admin` — replaced the redirect): venue name, stat tiles (menus · items · live/draft), menus-at-a-glance (Edit/Theme/View each), New-menu, quick actions (add item · QR · import · settings), View-live-site. Login now lands here; the wordmark links home.
- [ ] *(deferred — premature at single-venue)* Tenant/venue switcher; venues list + venue detail (hours, contact, map, gallery, domains). Revisit when a 2nd venue/tenant onboards (Phase-2 SaaS surface).
- [ ] *(follow-up)* "move/duplicate to another menu" as a first-class bulk action; per-menu publish state; mobile bottom tabs + desktop sidebar; breadcrumbs; real view counts / sold-out nudge / usage bar on the dashboard

## M5 — Theme gallery + customiser  ✅ *core built (`/admin/theme`)*
- [x] Split-screen customiser (`components/admin/theme-customiser.tsx`) + `/admin/theme` page — **live phone preview of the venue's REAL items**, re-themes as you change controls; 4-theme picker + a menu selector (theme Dinner or Bar List)
- [x] Accent picker (curated swatches + hex) with a **blocking 4.5:1 contrast check** (`lib/themes/contrast.ts`) — shows the ratio, refuses to publish an unreadable accent
- [x] Scheme + layout toggles (only the theme's declared options); **Publish** (`publishMenuTheme`) / **Discard**; draft save (`saveMenuThemeDraft` → `theme_config_draft`); plan gating (Free = Lacquer, others **Pro**-locked)
- [ ] *(follow-up)* full "Reset to defaults", preview toggles (item-sheet/search states); **visual test needs an owner login** (build-verified only so far — the underlying publish→re-theme mechanism is already proven live)

## M6 — Onboarding + import  *(the AI import wedge is built & live)*
- [x] **PDF/photo → structured menu (Gemini)** — `lib/ai/gemini.ts` (REST, no SDK; `gemini-2.5-flash`; `responseSchema`-enforced JSON; key via `GEMINI_API_KEY` only). **Live-tested** on a known 11-item menu: 100% of items/prices/sections correct, £ symbols stripped + decimals kept, 🌶→spice, (v)→vegetarian, smart squid→seafood / guanciale→contains_pork. ~9s/page.
- [x] **Review + edit UI** (`components/admin/menu-import.tsx`) — upload → editable tree (menu name, groups, sections, item name/price/description, delete anything) → **commit as a DRAFT menu**; `/admin/import` leads with it (CSV demoted to "advanced"). **Never auto-publishes** (`§13 C6`).
- [x] **Correct commit** (`lib/mutations/import-menu.ts commitParsedMenu`) — builds a real menu → groups → categories → items hierarchy (unlike the CSV path, which orphans categories); decimal-safe prices (`numeric(,2)`); unique slugs seeded from existing rows. Routes into the new menu's editor.
- [x] Upload plumbing: 12mb server-action `bodySizeLimit`; JPG/PNG/WEBP/HEIC/PDF ≤10MB; friendly errors for bad key / rate-limit / unreadable / safety-block.
- [x] **Self-serve signup + provisioning** — `/admin/signup` (logged-out) → `provision_tenant()` SECURITY DEFINER (tenant + venue + owner staff + membership, idempotent) → `/admin/onboarding` leads with the import. A brand-new restaurant now goes from nothing → isolated tenant with a draft menu, no manual seeding.
- [ ] Wizard polish: **business step** (currency/locale/cuisine — new venues default NGN), **theme step** (reuse the customiser), **claim-URL step** (→ M7 domains). Core funnel (account → import) is live; these are progressive.
- [ ] Per-item **confidence** surfacing (Gemini structured output doesn't return logprobs cheaply — revisit); dup flags; CSV/paste/sample-menu variants of the same review UI
- [ ] *(follow-up bug)* the legacy CSV import (`importItemsCsv`) creates **orphan categories** (no `group_id`) — invisible on any menu post-rescope. Point it at a target menu/group like the Gemini path does.

## M7 — Domains + QR Studio  *(on Railway — Vercel cutover dropped, `§13 P-Q2` reconsidered 2026-08-05)*
- [ ] **Custom + wildcard domains on Railway** — add `*.platter.menu` (wildcard domain + cert) and per-venue custom domains via Railway's domain API; no host migration.
- [ ] Update `NEXT_PUBLIC_SITE_URL`; update Supabase Auth redirect URLs for the new hosts
- [ ] **Host→venue resolution in the Proxy** — resolve `host` → restaurant (replaces the hardcoded `jin-canting` in the public menu), `venue:{host}` cache tag. **This is what gives new signups a live public URL.**
- [ ] Subdomain claim (`<venue>.platter.menu`) + reserved-subdomain blocklist
- [ ] Custom-domain verify (CNAME, `domain_verifications` table already exists) + TLS
- [ ] **Legacy `/menu/...` 301s forever** (printed QR contract)
- [ ] QR Studio: venue / per-menu / **per-table (bulk 1–N)** codes, styling (error-correction H), SVG/PNG/A6-PDF/A4-sheet, **scan analytics per code**
- [ ] **`[B2]` print parity** — the studio becomes **"Print & QR Studio"**: in-theme A4 / A3 / table-tent / specials-card PDFs via `@react-pdf`, from the same menu data (print price can't disagree with the QR price). `FEATURE-BACKLOG.md`.

## M8 — Billing + team
- [ ] `lib/plans.ts` (one module) enforced in **three** layers: zod + Postgres trigger + UI
- [ ] Paystack (NGN) + Stripe (USD) → one normalized `subscriptions` row; idempotent, signature-verified webhooks
- [ ] 14-day Pro trial (no card); proration/credit; **dunning keeps menus live** (`§13 C1`)
- [ ] Downgrade = read-only, never delete
- [ ] Team: invites, roles, escalation confirm, **audit log**

## M9 — Marketing site + discover + analytics
- [ ] `platter.app` home (live theme-cycling hero), `/themes` gallery, `/themes/[id]`, `/pricing` (dual currency)
- [ ] `/discover` — **curated-only** at launch (`§13 C7`)
- [ ] `/menu-import` landing
- [ ] Tenant analytics screen (views, top items, **no-result searches**, scans, category drop-off)
- [ ] Weekly digest email (Resend)
- [ ] **`[B3]` no-result search → one-tap "Add it?"** — turns the no-result report into a drafted item (venue-voice description optional, Pro). Draft only.
- [ ] **`[B4]` auto menu-engineering** in the weekly digest — star / plowhorse / puzzle / dog from views × price (views now; + orders/margin in P3).
- [ ] **`[B7]` one-tap social kit** — export any dish as a story / post image in the venue's theme (extends `next/og`).

## M10 — Hardening  ⛔ *all gates green before ship*
- [ ] **6 CI gates green across all 4 themes:** isolation · JS ≤120KB/theme · Lighthouse ≥90/theme · axe-clean · no-raw-color lint · no-unscoped-query lint
- [ ] Load-test 100 tenants / 20k items
- [ ] Notifications (Resend transactional set) · analytics events wired · rate-limits + storage quotas

---

## Feature adds — backlog features, placed in the phase plan
> The 7 candidates from [`FEATURE-BACKLOG.md`](FEATURE-BACKLOG.md), each slotted against the milestone that unlocks it. Cheap wins ride infra that already exists.
- **In M2** — `[B6]` **dual-currency display**: `₦6,000` with a quiet `≈ $4`, daily-cached FX; a thin display layer over `§7 #5`. *(cheap win — pull forward)*
- **In M7** — `[B2]` **print parity** (see M7): "Print & QR Studio," in-theme PDFs from one source of truth.
- **In M9** — `[B3]` no-result → one-tap add · `[B4]` auto menu-engineering (weekly digest) · `[B7]` one-tap social kit (see M9).
- **Phase 2 depth — their own slots after the core (M1–M10):**
  - [ ] `[B1]` **sold-out over WhatsApp** — a waiter texts the venue's WhatsApp Business number ("no more lobster") → trigram-matched item flipped sold-out via the instant `is_available` path + a confirm reply. Gated on WhatsApp BSP setup + a staff-number allowlist. *(highest word-of-mouth; schedule once the manager is solid.)*
  - [ ] `[B5]` **guest LLM concierge** — "no pork, spicy, under ₦10k" → 3 dishes with reasons; multilingual; **server-side + read-only**; Claude API; Pro-gated. *(the eight-second demo.)*

---

## Parallel / anytime
- [ ] Lock the platform **brand name** (before M9) — currently codename `Platter`
- [ ] Validate **pricing** (Free / Pro $9·₦9k / Business $29·₦29k)
- [ ] Design work offline (`DESIGN-SPEC.md` Part 8 order): Lacquer → Carafe → menu/item ×2 → customiser → onboarding → Counter/Palm → rest of app → marketing
