-- Map a memory to its upscaled (high-quality) storage path
create table if not exists public.image_upscaled_paths (
  user_id uuid not null references auth.users(id) on delete cascade,
  memory_id uuid not null,
  upscaled_path text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, memory_id)
);

alter table public.image_upscaled_paths enable row level security;

drop policy if exists iup_select on public.image_upscaled_paths;
drop policy if exists iup_insert on public.image_upscaled_paths;
drop policy if exists iup_update on public.image_upscaled_paths;

create policy iup_select on public.image_upscaled_paths
  for select to authenticated
  using (auth.uid() = user_id);

create policy iup_insert on public.image_upscaled_paths
  for insert to service_role -- only service role should normally insert
  with check (true);

create policy iup_update on public.image_upscaled_paths
  for update to service_role
  using (true) with check (true);

create index if not exists idx_iup_user on public.image_upscaled_paths (user_id);
create index if not exists idx_iup_memory on public.image_upscaled_paths (memory_id);
