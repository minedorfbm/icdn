-- Read-only checks; run as the project's SQL Editor administrator.
-- Empty results are expected for the first three queries after hardening.
SELECT c.relname AS table_without_rls
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity;

SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname IN ('public', 'storage') AND cmd <> 'SELECT'
  AND roles && ARRAY['public', 'anon', 'authenticated']::name[];

SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated', 'PUBLIC')
  AND privilege_type <> 'SELECT';

-- Internal functions should have no visitor EXECUTE grant; service_role retains it.
SELECT p.proname, p.prosecdef, p.proconfig,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
  has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public';

SELECT c.relname, c.reloptions,
  has_table_privilege('anon', c.oid, 'SELECT') AS anon_read
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'v';

SELECT role, has_schema_privilege(role, 'public', 'CREATE') AS can_create
FROM (VALUES ('anon'), ('authenticated')) AS roles(role);

-- Compare this ledger with Git; never fill missing versions just from filenames.
SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version ASC;
