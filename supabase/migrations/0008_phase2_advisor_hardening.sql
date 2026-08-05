-- Platter — 0008 Phase 2: advisor hardening
-- Trigger functions are invoked by triggers, not by users — they must never be RPC-callable.
-- (They already error if called directly outside a trigger; revoking EXECUTE is hygiene and
--  clears the `anon_security_definer_function_executable` advisor WARN. The triggers still fire —
--  trigger execution does not check the caller's EXECUTE privilege.)
revoke execute on function
  public.enforce_staff_item_availability_only(),
  public.enforce_staff_variant_availability_only()
  from anon, authenticated, public;

-- Note (intentional, not a finding to fix): the RLS helpers auth_tenant_ids()/auth_role_in()/
-- auth_can_manage()/auth_is_admin() REMAIN executable by `authenticated` — RLS policies invoke
-- them as the querying role, so that grant is required. They only ever return the CALLER's own
-- tenant/role, so exposure is safe. This is the standard Supabase RLS-helper pattern.
