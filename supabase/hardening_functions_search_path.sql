-- Harden function search_path to avoid role-mutable lookup vulnerabilities
-- Applies to listed functions in the public schema without redefining bodies.
-- Ref: Supabase Linter 0011_function_search_path_mutable

do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as proc
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'update_updated_at_column',
        'create_user_balance',
        'update_storage_usage'
      )
  loop
    execute format('alter function %s set search_path = public', r.proc);
  end loop;
end $$;

