-- Editing prompts catalog for search/templates
-- Run this in Supabase SQL editor

create table if not exists public.editing_prompts (
  key text primary key,
  ja_title text not null,
  en_prompt text not null,
  category text not null check (category in ('expression','background','attire','frame','pose','quality','size')),
  cover_url text,
  created_at timestamptz not null default now(),
  popularity integer not null default 0
);

alter table public.editing_prompts enable row level security;

-- Read-only for anonymous/authenticated clients
create policy if not exists ep_select_anon on public.editing_prompts
  for select
  to anon, authenticated
  using (true);

-- Optionally, restrict writes to service role only (no policy for anon/authenticated)

-- Helpful indexes
create index if not exists idx_ep_category on public.editing_prompts (category);
create index if not exists idx_ep_created_at on public.editing_prompts (created_at desc);
create index if not exists idx_ep_popularity on public.editing_prompts (popularity desc);

-- Sample upserts (optional)
-- insert into public.editing_prompts (key, ja_title, en_prompt, category, cover_url, popularity)
-- values
--   ('expression_soft_smile', 'やさしい微笑み', 'Gently adjust to a soft natural smile.', 'expression', null, 5),
--   ('background_remove', '背景を削除', 'Remove background to transparent.', 'background', null, 10),
--   ('attire_suit', 'ダークスーツに変更', 'Change clothing to a dark suit with a white shirt.', 'attire', null, 8)
-- on conflict (key) do update set
--   ja_title = excluded.ja_title,
--   en_prompt = excluded.en_prompt,
--   category = excluded.category,
--   cover_url = excluded.cover_url,
--   popularity = excluded.popularity;

