-- Keep Seaside Experiences as the single public card for beach activities.
-- Preserve official map point 18 and redirect its card association; do not move it.
BEGIN;

DO $$
BEGIN
  PERFORM id FROM public.destinations
  WHERE id IN ('marine-centre', 'sea-experiences') ORDER BY id FOR UPDATE;
  IF NOT EXISTS (SELECT 1 FROM public.destinations WHERE id = 'marine-centre') THEN
    RETURN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.destinations WHERE id = 'sea-experiences' AND active) THEN
    RAISE EXCEPTION 'Seaside Experiences must remain active before removing the duplicate';
  END IF;

  -- Stop if content has been added since the removal was reviewed.
  IF EXISTS (SELECT 1 FROM public.destination_photos WHERE destination_id = 'marine-centre')
     OR EXISTS (SELECT 1 FROM public.destination_events WHERE destination_id = 'marine-centre')
     OR EXISTS (SELECT 1 FROM public.destination_videos WHERE destination_id = 'marine-centre')
     OR EXISTS (SELECT 1 FROM public.destination_opening_hours WHERE destination_id = 'marine-centre')
     OR EXISTS (SELECT 1 FROM public.destination_notices WHERE destination_id = 'marine-centre')
     OR EXISTS (SELECT 1 FROM public.destination_notice_links WHERE destination_id = 'marine-centre')
     OR EXISTS (SELECT 1 FROM public.destination_relations
                WHERE destination_id = 'marine-centre' OR related_destination_id = 'marine-centre') THEN
    RAISE EXCEPTION 'Beach Activity Centre has new content: review before deletion';
  END IF;

  IF (SELECT count(*) FROM public.destination_posts WHERE destination_id = 'marine-centre') <> 1
     OR NOT EXISTS (
       SELECT 1 FROM public.destination_posts old_post
       JOIN public.destination_posts kept_post ON kept_post.destination_id = 'sea-experiences'
         AND kept_post.active
         AND (regexp_match(kept_post.post_url, '/(?:p|reel|reels)/([A-Za-z0-9_-]+)(?:/|[?]|$)'))[1] = 'Dc2etiKCC_C'
       WHERE old_post.destination_id = 'marine-centre'
         AND (regexp_match(old_post.post_url, '/(?:p|reel|reels)/([A-Za-z0-9_-]+)(?:/|[?]|$)'))[1] = 'Dc2etiKCC_C'
     ) THEN
    RAISE EXCEPTION 'The Beach Activity Centre Instagram post must remain on Seaside Experiences';
  END IF;

  IF (SELECT count(*) FROM public.destination_links WHERE destination_id = 'marine-centre') <> 1
     OR NOT EXISTS (
       SELECT 1 FROM public.destination_links WHERE destination_id = 'marine-centre'
         AND kind = 'DISCOVER' AND url IN (
           'https://www.danang.intercontinental.com/recreation/beach-water-sports/',
           'https://www.danang.intercontinental.com/' -- Original seed value on a fresh database.
         )
     ) THEN
    RAISE EXCEPTION 'Beach Activity Centre links changed since review';
  END IF;

  IF (SELECT count(*) FROM public.map_destination_links WHERE destination_id = 'marine-centre') <> 1
     OR NOT EXISTS (
       SELECT 1 FROM public.map_destination_links WHERE destination_id = 'marine-centre'
         AND place_id = 'beach-activity-centre' AND active AND is_primary
     ) OR EXISTS (SELECT 1 FROM public.map_destination_links WHERE destination_id = 'sea-experiences') THEN
    RAISE EXCEPTION 'Beach activity map associations changed since review';
  END IF;

  UPDATE public.map_destination_links SET destination_id = 'sea-experiences'
  WHERE destination_id = 'marine-centre' AND place_id = 'beach-activity-centre';
  DELETE FROM public.destination_posts WHERE destination_id = 'marine-centre';
  -- Its five localized DISCOVER variants cascade with this card's sole link.
  DELETE FROM public.destination_links WHERE destination_id = 'marine-centre';
  DELETE FROM public.destination_translations WHERE destination_id = 'marine-centre';
  DELETE FROM public.destinations WHERE id = 'marine-centre';
END;
$$;

COMMIT;
