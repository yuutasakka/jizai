-- Multi-category support for inspiration_examples
-- Adds a text[] column `categories`, backfills from `category`, and creates a GIN index.

alter table if exists public.inspiration_examples
  add column if not exists categories text[] default null;

-- Backfill: if categories is null, set to array[category]
update public.inspiration_examples
  set categories = array_remove(array[category], null)
  where categories is null;

-- Index for efficient contains queries
create index if not exists idx_inspiration_examples_categories
  on public.inspiration_examples using gin (categories);

