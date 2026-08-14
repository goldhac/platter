# Platter — UX Polish Punch-List

> Goal: make the app *feel* alive — never static, always responsive, always telling the user
> what's happening. Grounded in an audit of the current code (2026-08-07). Priorities:
> **P0** = fixes something broken or the "static/frozen" feeling now · **P1** = high-impact polish
> · **P2** = delight. Nothing here is load-bearing for the demo; it's the layer that makes it feel
> like a product.

## Audit snapshot (what exists today)
- ✅ Pending/disabled button states on mutations (`useTransition` in ~10 components).
- ✅ A few empty states (search "No dishes match", menu-tree "No items yet", dashboard "No menus yet").
- ✅ Item-sheet open animation + `prefers-reduced-motion` handling (globals.css).
- ✅ Toasts wired across the **admin** (sonner) — team, settings, QR, item-form, etc.
- ❌ **No `loading.tsx` anywhere** — navigations render blank until the server responds.
- ❌ **No `error.tsx` / `not-found.tsx`** — failures show the raw framework error screen.
- ❌ **`<Toaster>` not mounted on the public menu** — the admin-on-menu drawer's toasts don't show.
- ❌ **No image placeholders** — thumbnails flash empty boxes before they load.
- ❌ **No optimistic UI** — every admin action waits on a full `router.refresh()`.
- ❌ **Almost no skeletons** (1 file) — lists/menus appear all-at-once after the wait.

---

## P0 — do first (kills the "static" feeling + fixes the toast bug)

- [ ] **Route `loading.tsx` for the public menu** — an instant menu skeleton (shimmering header + rows) while `getMenu` runs. This is the single biggest "feels alive" win.
- [ ] **Route `loading.tsx` for every admin route** — skeleton for the menu tree, item form, lists, QR, team.
- [ ] **Root + segment `error.tsx`** — a branded "Something went off — Retry" instead of the raw error screen; a `global-error.tsx` fallback.
- [ ] **`not-found.tsx`** for the public menu (unknown venue/item) and admin.
- [ ] **Mount `<Toaster>` on the public layout** (`app/(public)/…`) so the quick-edit drawer's save/sold-out/hide toasts actually appear. *(Bug — introduced with the admin layer.)*
- [ ] **Image placeholders** — `next/image` `placeholder="blur"` (blurDataURL) or a shimmer skeleton on `ItemThumb`/`card-item`/`item-sheet`, so photos fade in instead of popping from empty boxes.
- [ ] **Optimistic UI on admin actions** — sold-out toggle, quick-edit save, publish/hide update the UI instantly; DB syncs in the background; roll back on error. (Also the perf pass.)
- [ ] **Top navigation progress bar** — a thin accent bar at the top during route transitions (the app is `force-dynamic`, so cross-page nav has real latency to cover).

## P1 — high-impact polish

- [ ] **Menu/Bar switch + category jumps** show a pending state (not a dead beat before content swaps).
- [ ] **Skeletons everywhere** a list loads — admin menu tree, items, categories, modifiers, team, QR grid.
- [ ] **Destructive-action confirms** — delete item/category/menu, remove teammate: an inline confirm or toast-with-Undo, never a silent hard action.
- [ ] **Long-op progress toasts** — AI image generate, CSV/AI import, QR export: a loading toast that resolves to success/fail (not a frozen button).
- [ ] **Empty states, complete + actionable** — empty menu, empty category, no team yet, no QR codes yet, no analytics yet, no results (each with a clear next action + a touch of personality).
- [ ] **Form UX** — inline field validation + error messages (item form, settings), dirty-state "unsaved changes" guard, disable Save until valid.
- [ ] **Focus management** — drawer/sheet trap focus, `Esc` closes, focus returns to the trigger on close (a11y + feel).
- [ ] **Motion system** — consistent slide/fade for sheet, drawer, toast, tab switch; button press (active:scale) + hover transitions; all under `prefers-reduced-motion`.
- [ ] **Admin breadcrumbs** + consistent back/close affordances.
- [ ] **Live region** for toasts + dynamic updates (screen-reader announces "Saved").

## P2 — delight

- [ ] **Undo** in toasts ("Hidden from menu — Undo").
- [ ] **Success micro-animations** — a subtle checkmark / row flash on save.
- [ ] **Haptics on mobile** — `navigator.vibrate` on key taps (sold-out, add, save).
- [ ] **Pull-to-refresh** on the mobile menu.
- [ ] **Skeleton→content crossfade** (not a hard swap).
- [ ] **Relative timestamps** ("edited just now") in admin.
- [ ] **Prefetch** item sheets + the other menu on hover/viewport for instant opens.
- [ ] **Optimistic image** — show the local preview immediately on upload/generate while it processes.

---

## Suggested first batch (one focused build)
`loading.tsx` (menu + admin) with skeletons · `error.tsx` + `not-found.tsx` · mount `<Toaster>` on public · image blur placeholders · optimistic UI on the sold-out/quick-edit/publish actions · top progress bar. That single pass removes ~every "static/frozen" moment **and** folds in the perf work + the 2KB bundle trim.
