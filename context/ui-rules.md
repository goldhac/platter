# Platter — UI Rules

> How tokens compose into screens. Tokens are owned by [`ui-tokens.md`](ui-tokens.md); components by [`ui-registry.md`](ui-registry.md). **Source:** PRD `§10`, already locked (`foundation.md §7 #17`). When this file and `foundation.md` disagree, foundation wins.

---

## §0 Prime directive

**Every screen must help someone at a table, in low light, decide what to eat in about forty seconds.** Density and legibility beat mood. This is not a lifestyle site. When a choice trades "atmospheric" against "readable and fast," readable wins — every time.

## §1 Layout & density

- **List rows, not card grids.** A 400-item menu is a ledger, not a gallery (the density baseline: Toast / Owner.com templates). Item rows stack; the plate photo is a thumbnail, not a hero.
- Generous **tap targets (≥44×44px)**; comfortable line length for descriptions; the page body **never scrolls horizontally** — only the category rail does.
- Mobile-first always; the design is authored for a phone held one-handed.

## §2 Hierarchy

- **Fraunces** for the restaurant name and category headings **only** — it's the voice, used sparingly. Everything else is Inter.
- Item name: Inter 600. Description: Inter 400 in `--color-text-secondary`, **CSS `line-clamp` to one line with `…`** — never truncate in the data layer (fixes D4).
- **Prices in IBM Plex Mono tabular figures, right-aligned into a column** like a ledger. This single detail is what makes the menu read as edited, not generated — protect it.
- The bilingual mark (金餐厅 / Jīn Cāntīng) pairs Noto Serif SC with Fraunces; CJK and Latin are both first-class from day one (`foundation.md §7 #20`).

## §3 Color discipline

- **One bold element: the accent (`--color-accent`).** It appears on chef's-pick seals, the active category chip, and seal marks — nowhere else. If everything is emphasized, nothing is.
- **Brass is for 1px lines and small marks only — never a fill.** Dividers, image frames, small-caps eyebrows.
- No gradients. No shadow deeper than `--shadow-1`. Radius `--radius` everywhere except the seal (`--radius-seal`).
- Backgrounds stay ink; surfaces stay porcelain. Resist adding a third surface color.

## §4 The seal mark (印章) replaces every generic pill/icon

- Use `SealMark` (`ui-registry.md`) for chef's pick (`厨`), spicy (`辣`), vegetarian (`素`), sold out (`售`). **Do not** introduce emoji, stock icons, or colored pills for these states — the seal *is* the vocabulary (`foundation.md §7 #17`; fixes D5).
- One or two seals per row maximum; they are punctuation, not decoration.

## §5 Per-surface rules

**Menu landing:** restaurant name + bilingual mark, hours, **open/closed pill** (jade when open), group→category nav. Renders server-side; **no layout shift on load** (reserve image space, set font metrics).

**Category rail:** sticky, horizontally scrollable chips; the active chip syncs to scroll position (**scrollspy accurate within ±40px**); tapping smooth-scrolls; the rail auto-scrolls the active chip into view. The rail is the *only* horizontally scrolling element.

**Item row:** name · one-line clamped description · **price shown once** · thumbnail (or seal-mark fallback frame) · up to two seals. Sold-out rows render at **50% opacity**, carry the struck `售` seal, are **not tappable to order**, and **sort to the bottom** of their category (fixes D10).

**Item sheet (the one designed moment):** a bottom **Sheet**, not a page nav. Opening springs it up from the tapped thumbnail with a **shared-element transition** (View Transitions API), the dish image scaling from the thumbnail's position. URL shallow-routes to `/menu/[category]/[item]` (shareable; Back closes). Inside: photo → name + seals → bilingual name → description (full, unclamped) → **variant segmented control** with per-variant price → collapsed "Allergens & dietary" row.

**Variants:** a **segmented control**, each segment showing label + price; the row card shows "from ₦X" (fixes D7).

**Missing image:** the seal-mark-on-brass-hairline-frame fallback — **never a grey box** (`foundation.md §7 #18`).

## §6 Prices & money (visual)

- Always `₦6,000` — grouped, no decimals on whole amounts, **once** per item (fixes D1/D3). Formatting comes from `lib/format`; the UI never assembles a price string by hand (`code-standards.md §6`).
- Tabular figures + right alignment = the ledger column. "from ₦X" for variant items.

## §7 Required interaction states

- **Every interactive element** has visible hover/active/focus states; **focus rings are visible** (WCAG 2.2 AA) — never remove the outline without a replacement.
- **Full keyboard operation** of the category rail and the item sheet (open, navigate variants, close).
- **Optimistic UI** where speed is promised: the sold-out toggle flips instantly, shows a Sonner **Undo** toast, reconciles on response (A5).
- **`prefers-reduced-motion`**: the shared-element sheet transition degrades to a plain fade; no ambient motion anywhere regardless.

## §8 Motion budget

- **Exactly one orchestrated moment:** the item-sheet shared-element spring (§5). Nothing else animates on scroll; **no ambient animation, no scroll-triggered reveals.** Motion is a scalpel here, not a mood.

## §9 Accessibility (non-negotiable, PRD §5.4)

WCAG 2.2 AA: **4.5:1** text contrast, visible focus, **44×44px** min targets, `prefers-reduced-motion` respected, spice level given a **text label** alongside the chili glyphs (not color/glyph alone), allergens as real text. Keyboard-complete. Axe must be clean at the M7 gate.

---

*Density and legibility beat mood. One bold element, everything else quiet.*
