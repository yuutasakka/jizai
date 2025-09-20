-- Mapping table for product -> credits
create table if not exists public.product_credits (
  product_id text primary key,
  credits integer not null check (credits >= 0),
  updated_at timestamptz not null default now()
);

alter table public.product_credits enable row level security;

-- read-only for authenticated users
drop policy if exists "product_credits_read_all" on public.product_credits;
create policy "product_credits_read_all"
  on public.product_credits for select
  using (true);

-- admin-only writes are expected via service key (no public insert/update policies)

