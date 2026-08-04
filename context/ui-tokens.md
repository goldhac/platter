# Platter — UI Tokens

> The design tokens and the layered architecture they follow. **Source:** drafted directly from the PRD's fully-specified design system (`docs/PRD-jin-canting-menu.md §10.1`), not from a Claude Design export — the direction was already locked (`foundation.md §7 #17`). If a Claude Design export is later committed, regenerate this from it. For *how* tokens compose into screens, see [`ui-rules.md`](ui-rules.md); for *why* this look, `foundation.md §4 #5`.
>
> **The invariant:** components consume **tokens only** — no raw hex, no off-palette values, ever. A raw color in a component is a bug.

**Status key:** ✅ locked · 🕗 TBD

---

## Layered architecture

```
raw palette (private)  →  semantic aliases (the contract)  →  Tailwind @theme binding
   --ink, --brass…          --color-bg, --color-accent…         utilities in components
   never used directly      what components reference           what the markup uses
```

Components reference **semantic aliases**, never the raw palette. The tenant's theme accent overrides one alias at the root — nothing else moves.

## §1 Raw palette (private — "lacquer, brass, porcelain")

Never referenced directly by a component. Dark-first: porcelain cards on an ink ground, so each dish reads as a plate set on a lacquer table (`foundation.md §4 #5`).

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#14110F` | Deep warm black — the lacquer box (page ground) |
| `--porcelain` | `#F7F4EE` | Card surface; primary text on ink |
| `--lacquer` | `#8E1D1D` | The single strong accent — chef's picks, seal marks, active chip |
| `--brass` | `#B08D4F` | Hairlines, dividers, small-caps eyebrows — **1px lines and small marks only, never fills** |
| `--jade` | `#3F6B58` | Vegetarian tag, "Open now" |
| `--ash` | `#8A827A` | Secondary text, descriptions |

## §2 Semantic aliases (the contract components code against)

| Alias | Maps to | Used for |
|---|---|---|
| `--color-bg` | `--ink` | Page background |
| `--color-surface` | `--porcelain` | Card / plate surface |
| `--color-text` | `--porcelain` | Primary text on `--color-bg` |
| `--color-text-on-surface` | `--ink` | Text on a porcelain card |
| `--color-text-secondary` | `--ash` | Descriptions, secondary labels |
| `--color-accent` | `--lacquer` | **Tenant-settable** — active chip, chef's-pick seal, seal marks |
| `--color-hairline` | `--brass` | Dividers, eyebrows, image-frame lines |
| `--color-positive` | `--jade` | Veg tag, open pill |
| `--color-sold-out` | `--ash` (@ 50% via opacity, not a new hex) | Sold-out row treatment |

**Tenant theming:** `--color-accent` (and only the accent) is injected at the document root from the tenant's `theme` jsonb (`restaurants.theme` / `tenants`). Everything else is fixed brand. This is why the accent is a CSS variable and not a Tailwind constant (`library-docs.md` → Tailwind v4).

## §3 Type tokens

| Token | Face | Use (`foundation.md §7 #17/#20`) |
|---|---|---|
| `--font-display` | **Fraunces** (variable; `opsz`, `SOFT`, `WONK`) | Restaurant name, category headings only |
| `--font-cjk` | **Noto Serif SC** | 金餐厅 and all `*_zh` fields |
| `--font-body` | **Inter** | Item names (600), descriptions (400) |
| `--font-mono` | **IBM Plex Mono**, **tabular figures** | Every price + small-caps eyebrow — prices align in a ledger column |

- Max **3 families / 5 weights** total; `font-display: swap`; subset. Wired via `next/font`.
- **Prices must use tabular figures** — the ledger-column alignment is what makes the menu read as *edited* (`ui-rules.md §0`).
- Noto Serif SC (heavy CJK subset) stays off the critical path until `*_zh` content exists.

## §4 Shape, elevation, spacing

| Token | Value | Note |
|---|---|---|
| `--radius` | `4px` | Everything… |
| `--radius-seal` | `6px` | …except the seal mark |
| `--shadow-1` | `0 1px 2px rgba(0,0,0,.30)` | **The deepest shadow allowed.** No gradients, no heavier shadows |
| `--hairline` | `1px solid var(--color-hairline)` | The primary divider/frame device (brass, not fills) |
| spacing | Tailwind's scale (4px base) | Density beats mood (`ui-rules.md §1`) |

## §5 The seal mark (印章) — the signature token set

A small lacquer-red rounded square (`--radius-seal`) carrying one character; replaces every generic pill/icon (`foundation.md §7 #17`). Not a color token but a fixed component contract (see [`ui-registry.md`](ui-registry.md) → `SealMark`):

| Glyph | Meaning | Treatment |
|---|---|---|
| `厨` | Chef's pick | `--color-accent` fill, porcelain glyph |
| `辣` | Spicy | accent fill (paired with spice glyphs) |
| `素` | Vegetarian | may tint toward `--color-positive` |
| `售` (struck-through) | Sold out | muted; row also drops to 50% opacity |

## §6 Theming switches

- **v1 is dark-only** (the room is dark, the phone is at the table — `foundation.md §4 #5`). The alias layer is structured so a `:root[data-theme="light"]` set could be added later without touching components; **light theme is deferred**, not designed.
- The only per-tenant override is `--color-accent`. Do not let tenant theming reach beyond the accent in v1.

---

*Tokens only in components. If a value isn't here, it isn't approved — add it here first.*
