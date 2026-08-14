#!/usr/bin/env bash
# test-isolation — the M10 tenant-isolation gate (foundation.md §13 P8 · security.md §1 · the P0 gate).
# Runs tests/isolation.sql against $DATABASE_URL via psql: 5 checks — cross-tenant read, cross-tenant
# write, staff column-lock (is_available only), anon published-only, manager positive control. Any
# leak RAISEs (ON_ERROR_STOP) → non-zero exit → the build fails. This is the gate that must never
# regress; RLS is the security boundary and this proves it on the real schema.
#
# Run against the Railway dev DB (NOT prod — it seeds + deletes two test tenants):
#   railway connect Postgres            # opens the SSH tunnel
#   export DATABASE_URL='postgresql://…' # the tunnelled connection string
#   npm run test:isolation
set -uo pipefail
cd "$(dirname "$0")/.."

if [ -z "${DATABASE_URL:-}" ]; then
  echo "✗ DATABASE_URL not set — open the dev-DB tunnel first:"
  echo "    railway connect Postgres   # then export DATABASE_URL=…"
  echo "  Do NOT point this at prod: the suite seeds + deletes test tenants."
  exit 2
fi
command -v psql >/dev/null 2>&1 || { echo "✗ psql not found (brew install libpq, or postgresql)"; exit 2; }

# Guard: refuse the known prod host outright (belt-and-braces on top of the comment above).
case "$DATABASE_URL" in
  *bnyadozvvyzlzwnelrfu*|*pooler.supabase.com*|*supabase.co*)
    echo "✗ refusing to run isolation against what looks like prod Supabase ($DATABASE_URL)."
    echo "  Use the Railway dev DB (railway connect Postgres)."; exit 2;;
esac

# Auth stub (auth schema + role/jwt helpers on a plain Postgres) — idempotent/best-effort.
psql "$DATABASE_URL" -q -f tests/fixtures/00_local_auth_stub.sql >/dev/null 2>&1 || true

if psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f tests/isolation.sql; then
  echo "✓ isolation: all 5 cross-tenant / role checks passed."
else
  echo "✗ isolation: a check FAILED — tenant isolation is broken. Blocks release (security.md §1)."
  exit 1
fi
