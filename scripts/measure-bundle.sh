#!/usr/bin/env bash
# measure-bundle — the M10 "≤215KB initial JS" gate (foundation.md §7 #6 · CLAUDE.md guardrail #4).
# Budget re-baselined 120→215KB on 2026-08-06: the Next16/React19 (Turbopack) framework floor is
# ~174KB gzipped first-load on its own; 215KB = floor + lean app JS + headroom.
# Measures the gzipped first-load JS (the <script> chunks in a route's initial HTML) of a running
# deployment and fails if it exceeds the budget. Point it at the live site, a preview, or a local
# `next start`. The authoritative build-time figure is `next build`'s "First Load JS" column;
# this measures the actual wire transfer, which is what the phone downloads.
#
# Usage: bash scripts/measure-bundle.sh [URL] [BUDGET_KB]
#   defaults: the live flagship menu, 215 KB
set -uo pipefail
cd "$(dirname "$0")/.."

URL="${1:-https://platter.goldhac.com/v/jin-canting}"
BUDGET_KB="${2:-215}"
budget=$((BUDGET_KB * 1024))

html=$(curl -s "$URL") || { echo "✗ could not fetch $URL"; exit 2; }
origin=$(printf '%s' "$URL" | grep -oE '^https?://[^/]+')
# First-load JS = the <script src> chunks in the initial document (not <link> prefetches, which
# are for future navigations).
scripts=$(printf '%s' "$html" | grep -oE '<script[^>]+src="/_next/static/[^"]+\.js"' \
          | grep -oE '/_next/static/[^"]+\.js' | sort -u)
[ -z "$scripts" ] && { echo "✗ no /_next/static <script> chunks at $URL (is it a Next.js route?)"; exit 2; }

total=0; n=0
while IFS= read -r c; do
  [ -z "$c" ] && continue
  # -H 'Accept-Encoding: gzip' WITHOUT --compressed → size_download is the compressed wire size.
  sz=$(curl -s -H 'Accept-Encoding: gzip' -o /dev/null -w '%{size_download}' "$origin$c")
  total=$((total + sz)); n=$((n + 1))
done <<< "$scripts"

kb=$((total / 1024))
echo "route: $URL"
echo "first-load JS (gzipped wire): ${kb} KB across ${n} chunks · budget ${BUDGET_KB} KB"
if [ "$total" -le "$budget" ]; then
  echo "✓ bundle: under the ${BUDGET_KB}KB budget."
else
  echo "✗ bundle: OVER budget by $(((total - budget) / 1024)) KB — trim client JS ('use client' surfaces + heavy deps). foundation.md §7 #6."
  exit 1
fi
