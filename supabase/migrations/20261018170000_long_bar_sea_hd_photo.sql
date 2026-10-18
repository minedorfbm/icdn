-- Owner-confirmed Sea level and owner-selected first photograph.
-- The official Instagram guide also places Long Pool at Sea, above Long Bar:
-- https://www.danang.intercontinental.com/top-instagrammable-spots/
-- Soar Gym and Planet Trekkers are confirmed at Sea in Resort Information:
-- https://www.danang.intercontinental.com/resort-information/
-- Upload the versioned WebP to hub-images before applying this migration.
BEGIN;

DO $long_bar$
DECLARE
  card record;
  linked_card record;
  place record;
  old_image constant text := 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/long-bar-home-3868d323bd49.webp';
  new_image constant text := 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/long-bar-home-8b4aeefdc714.webp';
BEGIN
  SELECT active, level_id, image_key INTO STRICT card
  FROM public.destinations WHERE id = 'long-bar' FOR UPDATE;
  SELECT active, level_id INTO STRICT place
  FROM public.map_places WHERE id = 'long-bar' FOR UPDATE;

  IF card.active IS DISTINCT FROM true
    OR card.level_id IS NULL OR card.level_id NOT IN ('earth', 'sea')
    OR card.image_key IS NULL OR card.image_key NOT IN (old_image, new_image)
    OR place.active IS DISTINCT FROM true
    OR place.level_id IS NULL OR place.level_id NOT IN ('earth', 'sea')
  THEN
    RAISE EXCEPTION 'Long Bar changed since the level and photo were reviewed';
  END IF;

  IF (SELECT count(*) FROM public.destinations
      WHERE id IN ('long-pool', 'soar-gym', 'planet-trekkers')) <> 3 THEN
    RAISE EXCEPTION 'A reviewed Sea level card is missing';
  END IF;
  FOR linked_card IN
    SELECT id, active, level_id FROM public.destinations
    WHERE id IN ('long-pool', 'soar-gym', 'planet-trekkers') FOR UPDATE
  LOOP
    IF linked_card.active IS DISTINCT FROM true
      OR linked_card.level_id IS NULL OR linked_card.level_id NOT IN ('earth', 'sea') THEN
      RAISE EXCEPTION 'Sea level card % changed since review', linked_card.id;
    END IF;
  END LOOP;

  UPDATE public.destinations
  SET level_id = 'sea', image_key = new_image
  WHERE id = 'long-bar'
    AND (level_id IS DISTINCT FROM 'sea' OR image_key IS DISTINCT FROM new_image);

  UPDATE public.destinations
  SET level_id = 'sea'
  WHERE id IN ('long-pool', 'soar-gym', 'planet-trekkers') AND level_id IS DISTINCT FROM 'sea';

  -- Keep the shared point, coordinates and all its destination associations.
  UPDATE public.map_places
  SET level_id = 'sea'
  WHERE id = 'long-bar' AND level_id IS DISTINCT FROM 'sea';
END $long_bar$;

COMMIT;
