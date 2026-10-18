-- Owner-selected first images. The versioned JPEG is delivered with the site.
-- Preserve both detail images and all other card content.
BEGIN;
DO $photos$
DECLARE
  previous_instagram constant text := 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/instagram-spots-home-8755d08eef.webp';
  previous_lobby constant text := 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/lobby-home-1f49ee3645a5.webp';
  new_instagram constant text := '/images/instagram-spots-home-b9f70907d92f.jpg';
  current_instagram text;
  current_lobby text;
BEGIN
  SELECT image_key INTO STRICT current_instagram FROM public.destinations WHERE id='instagram-spots' FOR UPDATE;
  SELECT image_key INTO STRICT current_lobby FROM public.destinations WHERE id='reception' FOR UPDATE;
  IF current_instagram IS NULL OR current_instagram NOT IN (previous_instagram,new_instagram)
    OR current_lobby IS NULL OR current_lobby NOT IN (previous_lobby,previous_instagram) THEN
    RAISE EXCEPTION 'First images have changed; review before replacing';
  END IF;
  UPDATE public.destinations SET image_key=previous_instagram
    WHERE id='reception' AND image_key=previous_lobby;
  UPDATE public.destinations SET image_key=new_instagram
    WHERE id='instagram-spots' AND image_key=previous_instagram;
END;
$photos$;
COMMIT;
