-- One read-only snapshot for an opened card. Existing RLS remains authoritative.
-- No content, policies, tables or Storage objects are changed.
BEGIN;

CREATE OR REPLACE FUNCTION public.published_hub_destination_media_v1(requested_destination_id text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $media$
SELECT CASE WHEN EXISTS (
  SELECT 1 FROM public.destinations WHERE id=requested_destination_id AND active
) THEN jsonb_build_object(
  'photos', (
    SELECT coalesce(jsonb_agg(to_jsonb(row)), '[]'::jsonb)
    FROM (
      SELECT destination_id, image_url, caption, post_url, display_order
      FROM public.destination_photos
      WHERE destination_id=requested_destination_id AND active ORDER BY display_order
    ) AS row
  ),
  'posts', (
    SELECT coalesce(jsonb_agg(to_jsonb(row)), '[]'::jsonb)
    FROM (
      SELECT destination_id, post_url, account, caption, image_url, posted_at, embed_mode, display_order
      FROM public.destination_posts
      WHERE destination_id=requested_destination_id AND active ORDER BY display_order
    ) AS row
  ),
  'videos', (
    SELECT coalesce(jsonb_agg(to_jsonb(row)), '[]'::jsonb)
    FROM (
      SELECT destination_id, video_url, title, title_translations, display_order
      FROM public.destination_videos
      WHERE destination_id=requested_destination_id AND active ORDER BY display_order
    ) AS row
  ),
  'hours', (
    SELECT coalesce(jsonb_agg(to_jsonb(row)), '[]'::jsonb)
    FROM (
      SELECT id, destination_id, service, days, opens_minutes, closes_minutes, last_order_minutes, display_order
      FROM public.destination_opening_hours
      WHERE destination_id=requested_destination_id AND published ORDER BY display_order
    ) AS row
  ),
  'notices', (
    SELECT coalesce(jsonb_agg(to_jsonb(row)), '[]'::jsonb)
    FROM (
      SELECT id, destination_id, kind, title, body, starts_at, ends_at, display_order, translations
      FROM public.published_destination_notices
      WHERE destination_id=requested_destination_id ORDER BY display_order
    ) AS row
  ),
  'collection', (
    SELECT coalesce(jsonb_agg(to_jsonb(row)), '[]'::jsonb)
    FROM (
      SELECT destination_id, key, target_destination_id, title, description, translations, display_order
      FROM public.destination_collection_items
      WHERE destination_id=requested_destination_id AND active ORDER BY display_order
    ) AS row
  )
) ELSE jsonb_build_object(
  'photos', '[]'::jsonb, 'posts', '[]'::jsonb, 'videos', '[]'::jsonb,
  'hours', '[]'::jsonb, 'notices', '[]'::jsonb, 'collection', '[]'::jsonb
) END;
$media$;

REVOKE ALL ON FUNCTION public.published_hub_destination_media_v1(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.published_hub_destination_media_v1(text) TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
