-- Track per-user per-image upscale usage counts
create table if not exists public.image_upscale_uses (
  user_id uuid not null references auth.users(id) on delete cascade,
  image_key text not null,
  uses integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, image_key)
);

alter table public.image_upscale_uses enable row level security;

-- Ensure policies are created idempotently (drop then create)
drop policy if exists iu_select on public.image_upscale_uses;
drop policy if exists iu_insert on public.image_upscale_uses;
drop policy if exists iu_update on public.image_upscale_uses;

-- Users can select only their own rows
create policy iu_select on public.image_upscale_uses
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Users can insert only their own rows
create policy iu_insert on public.image_upscale_uses
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update only their own rows
create policy iu_update on public.image_upscale_uses
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_iu_user on public.image_upscale_uses (user_id);
