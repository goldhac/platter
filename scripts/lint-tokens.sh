#!/usr/bin/env bash
# lint-tokens — the M2 "no raw color" gate (foundation.md §13 P8 · ui-tokens.md invariant).
# Fails if a raw color appears in a rendered surface (app/ or components/) outside the theme
# layer: a hex literal, a PRIVATE-palette utility (ink/porcelain/lacquer/brass/jade/ash), or a
# Tailwind default color scale (bg-red-500 …). Components must use the semantic contract only
# (bg-bg, text-text, text-accent, border-hairline, …). lib/themes + globals.css define the values.
set -uo pipefail
cd "$(dirname "$0")/.."

fail=0
report() { # $1 label, $2 matches
  if [ -n "$2" ]; then printf '\n✗ raw color (%s) outside the theme layer:\n%s\n' "$1" "$2"; fail=1; fi
}

# Exclusions (allowed to hold raw values):
#  - lib/themes + globals.css + components/theme : the theme layer defines the values
#  - app/(admin) + components/admin : the Menu Manager is the FIXED internal UI, not a
#    tenant-themed surface (it never re-themes) — a later pass can move it onto the contract
#  - components/marketing + the marketing pages (/, /pricing, /themes) : Platter's OWN
#    fixed brand chrome, not a per-tenant-themed surface (the theme swatches inside them
#    still use semantic tokens under their own data-theme)
#  - app/api/og : next/og renders images and cannot consume CSS variables (inline hex only);
#    per-theme OG images are a later theme enhancement
EX='lib/themes|app/globals\.css|components/theme/|app/\(admin\)|components/admin/|app/api/og|components/marketing/|app/page\.tsx|app/pricing/|app/themes/|app/menu-import/'

hex=$(grep -rnE '#[0-9a-fA-F]{6}\b' app components --include='*.tsx' --include='*.ts' 2>/dev/null | grep -vE "$EX" || true)
palette=$(grep -rnE '\b(bg|text|border|ring|divide|fill|stroke|from|to|via|outline|placeholder|accent)-([a-z]+-)?(ink|porcelain|lacquer|brass|jade|ash)(/[0-9]+)?\b' app components --include='*.tsx' 2>/dev/null | grep -vE "$EX" || true)
defaults=$(grep -rnE '\b(bg|text|border|ring|from|to|via)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\b' app components --include='*.tsx' 2>/dev/null | grep -vE "$EX" || true)

report "hex literal" "$hex"
report "private palette" "$palette"
report "tailwind default scale" "$defaults"

if [ "$fail" -eq 0 ]; then
  echo "✓ tokens: no raw color outside the theme layer — every surface is on the semantic contract."
else
  echo ""
  echo "FAIL: use the semantic tokens (ui-tokens.md §2). Raw values live only in lib/themes + globals.css."
  exit 1
fi
