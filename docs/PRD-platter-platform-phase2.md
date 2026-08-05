> **Preserved origin spec — Phase 2.** This is the platform (multi-tenant + theme system) PRD as authored, kept verbatim for detail (domain model, full SQL, screen specs, build order). It is the Phase-2 counterpart to [`PRD-jin-canting-menu.md`](PRD-jin-canting-menu.md) (v1).
> **Reconciled decisions + corrections live in [`../context/foundation.md`](../context/foundation.md) §13** — where this PRD and the foundation disagree, **the foundation wins** (notably: guest menu reads must never gate on billing status; `menu.layout` is single-source in `theme_config`; modifier groups need a `venue_id`; the migration runs on a Supabase branch first; the Railway-vs-domains call is open). Read §13 before implementing.
> **Status:** spec — build after v1 is deployed (v1 is deployed as of 2026-08-04).

---

# PRD — Platter Platform (Phase 2)
**From:** one deployed restaurant menu
**To:** a multi-tenant platform where any food business creates venues, menus, and QR codes, and picks a designed theme
**Codename:** Platter · **First tenant:** Jīn Cāntīng (金餐厅), De Geogold Hotel
**Status:** spec — build after v1 is deployed
**Intended reader:** Claude Code. Implement section by section, in the milestone order in §16.

---

## 1. The reframe

Today the codebase treats "the restaurant" as a global. Phase 2 makes that a lie in exactly three ways:

| Today | Phase 2 |
|---|---|
| One restaurant, implicit | Many **tenants**, each with many **venues** |
| One menu per restaurant | Many **menus** per venue (Dinner, Bar, Room Service, Brunch), each independently scheduled and published |
| One hardcoded design | A **theme registry** — the Jīn Cāntīng look becomes **"Lacquer"**, one of several themes any tenant can pick and tune |

**Jīn Cāntīng stops being the product and becomes row one.** Everything that was special-cased for it must become data: name, currency, timezone, palette, motif set, layout. The test for this whole phase: *seed a second tenant selling coffee in Lagos and a third selling wine in Abuja, and nothing in the codebase needs a new branch.*

### Non-goals (Phase 2)
- POS integration, delivery-driver dispatch, inventory, payroll.
- Native mobile apps (PWA only).
- **User-uploaded theme code.** Themes ship in the repo, configuration ships in the database. No arbitrary CSS/JS from tenants — that is a security surface and a support nightmare.
- Marketplace / third-party theme authors.
- Ordering — it stays spec'd but off by default. Phase 2 is about the platform seam; ordering is Phase 3 (§15).

---

## 2. Competitive read (early-to-mid 2026)

Grounding, so the positioning isn't invented:

| Player | Price | Shape | What to take | What to avoid |
|---|---|---|---|---|
| **Menubly** | ~$7.99–9.99/mo | Menu + mini-site + WhatsApp ordering + PDF-to-menu import | PDF/photo import is a real time-saver; WhatsApp ordering is the right channel for Nigeria; mini-site (About/Menu/Contact) is the correct minimum surface | Reviewers call it unpolished — that's the gap |
| **MenuTiger** | Free (49 items / 200 orders) → ~$17/mo per store | QR-first, 30+ languages, AI menu builder, KDS on higher tiers, table-level QR | Free tier with an item cap is the standard funnel; per-table QR analytics | Per-*store* pricing punishes multi-venue |
| **QR Menu Generator** | ~$17.99/mo Pro Plus | 6 premium themes with font/colour/layout controls, unlimited branches, menu-view tracking | Themes as a headline feature — closest thing to Platter's angle, and only six of them | Themes are skins, not design points of view |
| **GloriaFood / Menu.page** | Free | Zero-commission ordering, dead-simple setup | Setup speed is the acquisition weapon | Generic templates with the vendor's watermark |
| **Flipdish / Owner.com / Popmenu** | ~$179–$499/mo | Branded apps, kiosks, AI marketing, SEO | Menu-level SEO depth (Popmenu ranks individual dishes) | Nothing here is winnable at this price point; don't chase it |
| **Instalacarte** (incumbent being replaced) | Free → $20/$40 | The thing Jīn Cāntīng is leaving | Dynamic QR contract | Paywalling branding and translations; emoji art; currency bugs |

### Positioning

> Every cheap QR-menu tool gives you the same beige template with someone else's badge on it. Platter gives you a **menu that looks designed** — a real theme with a point of view — and a manager your staff will actually use in a dark kitchen.

**The wedge is the theme system.** Feature parity at the $10 tier is already commoditised; design quality is not. The moat underneath it stays what it was: a manager a non-technical person can use one-handed.

**Secondary wedge: emerging-market fit.** Multi-currency from day one (₦ is the default, not the exception), Paystack alongside Stripe, WhatsApp as the ordering channel, and a performance budget written for a mid-range Android on Nigerian mobile data. The $499/mo players do not build for that market at all.

---

## 3. Domain model

```
tenant  (the business/account that pays)
  └── venue  (a physical or virtual location: "Jīn Cāntīng", "De Geogold Rooftop Bar")
        └── menu  (Dinner · Bar List · Room Service · Sunday Brunch)
              └── group    (display band: "Chinese Kitchen", "Drinks")
                    └── category  (Appetizers, Noodles)
                          └── item  → variants, modifier groups
```

**Rules that follow from this and must hold everywhere:**

1. **Every** menu-domain table carries `tenant_id`. Not derived at query time — stored, indexed, and enforced by RLS. A query without tenant scoping is a bug, not a style choice.
2. `venue` owns identity (name, logo, hours, address, contact, currency, timezone, domain).
3. `menu` owns presentation and schedule (theme, layout, availability window, publish state). Two menus on one venue can look different and be live at different hours.
4. One QR can resolve to a **venue** (guest sees a menu switcher) or to a **specific menu**. Both must exist; venue-level is the default.
5. **The dynamic-QR contract is still sacred.** Every URL that has ever been printed resolves forever. All slug changes write a 301 into `redirects`. This constrains §7 routing.

### Multi-menu behaviours

| Behaviour | Detail |
|---|---|
| Scheduling | Each menu has an availability window per weekday. Breakfast 07:00–11:00, Bar 17:00–01:00. Outside its window a menu is hidden by default, or shown greyed with "Available from 17:00" — a per-menu setting |
| Default menu | Per venue, plus a rule: "show the menu that's live now, else the default" |
| Menu switcher | On the public venue page, a segmented control. Hidden entirely when the venue has one menu — never show a switcher with one option |
| Cross-menu items | An item belongs to one category in one menu. To reuse a dish, **duplicate to menu** (a first-class action) — a shared-item abstraction is a trap that makes pricing and availability ambiguous |
| Per-menu theme | A venue can run Lacquer on Dinner and Carafe on the Bar List. This is the feature that makes the theme system visibly worth it |
| Archive | Menus archive rather than delete (seasonal menus come back) |

---

## 4. The theme system

This is the centrepiece. Build it before anything else in Phase 2, because it forces every hardcoded design decision out of the components.

### 4.1 What a theme is

A theme is **code in the repo** (a registry entry) plus **configuration in the database** (what a tenant chose).

```ts
// lib/themes/types.ts
export type ThemeManifest = {
  id: 'lacquer' | 'counter' | 'palm' | 'carafe'
  name: string
  tagline: string                 // shown in the gallery
  bestFor: string[]               // ["Fine dining", "Pan-Asian", "Hotel restaurants"]
  preview: { light: string; dark: string; card: string }
  tokens: ThemeTokens             // the full CSS-variable set, both schemes
  typography: {                   // faces are fixed per theme; only scale is tunable
    display: FontSpec; body: FontSpec; numeric: FontSpec; cjk?: FontSpec
  }
  layouts: LayoutId[]             // capabilities this theme supports
  defaultLayout: LayoutId
  motif?: MotifPack               // the badge/icon system
  supports: {
    images: 'required' | 'optional' | 'none'
    darkMode: boolean
    heroStyles: HeroId[]
  }
}

export type LayoutId =
  | 'list-dense'      // row + right thumbnail — the v1 layout
  | 'card-grid'       // 2-up photo cards
  | 'editorial'       // full-bleed photo, one item per band
  | 'ruled-list'      // no images, dot leaders, printed-list feel

export type MotifPack = {
  id: string
  render: (kind: MotifKind) => ReactNode   // chefs-pick | spicy | vegetarian | sold-out | new
}
```

**Hard rule for implementation:** no component may reference a colour, radius, shadow, or font other than through a token. Add an ESLint rule banning hex literals and `text-red-*`-style Tailwind colour utilities outside `lib/themes/`. This rule is what keeps the system honest six months from now.

### 4.2 Launch themes (four, each proving a different capability)

**1. Lacquer** — *the Jīn Cāntīng theme, extracted*
Dark warm-black ground, porcelain cards, lacquer-red accent, brass hairlines. Seal-mark (印章) motif pack: `厨` chef's pick, `辣` spicy, `素` vegetarian, `售` sold out. Ledger-aligned monospace prices. `list-dense` default, images optional, CJK-ready.
*Best for: fine dining, pan-Asian, hotel restaurants.*
Proves: dark schemes, motif packs, bilingual type pairing.

**2. Counter** — *fast-casual, photo-forward*
Bright bone-white ground, one saturated signal colour, tight grotesk, oversized tabular numerals, 2-up photo grid. Motif: filled geometric chips, no illustration. `card-grid` default, **images required** — the theme is honest that it looks broken without them.
*Best for: QSR, shawarma, bakeries, bubble tea, food trucks.*
Proves: light schemes, image-required layouts, density at 200+ items.

**3. Palm** — *West African casual dining and lounges*
Deep green ground with raffia-cream cards, a woven hairline rule as the divider, chunky slab display face, generous row height. Motif: hand-drawn leaf/pepper marks. `list-dense` and `editorial`, images optional.
*Best for: Nigerian kitchens, Afro-Caribbean, lounges, buka-style.*
Proves: a non-Western design vocabulary, and that Platter is built for this market rather than localised into it.

**4. Carafe** — *bar, wine and cocktail lists*
Near-black, **no images at all**, ruled columns with dot leaders running name → price, small-caps section heads, vintage/ABV/region as a metadata line. `ruled-list` only.
*Best for: wine lists, cocktail bars, hotel bars, spirits menus.*
Proves the hardest case: a layout with `supports.images: 'none'`. If the component tree can render Carafe without a single conditional `{image && ...}` hack, the theme system is real.

Ship exactly these four. Four excellent themes beat twelve mediocre ones, and the gallery is the sales page.

### 4.3 What a tenant can tune (and what they can't)

| Tunable | Locked |
|---|---|
| Accent colour (from a curated set of 8 per theme, or a hex with a contrast check that **blocks** below 4.5:1) | Typeface pairing — this is the theme's identity |
| Colour scheme (light / dark / follow system) where the theme supports it | Spacing scale, radius scale, shadow scale |
| Layout, from the theme's declared `layouts` | Arbitrary CSS |
| Density (comfortable / compact) | Component structure |
| Hero style, from the theme's declared `heroStyles` | Motif pack (swappable only within the theme) |
| Motif on/off, logo, hero image | |

Rationale: every tunable is a way to make the menu *theirs*; every locked thing is a way to stop them making it ugly. That trade is the product.

### 4.4 Theme runtime

- `ThemeProvider` resolves `menu.theme_id` + `menu.theme_config` → a CSS-variable block injected in the server-rendered `<head>`. **No flash of unthemed content** — this must be SSR, not a client effect.
- Layout components are selected from a map: `LAYOUTS[layoutId]`. A theme cannot select a layout it doesn't declare; validate at write time in the zod schema.
- Fonts: only the active theme's faces load, via `next/font` with per-theme subsets. Never ship four themes' fonts to one guest.
- Theme changes are **draft-first**: the customiser writes to `menu.theme_config_draft`, previews from it, and only `Publish theme` promotes it and revalidates the cache tag.

### 4.5 Theme gallery & customiser (screen spec in §6.7)

The customiser previews against the tenant's **real menu data** in a phone frame, not lorem ipsum. Seeing your own dishes in Carafe is what sells the upgrade.

---

## 5. Tenancy, auth and isolation

### 5.1 Membership model

```sql
create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,              -- reserved-word blocklist enforced
  plan text not null default 'free' check (plan in ('free','pro','business')),
  plan_status text not null default 'active',
  billing_provider text,                  -- 'paystack' | 'stripe'
  billing_customer_id text,
  trial_ends_at timestamptz,
  created_at timestamptz default now()
);

create table memberships (
  user_id uuid references auth.users on delete cascade,
  tenant_id uuid references tenants on delete cascade,
  role text not null check (role in ('owner','admin','manager','staff')),
  venue_ids uuid[],                       -- null = all venues in tenant
  invited_by uuid, accepted_at timestamptz,
  primary key (user_id, tenant_id)
);
```

Roles, extended from v1:

| Role | Can |
|---|---|
| `owner` | Everything incl. billing, deleting the tenant, transferring ownership |
| `admin` | Everything except billing and tenant deletion |
| `manager` | Full menu CRUD, themes, QR, analytics — scoped to `venue_ids` |
| `staff` | **Only** toggle `is_available` on items/variants, and (Phase 3) work the order board |

### 5.2 RLS

Do not put `tenant_id` in the JWT and trust it — a stale token then survives a revoked membership. Use a `SECURITY DEFINER` helper reading `memberships`, and index it:

```sql
create or replace function auth_tenant_ids() returns uuid[]
language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(tenant_id), '{}') from memberships
  where user_id = auth.uid() and accepted_at is not null
$$;

create policy tenant_read on items for select to authenticated
  using (tenant_id = any(auth_tenant_ids()));

create policy staff_availability_only on items for update to authenticated
  using (tenant_id = any(auth_tenant_ids()))
  with check (tenant_id = any(auth_tenant_ids()));
-- column-level: revoke update on items from authenticated;
--               grant update (is_available) on items to authenticated;
--               grant update on items to <manager role path via policy>
```

Anonymous (guest) reads go through a separate policy chain: published, non-deleted, non-archived rows on a menu whose venue is live and whose tenant's plan is active.

> **⚠ Correction (foundation §13):** guest menu reads must **NOT** gate on `plan_status` — that contradicts §10 ("never take a restaurant's live menu down over a failed card"). Plan gates *features* (custom domain, badge, theme count), never menu availability.

### 5.3 Isolation testing — a CI gate, not a checklist

Write `tests/isolation.spec.ts` that, for **every** table with `tenant_id`:
1. Seeds tenant A and tenant B.
2. Impersonates A's owner, admin, manager and staff.
3. Asserts 0 rows readable from B and every write to B rejected.
4. Asserts a `staff` token cannot modify any column but `is_available`.

Fail the build on any leak. A cross-tenant read is a P0 and the single worst thing this product can do.

### 5.4 Plan enforcement

Limits live in one place (`lib/plans.ts`) and are enforced in **three**: the zod schema, a Postgres trigger, and the UI. Never only the UI.

```ts
free:     { venues: 1, menus: 1,  items: 60,  themes: ['lacquer'], customDomain: false, badge: true,  analyticsDays: 7 }
pro:      { venues: 1, menus: 5,  items: Infinity, themes: 'all',  customDomain: true,  badge: false, analyticsDays: 90 }
business: { venues: 10, menus: Infinity, items: Infinity, themes: 'all', customDomain: true, badge: false, analyticsDays: 365, ordering: true, api: true }
```

Downgrade behaviour must be specified, not discovered: on downgrade, **nothing is deleted** — excess menus/venues go read-only with a banner, and the custom domain falls back to the platter subdomain (the subdomain must therefore always resolve, even when a custom domain is attached).

---

## 6. Screens

Three surfaces: **marketing** (`platter.app`), **app** (`app.platter.app`), **public menus** (`*.platter.menu` + custom domains).

### 6.1 Marketing site — `platter.app`

| Page | Contents |
|---|---|
| `/` | Hero = a live, interactive phone frame cycling the four themes with real dish data (the product *is* the design — show it, don't describe it). Problem strip. Manager demo video. Pricing teaser. Social proof |
| `/themes` | The gallery. Each theme gets a full page: large previews, "best for", the layout options, a live "try it with your menu" CTA. **This is the highest-intent page on the site** |
| `/themes/[id]` | Single theme deep-dive with an interactive phone frame the visitor can scroll |
| `/pricing` | Three plans, dual currency (auto-detect NGN vs USD, manual override), FAQ, an explicit "what happens if I downgrade" answer |
| `/discover` | Opt-in directory of live venues by city and cuisine — SEO surface, and where "Jīn Cāntīng is just one restaurant on Platter" becomes literally visible |
| `/menu-import` | Landing for the PDF-import wedge: "Upload your paper menu, get a live one in 5 minutes" |
| `/login`, `/signup` | |

### 6.2 Signup + onboarding — the most important flow in Phase 2

Target: **live menu in under 5 minutes**, no credit card. Every step skippable, resumable, and never blocking on payment.

```
1. Account        email + password or magic link · Google optional
2. Business       business name → tenant. Venue name (prefilled) · cuisine · city · currency + timezone (geo-guessed, editable)
3. Get your menu in   ┌ Upload PDF or photos  ← the wedge, default
                      ├ Import CSV
                      ├ Paste text
                      └ Start blank / start from a sample menu
4. Review         extracted categories + items in an editable table, per-row confidence flags
5. Theme          the four themes previewed with THEIR just-imported dishes
6. Claim URL      yourname.platter.menu · availability check · QR shown immediately
→ Dashboard with a confetti-free "Your menu is live" state and the QR ready to download
```

**PDF/photo import (`/menu-import`)** — the differentiator, and cheap to build well:
- Accept PDF, JPG/PNG, or multiple photos of a paper menu.
- Extract with a vision model into the item schema; return per-item `confidence`.
- Show a review table: rows below a confidence threshold are highlighted, prices are re-checked against a currency regex, obvious duplicates flagged.
- Never auto-publish an import. It lands as draft, always.
- Accuracy target: ≥90% of items correct on a clean typed menu; ≥70% on a phone photo of a printed one. Instrument this — it's a headline claim.

### 6.3 App shell — `app.platter.app`

Persistent: tenant switcher (top-left, only when >1) → venue switcher → nav. Mobile: bottom tab bar (Menus · Items · QR · More), because managers are on phones.

### 6.4 Dashboard `/`

Live menu link + QR thumbnail (copy / open / download, always one tap) · unpublished-changes count with a Publish button · today's views + top 3 items · sold-out items still off from yesterday (a nudge, this is the #1 real-world data-rot problem) · plan usage bar · setup checklist until 100%.

### 6.5 Venues `/venues`

List with cover, name, address, menu count, live/paused. `+ New venue` (plan-gated). Venue detail = profile, hours (7-day + holiday overrides), contact, address + map pin, gallery, domains, languages, ordering toggle.

### 6.6 Menus `/venues/[venue]/menus`

The screen that makes multi-menu real.

```
┌─────────────────────────────────────────────────────┐
│  Jīn Cāntīng ▾                        + New menu    │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────┐ ┌─────────────────────┐     │
│ │ ▣ Dinner            │ │ ▣ Bar List          │     │
│ │ Lacquer · list-dense│ │ Carafe · ruled-list │     │
│ │ 214 items · Live    │ │ 68 items · Live     │     │
│ │ Daily 11:00–22:30   │ │ Daily 17:00–01:00   │     │
│ │ ● 3 unpublished     │ │                     │     │
│ │ [Edit] [Theme] [QR] │ │ [Edit] [Theme] [QR] │     │
│ └─────────────────────┘ └─────────────────────┘     │
│ ┌─────────────────────┐ ┌─────────────────────┐     │
│ │ ▣ Room Service      │ │ ◌ Christmas 2025    │     │
│ │ Lacquer · Live 24h  │ │ Archived            │     │
│ │ 40 items            │ │ [Restore]           │     │
│ └─────────────────────┘ └─────────────────────┘     │
└─────────────────────────────────────────────────────┘
```

New menu wizard: name → schedule → theme → start blank / duplicate an existing menu / import. Duplicating a menu deep-copies groups, categories, items and variants with new ids.

### 6.7 Theme gallery + customiser `/venues/[v]/menus/[m]/theme`

```
┌──────────────────────────┬──────────────────────────┐
│  THEME                   │                          │
│  ◉ Lacquer   ○ Counter   │      ┌────────────┐      │
│  ○ Palm      ○ Carafe    │      │            │      │
│                          │      │   phone    │      │
│  LAYOUT                  │      │  preview   │      │
│  [List][Cards][Editorial]│      │  with YOUR │      │
│                          │      │   dishes   │      │
│  ACCENT   ●●●●●●●● +hex  │      │            │      │
│  SCHEME   [Dark][Light]  │      └────────────┘      │
│  DENSITY  [Comfy][Compact]      Menu ▾ Item ▾ Search│
│  MOTIF    [on]           │                          │
│  HERO     [Mark][Photo]  │  [Discard]  [Publish]    │
└──────────────────────────┴──────────────────────────┘
```

Requirements: preview uses real data · preview toggles menu view / item sheet / search state · contrast checker blocks unreadable accents with a plain-language message ("This accent is hard to read on your background — try a darker shade") · draft/publish separation · "Reset to theme defaults" · locked themes on the Free plan show a preview with an upgrade CTA rather than being hidden.

### 6.8 Menu editor `/venues/[v]/menus/[m]/edit`

The existing v1 Menu Manager, rescoped from restaurant to menu. Everything already built stays: tree, one-tap sold-out, item form, variants, modifiers, drag-reorder, bulk actions, CSV, publish. **Add:** breadcrumb (Tenant › Venue › Menu), "Move/duplicate to another menu" in bulk actions, and a per-menu publish state independent of siblings.

### 6.9 QR Studio `/venues/[v]/qr`

Codes list — venue code, per-menu codes, per-table codes (bulk-generate 1–N) · styling within brand constraints (logo in the centre, accent colour, always keeping error-correction level H) · downloads SVG / PNG / A6 table tent PDF / A4 sheet of table numbers · **scan analytics per code** (which table, which day, which hour) · a big permanent warning that changing a code's destination is fine but deleting a code breaks printed material.

### 6.10 Analytics `/venues/[v]/analytics`

Views, unique sessions, scans by QR code, top 20 items, category drop-off, **searches with no results** (the highest-value report in the product — a literal list of what guests want that isn't on the menu), sold-out frequency by item, theme A/B if two menus differ. Range picker capped by plan. CSV export.

### 6.11 Team `/settings/team`

Members with role and venue scope · invite by email · pending invites with resend/revoke · role change with a confirmation on privilege escalation · audit log tab.

### 6.12 Billing `/settings/billing`

Plan cards with current usage against limits · **Paystack for NGN, Stripe for USD/other** · invoice history · cancel with an explicit "what you keep and what goes read-only" summary · dunning banners on failed payment (grace: 7 days full access, then admin read-only, menus stay live — *never take a restaurant's live menu down over a failed card*).

### 6.13 Platter admin (staff-only) `/_platter`

Tenants list with plan, usage, last activity · impersonate with a mandatory reason, a visible red banner during the session, and an audit entry · feature flags per tenant · theme registry health (which themes are used, error rates) · import-accuracy dashboard · abuse queue for the `/discover` directory.

---

## 7. Routing and domains

| Surface | Host | Notes |
|---|---|---|
| Marketing | `platter.app` | |
| App | `app.platter.app` | |
| Public menus | `{venue-slug}.platter.menu` | Always resolves, even when a custom domain is set |
| Legacy v1 paths | `/menu/...` on the old host | **Must 301 forever** — printed QR codes point here |
| Custom domain | `menu.jincanting.com` | Pro+. Verify by CNAME; auto TLS |

Middleware resolves host → venue in one indexed lookup, cached at the edge with a `venue:{host}` tag. Reserved subdomains blocklist (`app`, `www`, `api`, `admin`, `mail`, `platter`, …) enforced at signup.

Public paths: `/` (venue home) · `/m/[menu-slug]` · `/m/[menu-slug]/[category]` · `/m/[menu-slug]/[category]/[item]` · `?t=12` table param preserved through navigation.

**Cache tags:** `venue:{id}`, `menu:{id}`, `theme:{menuId}`. Publishing a menu revalidates `menu:{id}`; an availability toggle revalidates immediately and bypasses the publish flow (sold-out must be live within 5 seconds).

---

## 8. Data model changes

Migration from v1's single-tenant schema. Order matters — do it in one transaction per step, with a backfill between.

```sql
-- 1. New top of the tree
create table tenants (...);                        -- §5.1
create table memberships (...);                    -- §5.1

create table venues (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants on delete cascade,
  name text not null, name_i18n jsonb default '{}'::jsonb,
  slug text not null,
  cuisine text, description text,
  logo_url text, cover_url text,
  currency char(3) not null default 'NGN',
  locale text not null default 'en-NG',
  timezone text not null default 'Africa/Lagos',
  phone text, whatsapp text, address text, lat numeric, lng numeric,
  custom_domain text unique, domain_verified_at timestamptz,
  is_listed boolean not null default false,        -- /discover opt-in
  status text not null default 'active' check (status in ('active','paused')),
  created_at timestamptz default now(),
  unique (slug)
);

create table menus (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants on delete cascade,
  venue_id uuid not null references venues on delete cascade,
  name text not null, name_i18n jsonb default '{}'::jsonb,
  slug text not null,
  description text,
  theme_id text not null default 'lacquer',
  theme_config jsonb not null default '{}'::jsonb,
  theme_config_draft jsonb,
  layout text not null default 'list-dense',
  is_default boolean not null default false,
  status text not null default 'draft' check (status in ('draft','live','archived')),
  hidden_when_unavailable boolean not null default false,
  sort_order double precision not null default 1000,
  published_at timestamptz,
  unique (venue_id, slug)
);

create table menu_schedules (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references menus on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  starts_at time, ends_at time, all_day boolean default false
);

-- 2. Re-parent the existing tree
alter table menu_groups add column tenant_id uuid, add column menu_id uuid references menus;
alter table categories  add column tenant_id uuid;
alter table items       add column tenant_id uuid;
alter table item_variants add column tenant_id uuid;
alter table modifier_groups add column tenant_id uuid;   -- reusable per VENUE, not per menu
alter table modifiers   add column tenant_id uuid;
-- (backfill all six from the single existing restaurant, then:)
alter table menu_groups alter column tenant_id set not null, alter column menu_id set not null;
-- ...same for the rest

-- 3. Retire the old root
--    restaurants -> venues (one row), keep the id so nothing dangles.
--    Keep `restaurants` as a view for one release, then drop.

-- 4. Platform tables
create table invites (id uuid primary key default gen_random_uuid(), tenant_id uuid, email text,
  role text, token text unique, expires_at timestamptz, accepted_at timestamptz);
create table qr_codes (id uuid primary key default gen_random_uuid(), tenant_id uuid, venue_id uuid,
  menu_id uuid, label text, table_number text, target_path text not null,
  style jsonb default '{}'::jsonb, created_at timestamptz default now());
create table qr_scans (id bigserial primary key, qr_code_id uuid, session_id text, created_at timestamptz default now());
create table subscriptions (id uuid primary key default gen_random_uuid(), tenant_id uuid unique,
  provider text, external_id text, plan text, status text, current_period_end timestamptz);
create table imports (id uuid primary key default gen_random_uuid(), tenant_id uuid, venue_id uuid,
  source text check (source in ('pdf','image','csv','text')), file_url text,
  status text, result jsonb, accuracy_score numeric, created_at timestamptz default now());
create table domain_verifications (id uuid primary key default gen_random_uuid(), venue_id uuid,
  domain text, token text, verified_at timestamptz);
```

Indexes: `(tenant_id)` on every scoped table; `(menu_id, sort_order)` on groups; `(venue_id, status)` on menus; `venues(custom_domain)`; `venues(slug)`; `qr_scans(qr_code_id, created_at)`.

**Migration acceptance:** after the backfill, every existing Jīn Cāntīng URL still resolves, the printed QR still works, and the isolation suite in §5.3 passes with a second seeded tenant.

> **⚠ Corrections (foundation §13):** (a) run this migration + backfill + isolation suite on a **Supabase branch** (clone of prod) before applying to prod, with a rollback plan; (b) `modifier_groups` need a **`venue_id`** if they're venue-reusable, not just `tenant_id`; (c) `menu.layout` should be **single-source inside `theme_config`**, not both a column and a config key; (d) the backfill must mint the tenant + **owner membership** for the existing account or admin locks out; (e) prefer a clean rename + one-PR code update over the `restaurants`-as-a-view shim (a view can't carry v1's writes).

---

## 9. Public menu changes

Everything v1 built stays. Added:

| ID | Requirement | Acceptance |
|---|---|---|
| PB1 | **Venue home** — mini-site: hero, menu switcher, hours with live open/closed, address + map link, call / WhatsApp / directions, gallery | Renders server-side; switcher hidden when one menu |
| PB2 | **Menu switcher** honours schedules | Outside a menu's window it's greyed with "From 17:00", or hidden per setting |
| PB3 | **Theme applied per menu** | Switching menus can change the entire visual system without a full reload jump |
| PB4 | **Table param** `?t=12` survives all navigation and lands in analytics | |
| PB5 | **Platter badge** on Free plan | Small, bottom, links to `platter.app` — removable on Pro. This is the growth loop; do not skip it |
| PB6 | **Discover directory** | Opt-in per venue; city + cuisine facets; venue pages indexable with JSON-LD `Restaurant` |
| PB7 | **i18n** | `name_i18n` / `description_i18n` jsonb everywhere; language switcher when >1 locale is populated; auto-translate as a Pro action that writes drafts a human confirms |
| PB8 | Budgets unchanged and still CI-gated | ≤120KB JS, LCP <2.0s on Slow 4G, Lighthouse ≥90 mobile, WCAG AA — **per theme**, tested for all four |

---

## 10. Billing

- **Paystack** for NGN (cards, bank transfer, USSD — the realistic Nigerian rails), **Stripe** for everything else. Provider chosen by the tenant's currency at signup, changeable by support only.
- One `subscriptions` row per tenant; both providers' webhooks normalise into it. Webhook handlers are idempotent and signature-verified.
- Trial: 14 days of Pro on signup, no card. At expiry, drop to Free — **menus stay live**, extra menus go read-only.
- Proration on upgrade, credit on downgrade at period end.
- Suggested launch pricing (validate, don't take as settled): **Free** · **Pro $9 / ₦9,000 per month** · **Business $29 / ₦29,000 per month**. Sits under Menubly's effective price on value and far under MenuTiger's per-store model for anyone with two venues.

---

## 11. Notifications

Transactional email (Resend): welcome, invite, domain verified, payment failed, trial ending, weekly digest (views, top items, no-result searches). Weekly digest is the retention lever — make it genuinely useful and one-click unsubscribable. In-app toasts stay as-is.

---

## 12. Analytics events

Extend the v1 beacon; every event carries `tenant_id`, `venue_id`, `menu_id`, `session_id`, optional `table`:
`view_venue · view_menu · switch_menu · view_category · view_item · search · search_no_results · filter · scan_qr · share · call_tap · whatsapp_tap · directions_tap`

Product-side (PostHog or a `platform_events` table): `signup · onboarding_step · import_started · import_completed(accuracy) · theme_previewed · theme_published · menu_published · invite_sent · upgrade · downgrade · churn`.

---

## 13. Performance, security, quality gates

**CI must fail on any of these:**
1. Cross-tenant read/write in `tests/isolation.spec.ts`.
2. Initial JS > 120KB gz on the public menu, for any theme.
3. Lighthouse mobile < 90 on a representative menu per theme.
4. axe violations on the menu, item sheet, or menu editor.
5. A hex colour or Tailwind colour utility outside `lib/themes/`.
6. Any query in `lib/queries` or `lib/mutations` without a tenant scope (custom lint rule).

Also: rate-limit public writes and the import endpoint; storage quota per plan enforced at upload; signed URLs for private assets; service-role key server-only; CSP with no `unsafe-inline` (theme CSS vars go in a nonce'd block).

---

## 14. Success metrics

| Metric | Target |
|---|---|
| Signup → live menu | ≥ 60% within one session |
| Time to live menu (median) | < 5 minutes |
| PDF import accuracy (typed menu) | ≥ 90% items correct |
| Theme changed from default | ≥ 40% of tenants (proves the wedge) |
| Venues with >1 menu | ≥ 25% |
| Week-4 retention (published menu edited) | ≥ 50% |
| Free → Pro conversion | ≥ 5% |
| Cross-tenant data incidents | 0. Non-negotiable |

---

## 15. Deferred to Phase 3

Ordering (cart, dine-in / room-service / takeaway, kitchen order board, WhatsApp fallback) · payments on orders · POS integrations · native apps · public API + webhooks · theme marketplace · white-label reseller tier · loyalty · reservations.

---

## 16. Build order

**M1 — Tenancy seam.** `tenants`, `memberships`, `venues`, `menus`, `menu_schedules`; `tenant_id` on every scoped table; the `auth_tenant_ids()` helper and full RLS; backfill Jīn Cāntīng; `tests/isolation.spec.ts` green with two seeded tenants. **No UI.** Nothing else starts until this passes.

**M2 — Theme system.** `ThemeManifest` types, registry, `ThemeProvider` with SSR variable injection, the four layout components, per-theme font loading, the ESLint no-raw-colour rule. Port the existing design to **Lacquer** with zero visual regression — screenshot-diff the current live menu against the ported one.

**M3 — Themes 2–4.** Counter, Palm, Carafe. Carafe last, because `supports.images: 'none'` is what proves the abstraction. Fix the abstraction if it fights you — don't special-case.

**M4 — App shell + menus.** Tenant/venue switchers, dashboard, venues list + detail, menus list, new-menu wizard, duplicate-menu, rescope the v1 editor under a menu, breadcrumbs.

**M5 — Theme gallery + customiser.** Real-data phone preview, accent picker with the blocking contrast check, draft/publish, plan gating.

**M6 — Onboarding + import.** Signup, the 6-step wizard, PDF/photo extraction with a confidence-flagged review table, CSV and paste paths, sample-menu path, URL claim with the reserved blocklist.

**M7 — Domains + QR Studio.** Host resolution middleware, subdomain provisioning, custom domain verification + TLS, legacy 301s, QR Studio with per-table codes and scan analytics.

**M8 — Billing + team.** Plans in one module enforced in three layers, Paystack + Stripe, webhooks, trial, dunning, downgrade read-only behaviour, invites, roles, audit log.

**M9 — Marketing site + discover + analytics.** Home with the live theme-cycling hero, `/themes` gallery, pricing, discover directory, the tenant analytics screen, weekly digest email.

**M10 — Hardening.** All six CI gates green across all four themes. Load-test 100 tenants / 20k items. Then ship.

### First prompt to Claude Code

> Read `PRD-platter-platform-phase2.md` in full, then re-read `§3`, `§5` and `§8`. Implement **M1 only**. Write the migrations for `tenants`, `memberships`, `venues`, `menus`, `menu_schedules`; add `tenant_id` to `menu_groups`, `categories`, `items`, `item_variants`, `modifier_groups`, `modifiers` with a backfill from the existing single restaurant; create the `auth_tenant_ids()` SECURITY DEFINER helper and rewrite every RLS policy against it, including the column-level grant that limits `staff` to `is_available`. Update the zod schemas and every function in `lib/queries` and `lib/mutations` to take and enforce a tenant scope. Then write `tests/isolation.spec.ts` covering every scoped table for all four roles across two seeded tenants. Do not touch any UI. When the isolation suite passes, stop and report before starting M2.
