<div align="center">

# Platter

**A multi-tenant digital-menu platform for restaurants.**
QR-first menus that look designed, with a phone-first manager the owner actually enjoys using.

[**▶ Live demo — Jīn Cāntīng (金餐厅)**](https://platter.goldhac.com/v/jin-canting)

</div>

---

## What is this?

**Platter** turns a restaurant's menu into a fast, beautiful, shareable web page behind a QR code — and gives the owner a mobile CMS to keep it current in seconds (mark a dish sold-out, change a price, add a photo). It replaces rented QR-menu SaaS with something the venue owns.

The flagship tenant is **Jīn Cāntīng (金餐厅)**, a Chinese-Continental restaurant at De Geogold Hotel. The data model is **multi-tenant from the schema up** (a `tenant → restaurant → menu` hierarchy isolated by Postgres Row-Level Security), so the platform can host other venues without a re-migration — v1 simply ships one.

## Highlights

| Surface | What it does |
|---|---|
| **Diner menu** | Server-rendered menu with photo-or-seal thumbnails, **dual-currency** prices (₦ + ≈ USD), dietary / allergen / spice metadata, live search + filter chips, a sticky category rail with scroll-spy, a shareable **shallow-routed item detail sheet**, a "Most ordered" shelf, print view, and an **"Ask the menu" AI concierge** (Google Gemini). |
| **Menu Manager** (admin) | Phone-first CMS: onboarding wizard, menus / categories / items / variants / modifiers, image upload, drag-order, publish-vs-draft, **soft-delete with undo**, theme picker, a **QR studio**, team management with **role-based access** (owner / manager / staff), an audit log, and a multi-venue switcher. |
| **Marketing** | Landing page, a **Discover** venue directory, a themes showcase, and pricing. |
| **Design system** | A dark **"lacquer / oxblood / gilt / bone"** identity with a chamfered-octagon **seal-mark** motif, set in Bodoni Moda · Public Sans · Martian Mono · Noto Serif SC. |

## Tech stack

- **[Next.js 16](https://nextjs.org)** — App Router, React Server Components, Server Actions, Turbopack
- **React 19** · **TypeScript** (strict)
- **[Tailwind CSS v4](https://tailwindcss.com)** — design tokens via `@theme` · **[Radix UI](https://www.radix-ui.com)** primitives
- **[Supabase](https://supabase.com)** — Postgres, Row-Level Security, Auth, Storage
- **[Zod](https://zod.dev)** — the runtime schema/validation contract
- **[Railway](https://railway.app)** hosting (NIXPACKS) · **Cloudflare** DNS
- **Google Gemini** (menu concierge) · **Resend** (email) · **MuAPI** (dish imagery)

## Project structure

```
app/                 # Next.js App Router
  (public)/          #   diner menu, /v/[venue], /discover, print
  (admin)/           #   the Menu Manager CMS
  api/               #   concierge, view-tracking, OG images, export
components/
  menu/              # diner menu UI (seal-mark, item row, detail sheet, board)
  admin/             # manager UI
  marketing/         # landing / discover / themes
lib/
  queries/ mutations/ schemas/   # data layer (RLS-scoped)
  format/ themes/ supabase/       # currency, theme engine, clients
supabase/migrations/ # the database schema (RLS on every tenant table)
context/             # the source-of-truth docs (see "Working on this repo")
```

## Running locally

**Prerequisites:** Node 20+, npm, and a Supabase project.

```bash
# 1. install
npm install

# 2. configure — copy the template and fill in your keys
cp .env.example .env.local

# 3. database — apply the schema + seed to your Supabase project
#    (via the Supabase CLI, or paste supabase/migrations/*.sql then supabase/seed.sql)

# 4. run
npm run dev          # http://localhost:3000
```

Useful scripts: `npm run build` · `npm run typecheck` · `npm run test` · `npm run gates` (typecheck + token-lint + query-lint).

## Deployment

Hosted on **Railway** (production at [platter.goldhac.com](https://platter.goldhac.com)). NIXPACKS runs `npm run build` then `npm run start`. Deploys are pushed with:

```bash
railway up
```

---

## Working on this repo

This project is governed by a **context system** — source-of-truth markdown in [`context/`](context/) that any contributor (human or AI agent) reads **before writing code**, so the project stays consistent and never drifts. Start with [`CLAUDE.md`](CLAUDE.md), then:

| Read | For |
|---|---|
| [`context/foundation.md`](context/foundation.md) | Every locked decision **with its reasoning** — the source of truth |
| [`context/architecture.md`](context/architecture.md) | How the pieces fit; the data model + tenant isolation seam |
| [`context/security.md`](context/security.md) | **Authority** on data handling — tenant isolation (RLS) |
| [`context/code-standards.md`](context/code-standards.md) | Implementation law — read before writing code |
| [`context/ui-tokens.md`](context/ui-tokens.md) · [`ui-rules.md`](context/ui-rules.md) · [`ui-registry.md`](context/ui-registry.md) | The design system |
| [`context/progress-log.md`](context/progress-log.md) | The living build record — **add an entry after any work** |

**The golden rule:** one source of truth. When a decision changes, update `foundation.md` first, then ripple it everywhere it's referenced.

## License

No license yet — all rights reserved by the author. Open an issue if you'd like to use it.
