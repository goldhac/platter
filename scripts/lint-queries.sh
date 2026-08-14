#!/usr/bin/env bash
# lint-queries — the M10 "no unscoped query / no RLS bypass" gate
#   (code-standards.md §26,§40,§41 · security.md §1,§3 · architecture.md §121).
#
# Tenant isolation in this app is 100% RLS-enforced: every DB access goes through the
# cookie-bound session client (lib/supabase/server.ts) or the anon browser client
# (lib/supabase/browser.ts) — both @supabase/ssr, anon key only. There is NO service-role
# client. This gate fails the build the moment anything can turn that safety net off:
#   A. a service-role client/key referenced in the shipped app tree,
#   B. the raw @supabase/supabase-js SDK imported outside the two sanctioned wrappers,
#   C. @supabase/ssr's createServerClient/createBrowserClient called outside those wrappers
#      (everything else must import the wrapper's createClient — one blessed path),
#   D. the server (cookie/RLS) client imported into a 'use client' component (would break
#      cookies() and is a sign of a bypass).
# It does NOT try to prove RLS itself — tests/isolation.sql + the Supabase advisors own that.
set -uo pipefail
cd "$(dirname "$0")/.."

fail=0
report() { if [ -n "$2" ]; then printf '\n✗ %s:\n%s\n' "$1" "$2"; fail=1; fi }

ROOTS="app lib components"
# The files that ARE the sanctioned Supabase client layer (server + browser + the middleware
# session refresher), + the generated types.
WRAP='lib/supabase/(server|browser|session)\.ts'
TYPES='lib/supabase/database\.types\.ts'

# A. No service-role client or key anywhere in the shipped tree (it's server-only, and this
#    project deliberately uses none — the load-time admin path is scripts/, not app code).
svc=$(grep -rnE 'SERVICE_ROLE|service_role|serviceRole' $ROOTS --include='*.ts' --include='*.tsx' 2>/dev/null \
      | grep -vE "$TYPES" || true)
report "service-role reference in app code — RLS bypass, server-only (security.md §3)" "$svc"

# B. The raw @supabase/supabase-js SDK client must not be imported in the shipped tree (all
#    access is via the @supabase/ssr wrappers). A raw createClient() would not carry the RLS
#    session. `import type { SupabaseClient }` is fine — a type annotation on a helper param
#    that receives the already-scoped client ships no client code.
raw=$(grep -rnE "@supabase/supabase-js" $ROOTS --include='*.ts' --include='*.tsx' 2>/dev/null \
      | grep -vE "$WRAP|$TYPES" | grep -vE '^\S+:[0-9]+:import type ' || true)
report "raw @supabase/supabase-js client import outside the wrappers (no RLS session)" "$raw"

# C. createServerClient / createBrowserClient may be called ONLY in the wrappers.
ssr=$(grep -rnE 'create(Server|Browser)Client' $ROOTS --include='*.ts' --include='*.tsx' 2>/dev/null \
      | grep -vE "$WRAP" || true)
report "createServerClient/createBrowserClient outside the wrappers (import createClient from lib/supabase/* instead)" "$ssr"

# D. The server (cookie-bound RLS) client must never be pulled into a client component.
leak=""
while IFS= read -r f; do
  [ -z "$f" ] && continue
  if grep -qE "supabase/server" "$f"; then leak="${leak}${f}"$'\n'; fi
done < <(grep -rlE "^[\"']use client[\"']" $ROOTS --include='*.ts' --include='*.tsx' 2>/dev/null || true)
report "'use client' component importing the server RLS client (lib/supabase/server)" "$leak"

if [ "$fail" -eq 0 ]; then
  echo "✓ queries: RLS is the only path to tenant data — no service-role, no raw SDK, one client layer, server client stays server-side."
else
  echo ""
  echo "FAIL: tenant isolation is RLS-enforced (security.md §1/§3). Route every DB access through lib/supabase/{server,browser}.ts; never the service role in app code."
  exit 1
fi
