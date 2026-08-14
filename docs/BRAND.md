# Platter — Brand reference (for the marketing redesign)

> The Platter *platform* brand — for the marketing site (homepage, pricing, discover, themes)
> and shared chrome. Distinct from the per-tenant **menu themes** (those are the restaurants'
> looks; this is Platter's own). Feed this to Claude Design alongside the `marketing-*.png` shots.

## Positioning
- **One-liner:** "Your restaurant menu, online in minutes." A digital-menu SaaS: snap a photo of a paper menu → a beautiful, always-current QR menu, no app for diners.
- **Wedge:** it looks like a *restaurant* designed it, not a spreadsheet. Craft is the differentiator vs. generic QR-menu tools.
- **Audience:** restaurant owners/managers (the buyer) — busy, non-technical, proud of their food.

## Voice
Confident, crafted, a little editorial — never techy or salesy. Short, concrete sentences.
"Snap your menu." "The price on the wall can never disagree with the screen." Speak to a
restaurateur, not a developer.

## Colour (current brand palette)
The marketing chrome is **dark** (ink ground, porcelain text, lacquer/brass accents):

| Token | Hex | Use |
|---|---|---|
| `ink` | `#14110f` | page ground (dark) |
| `porcelain` | `#f7f4ee` | primary text / light surfaces |
| `lacquer` | `#8e1d1d` | primary accent (CTAs, active) |
| `brass` | `#b08d4f` | fine detail, eyebrows, hairlines |
| `jade` | `#3f6b58` | positive / "live" |
| `ash` | `#8a827a` | muted text |

*You have freedom to evolve this for the platform brand* — it's not bound by the tenant token
contract. If you shift it, tell me the new values and I'll remap `MarketingShell` + the pages.

## Type
- **Display** (headlines, wordmark): **Fraunces** — high-contrast serif, premium/editorial.
- **Body:** **Inter**.
- **Numeric/tabular** (prices, plan numbers): **IBM Plex Mono**.
- **CJK** (only where menu previews appear): **Noto Serif SC**.

## Logo
- The mark: a **cloche (serving dome) + checklist + cursor** + "Platter" wordmark. Files:
  `public/logo.png` (full, dark-on-white), `app/icon.png` (the cloche mark, favicon).
- **Gap:** the logo is dark navy on white, so it **can't sit on the dark marketing chrome** —
  it needs a **light/mono variant**. This is the one asset blocking the logo in the header;
  I can generate a light version from the current mark, or the redesign can define a new logo.

## The marketing surfaces (current)
See `redesign-shots/marketing-*.png`. Homepage = hero + phone mockup + feature grid + a
"One menu, every look" theme showcase. Pricing = Free/Pro. Discover = venue directory. Themes =
4 theme preview cards → per-theme detail. Shared: `MarketingShell` (header nav Discover · Themes ·
Pricing · Sign in · Get started; footer). Implemented in `components/marketing/` + `app/` pages —
independent of the menu/theme code, so this track ships on its own.
