# Prompt for Claude Design — build the design system

> Paste the block below into Claude Design after uploading the codebase. Attach these from
> `docs/`: `BRAND.md`, `tokens.md`, `REDESIGN-BRIEF.md`, the `redesign-shots/` images (esp.
> `marketing-landing.png`, `menu-home.png`, `item-sheet.png`), and the light logo
> (`brand-logo-light.png`). It's deliberately loose — direction, not a spec.

---

I'm redesigning **Platter** — a digital-menu SaaS for restaurants. Diners scan a QR code and
browse a beautiful menu on their phone (no app); owners manage it from a phone-first admin.
I've uploaded the codebase plus a brand reference (`BRAND.md`), the current tokens (`tokens.md`),
a screen inventory (`REDESIGN-BRIEF.md`), screenshots of the current app, and the logo.

**Start by building a design system — not full screens yet.** Do the foundations first
(colour, a real type scale, spacing rhythm, radius, elevation, and a small motion set), then the
core components, each in all its states (default, hover, focus, active, disabled, loading):

- Buttons (primary / secondary / ghost / danger / icon)
- Inputs (text / textarea / select / search) with label, helper, error
- Chips & filter pills (toggle on/off)
- Cards / surfaces / plates
- A bottom-sheet + modal shell
- Badges & tags (dietary, spice, sold-out, "hidden"/draft)
- An open/closed pill, a toggle/switch
- The price "ledger" treatment (tabular figures) + a secondary "≈ $X" line
- A seal-mark motif (used where a dish has no photo)
- A loading skeleton
- Tabs / a category rail / a menu switcher
- Toasts and an empty-state pattern

**Direction — but this is your canvas.** Platter's identity is dark, crafted, editorial,
fine-dining — a menu a *restaurant* designed, not a spreadsheet. I want you to **elevate** it:
sharper hierarchy, generous space, appetite-forward, modern, with real motion. Keep the crafted
DNA (a high-contrast serif for display, restraint, the seal motif). Beyond that, **design freely
— evolve the palette, type scale, spacing, and shape; don't just copy what's there.** Make it
distinctive and premium, not generic SaaS. Surprise me.

The current tokens and screenshots are a **starting point, not a spec.** The only thing that
helps downstream: keep the semantic token *roles* recognisable (bg, surface, text, accent,
hairline, positive…) so it maps cleanly back to code — but choose their values however you like,
and add roles if you need them.

Once the system feels solid, we'll build the **marketing homepage** from it first.

---
