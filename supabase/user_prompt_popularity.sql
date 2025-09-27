-- Use SECURITY INVOKER to ensure the view respects the caller's RLS/permissions
-- (PostgreSQL 15+)
create or replace view public.user_prompt_popularity
with (security_invoker = true)
as
select
  coalesce(example_key, prompt_text) as key,
  example_key,
  prompt_text,
  count(*)::bigint as uses,
  max(created_at) as last_used
from public.user_prompts
where source = 'template'
group by 1,2,3;
