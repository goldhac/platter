-- Platter — 0003 advisor hardening (resolves the WARN-level security lints from 0002).
-- None were vulnerabilities; this tightens the surface anyway (security.md).

-- 0011: pin search_path on the updated_at trigger fn
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

-- 0028/0029: the staff column-guards don't need SECURITY DEFINER — they only
-- call auth_role(). Make them INVOKER so they leave the definer-RPC surface.
alter function public.enforce_staff_item_availability_only() security invoker;
alter function public.enforce_staff_variant_availability_only() security invoker;

-- 0028: auth helpers must stay SECURITY DEFINER (read staff bypassing RLS to avoid
-- recursion), but only `authenticated` policies call them — anon never does.
-- Take them off PUBLIC (removes the anon RPC exposure); keep them for authenticated.
revoke execute on function public.auth_tenant_id() from public;
revoke execute on function public.auth_role() from public;
grant execute on function public.auth_tenant_id() to authenticated;
grant execute on function public.auth_role() to authenticated;

-- Residual (accepted): auth_tenant_id()/auth_role() remain callable by `authenticated`
-- via RPC — by design; each returns only the CALLER'S OWN tenant/role, never another
-- tenant's data, so this is not an isolation risk (security.md §1).
-- Also accepted: pg_trgm lives in `public` (admin-search index only; ubiquitous on Supabase).
