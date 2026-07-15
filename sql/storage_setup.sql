-- ============================================================
-- Electron Blog — cover image storage setup
-- Run this once inside: Supabase Dashboard → SQL Editor → New query
-- (Creates a public "covers" bucket + access rules. If you'd rather
-- do this by hand: Storage → Create bucket → name "covers" → Public.)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

alter table storage.objects enable row level security;

-- Anyone can view cover images (they're public, shown on the site)
drop policy if exists "public can view covers" on storage.objects;
create policy "public can view covers"
  on storage.objects for select
  using (bucket_id = 'covers');

-- Only the logged-in admin can upload new covers
drop policy if exists "authenticated can upload covers" on storage.objects;
create policy "authenticated can upload covers"
  on storage.objects for insert
  with check (bucket_id = 'covers' and auth.role() = 'authenticated');

-- Only the logged-in admin can delete covers
drop policy if exists "authenticated can delete covers" on storage.objects;
create policy "authenticated can delete covers"
  on storage.objects for delete
  using (bucket_id = 'covers' and auth.role() = 'authenticated');
