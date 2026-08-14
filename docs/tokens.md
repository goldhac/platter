# Platter — current tokens (a starting point, not a straitjacket)

> The values the app renders **today**, pulled from `app/globals.css` (`@theme`) + `app/layout.tsx`.
> Share this with Claude Design as *where we are now* — it's free to evolve the palette, scale,
> and shape. What matters is that whatever it lands on maps back to these **token roles** (names),
> because that's the contract the code consumes.

## Colour — brand palette
| Name | Hex |
|---|---|
| ink | `#14110f` |
| porcelain | `#f7f4ee` |
| lacquer | `#8e1d1d` |
| brass | `#b08d4f` |
| jade | `#3f6b58` |
| ash | `#8a827a` |

## Colour — semantic roles (the contract; these names are what code uses)
*Values shown are the Lacquer defaults; `<ThemeProvider>` overrides them per menu theme.*
| Role | → current value |
|---|---|
| `bg` | ink |
| `surface` | porcelain |
| `text` | porcelain |
| `text-on-surface` | ink |
| `text-secondary` | ash |
| `accent` | lacquer *(tenant-settable)* |
| `on-accent` | porcelain |
| `hairline` | brass |
| `positive` | jade |

*Keep these role names; change their values freely. Add new roles if the design needs them
(e.g. `surface-elevated`, `accent-soft`, `danger`) and I'll extend the contract in code.*

## Type
| Role | Family | Notes |
|---|---|---|
| display | **Fraunces** | headings, venue name, wordmark — high-contrast serif |
| body | **Inter** | dish names, descriptions, UI |
| numeric | **IBM Plex Mono** | prices — tabular figures (the "ledger" column) |
| cjk | **Noto Serif SC** | 中文 names |

No custom type scale or spacing scale is defined — the app uses **Tailwind defaults**. A real
modular type scale + spacing rhythm is exactly the kind of thing the new design system should add.

## Shape & elevation
| Token | Value |
|---|---|
| `radius-card` | `4px` |
| `radius-seal` | `6px` |
| `shadow-plate` | `0 1px 2px rgb(0 0 0 / 0.3)` (the deepest shadow used) |

Dark-first (`color-scheme: dark`). Motion: none defined yet — the design system should introduce
a small set of durations + easings.
