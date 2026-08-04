# Platter — Code Standards

> Implementation law. Read top-to-bottom at the start of every coding session. For *why* the project is shaped this way, see [`foundation.md`](foundation.md); for which libraries, see [`library-docs.md`](library-docs.md); for the data-isolation **policy**, [`security.md`](security.md) is the authority and this file defers to it. When this file and `foundation.md` disagree, foundation wins. **When a rule here and a convenient shortcut conflict, the rule wins.**

---

## §1 Engineering mindset (first, because it prevents the most damage)

1. **Read the context system before writing code.** This file, plus `foundation.md`, `architecture.md`, and — for anything touching data — `security.md`. Then check [`build-graph.md`](build-graph.md) for what a task depends on and [`ui-registry.md`](ui-registry.md) before building any component.
2. **Scope is sacred.** Build the thing asked for, not the thing next to it. v1 is menu + manager + QR, single tenant (`foundation.md §8`). If a task tempts you into ordering, payments, or the SaaS surface, stop — that's a different phase.
3. **One thing at a time, and log it.** After any work, add a [`progress-log.md`](progress-log.md) entry before ending — mandatory, like reading the context first.
4. **Think before coding.** A wrong tenant-scoping or a hardcoded currency symbol is far more expensive than the minute spent avoiding it. Prefer the simplest thing that satisfies the spec.
5. **When a load-bearing decision is unmade, don't guess it into code** — surface it, decide it, record it in `progress-log.md` as a `decision`, and update the affected context file.

## §2 Language & style

- **TypeScript strict, no `any`.** Use `unknown` + a zod parse at every boundary (network, form, CSV, Supabase response). No `@ts-ignore` without a one-line reason.
- **Zod is the single source of truth for shape** (`foundation.md §7 #15`). Types are `z.infer<>` from the schema in `lib/schemas` — never hand-write a parallel `interface` for the same entity. One schema serves the form, the server action, and the CSV importer.
- **No dead code, no commented-out blocks.** Delete it; git remembers.
- Prefer pure functions and early returns. Keep modules small and single-purpose.

## §3 Repo & boundary rules

- Anything used by more than one place lives in the right `lib/*` module (`architecture.md → what lives where`); don't duplicate a formatter or a query.
- **`lib/schemas` imports nothing app-specific** — it's the base everyone else depends on. Dependencies point *toward* it, never out of it.
- **The service-role Supabase client is server-only.** It may be imported by server actions, route handlers, and scripts — **never** by anything under a `'use client'` boundary or anything reachable from the client bundle (`security.md §3`).
- Public (`components/menu`) and admin (`components/admin`) components don't import each other; shared primitives live in `components/ui`.

## §4 Next.js conventions (imposing the structure the framework leaves open)

- **Server Components by default.** Add `'use client'` only for genuine interactivity (the item sheet, the sold-out toggle, forms, dnd). The public menu is RSC-first to hold the JS budget (`foundation.md §7 #6`).
- **Reads = RSC queries in `lib/queries`. Writes = server actions in `lib/mutations`.** No client-side direct DB writes. A mutation's shape: `parse input with zod → assert role via lib/rbac → tenant-scoped write → revalidate the correct tag`.
- **Cache discipline:** publishing menu changes calls `revalidateTag('menu')`; the `is_available` toggle revalidates immediately and bypasses the publish flow (`foundation.md §7 #8`). Never leave a mutation without its revalidation.
- **Shallow routing for the item sheet:** the sheet updates the URL to `/menu/[category]/[item]` so links are shareable and Back closes it (P4) — don't turn it into a full page navigation.
- **Images always through `next/image`** with explicit dimensions, `sizes`, lazy below the fold, and a blur placeholder. No raw `<img>` on the public menu.
- **Slugs are derived and stored** via `lib/slug`; changing a published slug writes a `redirects` row (never silently break a shared link).

## §5 Multi-tenancy is a security boundary, not a style choice

- **Every query and mutation on a tenant-owned table is tenant-scoped.** An unscoped access is a bug that fails review (`security.md §1` is the authority).
- Logged-in user actions go through the **RLS-scoped session client**, not the service role. If you reach for the service role, you've turned off the safety net — re-apply tenant scoping by hand and say why in a comment (`security.md §3`).
- Never trust a `tenant_id`, `restaurant_id`, or `role` sent from the client — derive them server-side from the authenticated session.

## §6 Money & formatting (the bug class being replaced)

- **Never hardcode a currency symbol or format a price by hand.** All money goes through `lib/format` driven by the tenant's `currency`/`locale`. Whole amounts render with no decimals (`₦6,000`), and a price renders **once** (`foundation.md §7 #5`; fixes D1/D3).
- Store money as `numeric(12,2)`; never do money math in floats in JS beyond display formatting.

## §7 Error handling

- No empty `catch`. Every catch either handles meaningfully or rethrows with a context prefix (`` `import row ${i}: ${err}` ``).
- User-facing errors are safe and generic; the real cause is logged server-side (`security.md §8`). Never surface a raw Supabase/Postgres error to a guest or manager.
- Mutations return a typed result (`{ ok: true, ... } | { ok: false, error }`), not thrown strings, so forms can render field errors.

## §8 Security & secrets

Policy is owned by [`security.md`](security.md); the code-level rules:
- Secrets in env vars only; only browser-safe values may be `NEXT_PUBLIC_`.
- **Never log** tokens, service-role keys, session/magic-link tokens, or (Phase 2+) guest PII / payment fields.
- Validate every upload (type, size, re-encode) before storing; storage paths are tenant-scoped.

## §9 Testing posture

- **Vitest** for units — especially the `lib/format` currency util (unit-tested from day one, per M2), zod schemas, and slug logic.
- **Playwright** for the flows the product lives on: menu browse, item sheet open/close + shareable URL, the sold-out toggle going live, and the publish flow.
- **A tenant-isolation test is not optional** once tenancy is in: prove tenant A's session cannot read or write tenant B's rows.
- Perf is a gate, not a vibe: Lighthouse CI + the bundle-size check fail the build (`foundation.md §7 #6`).

## §10 Naming, imports, comments

- Files/dirs `kebab-case`; React components `PascalCase`; vars/functions `camelCase`; DB columns `snake_case` (Postgres convention).
- Import order: std/framework → third-party → `lib/*` → local. No deep relative chains where a `lib/*` path exists.
- Comments explain **why**, not what. Match the surrounding code's comment density.

## §11 Patterns

- SOLID as a guide, not a religion; **the simplest thing that works, first.** Reach for an abstraction on the second real use, not the first anticipated one.
- Optimistic UI where the spec demands speed (sold-out toggle, A5) — update immediately, reconcile on response, offer Undo.
- Fractional `sort_order` for all ordering; a reorder writes one row (`foundation.md §7 #16`).

---

*Read this file top to bottom each session. When a rule here and a shortcut conflict, the rule wins.*
