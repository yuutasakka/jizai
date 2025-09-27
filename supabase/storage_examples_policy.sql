-- Storage policy for `images/examples/*` public read access
-- Use this when the `images` bucket is private but you want public (anon) read
-- for example assets referenced by `inspiration_examples.before_path/after_path`.

-- Notes:
-- - Creating signed URLs requires "select" permission on storage.objects.
-- - This policy allows anon and authenticated roles to select only objects
--   under the `examples/` prefix within the `images` bucket.
-- - Keep write operations restricted to server-side (service_role) only.

-- Idempotent: drop then create
drop policy if exists images_examples_public_read on storage.objects;
create policy images_examples_public_read
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = 'images'
    and (name like 'examples/%')
  );

-- Optional hardening examples (uncomment as needed):
-- Restrict inserts/updates/deletes for examples/* to service_role only
-- drop policy if exists images_examples_write_service_only on storage.objects;
-- create policy images_examples_write_service_only
--   on storage.objects for all
--   to service_role
--   using (bucket_id = 'images' and name like 'examples/%')
--   with check (bucket_id = 'images' and name like 'examples/%');

