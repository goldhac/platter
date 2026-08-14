# Platter — Redesign Brief & Screen Inventory

> Complete map of every screen, modal, drawer, component, and state in the product as it
> stands today, for handoff to Claude Design. Screenshots live in `./redesign-shots/`.
> Captured 2026-08-07 from the live app (`platter.goldhac.com`), flagship tenant **Jīn Cāntīng**.
>
> **Redesign scope (confirmed): the public diner-facing menu first.** Admin + marketing follow.
> **All 28 screens are screenshotted** — public + marketing + auth, and all 14 admin screens
> (captured via the logged-in session). See the index in §11.

---

## 1. What Platter is

A **multi-tenant digital menu SaaS**. A restaurant puts its menu on Platter; diners scan a QR
code and browse it on their phone — no app, no login, no ordering (v1). Restaurant staff manage
everything (items, prices, photos, sold-out, themes) from a phone-first admin ("Manager").

- **Two audiences:** *diners* (anonymous, mobile, the public menu) and *staff* (authenticated, the admin).
- **Flagship tenant:** Jīn Cāntīng (金餐厅), a Chinese/continental restaurant at De Geogold Hotel — 258 real dishes, AI-generated photos.
- **Platform surfaces:** the public menu, the Manager admin, and Platter's own marketing site.

---

## 2. Brand & current design language

- **Aesthetic:** dark, lacquered fine-dining — "lacquer / brass / porcelain." Restrained, editorial, a little ceremonial. A **seal-mark** motif (the 餐 seal stands in when a dish has no photo).
- **Type:**
  - *Display* (venue name, headings): **Fraunces** (a high-contrast serif)
  - *CJK* (金餐厅, 中文 names): **Noto Serif SC**
  - *Body* (dish names, descriptions): **Inter**
  - *Numeric* (prices — a tabular "ledger" column): **IBM Plex Mono**
- **Prices** are a deliberate design element — a right-aligned tabular ledger column, never hand-formatted, currency-correct (₦ for the flagship), with an optional "≈ $X" second-currency line.

### The theme system (important)
The look is **data-driven via a semantic token contract**. Components never use raw colours —
only these tokens, which each theme fills per light/dark scheme:

| Token | Role |
|---|---|
| `bg` | page ground |
| `surface` | card / plate / sheet surface |
| `text` | primary text on bg |
| `text-on-surface` | text on a surface |
| `text-secondary` | descriptions, meta |
| `accent` | active chip, chef's-pick, seal (tenant-settable) |
| `on-accent` | text/glyph on an accent fill |
| `hairline` | dividers, eyebrows, frames |
| `positive` | veg tag, open pill |

Four shipped themes, each with schemes (light/dark) + layouts (`list-dense`, `card-grid`,
`editorial`, `ruled-list`): **Lacquer** (dark red — the flagship default), **Carafe** (warm
gold, editorial ruled-list), **Counter**, **Palm**. See the same menu in different themes:
`menu-home.png` (Lacquer), `theme-carafe.png`, `theme-counter.png`, `theme-palm.png`.

> **Redesign guardrails:** (1) design against these semantic tokens so it stays theme-able —
> or hand me one new palette and I remap the token layer once; (2) initial-JS budget is 215KB
> (currently 205), so heavy/animated widgets get code-split.

---

## 3. PUBLIC — the diner menu  ← REDESIGN FOCUS

The menu is one long scroll under a max-width column, mobile-first.

### 3.1 Menu home — `menu-home.png`
Route: `/v/<venue>` (path-based) or `/menu` (host-mapped for a claimed domain). Top → bottom:
- **Header:** 中文 name (金餐厅) · display name (Jīn Cāntīng) · open/closed pill ("Closed · opens 11:00") · **Share** + **Print** actions.
- **Menu switcher:** pill tabs (Dinner / Bar List) — only shows when the venue has 2+ live menus.
- **Sticky bar:** search input · filter chips (Vegetarian, Contains pork, Seafood, Spicy, Chef's picks) · horizontally-scrolling **category rail** (scrollspy — highlights the active section).
- **"Most popular ★" shelf:** top ~6 dishes by real diner taps (auto-built; only when ≥3 have data).
- **Groups → category sections → item rows.** Each item row: photo thumb (or the 餐 seal fallback) · name + 中文 · truncated description · price · dietary/spice tags.

### 3.2 Item detail sheet (modal) — `item-sheet.png`
A Radix Dialog **bottom sheet** (drag handle, focus-trap, Esc-to-close), opened by tapping a
row; the URL shallow-routes to `/v/<venue>/<category>/<item>` (shareable/deep-linkable).
Contains: hero photo (or seal) · name + 中文 · full description · **price + "≈ $X" dual-currency
line** · portion/variant chips (when present) · spice meter · dietary + allergen tags · Close.

### 3.3 Search & filters (active state)
When searching/filtering, the grouped view is replaced by a flat results list (same row
component, with a result count + Clear). **Empty state:** "No dishes match '<query>'" → an
**"Ask us on WhatsApp"** button (wa.me deep-link prefilled with the query) when the venue has a
WhatsApp number.

### 3.4 Concierge widget (AI)
A floating **"Ask"** pill (bottom-right). Tapping opens a small chat panel: greeting + suggested
chips ("What's popular?", "Anything vegetarian?"…) + message thread + input. Powered by Gemini
grounded on the venue's live menu — recommends real dishes with prices. (Visible bottom-right in
`menu-home.png` / `theme-carafe.png`.)

### 3.5 Print menu — `print-menu.png`
Route: `/v/<venue>/print`. A **paper-optimised** rendering (white bg, dark text) that keeps the
venue's theme fonts + accent. Paginates cleanly onto **A4** (items never split; category headings
never orphan). A "Save as PDF / Print" button (hidden from the printout).

### 3.6 States to design
- **Image skeleton:** a theme-aware shimmer while a photo loads (replaced an old green flash).
- **Sold-out item:** sinks to the bottom of its category, dimmed, not tappable.
- **Route loading:** a full menu skeleton (`app/(public)/loading.tsx`).
- **Error / 404:** graceful boundaries (`error.tsx`, `not-found.tsx`).
- **Admin-on-menu overlay:** when a signed-in owner views their own menu — see §6.14.

---

## 4. PUBLIC — marketing site

Platter's own brand chrome (dark, `MarketingShell`: header nav Discover · Themes · Pricing ·
Sign in · Get started; footer). Note: currently dark-on-dark; the **logo** (`public/logo.png`,
a cloche mark + "Platter" wordmark, dark-on-white) needs a light variant to sit in this chrome —
a natural redesign task.

- **Landing** `/` — `marketing-landing.png`
- **Pricing** `/pricing` — `marketing-pricing.png` (Free / Pro tiers)
- **Discover** `/discover` — `marketing-discover.png` (directory of listed venues → each links to its menu)
- **Themes gallery** `/themes` — `marketing-themes.png` (4 theme preview cards)
- **Theme detail** `/themes/<id>` — `marketing-theme-detail.png` (live sample menu per scheme + capability specs)

---

## 5. AUTH & onboarding

- **Login** `/admin/login` — `login.png` (password + magic-link)
- **Sign up** `/admin/signup` — `signup.png`
- **Accept invite** `/admin/join?token=…` — invited teammate joins (now also arrives by email)
- **Onboarding wizard** `/admin/onboarding` — 3-step stepper: **Details** (name · cuisine · currency) → **Your link** (claim `<host>/v/<slug>`) → **Your menu** (AI import a photo/PDF of an existing menu). *(No screenshot — post-signup only.)*

---

## 6. ADMIN — the Manager (behind login)

Phone-first internal UI (shown here at desktop width). Fixed chrome (header: Platter · Manager ·
**venue switcher** · user · sign-out; horizontal nav: Menus · Editor · Insights · Categories ·
Add-ons · Theme · QR · Address · Data · Team · Settings).

1. **Dashboard** `/admin` — `admin-dashboard.png` — venue name + View-live-site + **Add venue** (owner); stat tiles (menus/items/live); **plan-usage bar**; **Recent activity** feed (audit log); menus grid (Edit/Theme/View per menu); quick actions.
2. **Menu editor** `/admin/menu` — `admin-menu-editor.png` — the collapsible **tree** (groups → categories → items), per-item Live/Draft toggle + sold-out switch + Edit + delete/undo, live filter, per-menu scope picker, **Publish N drafts** button.
3. **Insights** `/admin/analytics` — `admin-insights.png` — most-viewed dishes ranked (bar per row) + 30d/7d view headlines.
4. **Categories** `/admin/categories` — `admin-categories.png` — category CRUD, group assignment, item counts.
5. **Add-ons** `/admin/modifiers` — `admin-addons.png` — modifier groups + options (min/max select, required).
6. **Theme** `/admin/theme` — `admin-theme.png` — the customiser: pick theme/scheme/layout/accent; live preview against the real menu; publish.
7. **QR** `/admin/qr` — `admin-qr.png` — generate/download QR codes per menu (styled).
8. **Address** `/admin/domains` — `admin-address.png` — claim subdomain slug + connect a custom domain.
9. **Data** `/admin/import` — `admin-data.png` — AI menu import (photo/PDF → editable draft) + CSV export.
10. **Team** `/admin/team` — `admin-team.png` — members + roles; invite by email; revoke; seat limits.
11. **Settings** `/admin/settings` — `admin-settings.png` — venue name/中文, contact, address, currency, timezone, opening hours, accent, sold-out reset, **second-currency (code + rate)**.
12. **Billing** `/admin/billing` — `admin-billing.png` — plan + usage (Free/Pro); Paystack checkout stubbed pending keys.
13. **Item editor** `/admin/items/new` · `/admin/items/[id]` — `admin-item-editor.png` — full item form incl. **image upload with ✨ Generate-with-AI + ✨ Touch-up**.
14. **Onboarding wizard** `/admin/onboarding` — `admin-onboarding.png` — the 3-step post-signup setup.
15. **Admin-on-menu layer** *(not separately shot — it's an overlay on the public menu)* — when an owner views their *own* menu: a fixed **admin bar** (+Add item · Edit menu · Dashboard · Preview), **edit pencils** on every item, "Hidden" badges on drafts, and a **quick-edit drawer** (bottom sheet). "Preview" hides it all.

---

## 7. Modals · overlays · drawers (inventory)

| Element | Where | Type |
|---|---|---|
| **Item detail sheet** | public menu | Radix Dialog bottom sheet |
| **Concierge chat panel** | public menu | floating panel (bottom-right) |
| **Menu switcher** | public menu | inline pill tabs |
| **Quick-edit drawer** | admin-on-menu | bottom sheet |
| **Admin bar** | admin-on-menu | fixed bottom bar |
| **Add-venue / New-menu** | dashboard / menus | inline reveal form |
| **Toasts** | admin only | sonner (top-center) — *the public menu has no toaster* |
| **Confirm dialogs** | — | **not built yet** (destructive actions need them — design opportunity) |

---

## 8. Reusable components

- **Item row** (`list-dense`) / **item card** (`card-grid`) / **ruled row** (`editorial`/`ruled-list`) — the same item across layouts.
- **ItemThumb** — photo or the 餐 **seal fallback**; `.img-skeleton` shimmer while loading.
- **SealMark** — the brand seal motif.
- **Price** — tabular ledger figure + optional "≈ $X" secondary.
- **Category rail** — sticky, scrollspy, keyboard-operable.
- **Filter chips**, **Popular shelf**, **Open/closed pill**, **MenuActions** (share/print), **dietary/spice/allergen tags**.

---

## 9. Global states & edge cases

- **Loading:** route skeletons + per-image shimmer.
- **Empty:** no search results (→ Ask on WhatsApp) · no menus · no listed venues (Discover) · no activity/views yet.
- **Error / 404:** graceful boundaries.
- **Sold-out**, **draft** (admin-only, badged), **admin vs anon**, **single vs multi-venue** (switcher appears at 2+).

---

## 10. Not yet built (design-ahead if you like)

Ordering/cart & food payments (explicitly cut from v1), reservations, loyalty, real billing
checkout, confirm-dialogs + a motion system, custom-domain verification UI. See `ROADMAP.md`.

---

## 11. Screenshot index (`./redesign-shots/`)

| File | Screen |
|---|---|
| `menu-home.png` | Public menu (Lacquer, mobile) |
| `item-sheet.png` | Item detail sheet (modal) |
| `menu-bar-list.png` | Second menu (Bar List) via the switcher |
| `theme-carafe.png` · `theme-counter.png` · `theme-palm.png` | Same menu in the other 3 themes |
| `print-menu.png` | Print / PDF menu (A4) |
| `marketing-landing.png` · `marketing-pricing.png` · `marketing-discover.png` · `marketing-themes.png` · `marketing-theme-detail.png` | Marketing site |
| `login.png` · `signup.png` | Auth |
| `admin-dashboard` · `admin-menu-editor` · `admin-insights` · `admin-categories` · `admin-addons` · `admin-theme` · `admin-qr` · `admin-address` · `admin-data` · `admin-team` · `admin-settings` · `admin-billing` · `admin-item-editor` · `admin-onboarding` `.png` | Admin / Manager (all 14, authenticated) |
