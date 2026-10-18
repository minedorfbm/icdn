-- Terra Mare is beside the beach at Sea Level in the official design tour:
-- https://www.danang.intercontinental.com/bensley-digital-design-tour/
-- Owner-selected Six-Bedroom photographs: image 1 for previews, image 2 for the expanded cover.
-- Storage uploads must exist before applying this migration. No frontend deployment is needed.
BEGIN;

UPDATE public.destinations
SET level_id = 'sea'
WHERE id = 'terra-mare' AND level_id = 'earth';

UPDATE public.map_places
SET level_id = 'sea'
WHERE id = 'terra-mare' AND level_id = 'earth';

DO $photos$
DECLARE
  current_card record;
  old_image constant text := 'https://i.ytimg.com/vi/iMZ7Y1VwVRk/hqdefault.jpg';
  home_image constant text := 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/six-bedroom-sun-peninsula-residence-home-b8d0ac42065f.webp';
  detail_image constant text := 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/six-bedroom-sun-peninsula-residence-detail-5f8bd3a18dff.webp';
BEGIN
  SELECT image_key, detail_image_key, active INTO current_card
  FROM public.destinations
  WHERE id = 'six-bedroom-sun-peninsula-residence'
  FOR UPDATE;

  -- This card was added directly to the live catalogue. A fresh seed may not contain it.
  IF FOUND THEN
    IF NOT current_card.active
      OR current_card.image_key IS NULL
      OR current_card.detail_image_key IS NULL
      OR current_card.image_key NOT IN (old_image, home_image)
      OR current_card.detail_image_key NOT IN (old_image, detail_image)
    THEN
      RAISE EXCEPTION 'Six-Bedroom card changed since photo selection';
    END IF;

    UPDATE public.destinations
    SET image_key = home_image, detail_image_key = detail_image
    WHERE id = 'six-bedroom-sun-peninsula-residence'
      AND (image_key IS DISTINCT FROM home_image OR detail_image_key IS DISTINCT FROM detail_image);
  END IF;
END $photos$;
COMMIT;
