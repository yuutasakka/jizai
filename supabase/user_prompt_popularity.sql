-- Popularity view for template prompts (any user can read via base RLS allowing source='template')
create or replace view public.user_prompt_popularity as
select
  coalesce(example_key, prompt_text) as key,
  example_key,
  prompt_text,
  count(*)::bigint as uses,
  max(created_at) as last_used
from public.user_prompts
where source = 'template'
group by 1,2,3;

