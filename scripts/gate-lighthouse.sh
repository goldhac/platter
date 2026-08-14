#!/usr/bin/env bash
# gate-lighthouse — M10 "Lighthouse ≥90" gate (foundation.md §7 #6, §13 P8).
# Runs Lighthouse headless against a route and fails if any of performance / accessibility /
# best-practices / SEO scores below the threshold. NEEDS a local Chrome; npx fetches Lighthouse
# on first run. On-demand / CI gate (heavy), not part of the fast `npm run gates` suite.
#
# Usage: bash scripts/gate-lighthouse.sh [URL] [MIN_SCORE]   (defaults: live menu, 90)
set -uo pipefail
cd "$(dirname "$0")/.."

URL="${1:-https://platter.goldhac.com/v/jin-canting}"
MIN="${2:-90}"
command -v npx >/dev/null 2>&1 || { echo "✗ npx not found"; exit 2; }
out="$(mktemp -t lh).json"

echo "lighthouse → $URL (min ${MIN})"
if ! npx --yes lighthouse "$URL" --quiet \
      --chrome-flags="--headless=new --no-sandbox" \
      --only-categories=performance,accessibility,best-practices,seo \
      --output=json --output-path="$out"; then
  echo "✗ lighthouse failed to run (is Chrome installed?)"; exit 2
fi

node -e '
  const r = require(process.argv[1]); const min = +process.argv[2]; let bad = 0;
  for (const c of Object.values(r.categories)) {
    const s = Math.round((c.score ?? 0) * 100); const ok = s >= min;
    console.log((ok ? "  ✓" : "  ✗") + " " + c.title + ": " + s);
    if (!ok) bad++;
  }
  process.exit(bad ? 1 : 0);
' "$out" "$MIN" \
  && { echo "✓ lighthouse: all categories ≥ ${MIN}."; } \
  || { echo "✗ lighthouse: a category below ${MIN} — fix before release."; exit 1; }
