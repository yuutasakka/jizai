-- User Prompts table: stores prompts used to generate images
create table if not exists public.user_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt_text text not null,
  source text not null check (source in ('user','template')),
  example_key text,
  used_in_memory uuid,
  created_at timestamptz not null default now()
);

alter table public.user_prompts enable row level security;

drop policy if exists "user_prompts_select_own_or_template" on public.user_prompts;
create policy "user_prompts_select_own_or_template"
  on public.user_prompts for select
  using (auth.uid() = user_id or source = 'template');

drop policy if exists "user_prompts_insert_own" on public.user_prompts;
create policy "user_prompts_insert_own"
  on public.user_prompts for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_prompts_update_own" on public.user_prompts;
create policy "user_prompts_update_own"
  on public.user_prompts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
