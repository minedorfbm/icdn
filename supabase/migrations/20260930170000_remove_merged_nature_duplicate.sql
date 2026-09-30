-- Nature Discovery Guide was merged into Nature. Keep unpublished rooms,
-- penthouses, reception and information desk for future editorial use.
BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.destinations WHERE id = 'nature-discovery-guide') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.destinations
      WHERE id = 'nature-discovery-guide' AND NOT active
    ) OR NOT EXISTS (
      SELECT 1 FROM public.destinations
      WHERE id = 'nature-experiences' AND active
    ) THEN
      RAISE EXCEPTION 'Nature merge is not complete';
    END IF;

    IF (SELECT count(*) FROM public.destination_links
        WHERE destination_id = 'nature-discovery-guide') <> 1
       OR NOT EXISTS (
         SELECT 1 FROM public.destination_links AS old_link
         JOIN public.destination_links AS nature_link
           ON nature_link.destination_id = 'nature-experiences'
          AND nature_link.kind = old_link.kind
          AND nature_link.url = old_link.url
          AND nature_link.active
         WHERE old_link.destination_id = 'nature-discovery-guide'
           AND old_link.kind = 'BROCHURE'::public.destination_link_type
       ) THEN
      RAISE EXCEPTION 'Nature Discovery PDF has not been preserved';
    END IF;

    IF EXISTS (
      SELECT locale FROM public.destination_translations
      WHERE destination_id = 'nature-discovery-guide' AND published
      EXCEPT
      SELECT locale FROM public.destination_translations
      WHERE destination_id = 'nature-experiences' AND published
    ) OR EXISTS (
      SELECT 1 FROM public.destination_link_translations AS translation
      JOIN public.destination_links AS link ON link.id = translation.link_id
      WHERE link.destination_id = 'nature-discovery-guide'
    ) THEN
      RAISE EXCEPTION 'Nature Discovery has translations that have not been preserved';
    END IF;

    IF EXISTS (SELECT 1 FROM public.destination_photos WHERE destination_id = 'nature-discovery-guide')
       OR EXISTS (SELECT 1 FROM public.destination_events WHERE destination_id = 'nature-discovery-guide')
       OR EXISTS (SELECT 1 FROM public.destination_posts WHERE destination_id = 'nature-discovery-guide')
       OR EXISTS (SELECT 1 FROM public.destination_videos WHERE destination_id = 'nature-discovery-guide')
       OR EXISTS (SELECT 1 FROM public.map_destination_links WHERE destination_id = 'nature-discovery-guide') THEN
      RAISE EXCEPTION 'Nature Discovery has content that has not been reviewed for migration';
    END IF;

    DELETE FROM public.destination_links WHERE destination_id = 'nature-discovery-guide';
    DELETE FROM public.destination_translations WHERE destination_id = 'nature-discovery-guide';
    DELETE FROM public.destinations WHERE id = 'nature-discovery-guide' AND NOT active;
  END IF;
END;
$$;

COMMIT;
