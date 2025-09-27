-- Harden RLS for user_credits to prevent self-modification by end users
-- Users may read their own credits; only service_role can insert/update/delete.

alter table if exists public.user_credits enable row level security;

-- Keep/ensure read-only for the owner
drop policy if exists "user can read own credits" on public.user_credits;
create policy "user can read own credits"
  on public.user_credits for select
  using (auth.uid() = user_id);

-- Remove permissive write policies (if present)
drop policy if exists "user can update own credits" on public.user_credits;
drop policy if exists "user can insert own credits" on public.user_credits;

-- Restrict writes to service_role only
drop policy if exists user_credits_insert_service on public.user_credits;
create policy user_credits_insert_service
  on public.user_credits for insert
  to service_role
  with check (true);

drop policy if exists user_credits_update_service on public.user_credits;
create policy user_credits_update_service
  on public.user_credits for update
  to service_role
  using (true)
  with check (true);

drop policy if exists user_credits_delete_service on public.user_credits;
create policy user_credits_delete_service
  on public.user_credits for delete
  to service_role
  using (true);

