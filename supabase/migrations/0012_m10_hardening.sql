-- 0012_m10_hardening.sql
-- M10 pre-launch hardening, from re-running the Supabase advisors (2026-08-06).
-- Scope kept tight + safe: one security lock-down + one hot-path index.
-- (The auth_* RLS helpers + accept_invite/provision_tenant staying executable by
--  `authenticated` is intentional — RLS policies invoke the helpers, and the two RPCs
--  are the onboarding/invite entrypoints. Those advisor WARNs are expected, not fixed here.)

-- 1) SECURITY — lock the plan-enforcement TRIGGER function.
--    enforce_menu_plan() fires on menus INSERT/UPDATE; it is not meant to be an RPC, but it
--    still carried the default PUBLIC EXECUTE grant, so it was reachable at
--    /rest/v1/rpc/enforce_menu_plan by anon + authenticated (advisors 0028 / 0029).
--    The sibling trigger fns (enforce_staff_*_availability_only) are already locked to
--    postgres/service_role; match them. Triggers fire as the table owner regardless of these
--    grants, so revoking EXECUTE does not affect enforcement — it only removes the RPC surface.
revoke execute on function public.enforce_menu_plan() from public, anon, authenticated;

-- 2) PERFORMANCE — index the hot-path foreign key.
--    categories.group_id had no covering index (advisor 0001). The public menu tree joins
--    menu_groups -> categories on group_id on every render; cheap now, matters at menu/venue scale.
create index if not exists idx_categories_group on public.categories(group_id);
