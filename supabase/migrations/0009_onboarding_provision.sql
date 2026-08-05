-- Self-serve onboarding: a signed-up user provisions their own tenant.
-- SECURITY DEFINER because a brand-new user has no membership yet, so RLS would
-- block the tenant/restaurant/staff/membership inserts (chicken-and-egg). The
-- function only ever acts for auth.uid(), is idempotent, and is granted to
-- `authenticated` only — so it cannot be used to provision for anyone else, and
-- never needs the service-role key in app code (security.md §3).
create or replace function public.provision_tenant(p_name text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_meta_name text;
  v_name text;
  v_base text;
  v_slug text;
  v_n int := 2;
  v_tenant_id uuid;
  v_restaurant_id uuid;
  v_existing text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  -- Idempotent: already provisioned → return the existing restaurant slug.
  select r.slug into v_existing
  from staff s
  join restaurants r on r.tenant_id = s.tenant_id
  where s.id = v_uid
  limit 1;
  if v_existing is not null then
    return v_existing;
  end if;

  -- Business name: arg → signup metadata → email local-part → fallback.
  select email, coalesce(raw_user_meta_data ->> 'business_name', raw_user_meta_data ->> 'full_name')
    into v_email, v_meta_name
  from auth.users
  where id = v_uid;

  v_name := coalesce(
    nullif(btrim(p_name), ''),
    nullif(btrim(v_meta_name), ''),
    nullif(split_part(coalesce(v_email, ''), '@', 1), ''),
    'My Restaurant'
  );

  -- A slug that is free in BOTH tenants and restaurants (they carry independent
  -- unique constraints; at signup the tenant owns exactly one restaurant).
  v_base := btrim(regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g'), '-');
  if v_base = '' then v_base := 'restaurant'; end if;
  v_base := left(v_base, 50);
  v_slug := v_base;
  while exists (select 1 from restaurants where slug = v_slug)
     or exists (select 1 from tenants where slug = v_slug) loop
    v_slug := v_base || '-' || v_n;
    v_n := v_n + 1;
  end loop;

  insert into tenants (name, slug)
  values (v_name, v_slug)
  returning id into v_tenant_id;

  insert into restaurants (tenant_id, name, slug)
  values (v_tenant_id, v_name, v_slug)
  returning id into v_restaurant_id;

  -- The staff row drives the app layer (getCurrentStaff); the membership drives
  -- RLS scoping (auth_tenant_ids). New signup = owner of their own tenant.
  insert into staff (id, tenant_id, restaurant_id, role, full_name, email)
  values (v_uid, v_tenant_id, v_restaurant_id, 'owner', v_name, v_email);

  insert into memberships (user_id, tenant_id, role, accepted_at)
  values (v_uid, v_tenant_id, 'owner', now());

  return v_slug;
end;
$$;

revoke all on function public.provision_tenant(text) from public;
revoke all on function public.provision_tenant(text) from anon;
grant execute on function public.provision_tenant(text) to authenticated;
