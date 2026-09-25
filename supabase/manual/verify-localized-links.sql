-- Read-only checks after applying the two localized-link migrations.
SELECT 'destination_links' AS content, locale, count(*) AS active_variants
FROM public.destination_link_translations WHERE active GROUP BY locale
UNION ALL
SELECT 'website', locale, count(*) FROM public.site_link_translations WHERE active GROUP BY locale
ORDER BY content, locale;

SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled,
  has_table_privilege('anon', c.oid, 'SELECT') AS public_read,
  has_table_privilege('anon', c.oid, 'INSERT,UPDATE,DELETE') AS anonymous_write,
  has_table_privilege('authenticated', c.oid, 'INSERT,UPDATE,DELETE') AS authenticated_write
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN ('destination_link_translations', 'site_link_translations');

-- Expected: no rows (no active obsolete variants or variants on unsupported actions).
SELECT 'destination_link' AS content, t.link_id::text AS id, t.locale
FROM public.destination_link_translations t JOIN public.destination_links l ON l.id = t.link_id
WHERE t.active AND (l.kind NOT IN ('DISCOVER', 'WEBSITE') OR t.source_url IS DISTINCT FROM l.url)
UNION ALL
SELECT 'website', t.setting_key, t.locale
FROM public.site_link_translations t JOIN public.site_settings s ON s.key = t.setting_key
WHERE t.active AND (t.setting_key <> 'website' OR t.source_url IS DISTINCT FROM s.value);
