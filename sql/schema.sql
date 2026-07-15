-- ============================================================
-- Electron Blog — Supabase schema (v2)
-- Run this once inside: Supabase Dashboard → SQL Editor → New query
--
-- If you already ran the OLD version of this file (single `category`
-- column, `content` as a text[] of paragraphs), do NOT run this file —
-- run sql/migrate_to_v2.sql instead, it upgrades your existing table
-- in place without losing data.
-- ============================================================

create table if not exists articles (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  slug         text unique,
  excerpt      text default '',
  content      text default '',        -- rich-text HTML from the admin editor
  categories   text[] not null default '{}',  -- an article can belong to several categories
  tags         text[] default '{}',
  cover_url    text,
  date_label   text,                   -- display date e.g. "1404/04/01"
  draft        boolean not null default true,
  featured     boolean not null default false,
  seo_title    text,
  seo_description text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- keep updated_at fresh
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_articles_updated_at on articles;
create trigger trg_articles_updated_at
  before update on articles
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table articles enable row level security;

-- Anyone (anon key) can read only published articles
drop policy if exists "public can read published articles" on articles;
create policy "public can read published articles"
  on articles for select
  using (draft = false);

-- Only logged-in users (your admin account) can read everything,
-- including drafts, and can insert/update/delete
drop policy if exists "authenticated full access" on articles;
create policy "authenticated full access"
  on articles for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- No seed data on purpose — the site ships with zero hardcoded
-- articles. Everything you see comes from this table, created
-- through /admin.
