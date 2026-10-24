-- A focused public card snapshot keeps the complete catalogue out of initial card HTML.
-- Explicit columns, publication guard and SECURITY INVOKER preserve the existing RLS boundary.
BEGIN;
CREATE OR REPLACE FUNCTION public.published_hub_destination_card_v1(requested_destination_id text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $card$
SELECT jsonb_build_object(
  'destination', (
    SELECT to_jsonb(row)
    FROM (
      SELECT
        id, name, level_id, cluster, type, short_description, detail_description, search_keywords,
        primary_link_id, links_heading, video_heading, instagram_heading, heading_translations, image_key,
        image_position, detail_image_key, content_kind, content_family, audience_tags, offer_duration,
        offer_starts_on, offer_ends_on, storytelling_scope, minimum_age, maximum_age, instagram_spot,
        display_order, active
      FROM public.destinations WHERE active AND id = requested_destination_id ORDER BY display_order
    ) AS row
  ),

  'links', (
    SELECT coalesce(jsonb_agg(to_jsonb(row)), '[]'::jsonb)
    FROM (
      SELECT id, destination_id, kind, label, benefits_id, url, display_order
      FROM public.destination_links WHERE active AND destination_id = requested_destination_id ORDER BY display_order
    ) AS row
  ),

  'events', (
    SELECT coalesce(jsonb_agg(to_jsonb(row)), '[]'::jsonb)
    FROM (
      SELECT id, destination_id, title, schedule, description, url, display_order
      FROM public.published_destination_events WHERE active AND destination_id = requested_destination_id ORDER BY display_order
    ) AS row
  ),

  'mapPlaces', (
    SELECT coalesce(jsonb_agg(to_jsonb(row)), '[]'::jsonb)
    FROM (
      SELECT accommodation_group, covered_levels, room_numbers, id, name, level_id, pin, x, y, zoom, active
      FROM public.map_places WHERE active AND id IN (SELECT place_id FROM public.map_destination_links WHERE active AND destination_id = requested_destination_id) ORDER BY pin
    ) AS row
  ),

  'mapLinks', (
    SELECT coalesce(jsonb_agg(to_jsonb(row)), '[]'::jsonb)
    FROM (
      SELECT place_id, destination_id, display_order, is_primary, active
      FROM public.map_destination_links WHERE active AND destination_id = requested_destination_id ORDER BY display_order
    ) AS row
  ),

  'linkTranslations', (
    SELECT coalesce(jsonb_agg(to_jsonb(row)), '[]'::jsonb)
    FROM (
      SELECT locale, url, source_url, link_id
      FROM public.destination_link_translations WHERE active AND link_id IN (SELECT id FROM public.destination_links WHERE active AND destination_id = requested_destination_id)
    ) AS row
  ),

  'editorial', jsonb_build_object(
    'descriptions', (
    SELECT coalesce(jsonb_agg(to_jsonb(row)), '[]'::jsonb)
    FROM (
      SELECT destination_id, locale, description, source_description, detail_description, source_detail_description
      FROM public.destination_translations WHERE published AND destination_id = requested_destination_id
    ) AS row
  ),
    'events', (
    SELECT coalesce(jsonb_agg(to_jsonb(row)), '[]'::jsonb)
    FROM (
      SELECT event_id, locale, title, schedule, description, source_title, source_schedule, source_description
      FROM public.event_translations WHERE published AND event_id IN (SELECT id FROM public.published_destination_events WHERE active AND destination_id = requested_destination_id)
    ) AS row
  )
  )
)
WHERE EXISTS (SELECT 1 FROM public.destinations WHERE id = requested_destination_id AND active);
$card$;
REVOKE ALL ON FUNCTION public.published_hub_destination_card_v1(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.published_hub_destination_card_v1(text) TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
