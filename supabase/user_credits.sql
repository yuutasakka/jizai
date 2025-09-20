-- User Credits table (user_id-based)
create table if not exists public.user_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  credits integer not null default 0,
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.user_credits enable row level security;

drop policy if exists "user can read own credits" on public.user_credits;
create policy "user can read own credits"
  on public.user_credits for select
  using (auth.uid() = user_id);

drop policy if exists "user can update own credits" on public.user_credits;
create policy "user can update own credits"
  on public.user_credits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Optional: insert by self (first bootstrap)
drop policy if exists "user can insert own credits" on public.user_credits;
create policy "user can insert own credits"
  on public.user_credits for insert
  with check (auth.uid() = user_id);

