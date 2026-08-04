# Claude Design handoff (optional)

> The design system is **already fully specified** (`docs/PRD-jin-canting-menu.md §10`) and drafted directly into the UI trio (`context/ui-tokens.md`, `ui-rules.md`, `ui-registry.md`). You do **not** need Claude Design to start building.
>
> This handoff exists only if you later want to formalize a **visual component library / export** in Claude Design and regenerate the trio from it. If you do, use the two blocks below.

---

## 1) Claude Design intake — for the "Set up your design system" screen

**Company name and blurb / name of design system**
> **Platter** (working codename) — a multi-tenant digital-menu platform. v1 is a fast, phone-first QR menu + a kitchen-usable menu manager for **Jīn Cāntīng (金餐厅)**, the Chinese restaurant at De Geogold Hotel, read at a table in low light by someone deciding what to eat in ~40 seconds.

**Examples to attach (all optional):**
- The repo (or the `components/` + `app/(public)` subfolder once it exists).
- Fonts: Fraunces (variable), Noto Serif SC, Inter, IBM Plex Mono.
- Any dish photography and the seal-mark glyphs (厨 / 辣 / 素 / 售).

**Any other notes?**
> Dark-first "lacquer, brass, porcelain": ink `#14110F` ground, porcelain `#F7F4EE` cards (each dish reads as a plate on a lacquer table), one strong accent lacquer `#8E1D1D`, brass `#B08D4F` for **hairlines and small marks only — never fills**, jade `#3F6B58` for veg/open. Radius 4px everywhere except the seal mark (6px); no gradients; no shadow deeper than `0 1px 2px`. Prices in IBM Plex Mono **tabular figures**, right-aligned in a ledger column. The **seal mark (印章)** is the one bold element and replaces every pill/icon. Density and legibility beat mood; exactly one motion moment (the item sheet's shared-element spring). Full spec: `context/ui-tokens.md` + `context/ui-rules.md`.

---

## 2) In-repo prompt — regenerate the UI trio from an export

Run this in Claude Code **only after** a Claude Design export is committed:

> Read the Claude Design export at `<path/to/export>` and the context system in `context/`. Regenerate `ui-tokens.md`, `ui-rules.md`, and `ui-registry.md` from the actual export — values come from the export, not assumption — each referencing `foundation.md` for the *why* and never restating it. Preserve the decisions already locked in `foundation.md §7 #17`/`#18` and PRD §10 (dark-first palette, seal-mark system, tabular-figure prices, one-motion-moment). Keep the token layering (raw → semantic alias → Tailwind `@theme`) and the invariant "tokens only in components." Mark anything the export doesn't cover as TBD. When done, verify every cross-reference across the system still resolves, and add a `docs` entry to `progress-log.md`.
