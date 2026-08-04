# Platter — Project Overview

> This file **summarizes**. [`foundation.md`](foundation.md) is the complete, authoritative source — read it for the full reasoning behind every decision below. If this file and `foundation.md` ever disagree, `foundation.md` wins.

## About the project

Platter is a **multi-tenant digital-menu platform**: a fast, phone-first QR menu for guests, plus a menu manager that a non-technical supervisor can run one-handed from a kitchen. **v1 ships a single tenant** — Jīn Cāntīng (金餐厅), the Chinese restaurant at De Geogold Hotel — replacing its rented Instalacarte QR-menu page. The same codebase is built to host other food businesses later; v1 just doesn't expose that surface yet.

## The problem it solves

The restaurant rents a page on a shared QR-menu SaaS. It works, but it's a landlord's template with real, trust-killing defects — the worst being **prices rendered with a `$` sign on amounts that are actually Naira** (a guest reads "6,000 dollars"). Category links read `/burgers/` under "Appetizers"; descriptions cut off mid-word; there's no sold-out state, no search, no hierarchy, no data ownership, and every fix is behind a per-feature paywall. Platter replaces it with something the venue owns end to end and that looks like it belongs to a hotel restaurant.

## The apps / surfaces

- **Public menu** — the guest-facing PWA. Mostly static, fast, shareable, installable.
- **Menu Manager** — the authenticated admin. Phone-first. The reason the rebuild exists.
- **Order board** — Phase 2 (ordering is off in v1).
- **Platform / tenant onboarding** — the SaaS surface; deferred until v1 proves out on one venue.

## Core end-to-end flow

**Guest:** scan the QR (or open a shared link) → menu landing with the bilingual mark and an open/closed pill → scroll categories under a sticky rail that tracks position → tap a dish → a **bottom sheet** springs up with a shareable URL, the full description, variant/portion prices, spice and allergens → share, call, WhatsApp, or get directions. Search and filters cut across everything.

**Manager:** log in → menu tree → **one tap marks a dish sold out** (instant, undoable) or open the item form to edit name/price/variants/photo/tags → edits land in **draft** → a "Publish changes" bar shows what's pending → publish refreshes the live menu. Sold-out toggles skip publishing and go live within seconds.

## Key invariants

- **Prices are correct and shown once** — real currency (₦ for this tenant), no decimals on whole amounts, never a stray `$`.
- **The printed QR never changes** when the menu changes.
- **Sold-out is live within ~5 seconds**, without a publish step.
- **Every menu query is tenant-scoped** — one tenant can never see another's data (enforced in the database, not just the UI).
- **Delete is always recoverable** for 30 days.
- **The menu is fast on a cheap Android on bad data** — performance budgets fail the build if they regress.
- **The design stays quiet except for the seal mark** — one bold element, everything else hairline.

## Features in scope (v1)

Public menu (search, filters, variants, sold-out, spice/allergens, PWA, share, contact actions, SEO/OG); the full Menu Manager (auth+RBAC, menu tree, CRUD, sold-out toggle, drag reorder, photo upload+crop, draft/publish, bulk actions, CSV import/export, modifiers, QR + table-tent PDF, settings, staff, audit log, analytics); and the multi-tenant **data model** (schema only). Reasoning in `foundation.md` §8.

## Features out of scope (deferred)

Online payments (Phase 3), the ordering flow + order board (Phase 2), translations (Phase 3), native apps (never — PWA only), POS integration (never), and the **SaaS product surface** — tenant signup, billing, subdomains, tenant-admin console (deferred until one venue proves the model).

## Target users

Per venue: **Guests** (browse/order-later), **Managers** (full menu control), **Staff** (availability only), **Owner** (everything + accounts/settings). Platform: the **operator** (Gold) onboards tenants — a deferred surface.

## Success criteria & stage

Greenfield; nothing built yet. v1 gates: Lighthouse mobile ≥90, LCP <2s on Slow 4G, sold-out in <10s, add-an-item in <90s, 100% correct shareable slugs, ≥3 item views/session. Full list in `foundation.md` §3.

---

Summary only. For the complete picture and the reasoning behind every decision, read [`foundation.md`](foundation.md). For the technical shape, see [`architecture.md`](architecture.md).
