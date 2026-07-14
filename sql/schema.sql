-- ============================================================
-- Electron Blog — Supabase schema
-- Run this once inside: Supabase Dashboard → SQL Editor → New query
-- ============================================================

create table if not exists articles (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  slug         text unique,
  excerpt      text default '',
  content      text[] default '{}',      -- one paragraph per array item
  category     text not null default 'politics',
  tags         text[] default '{}',
  cover_url    text,
  date_label   text,                     -- display date e.g. "1404/04/01"
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

-- ------------------------------------------------------------
-- Seed data (the 6 sample articles from the prototype)
-- Safe to skip if you'd rather start empty.
-- ------------------------------------------------------------
insert into articles (title, slug, excerpt, content, category, tags, date_label, draft, featured)
values
(
  'معمای مشروعیت در دولت‌های پساتحول',
  'legitimacy-post-transition-states',
  'چرا برخی نظام‌های سیاسی پس از تحولات بزرگ، سال‌ها با بحران مشروعیت دست‌وپنجه نرم می‌کنند؟',
  array[
    'مشروعیت سیاسی، برخلاف تصور رایج، یک‌بار برای همیشه کسب نمی‌شود؛ بلکه فرآیندی مستمر از اقناع، عملکرد و روایت‌سازی است.',
    'در دوره‌های گذار، شکاف میان مشروعیت رویه‌ای و مشروعیت کارکردی بیش از هر زمان دیگری خود را نشان می‌دهد.',
    'تجربه بسیاری از کشورها نشان می‌دهد که ترکیب روایت مؤسس، کارآمدی اقتصادی، و مشارکت نهادینه‌شده، تعیین‌کننده پایداری مشروعیت است.'
  ],
  'governance',
  array['مشروعیت','دولت','نظریه سیاسی'],
  '1404/03/12',
  false,
  true
)
on conflict (slug) do nothing;
