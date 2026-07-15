-- ============================================================
-- Electron Blog — migrate an existing v1 database to v2
-- Run this ONCE inside: Supabase Dashboard → SQL Editor → New query
-- (Only if you already ran the old schema.sql before this update.
--  If your `articles` table doesn't exist yet, run sql/schema.sql
--  instead — not this file.)
-- ============================================================

-- 1) Add the new columns alongside the old ones
alter table articles add column if not exists categories text[] not null default '{}';
alter table articles add column if not exists content_v2 text default '';

-- 2) Migrate old single `category` into the new `categories` array
update articles
set categories = array[category]
where category is not null and categories = '{}';

-- 3) Migrate old paragraph-array `content` into a single HTML string
update articles
set content_v2 = coalesce(
  (select string_agg('<p>' || replace(p, '''', '''''') || '</p>', '') from unnest(content) as p),
  ''
)
where content_v2 = '' or content_v2 is null;

-- 4) Swap the columns
alter table articles drop column if exists content;
alter table articles rename column content_v2 to content;
alter table articles drop column if exists category;

-- Done. Your existing articles now have `categories` (array) and
-- `content` (HTML string) matching the new admin editor.
