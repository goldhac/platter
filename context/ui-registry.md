# Platter — UI Registry

> The component registry. **Source:** the surfaces in `foundation.md §6` + the wireframes/requirements in `docs/PRD-jin-canting-menu.md §5, §6, §10.2`. Tokens: [`ui-tokens.md`](ui-tokens.md); composition rules: [`ui-rules.md`](ui-rules.md).
>
> **The rule: check this registry before building any component.** If it's here and ✅ built, reuse it. If it's ⬜ planned, build it per the rules and update its row (status + built path). If it isn't here at all, it hasn't been designed — add a row and design it deliberately, don't improvise.

**Status legend:** ⬜ planned · 🟡 in progress · ✅ built. Built path stays `—` until the component exists in the codebase. Nothing is built yet (M1 not started).

---

## Shared primitives — `components/ui/` (shadcn, copied in)

| Component | Status | Built path | Variants | Purpose |
|---|---|---|---|---|
| `Sheet` | ⬜ | — | bottom | The item detail sheet (P4) |
| `Command` | ⬜ | — | — | Search palette (P5) |
| `Dialog` | ⬜ | — | — | Confirm dialogs (admin, sparing) |
| `Sonner` (toaster) | ⬜ | — | — | Undo toasts (sold-out, delete) |
| `SegmentedControl` | ⬜ | — | — | Variant/portion picker (P9) |

## Signature — used across both surfaces

| Component | Status | Built path | Variants | Purpose |
|---|---|---|---|---|
| `SealMark` (印章) | ✅ | `components/menu/seal-mark.tsx` | `chef 厨` · `spicy 辣` · `veg 素` · `sold-out 售` | The one bold element; replaces every pill/icon (`ui-rules.md §4`) |
| `PriceTag` | 🟡 | (inline via `lib/format/currency`) | `single` · `from` | ₦, tabular figures, ledger-aligned, once (`ui-rules.md §6`). Rendered inline in `ItemRow`/`ItemSheet`; extract if reused |
| `ItemThumb` (was `ImageOrSeal`) | ✅ | `components/menu/item-thumb.tsx` | `thumb` (+ hero handled in `ItemSheet`) | `next/image` or the seal-on-hairline fallback (`foundation.md §7 #18`) |
| `SpiceGlyphs` | 🟡 | (inline in `ItemSheet`) | 0–3 pips + label | Pips **+ text label** for a11y (P10); no emoji |

## Public menu — `components/menu/`

| Component | Status | Built path | Variants | Purpose |
|---|---|---|---|---|
| `MenuHeader` (was `MenuLanding`) | ✅ | `components/menu/menu-header.tsx` | — | Name, bilingual mark, open/closed pill (P1) |
| `OpenClosedPill` | ✅ | (inline in `MenuHeader`) | `open` · `closed` | Jade when open; computed in restaurant tz (`lib/format/hours.ts`) |
| `CategoryRail` | ✅ | `components/menu/category-rail.tsx` | — | Sticky scrollable chips + IntersectionObserver scrollspy, active-chip sync, keyboard (P2) |
| `MenuBoard` | ✅ | `components/menu/menu-board.tsx` | — | Delegated row-click → `history.pushState` shallow routing + popstate sync; hosts the sheet (P4) |
| `MenuSearch` | ⬜ | — | — | Fuzzy client search over name/desc/tags (P5) |
| `FilterChips` | ⬜ | — | veg · pork · seafood · spicy · chef's pick | Multi-select, count shown, state in URL (P6) |
| `ItemRow` | ✅ | `components/menu/item-row.tsx` | `default` · `sold-out` · `featured` | The core list row (P3, `ui-rules.md §5`) |
| `ItemSheet` | ✅ | `components/menu/item-sheet.tsx` | — | Bottom-sheet detail (Radix Dialog: focus-trap/Esc/aria); shallow route (P4). Shared-element open is M7 |
| `VariantSelector` | 🟡 | (inline in `ItemSheet`) | — | Per-variant price shown; interactive selection lands with ordering (Phase 2, P9) |
| `AllergenRow` | ✅ | (inline in `ItemSheet`) | — | "Allergens & dietary" row (P11) |
| `ContactFooter` | ⬜ | — | — | Persistent Call / WhatsApp / Directions (P15) |
| `ShareButton` | ⬜ | — | item · category | Native share sheet; OG per item (P14) |
| `LangToggle` | ⬜ | — | EN · 中文 | Layout ships in v1, content Phase 3 (`foundation.md §7 #20`) |

## Menu Manager — `components/admin/`

| Component | Status | Built path | Variants | Purpose |
|---|---|---|---|---|
| `MenuTree` | ⬜ | — | — | Groups→categories→items, counts, live filter (A3) |
| `SoldOutToggle` | ⬜ | — | — | One-tap, optimistic, Undo toast, no dialog (A5) — the <10s flow |
| `ItemForm` | ⬜ | — | create · edit · duplicate | Full item form, rhf+zod (A4/A10) |
| `CategoryForm` | ⬜ | — | — | Category CRUD, slug, group, daypart (A12) |
| `PhotoUpload` | ⬜ | — | — | Camera/gallery → crop → WebP ≤200KB, progress (A7) |
| `PublishBar` | ⬜ | — | — | Pending-change count + diff summary; publish → revalidate (A8) |
| `BulkActionBar` | ⬜ | — | — | Multi-select: recategorize, price %/flat, unavailable, delete (A9) |
| `ReorderList` | ⬜ | — | items · categories | dnd-kit, touch+keyboard, fractional order (A6) |
| `VariantEditor` | ⬜ | — | — | Add/edit portion variants (A4/A13) |
| `ModifierGroupEditor` | ⬜ | — | — | Reusable modifier groups (A13) |
| `CsvImportWizard` | ⬜ | — | — | Column map, dry-run, per-row errors (A11) — the migration path |
| `QRGenerator` | ⬜ | — | menu · per-table | SVG/PNG/PDF + A6 table-tent (A14) |
| `StaffManager` | ⬜ | — | — | Invite/assign/revoke (A16) |
| `SettingsForm` | ⬜ | — | — | Name, logo, hours, contact, currency, accent, ordering toggle (A15) |
| `AuditLogView` | ⬜ | — | — | Who/what/when, before/after (A17) |
| `AnalyticsDashboard` | ⬜ | — | — | Views, top items, no-result searches (A18); Recharts |
| `DeletedTab` | ⬜ | — | — | Soft-deleted items, 30-day undo (A4) |

## Phase 2 (spec'd, not built)

`Cart`, `CheckoutForm` (dine-in/room/takeaway), `OrderBoard` (New→Preparing→Ready→Served, realtime, sound+vibrate). See `foundation.md §8` → deferred.

---

*Check this registry before building any component. Not here = not designed yet.*
