-- User purchases ledger (to prevent duplicate credits and audit)
create table if not exists public.user_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'apple',
  provider_transaction_id text not null,
  product_id text not null,
  credits_added integer not null default 0,
  purchased_at timestamptz not null default now(),
  unique (provider, provider_transaction_id)
);

alter table public.user_purchases enable row level security;

drop policy if exists "user_purchases_select_own" on public.user_purchases;
create policy "user_purchases_select_own"
  on public.user_purchases for select
  using (auth.uid() = user_id);

drop policy if exists "user_purchases_insert_own" on public.user_purchases;
create policy "user_purchases_insert_own"
  on public.user_purchases for insert
  with check (auth.uid() = user_id);

