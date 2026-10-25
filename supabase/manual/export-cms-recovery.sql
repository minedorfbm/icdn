-- READ ONLY. Export the complete Results as JSON; do not copy truncated cells.
-- CMS tables and public hub-images inventory only; excludes auth, Vault and credentials.
-- One statement gives a single consistent database snapshot. Storage bytes are separate.
WITH export_scope AS (
  SELECT 'public'::text AS schema_name, 'hub-images'::text AS bucket_name,
         'table'::text AS table_section, '[]'::jsonb AS empty_rows
)
SELECT 'manifest' AS section, 'cms-v1' AS name, jsonb_build_object(
  'format', 'icdn-cms-recovery-v1',
  'captured_at', transaction_timestamp(),
  'versions', (SELECT jsonb_agg(version ORDER BY version ASC) FROM supabase_migrations.schema_migrations),
  'tables', (SELECT jsonb_agg(c.relname ORDER BY c.relname ASC) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=(SELECT schema_name FROM export_scope) AND c.relkind='r'),
  'columns', (SELECT jsonb_object_agg(table_name, names) FROM (SELECT table_name, jsonb_agg(column_name ORDER BY ordinal_position ASC) AS names FROM information_schema.columns WHERE table_schema=(SELECT schema_name FROM export_scope) AND table_name IN ('accommodation_benefit_translations','accommodation_benefits','destination_collection_items','destination_event_links','destination_events','destination_link_translations','destination_links','destination_notice_links','destination_notice_translations','destination_notices','destination_opening_hours','destination_photos','destination_posts','destination_relations','destination_translations','destination_videos','destinations','event_translations','levels','map_destination_links','map_places','site_link_translations','site_settings' ) GROUP BY table_name) columns)
) AS payload
UNION ALL
SELECT (SELECT table_section FROM export_scope), 'accommodation_benefit_translations', COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text ASC), (SELECT empty_rows FROM export_scope)) FROM public.accommodation_benefit_translations t
UNION ALL
SELECT (SELECT table_section FROM export_scope), 'accommodation_benefits', COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text ASC), (SELECT empty_rows FROM export_scope)) FROM public.accommodation_benefits t
UNION ALL
SELECT (SELECT table_section FROM export_scope), 'destination_collection_items', COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text ASC), (SELECT empty_rows FROM export_scope)) FROM public.destination_collection_items t
UNION ALL
SELECT (SELECT table_section FROM export_scope), 'destination_event_links', COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text ASC), (SELECT empty_rows FROM export_scope)) FROM public.destination_event_links t
UNION ALL
SELECT (SELECT table_section FROM export_scope), 'destination_events', COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text ASC), (SELECT empty_rows FROM export_scope)) FROM public.destination_events t
UNION ALL
SELECT (SELECT table_section FROM export_scope), 'destination_link_translations', COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text ASC), (SELECT empty_rows FROM export_scope)) FROM public.destination_link_translations t
UNION ALL
SELECT (SELECT table_section FROM export_scope), 'destination_links', COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text ASC), (SELECT empty_rows FROM export_scope)) FROM public.destination_links t
UNION ALL
SELECT (SELECT table_section FROM export_scope), 'destination_notice_links', COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text ASC), (SELECT empty_rows FROM export_scope)) FROM public.destination_notice_links t
UNION ALL
SELECT (SELECT table_section FROM export_scope), 'destination_notice_translations', COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text ASC), (SELECT empty_rows FROM export_scope)) FROM public.destination_notice_translations t
UNION ALL
SELECT (SELECT table_section FROM export_scope), 'destination_notices', COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text ASC), (SELECT empty_rows FROM export_scope)) FROM public.destination_notices t
UNION ALL
SELECT (SELECT table_section FROM export_scope), 'destination_opening_hours', COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text ASC), (SELECT empty_rows FROM export_scope)) FROM public.destination_opening_hours t
UNION ALL
SELECT (SELECT table_section FROM export_scope), 'destination_photos', COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text ASC), (SELECT empty_rows FROM export_scope)) FROM public.destination_photos t
UNION ALL
SELECT (SELECT table_section FROM export_scope), 'destination_posts', COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text ASC), (SELECT empty_rows FROM export_scope)) FROM public.destination_posts t
UNION ALL
SELECT (SELECT table_section FROM export_scope), 'destination_relations', COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text ASC), (SELECT empty_rows FROM export_scope)) FROM public.destination_relations t
UNION ALL
SELECT (SELECT table_section FROM export_scope), 'destination_translations', COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text ASC), (SELECT empty_rows FROM export_scope)) FROM public.destination_translations t
UNION ALL
SELECT (SELECT table_section FROM export_scope), 'destination_videos', COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text ASC), (SELECT empty_rows FROM export_scope)) FROM public.destination_videos t
UNION ALL
SELECT (SELECT table_section FROM export_scope), 'destinations', COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text ASC), (SELECT empty_rows FROM export_scope)) FROM public.destinations t
UNION ALL
SELECT (SELECT table_section FROM export_scope), 'event_translations', COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text ASC), (SELECT empty_rows FROM export_scope)) FROM public.event_translations t
UNION ALL
SELECT (SELECT table_section FROM export_scope), 'levels', COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text ASC), (SELECT empty_rows FROM export_scope)) FROM public.levels t
UNION ALL
SELECT (SELECT table_section FROM export_scope), 'map_destination_links', COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text ASC), (SELECT empty_rows FROM export_scope)) FROM public.map_destination_links t
UNION ALL
SELECT (SELECT table_section FROM export_scope), 'map_places', COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text ASC), (SELECT empty_rows FROM export_scope)) FROM public.map_places t
UNION ALL
SELECT (SELECT table_section FROM export_scope), 'site_link_translations', COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text ASC), (SELECT empty_rows FROM export_scope)) FROM public.site_link_translations t
UNION ALL
SELECT (SELECT table_section FROM export_scope), 'site_settings', COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text ASC), (SELECT empty_rows FROM export_scope)) FROM public.site_settings t
UNION ALL
SELECT 'storage', (SELECT bucket_name FROM export_scope), COALESCE(jsonb_agg(jsonb_build_object('name', name, 'metadata', metadata, 'updated_at', updated_at) ORDER BY name ASC), (SELECT empty_rows FROM export_scope)) FROM storage.objects WHERE bucket_id=(SELECT bucket_name FROM export_scope)
UNION ALL
SELECT 'bucket', (SELECT bucket_name FROM export_scope), COALESCE(jsonb_agg(jsonb_build_object('id', id, 'public', public)), (SELECT empty_rows FROM export_scope)) FROM storage.buckets WHERE id=(SELECT bucket_name FROM export_scope)
ORDER BY section ASC, name ASC;
