-- Put the selected Reel first; preserve the existing holiday post second.
-- Canonical /reel/ permalink and embed mode use the existing Instagram player.
BEGIN;
DO $holiday$
DECLARE
  current_urls text[];
  reel_url constant text := 'https://www.instagram.com/reel/DfKKVDtkWKZ/';
  previous_url constant text := 'https://www.instagram.com/p/DcupMNcgQjF/';
BEGIN
  PERFORM 1 FROM public.destinations WHERE id='enchanted-holiday' AND active FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing active Enchanted Holiday card'; END IF;
  PERFORM 1 FROM public.destination_posts WHERE destination_id='enchanted-holiday' FOR UPDATE;
  SELECT array_agg(post_url ORDER BY display_order,id) INTO current_urls
    FROM public.destination_posts WHERE destination_id='enchanted-holiday' AND active;
  IF current_urls IS NOT DISTINCT FROM ARRAY[reel_url,previous_url] THEN RETURN; END IF;
  IF current_urls IS DISTINCT FROM ARRAY[previous_url] THEN
    RAISE EXCEPTION 'Enchanted Holiday Instagram selection changed since review';
  END IF;
  IF EXISTS (SELECT 1 FROM public.destination_posts WHERE destination_id='enchanted-holiday'
    AND (regexp_match(post_url,'/(?:p|reel|reels)/([A-Za-z0-9_-]+)(?:/|[?]|$)'))[1]='DfKKVDtkWKZ') THEN
    RAISE EXCEPTION 'Review the existing or disabled Holiday Reel before publishing';
  END IF;
  UPDATE public.destination_posts SET display_order=1
    WHERE destination_id='enchanted-holiday' AND active AND post_url=previous_url;
  INSERT INTO public.destination_posts(destination_id,post_url,embed_mode,display_order,active)
    VALUES('enchanted-holiday',reel_url,'embed',0,true);
END;
$holiday$;
COMMIT;
