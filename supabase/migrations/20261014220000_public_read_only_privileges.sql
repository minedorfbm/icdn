-- Defence in depth: the hub reads published content; administration uses service_role
-- or the SQL Editor. RLS already blocks public writes. Remove redundant SQL grants
-- as well, including TRUNCATE (which is not governed by row-level policies).
-- Idempotent; no content, publication policy or service_role grant is changed.
BEGIN;

REVOKE ALL ON public.destination_videos, public.published_destination_notices
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.destination_videos, public.published_destination_notices
  TO anon, authenticated;

-- Internal trigger/constraint helpers are not public RPC endpoints.
REVOKE EXECUTE ON FUNCTION
  public.set_updated_at(),
  public.check_destination_cluster(),
  public.check_level_clusters(),
  public.unpublish_changed_destination_translations(),
  public.unpublish_changed_event_translations(),
  public.prepare_link_translation(),
  public.unpublish_changed_link_translations(),
  public.sync_destination_legacy_kind(),
  public.touch_destination_notice_timestamp(),
  public.valid_destination_headings(jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION
  public.set_updated_at(),
  public.check_destination_cluster(),
  public.check_level_clusters(),
  public.unpublish_changed_destination_translations(),
  public.unpublish_changed_event_translations(),
  public.prepare_link_translation(),
  public.unpublish_changed_link_translations(),
  public.sync_destination_legacy_kind(),
  public.touch_destination_notice_timestamp(),
  public.valid_destination_headings(jsonb)
  TO service_role;

-- Future objects created through the project's postgres migration/SQL role need
-- explicit public grants. Keep service_role's existing defaults intact.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated;
-- PostgreSQL grants PUBLIC EXECUTE globally by default: a per-schema REVOKE
-- cannot override that. Only future functions created by postgres are affected.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

COMMIT;
