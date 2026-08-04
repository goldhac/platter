-- Platter — 0005 storage bucket for dish photos (A7).
-- Public-read bucket; writes are tenant-scoped by the first path folder = tenant_id,
-- and limited to manager/owner (security.md §6). Upload path: {tenant_id}/{uuid}.webp

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images', 'menu-images', true, 5242880,
  array['image/webp', 'image/avif', 'image/jpeg', 'image/png']
)
on conflict (id) do nothing;

-- storage.objects has RLS enabled by default in Supabase; add our policies.
create policy "menu images: public read"
  on storage.objects for select
  using (bucket_id = 'menu-images');

create policy "menu images: tenant insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'menu-images'
    and public.auth_role() in ('manager', 'owner')
    and (storage.foldername(name))[1] = public.auth_tenant_id()::text
  );

create policy "menu images: tenant update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'menu-images'
    and public.auth_role() in ('manager', 'owner')
    and (storage.foldername(name))[1] = public.auth_tenant_id()::text
  );

create policy "menu images: tenant delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'menu-images'
    and public.auth_role() in ('manager', 'owner')
    and (storage.foldername(name))[1] = public.auth_tenant_id()::text
  );
