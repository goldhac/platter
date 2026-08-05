# Platter — Full Product & Screen Spec (for design)

> **What this is.** A design-oriented view of the *entire* final product (v1, already built + deployed, **plus** Phase 2, spec'd), organised by **surface → screen → state** so you can mock up designs offline. It's derived from `context/foundation.md` (§7, §13) and the two PRDs — **the foundation wins on any conflict.** This doc doesn't decide anything new; it *lays out what to design.*
>
> **Build vs. design.** The *build* is staged (validation-first: Lacquer + Carafe first — `foundation.md §13 P-Q1`). The *design* is not — you can design every screen and all four themes now. Screens tagged **[v1 ✅]** already exist and are live (redesign/restyle only); **[P2]** are new.
>
> **Reference device:** a mid-range Android on Nigerian mobile data. **Mobile-first, always.** Every screen is designed for a phone first, then scaled up.

---

## Part 0 — The product at a glance

**Platter** = a menu that *looks designed* + a manager staff will actually use in a dark kitchen. Three public-facing surfaces + one internal:

| Surface | Host | Who | What |
|---|---|---|---|
| **A · Public menus** | `{venue}.platter.menu` + custom domains | Guests (no login) | The QR-scanned menu. The product's front door. |
| **B · Manager app** | `app.platter.app` | Owners / managers / staff | Create venues, menus, items; pick + tune themes; QR; analytics; billing. |
| **C · Marketing site** | `platter.app` | Prospects | Sell the themes. Signup. Pricing. Discover. |
| **D · Platter admin** | `app.platter.app/_platter` | Us (internal) | Tenants, impersonation, feature flags, abuse queue. |

**Roles:** `owner` > `admin` > `manager` (venue-scoped) > `staff` (sold-out toggle only). **Plans:** Free / Pro / Business (feature gating in Part 6).

**The two things design must nail:** (1) the **theme system** — four themes with genuinely different points of view (Part 1); (2) the **manager** — sold-out in <10s, a full item in <90s, one-handed on a phone (Part 3).

---

## Part 1 — Design system & the four themes  *(design's biggest job)*

### 1.1 What a theme defines

A theme is a **complete visual system**, not a colour swap. Each theme fixes all of these; the tenant only tunes a small subset (1.6).

| Layer | What the theme sets |
|---|---|
| **Colour** | A full token set for **light and dark** (ground, surface/card, accent, secondary/metal, text-strong, text-muted, hairline, states: sold-out/featured/error) |
| **Typography** | 4 faces: **display**, **body/UI**, **numeric** (prices), optional **CJK**. Plus the type scale + weights. Faces are the theme's identity — *not* tunable. |
| **Layout** | Which of the 4 layouts it supports + its default (1.5) |
| **Motif** | The badge/icon system for chef's-pick / spicy / vegetarian / sold-out / new |
| **Hero** | Which hero styles the venue/menu header can use (mark, photo, none) |
| **Shape/space** | Radius scale, spacing scale, shadow/elevation, hairline weight — *not* tunable |
| **Imagery** | `required` / `optional` / `none` — how the layout treats dish photos |

### 1.2 Theme 1 — **Lacquer**  *(built ✅ — extract, don't reinvent; this is the reference)*

*Fine dining · pan-Asian · hotel restaurants. Proves: dark schemes, motif packs, bilingual type.*

| Token | Value | Use |
|---|---|---|
| Ground `--ink` | `#14110f` warm near-black | Page background |
| Surface `--porcelain` | `#f7f4ee` | Cards, primary text on dark |
| Accent `--lacquer` | `#8e1d1d` | Primary accent, active states, seal red |
| Metal `--brass` | `#b08d4f` | Hairlines, frames, fine rules |
| Secondary `--jade` | `#3f6b58` | Veg/quiet accents |
| Muted `--ash` | `#8a827a` | Secondary text, meta |

- **Type:** Fraunces (display serif) · Inter (body/UI) · IBM Plex Mono (prices, ledger-aligned) · Noto Serif SC (中文).
- **Motif — seal marks (印章)** on brass-hairline frames: `厨` chef's pick · `辣` spicy · `素` vegetarian · `售` sold-out. This *replaces* every generic pill/emoji.
- **Layout:** `list-dense` (row + right thumbnail). Images **optional** — missing image → seal-mark on a brass hairline frame (never a grey box).
- **Scheme:** dark-first. **Feel:** quiet, premium, one bold element (the seal), everything else hairline.

### 1.3 Theme 2 — **Counter**  *(new [P2])*

*QSR · shawarma · bakeries · bubble tea · food trucks. Proves: light schemes, image-required layouts, density at 200+ items.*

- **Ground:** bright bone-white (`~#faf9f6`). **Surface:** white cards, soft shadow. **Accent:** one saturated signal colour (proposed: a hot tangerine `~#ff5a1f` or electric grape — designer picks the family; must pass 4.5:1).
- **Type:** a tight modern **grotesk** (e.g. a condensed sans) for names; **oversized tabular numerals** for prices — price is a hero, not a footnote.
- **Motif:** filled **geometric chips** (no illustration) — solid rounded rects with a glyph.
- **Layout:** `card-grid` (2-up photo cards) default. **Images REQUIRED** — the theme is honest that it looks broken without them; the review/empty state should *push* the operator to add photos.
- **Scheme:** light-first. **Feel:** loud, fast, appetite-forward, photography does the work.

### 1.4 Theme 3 — **Palm**  *(new [P2])*

*Nigerian kitchens · Afro-Caribbean · lounges · buka-style. Proves: a non-Western design vocabulary — built *for* this market, not localised into it.*

- **Ground:** deep green (`~#123a2e`). **Surface:** raffia-cream cards (`~#efe6d2`). **Accent:** a warm ochre/terracotta. **Divider:** a **woven hairline rule** (a textural motif, not a plain line).
- **Type:** a chunky **slab** display face; generous row height (comfortable, communal).
- **Motif:** hand-drawn **leaf / pepper** marks (organic, not geometric).
- **Layout:** `list-dense` + `editorial`. Images optional.
- **Scheme:** dark-ish warm. **Feel:** generous, textural, rooted.

### 1.5 Theme 4 — **Carafe**  *(new [P2] — the hotel's Bar List)*

*Wine lists · cocktail bars · hotel bars · spirits. Proves the hardest case: a layout with **no images at all**.*

- **Ground:** near-black. **No photography.** **Accent:** a single restrained metallic (thin gold or bone).
- **Type:** small-caps section heads; a refined serif or grotesk for names; the **price runs to the right edge via dot leaders** (name · · · · · · ₦price).
- **Metadata line:** vintage / ABV / region / tasting note, small and quiet, under the name.
- **Motif:** none (or a hairline rule only).
- **Layout:** `ruled-list` **only**. **Images: none.**
- **Feel:** a printed drinks list. Typographic, calm, zero clutter.

### 1.6 The four layouts (design each once; themes reuse them)

| Layout | Look | Images | Used by |
|---|---|---|---|
| **`list-dense`** | Row: name + one-line desc (left), price + thumb (right) — the v1 layout | optional | Lacquer, Palm |
| **`card-grid`** | 2-up photo cards, price overlaid/under | required | Counter |
| **`editorial`** | Full-bleed photo, one item per band, big type | required | Palm |
| **`ruled-list`** | Name → dot leaders → price; no images; metadata line | none | Carafe |

> **Design rule for the layouts:** they must share **one row/section structure** so a menu re-themes without re-authoring. Design them as **four skins of the same data**, not four different information architectures.

### 1.7 What a tenant tunes vs. what's locked  *(the customiser's guardrails — Part 3.9)*

| ✅ Tunable | 🔒 Locked (theme identity) |
|---|---|
| Accent (curated set of **8** per theme, or a hex with a **blocking** 4.5:1 contrast check) | Typeface pairing |
| Scheme (light / dark / follow system) where supported | Spacing / radius / shadow scales |
| Layout (only from the theme's declared set) | Component structure |
| Density (comfortable / compact) | Motif pack (swap only *within* the theme) |
| Hero style (mark / photo / none, from the theme's set) | Arbitrary CSS |
| Motif on/off · logo · hero image | |

### 1.8 Global design standards (all themes, all surfaces)

- **Accessibility:** WCAG **AA**. Text contrast ≥ 4.5:1 (the customiser *enforces* this). Tap targets ≥ 44px. Full keyboard nav. Focus-visible on everything. Respect reduced-motion.
- **Motion:** purposeful only — the item sheet spring, sold-out toggle feedback, menu-switch cross-fade. Never gratuitous. Everything must feel instant.
- **Imagery:** dish photos are square, auto-cropped to WebP. A missing photo is a *designed* fallback per theme (never a grey box).
- **Bilingual:** every name/description can carry a 中文 (or other) value; Latin + CJK type must both be first-class in every theme.
- **Performance is a design constraint:** ≤120KB JS, LCP <2s. Heavy hero video / huge web-fonts / decorative image walls are budget you may not have. Design lean.

---

## Part 2 — Surface A: Public menus  *(what a guest sees)*

> Routes: `/` (venue home) · `/m/[menu]` · `/m/[menu]/[category]` · `/m/[menu]/[category]/[item]` · `?t=12` table param carried through everything. Every screen server-rendered, themed per-menu.

| # | Screen / component | Purpose | Key elements | States to design |
|---|---|---|---|---|
| A1 | **Venue home** (mini-site) [P2] | The landing when a QR points at a venue (not a specific menu) | Hero (mark/photo), **menu switcher**, open/closed pill (live, venue TZ), hours, address + map link, call / WhatsApp / directions, gallery | 1 menu (switcher hidden) · many menus · venue paused · after hours |
| A2 | **Menu view** [v1 ✅] | The menu itself | Sticky header (search + filter chips + category rail w/ scrollspy), grouped list of items (per layout) | grouped/default · searching · filtered · empty menu · loading |
| A3 | **Item row / card** [v1 ✅] | One dish | Name (+中文), one-line desc, **price once** (`₦6,000` or `from ₦8,000`), thumb/fallback, motif badges | available · featured (厨) · sold-out (dim, struck 售, sinks, not tappable) · no-image |
| A4 | **Item detail sheet** [v1 ✅] | Full dish, shareable | Bottom sheet (shallow-routed URL, back closes), photo, full desc, **variants w/ per-size price**, spice, allergens, share/call/WhatsApp | with/without photo · with/without variants · sold-out · shared-link deep entry |
| A5 | **Search** [v1 ✅] | Find a dish | Input in sticky header, live results (flat list), result count, clear | idle · typing · results · **no-results** (highest-value: feeds analytics) |
| A6 | **Filters** [v1 ✅] | Narrow by trait | Chips: Vegetarian · Contains pork · Seafood · Spicy · Chef's picks; live counts | none active · one/many active · empty result |
| A7 | **Menu switcher** [P2] | Move between a venue's menus | Segmented control; **schedule-aware** | hidden (1 menu) · active menu · a menu outside its window → greyed "From 17:00" or hidden (per setting) |
| A8 | **Language switcher** [P2] | Toggle locale | Appears only when >1 locale populated | 1 locale (hidden) · switching |
| A9 | **Platter badge** [P2] | Growth loop | Small, bottom, links to `platter.app` | Free (shown) · Pro (removed) |
| A10 | **PWA / offline** [v1 ✅] | Installable, cached | Install prompt, offline shell of last-seen menu | online · offline · update-available |
| A11 | **Not-found / closed** | Graceful edges | Bad slug, archived menu, paused venue — never a raw 404 | bad menu · bad item · paused venue |

**Per-theme:** A2–A4 render in each of the 4 themes/layouts. Design A2/A3/A4 **×4** (or design the structure once + 4 theme skins) — this *is* the theme gallery's proof.

---

## Part 3 — Surface B: The Manager app  *(app.platter.app — phone-first)*

### 3.0 App shell [P2 evolves v1]
Persistent chrome: **tenant switcher** (top-left, only if >1) → **venue switcher** → nav. **Desktop:** left sidebar. **Mobile:** bottom tab bar (**Menus · Items · QR · More**). Breadcrumb: *Tenant › Venue › Menu*.

### 3.1 Auth [v1 ✅]
Login (email+password / magic link), signup entry, forgot-password. Everything behind it is access-gated.

### 3.2 Onboarding wizard [P2] — *the most important new flow; target: live menu <5 min, no card*
Design each step as its own screen, all skippable/resumable:
1. **Account** — email+password / magic link / Google
2. **Business** — business name → tenant; venue name, cuisine, city, currency + timezone (geo-guessed, editable)
3. **Get your menu in** — 4 tiles: **Upload PDF/photos** (default, the wedge) · Import CSV · Paste text · Start blank / from a sample
4. **Review** — extracted categories + items in an **editable table**, per-row **confidence flags**, price re-check, duplicate flags (design the low-confidence highlight + inline edit)
5. **Theme** — the 4 themes previewed **with their just-imported dishes**
6. **Claim URL** — `yourname.platter.menu`, availability check, **QR shown immediately**
→ **"Your menu is live"** dashboard state + QR ready to download

### 3.3 Dashboard [P2]
Live-menu link + QR thumb (copy/open/download, one tap) · **unpublished-changes count + Publish** · today's views + top 3 items · **sold-out items still off from yesterday** (the #1 data-rot nudge) · plan-usage bar · setup checklist until 100%.

### 3.4 Venues [P2]
List (cover, name, address, menu count, live/paused) + `New venue` (plan-gated). **Venue detail:** profile, hours (7-day + holiday overrides), contact, address + map pin, gallery, domains, languages, ordering toggle.

### 3.5 Menus list [P2] — *the screen that makes multi-menu real*
Card grid of menus per venue: each card = name, **theme + layout**, item count, live/scheduled window, unpublished count, `[Edit] [Theme] [QR]`. Plus archived (Restore) cards. **New-menu wizard:** name → schedule → theme → blank / **duplicate existing** / import.

### 3.6 Menu editor [v1 ✅, rescoped under a menu]
Everything v1 has, now per-menu: **tree** (groups→categories→items, counts, filter) · **one-tap sold-out** (optimistic, undo toast) · **item form** (name EN/中文, desc, price, **variants**, category, **photo upload→crop→WebP**, dietary tags, allergens, spice, chef's-pick, add-on groups) · draft/publish per item · **drag-reorder** · **duplicate** · **bulk actions** (sold-out/publish/move/price ±%/delete + **move/duplicate to another menu** [P2]) · **CSV import/export**. Add breadcrumb + per-menu publish state.

### 3.7 Item form [v1 ✅] — *design the <90s path*
The highest-frequency creation screen. Camera→crop→WebP inline. Every field reachable one-handed. Draft by default.

### 3.8 Sold-out toggle [v1 ✅] — *design the <10s path*
From lock screen → menu tree → tap → done, optimistic, undo. This is the moat; design it to feel instant.

### 3.9 Theme gallery + customiser [P2] — *the upgrade-seller*
Split screen: **left** = controls (theme radios · layout · accent swatches +hex · scheme · density · motif · hero); **right** = a **phone preview of the tenant's REAL menu** that toggles menu-view / item-sheet / search. **Blocking contrast check** with a plain-language message. Draft/publish separation ("Discard" / "Publish"). "Reset to theme defaults." Locked themes on Free → preview + upgrade CTA (not hidden).

### 3.10 QR Studio [P2 evolves v1]
Codes list: venue code · per-menu codes · **per-table codes (bulk 1–N)**. Styling within brand (centre logo, accent, always error-correction H). Downloads: SVG / PNG / **A6 table-tent PDF** / A4 table-number sheet. **Scan analytics per code.** Permanent warning: changing a code's destination is fine, **deleting one breaks printed material**.

### 3.11 Analytics [P2]
Views · unique sessions · scans by QR code · top 20 items · category drop-off · **searches with no results** (the star report) · sold-out frequency · theme A/B (if 2 menus differ). Range picker capped by plan. CSV export.

### 3.12 Team [P2]
Members (role + venue scope) · invite by email · pending invites (resend/revoke) · role change with **escalation confirm** · **audit-log** tab.

### 3.13 Billing [P2]
Plan cards (usage vs limits) · **Paystack (NGN) / Stripe (USD)** · invoices · cancel with an explicit **"what you keep / what goes read-only"** · dunning banner (grace 7 days, then admin read-only — **menus stay live**).

### 3.14 Settings [v1 ✅]
Restaurant/venue name, hours, contact, currency, timezone, theme accent, ordering toggle.

---

## Part 4 — Surface C: Marketing site  *(platter.app — sells the themes)*

| Screen | Purpose | Design notes |
|---|---|---|
| **Home** | Convert | Hero = a **live phone frame cycling the 4 themes with real dish data** (show, don't tell). Problem strip · manager demo video · pricing teaser · social proof |
| **/themes** (gallery) | Highest-intent page | Each theme: big previews, "best for", layout options, **"try it with your menu"** CTA |
| **/themes/[id]** | Deep-dive | One theme, interactive scrollable phone frame |
| **/pricing** | Plans | 3 plans, **dual currency** (auto NGN/USD + toggle), FAQ, explicit downgrade answer |
| **/discover** | SEO + proof | Curated directory of live venues by city/cuisine (curated-only at launch — `§13 C7`) |
| **/menu-import** | Wedge landing | "Upload your paper menu, get a live one in 5 minutes" |
| **/login · /signup** | Entry | → the onboarding wizard |

---

## Part 5 — Surface D: Platter admin (internal) [P2]
`/_platter`: tenants list (plan, usage, last activity) · **impersonate** (mandatory reason, red banner during session, audit entry) · feature flags per tenant · theme-registry health · import-accuracy dashboard · `/discover` abuse queue. *(Functional, not brand-critical — minimal design.)*

---

## Part 6 — Cross-cutting design

### 6.1 Roles → what they see
| Role | Sees / does |
|---|---|
| Guest | Public menu only |
| Staff | Menu editor **read-only except the sold-out toggle** (+ Phase-3 order board) |
| Manager | Full menu/theme/QR/analytics for **their venues** |
| Admin | All venues; no billing / no tenant delete |
| Owner | Everything + billing + team + transfer/delete |

### 6.2 Plans → feature gating (affects UI: locks, upgrade prompts, read-only banners)
| | Free | Pro | Business |
|---|---|---|---|
| Venues / Menus | 1 / 1 | 1 / 5 | 10 / ∞ |
| Items | 60 | ∞ | ∞ |
| Themes | Lacquer only | all 4 | all 4 |
| Custom domain | — | ✅ | ✅ |
| Platter badge | shown | removable | removed |
| Analytics range | 7d | 90d | 365d |
| Ordering / API | — | — | ✅ (Phase 3) |

Design the **locked/upgrade** state (Free sees Counter/Palm/Carafe as previews with an upgrade CTA) and the **downgrade read-only** banner (nothing deleted; excess goes read-only).

### 6.3 Global states & component inventory (design once, reuse)
Buttons (primary/secondary/ghost/danger) · inputs/selects/toggles/steppers · **sold-out toggle** · chips/filters · **seal-mark / motif set ×4 themes** · cards · **bottom sheet** · dialogs/confirms · **toasts (with Undo)** · **empty states** (no menus / no items / no results / no analytics yet) · **loading skeletons** · **error states** · price display · open/closed pill · QR preview · phone-frame preview · plan-usage bar · upgrade CTA · confidence-flag row (import).

### 6.4 Responsive
Mobile-first. Breakpoints ~360 (design target) / 768 / 1024+. The **manager is a phone app that also works on desktop**, not the reverse. Public menu is phone-only in spirit.

---

## Part 7 — Key flows to design against
1. **Guest:** scan (`?t=`) → venue home → switch to Dinner → scroll → tap dish → sheet → pick variant → WhatsApp/share.
2. **Sold-out (<10s):** lock screen → app → tree → tap → undo toast.
3. **New tenant (<5 min):** signup → business → upload PDF → review → pick theme → claim URL → live + QR.
4. **Re-theme:** menu → Theme → try Carafe on real data → tune accent (contrast-checked) → Publish.
5. **Invite staff:** Team → invite email → role + venue scope → escalation confirm.
6. **Upgrade:** hit a Free limit → upgrade prompt → Paystack/Stripe → unlock.

---

## Part 8 — Screen inventory (design checklist)
**Public (A):** venue home · menu view ×4 themes · item row/card ×4 · item sheet ×4 · search · filters · menu switcher · language switcher · badge · offline/PWA · not-found/closed.
**Manager (B):** login · signup · onboarding ×6 steps · import review · app shell (mobile + desktop) · dashboard · venues list · venue detail · menus list · new-menu wizard · menu editor · item form · theme customiser · QR studio · analytics · team · billing · settings.
**Marketing (C):** home · themes gallery · theme detail · pricing · discover · menu-import · login/signup.
**Admin (D):** tenants · impersonation banner · flags.
**Themes (1):** Lacquer (extract) · Counter · Palm · Carafe — each: full token set (light+dark) · type specimen · motif pack · hero · the layout(s) it uses · empty/fallback treatment.
**Components (6.3):** the full inventory above.

> Suggested design order (mirrors the validation-first build): **Lacquer polish → Carafe → the menu-view/item-sheet ×those two → the customiser → onboarding → then Counter/Palm → the rest of the app → marketing.**
