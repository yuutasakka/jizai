-- Track per-user per-image upscale usage counts
create table if not exists public.image_upscale_uses (
  user_id uuid not null references auth.users(id) on delete cascade,
  image_key text not null,
  uses integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, image_key)
);

alter table public.image_upscale_uses enable row level security;

-- Users can select only their own rows
create policy if not exists iu_select on public.image_upscale_uses
  for select using (auth.uid() = user_id);

-- Users can upsert only their own rows
create policy if not exists iu_upsert on public.image_upscale_uses
  for insert with check (auth.uid() = user_id);

create policy if not exists iu_update on public.image_upscale_uses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_iu_user on public.image_upscale_uses (user_id);
