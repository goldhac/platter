#!/usr/bin/env bash
# gate-a11y — M10 accessibility gate (foundation.md §13 P8: "axe-clean").
# Runs axe-core against a running route via @axe-core/cli and fails on any violation.
# NEEDS a local Chrome (present on dev + CI runners). Heavy-ish (npx fetches the CLI on first
# run), so it's an on-demand / CI gate, not part of the fast `npm run gates` static suite.
#
# Usage: bash scripts/gate-a11y.sh [URL]   (default: the live flagship menu)
# A lightweight, dependency-free WCAG smoke check also lives inline in the M10 notes
# (lang, single-h1, landmarks, accessible names, labels) — this is the full audit.
set -uo pipefail
cd "$(dirname "$0")/.."

URL="${1:-https://platter.goldhac.com/v/jin-canting}"
command -v npx >/dev/null 2>&1 || { echo "✗ npx not found"; exit 2; }

echo "axe audit → $URL"
if npx --yes @axe-core/cli "$URL" --exit; then
  echo "✓ axe: no accessibility violations."
else
  echo "✗ axe: accessibility violations above — fix before release (foundation.md §7 #6)."
  exit 1
fi
