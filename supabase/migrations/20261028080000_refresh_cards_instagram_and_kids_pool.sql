-- User-selected content refresh, 28 October 2026.
-- Archive replaced Instagram associations; preserve disabled/restricted posts.
-- Swap the existing optimized Kids Pool images without re-encoding or uploads.
BEGIN;
DO $refresh$
DECLARE
  card jsonb;
  post jsonb;
  current_codes text[];
  old_codes text[];
  new_codes text[];
  existing_id uuid;
  position integer;
BEGIN
  FOR card IN SELECT value FROM jsonb_array_elements($selection$[{"destination":"the-summit","before":["DV-RiYhjqfR"],"posts":[{"code":"De4FTUOF1p_","url":"https://www.instagram.com/p/De4FTUOF1p_/","account":null,"date":null},{"code":"De33jQOCJnk","url":"https://www.instagram.com/p/De33jQOCJnk/","account":null,"date":null}]},{"destination":"reception","before":["C_cqjLcsoGL","DVK4hyuGYI2"],"posts":[{"code":"De4FTUOF1p_","url":"https://www.instagram.com/p/De4FTUOF1p_/","account":null,"date":null},{"code":"De33jQOCJnk","url":"https://www.instagram.com/p/De33jQOCJnk/","account":null,"date":null}]},{"destination":"la-maison-1888","before":["DbNEUtJiSro","DdVfCTwFhaw","DdBZAppDyR5","DTkauDdEt51"],"posts":[{"code":"De8RMgAD51E","url":"https://www.instagram.com/p/De8RMgAD51E/","account":null,"date":null},{"code":"DbNEUtJiSro","url":"https://www.instagram.com/p/DbNEUtJiSro/","account":null,"date":null},{"code":"DdVfCTwFhaw","url":"https://www.instagram.com/p/DdVfCTwFhaw/","account":null,"date":null},{"code":"DdBZAppDyR5","url":"https://www.instagram.com/p/DdBZAppDyR5/","account":null,"date":null}]},{"destination":"mi-sol-spa","before":["DKG_o52sB3l","DbZ43WrnKAG","DMuQbvapZMP","DL4Lxeotfvi","DGcGc3mMi4-"],"posts":[{"code":"De6jNPGHWBY","url":"https://www.instagram.com/p/De6jNPGHWBY/","account":null,"date":null},{"code":"DKG_o52sB3l","url":"https://www.instagram.com/reel/DKG_o52sB3l/","account":null,"date":null},{"code":"DbZ43WrnKAG","url":"https://www.instagram.com/p/DbZ43WrnKAG/","account":null,"date":null},{"code":"DMuQbvapZMP","url":"https://www.instagram.com/p/DMuQbvapZMP/","account":null,"date":null},{"code":"DL4Lxeotfvi","url":"https://www.instagram.com/p/DL4Lxeotfvi/","account":null,"date":null}]},{"destination":"moulin-rouge","before":["DBipQdVRn8F"],"posts":[{"code":"DfBhhlvAGem","url":"https://www.instagram.com/intercontinentaldanang/reel/DfBhhlvAGem/","account":null,"date":null}]}]$selection$::jsonb)
  LOOP
    PERFORM 1 FROM public.destinations WHERE id=card->>'destination' AND active FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Missing active card: %',card->>'destination'; END IF;
    PERFORM 1 FROM public.destination_posts WHERE destination_id=card->>'destination' FOR UPDATE;
    SELECT array_agg((regexp_match(post_url,'/(?:p|reel|reels)/([A-Za-z0-9_-]+)(?:/|[?]|$)'))[1] ORDER BY display_order,id)
      INTO current_codes FROM public.destination_posts WHERE destination_id=card->>'destination' AND active;
    SELECT array_agg(value ORDER BY ord) INTO old_codes FROM jsonb_array_elements_text(card->'before') WITH ORDINALITY AS t(value,ord);
    SELECT array_agg(value->>'code' ORDER BY ord) INTO new_codes FROM jsonb_array_elements(card->'posts') WITH ORDINALITY AS t(value,ord);
    IF current_codes IS NOT DISTINCT FROM new_codes THEN CONTINUE; END IF;
    IF current_codes IS DISTINCT FROM old_codes THEN RAISE EXCEPTION 'Instagram selection changed since review: %',card->>'destination'; END IF;
    IF cardinality(new_codes)>5 THEN RAISE EXCEPTION 'Too many posts'; END IF;
    IF EXISTS(SELECT 1 FROM public.destination_posts WHERE destination_id=card->>'destination'
      GROUP BY (regexp_match(post_url,'/(?:p|reel|reels)/([A-Za-z0-9_-]+)(?:/|[?]|$)'))[1] HAVING count(*)>1)
      THEN RAISE EXCEPTION 'Duplicate shortcode: %',card->>'destination'; END IF;
    UPDATE public.destination_posts SET active=false WHERE destination_id=card->>'destination' AND active
      AND NOT ((regexp_match(post_url,'/(?:p|reel|reels)/([A-Za-z0-9_-]+)(?:/|[?]|$)'))[1]=ANY(new_codes));
    position:=0;
    FOR post IN SELECT value FROM jsonb_array_elements(card->'posts') LOOP
      SELECT id INTO existing_id FROM public.destination_posts WHERE destination_id=card->>'destination'
        AND (regexp_match(post_url,'/(?:p|reel|reels)/([A-Za-z0-9_-]+)(?:/|[?]|$)'))[1]=post->>'code';
      IF existing_id IS NULL THEN
        INSERT INTO public.destination_posts(destination_id,post_url,account,posted_at,display_order,active)
        VALUES(card->>'destination',post->>'url',post->>'account',(post->>'date')::date,position,true);
      ELSE
        UPDATE public.destination_posts SET display_order=position,active=true WHERE id=existing_id
          AND (display_order IS DISTINCT FROM position OR NOT active);
      END IF;
      position:=position+1;
    END LOOP;
  END LOOP;
END;
$refresh$;
DO $kids$
DECLARE current_card record;
BEGIN
 SELECT image_key, detail_image_key INTO STRICT current_card FROM public.destinations WHERE id='kids-pool' AND active FOR UPDATE;
 IF current_card.image_key = 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/adj-bb9752c8607d0136d5c9a276-native.webp' AND current_card.detail_image_key = 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/adj-1b52a248131ca61b697083a8-native.webp' THEN RETURN; END IF;
 -- Fresh installations still carry the reviewed September source URLs.
 -- Publish the same final bucket pair there; never overwrite an unknown CMS edit.
 IF current_card.image_key = 'https://www.danang.intercontinental.com/wp-content/uploads/2025/08/Pool-Friends-scaled.jpg'
    AND current_card.detail_image_key = 'https://www.danang.intercontinental.com/wp-content/uploads/2022/03/ICDN-Resort-Pool-with-family-scaled-1.jpg' THEN
   UPDATE public.destinations SET
     image_key='https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/adj-bb9752c8607d0136d5c9a276-native.webp',
     detail_image_key='https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/adj-1b52a248131ca61b697083a8-native.webp'
   WHERE id='kids-pool';
   RETURN;
 END IF;
 IF current_card.image_key IS DISTINCT FROM 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/adj-1b52a248131ca61b697083a8-native.webp' OR current_card.detail_image_key IS DISTINCT FROM 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/adj-bb9752c8607d0136d5c9a276-native.webp' THEN RAISE EXCEPTION 'Kids Pool photos changed since review'; END IF;
 UPDATE public.destinations SET image_key=detail_image_key, detail_image_key=image_key WHERE id='kids-pool';
END;
$kids$;
COMMIT;
