# Platter — Feature Backlog

> Living list of **candidate** features beyond the core M1–M10 build ([`BUILD-CHECKLIST.md`](BUILD-CHECKLIST.md)). Each is a candidate, not a locked commitment; the phase/milestone placement is a **recommendation** to be scheduled later. `context/foundation.md` wins on any conflict. Added 2026-08-04 (Gold).
>
> The through-line: most of these **ride infrastructure that already exists** — `@react-pdf/renderer`, `next/og` per-item images, the `search_no_results` event, the per-tenant currency setting, the instant `is_available` revalidation path. That's what makes them cheap relative to their punch.

## At a glance

| # | Feature | Phase | Effort | Leverage | Rides on |
|---|---|---|---|---|---|
| **B1** | Sold-out over WhatsApp | P2 (manager depth) | L | ★★★ moat / word-of-mouth | WhatsApp Business API + item matching |
| **B2** | Print parity (in-theme PDFs) | P2 (M2 + M7) | M | ★★★ unique combo | `@react-pdf/renderer` *(in stack)* |
| **B3** | No-result search → one-tap add | P2 (M9 + M4) | S–M | ★★★ insight→action | `search_no_results` event + editor |
| **B4** | Menu engineering, automatic | P2 (views) → P3 (orders) | M | ★★★ retention lever | view analytics + weekly digest |
| **B5** | Guest concierge (LLM) | P2 / P3 (guest) | M–L | ★★ demo + scale | menu data + Claude API |
| **B6** | Dual-currency display | P2 (M2 / public) | S | ★★ market-fit | `§7 #5` currency + daily FX |
| **B7** | One-tap social kit *(bonus)* | P2 (M9 / theme) | S | ★★ growth loop | `next/og` per-item images *(in stack)* |

**Effort:** S ≈ days · M ≈ 1–2 wks · L ≈ multi-week (usually an external integration). **Leverage** = differentiation punch.

---

## B1 — Sold-out over WhatsApp

**Pitch.** A waiter texts the venue's WhatsApp Business number — *"no more lobster"* — and Platter matches the item, marks it sold out, and replies to confirm. Zero-friction sold-out for the person who actually knows the kitchen ran out.

**Why it wins.** The manager is the moat, but the deeper truth is *a waiter won't open an app mid-service*. WhatsApp is the default channel in this market — this becomes the feature operators tell each other about.

**Where it fits.** Phase 2, manager depth (after M4). The target behaviour already exists — `is_available` + its instant (<5s) revalidation path (`foundation.md §7 #8`).

**Depends on.** WhatsApp Business **Cloud API** (Meta) + a verified business number per venue · inbound-message webhook · fuzzy item matching (`pg_trgm` is already installed) · a **staff-number allowlist** (only known numbers may toggle).

**Build notes.** Inbound message → trigram-match against the venue's live items → flip `is_available` via the existing instant path → reply to confirm. Ambiguity → reply with numbered choices ("1 Fried Lobster · 2 Lobster Roll?"). Log every WA-driven change to the audit trail.

**Watch-outs.** The real cost is WhatsApp BSP onboarding + per-venue number provisioning + template-message approval, not the matching. Rate-limit; authenticate senders against the allowlist.

## B2 — Print parity

**Pitch.** One tap → print-ready PDFs **in the menu's own theme, from the same data**: A4/A3 menu, table tent, specials card, takeaway insert. The printed price can never disagree with the QR price again.

**Why it wins.** Every digital-menu tool pretends paper died; it didn't. MustHaveMenus charges $24–49/mo for print templates *without* a live menu — Platter would have both, from one source of truth.

**Where it fits.** Phase 2 — the theme system (M2) supplies the visual; it ships as an extension of the QR Studio → rename it **"Print & QR Studio"** (M7).

**Depends on.** `@react-pdf/renderer` — **already in the stack** (v1 renders the A6 table-tent with it). Each theme needs a print variant of its tokens.

**Build notes.** Server-render the PDF from the same menu query the public page uses. Sizes: A4/A3 menu, A6 tent, specials card, takeaway insert. Embed the theme's fonts.

**Watch-outs.** `@react-pdf` font/CJK support is limited (v1 hit CJK/macron issues → fell back to Latin/ASCII). Per-theme print styling is genuine design work — add it to each theme's design in `DESIGN-SPEC.md`.

## B3 — Close the no-result-search loop

**Pitch.** Turn the "searches with no results" report from a chart into an action: *"31 guests searched 'jollof' this month → Add it?"* → one tap creates a **drafted** item with a description in the venue's voice.

**Why it wins.** You already have the best report in the product — a literal list of demand you're not meeting. Almost every analytics product stops at the chart; insight→action in one tap is rare.

**Where it fits.** Phase 2 — M9 analytics (the report) + M4 editor (the create-draft path).

**Depends on.** The `search_no_results` event (already in the Phase-2 analytics spec, PRD §12) + the item-create mutation.

**Build notes.** Aggregate + normalise no-result terms; an "Add it?" button pre-fills a draft item (name from the term; an optional LLM-drafted description in the venue's voice — gate behind Pro). **Always lands as draft** — never auto-publish.

**Watch-outs.** Dedupe/stem terms ("jollof", "jollof rice", "jelof"). The LLM description is a nice-to-have, not required for v1 of the feature.

## B4 — Menu engineering, automatically

**Pitch.** Classify every dish — **star / plowhorse / puzzle / dog** — and turn it into a weekly action email: *"Nobody's opened Fried Lobster in 30 days and it's your third-highest price. Move it to the top of its category, reshoot it, or cut it."*

**Why it wins.** Restaurant consultants sell this framework for real money. Shipped as the weekly email, it's the **retention lever the whole category is missing**.

**Where it fits.** Phase 2 gets a **views-only** version (view analytics exist); the full popularity×margin matrix wants Phase 3 orders. Ships in the weekly digest (`foundation.md` §11 notifications / M9).

**Depends on.** View analytics (Phase 2 §12) now → order data (Phase 3) for true popularity → an optional **item cost field** for true margin.

**Build notes.** v2 = views × price (a proxy matrix); v3 = orders × margin (the real one). Output **actions**, not just labels.

**Watch-outs.** Needs enough traffic to be meaningful (guard low-N venues). Margin/cost isn't captured yet — add a per-item `cost` field when this graduates to Phase 3.

## B5 — Guest concierge (LLM)

**Pitch.** A guest-side assistant: *"No pork, something spicy, under ₦10,000"* → three dishes, each with a reason. Handles dietary questions, works in any language.

**Why it wins.** At 400 items, search isn't enough — this is genuinely better than browsing, it answers the dietary questions staff currently field from memory, and for a hotel with international guests it works in any language. It demos in eight seconds. This is the **one place an LLM belongs on the guest side**.

**Where it fits.** Phase 2/3, guest feature. (Gate behind Pro — it has per-query cost.)

**Depends on.** The full menu as structured context + an LLM (**Claude API** — see the `claude-api` skill). Multilingual for free.

**Build notes.** **Server-side** (keeps the client bundle lean, `§7 #6`). Feed the menu (names, tags, allergens, prices, spice) as context; return dish picks with reasons + deep-links to the item sheets. Stream the response. Cache common queries.

**Watch-outs.** **Read-only** — it recommends, never takes actions (guests are untrusted; a guest-facing LLM must not be manipulable into anything beyond menu Q&A). Watch per-query cost + latency on mobile data. Keep answers grounded in the actual menu (no hallucinated dishes).

## B6 — Dual-currency display

**Pitch.** Show `₦6,000` with a quiet `≈ $4` beside it, rate refreshed daily.

**Why it wins.** Hotel guests think in dollars. And it's the exact wound the incumbent inflicted (`6,000.00 $` on Naira) — turned into a feature. Trivial to build.

**Where it fits.** Phase 2 — public menu (M2), a thin display layer over the currency setting (`foundation.md §7 #5`). A genuine **quick win**.

**Depends on.** The per-tenant `currency`/`locale` (`§7 #5`) + a **daily-cached FX rate** (one fetch/day) + a per-venue "show approximate USD" toggle.

**Build notes.** Primary stays ₦, formatted **once** (`§7 #5`); the secondary is quiet, prefixed `≈`, and explicitly approximate. Cache the rate daily — never call FX per render. Make the secondary currency configurable.

**Watch-outs.** Never imply the $ is what's charged (it's approximate). Respect "price shown once" — the `≈$` is a subtitle, not a second price. Pick a reliable free FX source.

## B7 — One-tap social kit *(cheap bonus)*

**Pitch.** Export any dish as a story-sized image in the venue's theme.

**Why it wins.** You already render per-item OG images — this is nearly free. Restaurants post constantly and design it badly.

**Where it fits.** Phase 2 — rides the theme system + `next/og` (alongside M9 / the theme work).

**Depends on.** `next/og` (already renders per-item OG images) + the theme tokens + story/post aspect ratios (1080×1920, 1080×1080).

**Build notes.** Extend the OG route to story/post/price-card sizes styled in the menu's theme; add a "Share image" action per item in the manager.

**Watch-outs.** Same `next/og` CJK/font limits as the OG images (Latin-safe or embed subsets). Ship 2–3 templates, not twenty.

---

## How I'd sequence these

- **Pull forward (cheap, high-punch, ride existing infra):** **B6 dual-currency** and **B3 no-result→add** and **B7 social kit**. Each is days of work on infrastructure that already exists, and each is visibly differentiating.
- **Bundle with the milestone that unlocks it:** **B2 print parity** with M2/M7 (theme = the print source), **B4 menu-engineering** with M9's weekly digest.
- **Bigger bets, schedule deliberately:** **B1 WhatsApp sold-out** (the moat-deepener, but gated on WhatsApp BSP setup) and **B5 concierge** (the demo piece, but with real LLM cost/latency/safety to design around).
