-- Local-only stub of the Supabase-managed `auth` schema + service roles.
-- Purpose: let the real migrations (0001+) and RLS policies apply against a plain
-- local Postgres so the isolation suite can run for $0 (no Supabase branch / Docker).
-- This is a TEST FIXTURE — never part of the production migration set.
--
-- Emulates just enough of Supabase:
--   • roles anon / authenticated / service_role / authenticator
--   • auth.users, auth.uid(), auth.role(), auth.jwt() (read request.jwt.claims GUC)
--   • the default table grants Supabase applies to anon/authenticated
--
-- Impersonate in tests with:
--   set local role authenticated;
--   set local request.jwt.claims = '{"sub":"<user-uuid>","role":"authenticated"}';

create schema if not exists auth;

do $$
begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit; end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit; end if;
  if not exists (select from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls; end if;
  if not exists (select from pg_roles where rolname = 'authenticator') then
    create role authenticator noinherit login password 'authenticator'; end if;
end $$;

grant anon, authenticated, service_role to authenticator;
grant usage on schema public to anon, authenticated, service_role;
grant usage on schema auth to anon, authenticated, service_role;

-- Supabase grants table DML to anon/authenticated by default; RLS then restricts.
-- Apply to every table the migrations create after this point:
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public grant select, insert on tables to anon;
alter default privileges in schema public grant usage, select on sequences to authenticated, anon, service_role;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  created_at timestamptz not null default now()
);

create or replace function auth.uid() returns uuid
  language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::json ->> 'sub', '')::uuid
$$;

create or replace function auth.role() returns text
  language sql stable as $$
  select coalesce(current_setting('request.jwt.claims', true)::json ->> 'role', 'anon')
$$;

create or replace function auth.jwt() returns jsonb
  language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb)
$$;

grant execute on function auth.uid(), auth.role(), auth.jwt() to anon, authenticated, service_role;
