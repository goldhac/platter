# Platter

> **Platter** (working codename) is a multi-tenant digital-menu platform. **v1 ships one tenant** — Jīn Cāntīng (金餐厅), the Chinese restaurant at De Geogold Hotel — replacing its rented Instalacarte QR menu. The platform is built to host other food businesses later; v1 just doesn't expose that surface yet.

This repo is governed by a **context system**: a set of source-of-truth markdown files in [`context/`](context/) that an AI coding agent (and any human) **reads before writing code**. It exists so the project stays consistent across sessions and never drifts.

## The system — what each file is

| File | Job |
|---|---|
| [`context/foundation.md`](context/foundation.md) | **The source of truth.** Every locked decision *with its reasoning*. Everything else references it; nothing restates it. |
| [`context/project-overview.md`](context/project-overview.md) | Plain-English 5-minute digest. Summarizes, never decides. |
| [`context/architecture.md`](context/architecture.md) | How the pieces fit — stack, repo layout, the data model + tenant seam, caching, the keystone. |
| [`context/security.md`](context/security.md) | **Authority** on data handling — tenant isolation + (later) payments. Wins on any data-handling conflict. |
| [`context/code-standards.md`](context/code-standards.md) | Implementation law. Read top-to-bottom every coding session. |
| [`context/library-docs.md`](context/library-docs.md) | The stack as used here + the **approved-dependencies** list (don't install outside it). |
| [`context/build-graph.md`](context/build-graph.md) | Dependency map (what needs what) — a DAG, not a checklist. |
| [`context/progress-log.md`](context/progress-log.md) | Living build record. **Add an entry after any work.** |
| [`context/ui-tokens.md`](context/ui-tokens.md) · [`ui-rules.md`](context/ui-rules.md) · [`ui-registry.md`](context/ui-registry.md) | The design system — tokens, composition rules, component registry. |
| [`docs/PRD-jin-canting-menu.md`](docs/PRD-jin-canting-menu.md) | The **origin brief** (wireframes, full SQL, defect audit). Preserved; superseded by `foundation.md` where they differ (notably tenancy). |

## Reading order

1. `foundation.md` — the whole picture and the *why*.
2. `project-overview.md` — if you want the fast version first.
3. `architecture.md` → `security.md` — how it's built and how it's kept isolated.
4. `code-standards.md` — before writing any code.
5. `library-docs.md`, `build-graph.md`, the UI trio — as the task needs.
6. `progress-log.md` — what's been done; add to it when you finish.

## Route by need

| I'm about to… | Read |
|---|---|
| Make or change a decision | `foundation.md` (update it *first*, then ripple) |
| Write any code | `code-standards.md` + `foundation.md` |
| Touch data / queries / RLS | `security.md` (authority) + `architecture.md → Data & tenancy` |
| Add a dependency | `library-docs.md` (add it there first) |
| Build UI | the UI trio — **check `ui-registry.md` before building any component** |
| Pick what to build next | `build-graph.md` |
| Understand the money/currency rule | `foundation.md §7 #5` + `code-standards.md §6` |

## The golden rule

**One source of truth.** When a decision changes, update [`foundation.md`](context/foundation.md) **first**, then ripple the change into every file that references it. Never let two files disagree. Every session: **read the context first; log a progress entry after** (`progress-log.md`).

## Non-negotiables (the things that must never happen)

- A price rendered with the wrong currency or shown twice (the bug being replaced).
- A menu query or write on a tenant-owned table **without tenant scoping** — an isolation leak (`security.md §1`).
- The service-role key reaching the client bundle (`security.md §3`).
- The printed QR's destination changing when the menu changes (`foundation.md §7 #10`).
- Sold-out taking longer than ~5s to go live (`foundation.md §7 #8`).
- Shipping past the performance budget: >120KB initial JS or Lighthouse <90 fails the build (`foundation.md §7 #6`).
- A hard delete of menu data (soft-delete only, 30-day undo).

## Status

Greenfield — **no application code yet; M1 not started.** The context system is complete. The UI trio was drafted directly from the PRD's already-locked design system (`§10`), not a Claude Design export — regenerate from an export if one is later committed. Open items awaiting Gold's confirmation are in [`foundation.md §12`](context/foundation.md).

## Build order

M1 Foundation → M2 Public menu (read-only) → M3 Menu Manager core → M4 Manager depth → M5 Migration → M6 Search/QR/analytics → M7 Polish gate → M8 Ordering (Phase 2). Detail in `docs/PRD-jin-canting-menu.md §13`; dependencies in `build-graph.md`.
