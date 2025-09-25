-- Requires: pgcrypto (for gen_random_uuid) and editing_prompts table
create extension if not exists pgcrypto;
-- Use storage paths for images, and link to editing_prompts via prompt_key

-- Table
create table if not exists public.inspiration_examples (
  id uuid primary key default gen_random_uuid(),
  title text,
  -- Prefer storage paths under images bucket, e.g. 'examples/human_01_before.jpg'
  before_path text not null,
  after_path text not null,
  -- Optional: external URLs for flexibility
  before_url text,
  after_url text,
  -- Link to template key (editing_prompts.key)
  prompt_key text references public.editing_prompts(key) on update cascade on delete set null,
  -- Optional display prompt (shown in UI)
  prompt text,
  category text default 'inspire',
  popularity int default 0,
  display_order int,
  created_at timestamptz default now()
);

-- RLS
alter table public.inspiration_examples enable row level security;

-- Allow anonymous read-only access (public gallery)
drop policy if exists inspiration_examples_select_anon on public.inspiration_examples;
create policy inspiration_examples_select_anon
  on public.inspiration_examples
  for select
  to anon
  using (true);

-- Optional: allow service role to manage rows
drop policy if exists inspiration_examples_all_service on public.inspiration_examples;
create policy inspiration_examples_all_service
  on public.inspiration_examples
  for all
  to service_role
  using (true)
  with check (true);

-- Indexes for sorting/filtering
create index if not exists idx_inspiration_examples_created_at
  on public.inspiration_examples (created_at desc);
create index if not exists idx_inspiration_examples_category
  on public.inspiration_examples (category);

-- Storage policy (optional): public read for examples folder only (private bucket scenario)
-- Uncomment if images bucket is private and you prefer unsigned public access for this prefix
-- create policy if not exists images_examples_public_read
-- on storage.objects for select to anon
-- using (bucket_id = 'images' and (position(name in 'examples/') = 1 or name like 'examples/%'));

-- Usage note:
-- Prefer storing storage paths:
--   before_path = 'examples/human_01_before.jpg'
--   after_path  = 'examples/human_01_after.jpg'
-- Frontend resolves storage paths to public or signed URLs.
