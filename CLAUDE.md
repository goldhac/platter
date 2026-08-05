# CLAUDE.md — read this first, every session

This project is governed by the **context system** in [`context/`](context/). It is a contract, not documentation.

## Before you write any code

Read, in this order:
1. [`context/foundation.md`](context/foundation.md) — the source of truth (every decision + the *why*).
2. [`context/code-standards.md`](context/code-standards.md) — implementation law, top to bottom.
3. [`context/architecture.md`](context/architecture.md) — the shape and the data/tenancy model.
4. [`context/security.md`](context/security.md) — **the authority** for anything touching data (tenant isolation).

Then, as the task needs: [`library-docs.md`](context/library-docs.md) (before adding a dependency), the UI trio (**check [`ui-registry.md`](context/ui-registry.md) before building any component**), and [`build-graph.md`](context/build-graph.md) (to pick what's buildable).

## After you finish any work

Add an entry to [`context/progress-log.md`](context/progress-log.md) **before ending your response** — mandatory. If your work changed a decision, update `foundation.md` (and any affected file) *first*, then log a `docs` entry. Never let two files disagree.

## The five things that must never happen

1. A tenant-owned query or write **without tenant scoping** (`security.md §1`).
2. The **service-role key** in anything reachable from the client bundle (`security.md §3`).
3. A price in the wrong currency, hand-formatted, or shown twice (`code-standards.md §6`).
4. Shipping past the **perf budget** — >120KB initial JS or Lighthouse <90 (`foundation.md §7 #6`).
5. A **hard delete** of menu data — soft-delete only (`foundation.md §7 #14`).

## Where things are

- Decisions & reasoning → `context/foundation.md` (this wins on any conflict).
- Origin brief (wireframes, full SQL, defect audit) → `docs/PRD-jin-canting-menu.md` (superseded by foundation where they differ).
- **Phase 2 spec** (the platform: multi-tenant venues/menus + theme system) → `docs/PRD-platter-platform-phase2.md`, reconciled with corrections in `foundation.md §13`. **Spec'd, not started** — don't build into it without being asked; two open questions there (sequencing, hosting-vs-domains) are blocking.
- Scope: v1 is **menu + manager + QR, single tenant, no ordering** (`foundation.md §8`) — **built & deployed** (Railway, 2026-08-04). Don't build into a later phase without being asked.

**Solo project.** No team/branch-lock layer. Commit only when Gold asks.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
