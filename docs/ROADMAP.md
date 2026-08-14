# Platter — Roadmap / Complete Outstanding Inventory

> Every open item, including passing mentions — so the phase *after* the redesign can be scoped.
> Compiled 2026-08-07. Live source of truth for status stays `BUILD-CHECKLIST.md`; UX items in
> `UX-POLISH.md`; nice-to-haves in `FEATURE-BACKLOG.md`. **Core product is built + live** (public
> menu, admin CMS, themes, multi-venue routing, QR, plan enforcement, real data + photos, admin-on-menu).

---

## PHASE A — Current push (now → redesign)

### A1. UX + perf plumbing
- [x] **Wave 1 (2026-08-07):** loading skeletons, error/404 boundaries, Toaster-on-menu (bug), image crossfade, optimistic quick-edit, anon auth-guard.
- [ ] **UX P1** (`UX-POLISH.md`): top nav progress bar · admin-list skeletons · destructive-action confirms (delete/remove) · long-op progress toasts (image-gen/import/QR) · complete empty states · form inline validation + dirty-state guard · focus-trap on sheet/drawer · motion system · admin breadcrumbs · ARIA live region.
- [ ] **UX P2 (delight):** toast Undo · success micro-animations · mobile haptics · pull-to-refresh · skeleton→content crossfade · relative timestamps · hover prefetch · optimistic image preview.
- [ ] **Perf:** cache the customer menu (drop `force-dynamic`, tag-invalidate) · ~~claw back the +2KB admin bundle~~ ✅ **done** (lazy-loaded Radix Dialog → 218→205KB, under budget) · full client-side optimistic state (local rollback).

### A2. The 8 features — ✅ DONE (2026-08-07)
- [x] **⭐ Generate button in the item editor** — AI photo from name+desc (seedream-v4 HTTP → sharp → upload). `MUAPI_API_KEY` in Railway; manager-gated spend.
- [x] **Touch up with AI** — image-to-image enhance of the *uploaded* photo (nano-banana-pro edit). Shipped.
- [x] **Editor bulk actions** — move/duplicate (`bulkMoveCategory`/`duplicateItem`) + per-menu "Publish N drafts" button. Shipped.
- [x] **Onboarding wizard** — Details (currency/cuisine) → claim-URL → menu-import, 3-step stepper. Shipped.
- [x] **Dashboard polish** — plan-usage bar + "Recent activity" feed + quick actions. Shipped.
- [x] **Popularity — "Track + Popular section"** — `/api/track` beacon → SECURITY-DEFINER `popular_items` RPC → "Most popular ★" shelf + `/admin` Insights screen. Verified live.
- [x] **Multi-venue switcher UI** — active-venue cookie + `<VenueSwitcher>` header dropdown + "Add venue" (`createVenue`) + per-venue scoping threaded through the ENTIRE admin data layer. Verified with a throwaway 2nd venue.
- [x] **Marketing pages** — `/discover` venue directory + `/themes/[id]` detail pages. Shipped.
- [x] **Audit log** (part of team polish) — DB triggers → `audit_log` → dashboard activity feed. Shipped.
- [ ] **Team polish — remainder:** venue-scoped invites (`invites.venue_ids` + venue-level RLS) · **real email invites** (link-share only today; needs Resend) · role-escalation confirm · delete-venue UI.

### A3. Brand
- [x] **Favicon** — Platter cloche mark cropped from the logo → `app/icon.png` + `apple-icon.png` (2026-08-07). Full logo stashed at `public/logo.png`; marketing/admin header placement still pending (logo is dark-on-white; needs a light variant for the dark chrome — fold into redesign).

### A4. Finale
- [ ] **Total redesign** — Gold is designing new screens; scope confirmed **public menu first**. (2026-08-07)

---

## PHASE B — Blocked on Gold (external / accounts; unblock as needed)
- [ ] **Flagship drink prices** — 26 wines/spirits + some drinks show `₦1` (source had none). Enter in admin, or hide till priced.
- [ ] **Wildcard DNS** `*.platter.goldhac.com` (one click short) → venues at `<slug>.platter.goldhac.com` + set `NEXT_PUBLIC_PLATFORM_DOMAIN`.
- [ ] **Google Analytics** `G-…` id → set `NEXT_PUBLIC_GA_ID` (code deployed, dormant).
- [ ] **Paystack** account + `sk_test_…` → unblocks billing checkout.
- [x] **Resend** — reused GroupPad's key (send.goldhac.com verified). Team invite emails live (2026-08-07). Digest/other transactional still to build.
- [ ] **MuAPI key in Railway** → unblocks the deployed Generate button.
- [ ] **Lock brand name** (codename "Platter") + **confirm Pro pricing** (Free ₦0 · Pro ₦?/mo).
- [ ] **Supabase Auth** — enable leaked-password protection (dashboard toggle).

---

## BACKLOG BATCH shipped 2026-08-07
- [x] **B2 in-theme print PDF** — `/v/<slug>/print` (theme fonts + accent, `@media print`, Save-as-PDF).
- [x] **B3 no-result → "Ask us on WhatsApp"** — wa.me deep link prefilled with the search query.
- [x] **B5 LLM guest concierge** — Gemini 2.5 Flash grounded on the live menu; floating "Ask" widget. Verified.
- [x] **B6 dual-currency** — optional "≈ $X" second price in the item sheet (venue-set code + rate).
- [x] **B7 social-share** — Web Share + copy-link in the menu header. (Full "kit" — OG variants, per-item cards — later.)
- [ ] **B1 sold-out over WhatsApp** — needs WhatsApp Business API (Meta/Twilio). The no-results wa.me ask is the achievable slice.
- [ ] **B4 full menu-engineering** — needs per-item **cost** + ideally real sales data (post-ordering). Popular shelf + Insights is the shipped v1.

## PHASE C — Next phase (post-redesign): launch-hardening + advanced

### C1. Launch hardening (finish M10)
- [ ] Run + record the 3 runtime gates once: isolation (dev-DB tunnel) · Lighthouse ≥90 · axe.
- [ ] **Load test** (100 tenants / 20k items).
- [ ] **Rate-limits + storage quotas.**
- [ ] **Transactional email** (Resend).
- [ ] Reconstruct migrations `0010`/`0011` as repo files (in DB, not in `supabase/migrations/`).
- [ ] Deferred DB perf: `auth_read_members` initplan `(select auth.*)` · `multiple_permissive_policies` RLS refactor · move `pg_trgm` out of `public`.
- [ ] Housekeeping: `restaurants`→`venues` rename · isolation as a vitest/CI wrapper.

### C2. Billing (finish M8)
- [ ] Paystack (NGN) [+ Stripe USD] checkout + **signature-verified webhook** → flips `tenants.plan`→pro, writes `subscriptions`.
- [ ] 14-day Pro trial (no card) · proration/credit · **dunning keeps menus live** · **downgrade = read-only, never delete**.

### C3. Domains & routing depth
- [ ] Custom-domain **verification flow** (CNAME/TXT via `domain_verifications`).
- [ ] **Slug-change 301s** (via `redirects`).
- [ ] `venue:{host}` **tag caching** (part of dropping `force-dynamic`).

### C4. Deeper feature work
- [ ] **Analytics depth** beyond Popular — revenue view, funnel, **per-table via QR `?t=`**, real in-app charts.
- [ ] **Import depth** — per-item confidence · dup flags · CSV/paste/sample-menu review variants.
- [ ] **Customiser** — full "Reset to defaults" · preview toggles (item-sheet/search) · per-theme font loading.
- [ ] **Generate button v2** — regenerate · style-preset picker · margin-aware.

### C5. Backlog (`FEATURE-BACKLOG.md`)
- [ ] **B1** Sold-out over WhatsApp · **B2** In-theme print PDFs (A4/A3/tent/specials) · **B3** no-result → "Add it?" · **B4** full auto menu-engineering (margin-weighted; Popular is the gentle v1) · **B5** Guest concierge (LLM, Gemini) · **B6** dual-currency display · **B7** one-tap social kit.

---

### Not doing (explicitly cut from v1 — `foundation.md §8`)
Online ordering / payments-for-food, delivery, reservations, loyalty, POS integration.
