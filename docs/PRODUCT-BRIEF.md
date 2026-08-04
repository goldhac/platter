# Platter — Product Brief

*A self-contained overview of the product as it stands. Written to be pasted into a fresh conversation to discuss strategy and next steps. Codename "Platter"; the live tenant is Jīn Cāntīng (金餐厅).*

---

## 1. What it is

**Platter is a digital-menu platform.** A restaurant gets two things:

1. A **public menu** — a fast, phone-first web page a guest opens by scanning a QR code at the table (or a link on WhatsApp). No app to install.
2. A **Menu Manager** — a phone-friendly admin where non-technical staff add/edit dishes, upload photos, mark items sold out, reorder the menu, and generate the QR codes — in seconds, one-handed, standing in the kitchen.

**v1 is deployed for a single restaurant** — Jīn Cāntīng, the Chinese restaurant inside De Geogold Hotel — but the whole thing is built as a **multi-tenant platform**: the database and access model already isolate tenants, so onboarding a second business later is additive, not a rebuild.

## 2. The problem it replaces

The restaurant currently rents a page on a shared QR-menu SaaS (Instalacarte). It works but is a landlord's template with real, trust-killing defects, and every improvement is paywalled. Confirmed problems on the live menu:

- **Prices show a `$` sign on amounts that are actually Naira** — a guest reads "6,000 dollars." (The worst bug.)
- Category URLs are template leftovers (`/burgers/` under "Appetizers").
- Descriptions truncate mid-word; the price prints twice per card.
- Generic emoji art; 19 flat categories with no hierarchy and no search.
- No sold-out state, no dietary/spice/allergen info, no variants (portion sizes), no data ownership, no analytics, no custom domain.

Platter fixes all of these and the restaurant **owns** it end to end — data, design, domain — with no per-feature paywall and no third-party footer.

## 3. Who it's for

- **Guests** — browse, search, understand a dish, see a real ₦ price, (later) order to their room.
- **Managers** — full control of the menu, pricing, photos, availability, QR codes.
- **Staff (waiters/kitchen)** — can *only* toggle item availability (sold-out).
- **Owner** — everything, plus staff accounts and settings.

Roles are `owner > manager > staff`, enforced both in the database (Postgres row-level security) **and** the app layer.

## 4. What's built (all working today)

### Public menu (what a guest sees)
- Restaurant identity with a **bilingual mark** (金餐厅 / Jīn Cāntīng) and a live **open/closed pill** computed in the restaurant's timezone.
- **Item rows** — name, one-line description, a **correct ₦ price shown once** (`₦6,000`, or `from ₦8,000` for items with portion sizes), a photo thumbnail (or an intentional seal-mark fallback when there's no photo).
- **Sticky category rail** with scroll-spy (the active category highlights as you scroll).
- **Search** across names/descriptions/tags, and **filters** (Vegetarian, Contains pork, Seafood, Spicy, Chef's picks) with live result counts.
- **Item detail** opens as a **bottom sheet** with the dish photo, full description, **portion variants** with per-size prices, spice level, and allergens. The URL updates to a **shareable** link and the back button closes it.
- **Sold-out** items dim, show a struck seal, sink to the bottom, and aren't tappable.
- **Shareable links** carry rich previews — per-item Open-Graph images, JSON-LD structured data, and a sitemap for search engines.
- Design: dark "lacquer, brass, porcelain" palette; a Chinese **seal-mark (印章)** system (`厨` chef's pick, `辣` spicy, `素` vegetarian, `售` sold-out) replaces generic icons; ledger-aligned monospace prices.

### Menu Manager (what staff use)
- **Sign in** with email + password or a magic link. Everything behind it is access-gated.
- **Menu tree** — collapsible groups → categories → items, with counts and a live filter.
- **One-tap sold-out toggle** — instant, optimistic, with Undo (the target flow: under 10 seconds).
- **Add / edit items** — a full form: name (EN/中文), description, price, **portion variants** (e.g. 6 pcs / 12 pcs), category, **photo upload with crop → auto-WebP**, dietary tags, allergens, spice level, "chef's pick", and add-on groups.
- **Publish / unpublish** per item (new items land as draft).
- **Categories** — create, rename, re-slug, assign to a display group, set day-parts, hide, delete.
- **Drag-to-reorder** items; **duplicate** an item.
- **Bulk actions** — multi-select items → mark sold out/available, publish, move category, **adjust price by % or flat amount**, delete.
- **Add-on groups (modifiers)** — reusable options like "Choice of rice" or "Extras", attachable to items.
- **CSV import / export** — download all items; import with a dry-run preview (this is how the real menu gets migrated in).
- **QR codes** — a branded menu QR with a **per-table variant**, downloadable as SVG / PNG / **A6 table-tent PDF**. The printed code never changes when the menu changes.
- **Settings** — restaurant name, hours (7 days), contact, currency, timezone, theme accent, ordering on/off.

## 5. How it's built

| Layer | Choice |
|---|---|
| Framework | **Next.js 16** (App Router, React 19, TypeScript strict) — server-rendered public menu + admin in one codebase |
| Database / Auth / Storage | **Supabase** (Postgres + Row-Level Security + Auth + file Storage) |
| Styling | Tailwind CSS v4 with CSS-variable design tokens |
| UI | Radix (accessible dialogs/sheets), dnd-kit (drag-reorder), react-hook-form + zod (forms/validation) |
| Images | `next/image` (AVIF/WebP); dish photos in Supabase Storage; per-item OG images via `next/og` |
| QR / PDF | `qrcode` + `@react-pdf/renderer` |
| Hosting | Deploying to **Railway** |

**Security model:** every menu row is scoped to its tenant by Postgres RLS *and* the app layer — a query without tenant scoping is treated as a bug. Staff can physically only change item availability. The Supabase service-role key is server-only. This was verified by impersonating the owner's session in SQL for every read/write path.

## 6. Multi-tenant / SaaS direction

v1 ships one restaurant, but the schema has a **tenant seam** (a `tenants` layer above restaurants, with `tenant_id` on every table + RLS). Adding a second business later means data + a signup/billing/subdomain surface — not a rewrite. The eventual vision is a platform where other food businesses host their own menus.

## 7. Current status

- **Built and verified** (typecheck + production build green; every data path checked through real RLS): the entire public menu and the entire Menu Manager described above.
- The Supabase project is live (on the owner's personal account). An owner account exists and works.
- Seeded with 10 real sample dishes across 3 categories, ~half with AI-generated photos, the rest showing the intentional fallback.

## 8. What's next (not yet done)

1. **Deploy** to Railway with a real domain, then point the QR at it.
2. **PWA** — make the menu installable + cache offline.
3. **Performance gate** — verify the hard budget (Lighthouse ≥90 mobile, ≤120KB JS, <2s load on slow mobile data).
4. **Migrate the real menu** — scrape the current live Instalacarte menu (all 19 categories) and import it via CSV, replacing the sample data.
5. **Analytics** — instrument views, top items, and "searches with no results" (a direct list of what guests want that isn't on the menu).
6. **Admin extras** — staff account invites, an audit log.
7. **Phase 2 — Ordering** — cart, dine-in/room-service/takeaway checkout, a live kitchen order board, WhatsApp fallback. (Spec'd, not built.)
8. **Phase 3 — Growth** — payments (Paystack), 中文 + French translations, a second hotel outlet, guest feedback.

## 9. Key decisions & constraints (context for a strategy chat)

- **Currency is a per-restaurant setting** (₦ for this one), never hardcoded — so a future tenant in another currency just works.
- **Performance is a hard requirement**, not a nicety — the reference device is a mid-range Android on Nigerian mobile data. "A slow menu is a broken menu."
- **The dynamic-QR contract is sacred** — the printed table code must never change when the menu changes.
- **Ordering is intentionally OFF in v1** — a correct, fast menu + a real manager is the whole first win; the old menu's ordering was barely used.
- **The manager is the moat** — a menu is easy to clone; a manager a non-technical person will actually use in a dark kitchen is what makes a venue stay, and what makes this sellable to other businesses.

## 10. Open questions worth discussing next

- Deploy + domain: what domain, and do we keep the old Instalacarte page alive for ~60 days as a redirect during one print cycle?
- When to import the real menu (it replaces the sample data) and who reviews/publishes it.
- Is ordering (Phase 2) the priority after launch, or multi-tenant onboarding (turning this into a product for other restaurants)?
- Pricing model if it becomes a SaaS.
- Translations (中文/French) — priority for the hotel's international guests?
