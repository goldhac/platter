-- Platter — 0004: fully de-expose the auth helpers from anon.
-- Supabase grants EXECUTE on new public functions to anon/authenticated DIRECTLY
-- (not only via PUBLIC), so 0003's `revoke ... from public` didn't drop the anon
-- grant. Anon policies never call these helpers, so revoke from anon explicitly.
revoke execute on function public.auth_tenant_id() from anon;
revoke execute on function public.auth_role() from anon;

-- Residual (accepted): both remain callable by `authenticated` via RPC — required,
-- since authenticated RLS policies reference them. Each returns only the CALLER'S OWN
-- tenant/role, never another tenant's data, so this is not an isolation risk
-- (security.md §1). A fuller fix (move them to a non-exposed `private` schema) is
-- deferred to M3 when the auth/RBAC layer is built.
