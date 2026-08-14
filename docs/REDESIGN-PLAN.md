# Platter — Redesign Plan (design system → screens → ship)

> Step-by-step plan for the full redesign. Pairs with `REDESIGN-BRIEF.md` (the screen inventory)
> and `redesign-shots/` (current-state screenshots). Sequenced so each phase feeds the next.
>
> **The golden rule of this codebase:** the whole app is **token-driven**. Components never use
> raw colours — only a **semantic token contract** (`bg`, `surface`, `text`, `text-on-surface`,
> `text-secondary`, `accent`, `on-accent`, `hairline`, `positive`) that lives in `lib/themes/*`
> as CSS variables, consumed via Tailwind utilities, and enforced by a no-raw-color lint. A
> redesign is therefore mostly **(1) redefine the tokens + primitives, (2) rebuild components
> against them.** Design the *system*, and the screens largely re-skin themselves.

---

## Phase 0 — Lock the direction (before any pixels)

Decisions that are expensive to change later. Make these first:

- **0.1 Identity:** refine the current dark lacquer/brass/porcelain fine-dining look, or reposition (lighter/brighter, more editorial, bolder)? Write 3–5 mood words the design must hit.
- **0.2 Theme strategy:** keep the **4-theme system** (Lacquer/Carafe/Counter/Palm × light/dark), or collapse to **one hero theme now, re-expand later**? *Recommended:* design **one** theme end-to-end first (fastest to ship), but keep the token names so the others re-skin later.
- **0.3 Type:** keep the 4 families (Fraunces / Noto Serif SC / Inter / IBM Plex Mono) or swap any? Any swap must keep a CJK face (中文 dish names) and a tabular face (the price ledger).
- **0.4 Scope order:** **marketing (homepage + pricing + discover + themes) → public menu → auth → admin** *(updated 2026-08-07 — start with marketing).* Marketing is the smart first track: it uses its **own brand chrome** (not the per-tenant theme tokens), so it's independent of the token-system work; it's pure presentational (no data/state); it's where the **Platter brand identity + logo** get settled (which then informs the menu themes); and it's the lowest-risk, highest-sales-value surface to ship first.
- **0.5 Constraints to honour:** 215 KB first-load JS budget; every surface stays on semantic tokens; mobile-first.

**Deliverable:** a one-paragraph direction statement + the answers above. *(Optional: run `/architect` in the repo to turn this into a decision spec.)*

### Recommended answers (2026-08-07 — react/adjust)
- **0.1 Identity → refine & evolve, don't reposition.** Keep the crafted editorial DNA (it's the moat vs spreadsheet-y QR-menu tools) but level it up: sharper type hierarchy, more generous whitespace, **bigger appetite-forward food imagery**, softer/cleaner primitives, real motion. The gap isn't the vibe — it's polish, appetite, and modern interaction.
- **0.2 Themes → one hero theme first (dark Lacquer), re-expand the other 3 after.** Can't design 4 well at once; it's token-driven so re-skinning is cheap later. Ship one complete, polished experience (the flagship's live look), then swap token values for Carafe/Counter/Palm.
- **0.3 Type → keep the family strategy, refine usage.** Keep Fraunces (distinctive display), Inter (phone legibility), a tabular face for prices, Noto Serif SC (CJK, required). *Optional refinement to consider:* prices in Inter tabular figures instead of IBM Plex Mono for a cleaner, less "techy" ledger.
- **0.4 Scope → marketing first** (updated): homepage → pricing → discover → themes, then the public menu. Marketing is independent of the token system + is where the brand/logo gets nailed.
- **0.5 Constraints → fixed** (215 KB, semantic tokens, mobile-first).

**Synthesis:** a refined, **appetite-forward** evolution of the dark editorial identity — one polished Lacquer theme on the existing token contract, distinctive serif display + legible sans body + tabular prices + CJK, tightened hierarchy/spacing, photography as the hero, and a real motion layer — built so the other themes re-skin by swapping tokens.

---

## Phase 1 — Create the design system (in Claude Design)  ← START HERE

Build the system, not screens. Order matters: foundations → primitives → brand.

### 1.1 Foundations (tokens)
Design each of these as a named token set so it maps 1:1 onto the code contract:
- **Colour** — a value for every semantic role, per scheme you're keeping:
  `bg · surface · text · text-on-surface · text-secondary · accent · on-accent · hairline · positive`
  (Add any *new* roles you need — e.g. `surface-elevated`, `accent-soft`, `danger` — and list them; I'll extend the contract in `ui-tokens.md` + `lib/themes/types.ts`.)
- **Type scale** — families + a modular scale (e.g. 12/14/16/18/20/24/32/40/56), weights, line-heights, letter-spacing. Call out the **display** (headings/venue name), **body**, **mono/tabular** (prices), **CJK** roles.
- **Spacing** — a 4/8-based scale. **Radius** — card/seal/pill values. **Elevation** — the shadow ramp (the sheet/plate shadow is the deepest allowed). **Hairline** — border widths.
- **Motion** — 2–3 durations + easings (used in Phase 6).

### 1.2 Primitives (components with all states)
Design each with **default / hover / focus-visible / active / disabled / loading**:
- Buttons (primary · ghost · danger), inputs, select, **chips/filter pills**, **cards/plates**, **bottom sheet + modal shell**, badges, the **open/closed pill**, **skeleton shimmer**, tags (dietary/spice/allergen).
- **The price ledger** — the tabular right-aligned price treatment + the "≈ $X" secondary line.
- **The seal-mark** (餐) — the no-photo fallback + brand motif.

### 1.3 Brand
- Logo lockups — **and a light/mono variant** (the current logo is dark-on-white and can't sit on the dark chrome; this is the blocker on putting the logo in the header).
- Iconography style, favicon (already generated from the cloche mark — restyle if the mark changes).

**Deliverable:** a design-system board + a **token map** (design token → semantic-contract name). This is the single most important handoff artifact — it makes Phase 3 a remap, not a rewrite.

---

## Phase 2 — Design the public menu (screen by screen)

Using the Phase 1 system. Cover every surface + state from `REDESIGN-BRIEF.md §3`:
- **2.1 Menu home** — header (中文 + name + open/closed + Share/Print), menu switcher tabs, sticky search + filter chips + category rail, **Most popular ★ shelf**, group/category sections, item row/card.
- **2.2 Item detail sheet** (bottom-sheet modal) — hero, description, variants, price + dual-currency, spice, allergens.
- **2.3 States** — image **skeleton**, **empty search → Ask-on-WhatsApp**, sold-out, route loading, error/404.
- **2.4 Concierge** "Ask" widget (button + chat panel).
- **2.5 Print** menu (A4, paper-optimised, theme fonts/accent).
- **2.6 Layouts** — if keeping multiple layouts, show the item in `list-dense` (photo rows) *and* one text-forward layout (`editorial`/`ruled-list`), since themes switch layout.

**Deliverable:** designs for the above, ideally with the token names annotated.

---

## Phase 3 — Implement the public menu (code)  ← my job

1. **Remap the token layer** — update `lib/themes/lacquer.ts` (+ others) with the new values; extend `ui-tokens.md` + `lib/themes/types.ts` for any new roles; update `app/globals.css` + Tailwind bindings.
2. **Rebuild the components** to the new specs — `menu-header`, `menu-board`, item row/card (`layouts.tsx`), `item-sheet`, `category-rail`, filter chips, popular shelf, `item-thumb`/skeleton, `menu-actions`, concierge, print page.
3. **Hold the guardrails** — semantic tokens only (lint stays green), stay ≤215 KB (code-split heavy bits), keep a11y (focus-trap, scrollspy, contrast).
4. **Verify** — every state in Phase 2 + across the themes you kept, on the live flagship data.

**Loop:** you design a screen → I implement → screenshot back → you adjust → repeat. We can go screen-by-screen or land the whole menu in one pass.

---

## Phase 4 — Marketing + auth

- **4.1 Design** the marketing shell (nav/footer + a proper **light logo**), landing, pricing, discover, themes gallery, theme detail; login/signup/onboarding wizard.
- **4.2 Implement** — `components/marketing/*`, `app/(marketing)` pages, `app/themes/*`, `/discover`, auth pages. (These already use their own brand chrome, so they're independent of the theme tokens — a good parallel track.)

---

## Phase 5 — Admin / Manager (the big surface)

- **5.1 Capture** the current admin screens first (I'll grab them from your logged-in session so we design against reality — `REDESIGN-BRIEF.md §6` lists all ~14).
- **5.2 Design** the admin shell + key screens: dashboard, menu editor (the tree), item editor, insights, settings, team, theme customiser, plus the **admin-on-menu overlay** (bar + quick-edit drawer).
- **5.3 Implement** — `app/(admin)/**` + `components/admin/**`. Decide whether admin adopts the token system or stays a fixed internal UI (currently it's fixed/excluded from the theme).

---

## Phase 6 — Motion, polish, a11y, ship

- Motion system (the durations/easings from 1.1) — sheet/drawer transitions, list reveals, tap feedback.
- Fill the gaps the redesign should add: **confirm dialogs** for destructive actions, richer empty states, toast-undo.
- Accessibility + perf pass: contrast in every theme, focus order, reduced-motion, re-measure the bundle, Lighthouse/axe gates.
- Wire the **logo** into the headers now that a light variant exists.

---

## How we work the design → code loop
1. You create the **design system** (Phase 1) in Claude Design and share it (board + token map).
2. I implement the token layer + primitives, and we sanity-check one screen (the menu home) top-to-bottom before going wide.
3. Then we march the screens (Phase 2→3), screen-by-screen or in batches, with a screenshot check each round.
4. Marketing/auth can run in parallel; admin comes last.

**Immediate next step:** answer Phase 0 (esp. 0.1 identity + 0.2 theme strategy), then start Phase 1.1 (colour + type tokens). Tell me the token values/map when ready and I'll wire the contract while you design the screens.
