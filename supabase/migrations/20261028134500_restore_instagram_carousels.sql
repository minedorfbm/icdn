-- Keep the October additions first, then restore only the associations archived
-- by 20261028080000 while staying at five embeds per affected card.
-- Previously restricted/disabled posts remain untouched. No rows are deleted.
BEGIN;
DO $restore$
DECLARE
  card jsonb;
  current_codes text[];
  before_codes text[];
  desired_codes text[];
  code text;
  position integer;
  selected_post public.destination_posts%ROWTYPE;
BEGIN
  FOR card IN SELECT value FROM jsonb_array_elements($selection$[
    {"destination":"the-summit","before":["De4FTUOF1p_","De33jQOCJnk"],
     "posts":["De4FTUOF1p_","De33jQOCJnk","DV-RiYhjqfR"]},
    {"destination":"reception","before":["De4FTUOF1p_","De33jQOCJnk"],
     "posts":["De4FTUOF1p_","De33jQOCJnk","C_cqjLcsoGL","DVK4hyuGYI2"]},
    {"destination":"la-maison-1888","before":["De8RMgAD51E","DbNEUtJiSro","DdVfCTwFhaw","DdBZAppDyR5"],
     "posts":["De8RMgAD51E","DbNEUtJiSro","DdVfCTwFhaw","DdBZAppDyR5","DTkauDdEt51"]},
    {"destination":"mi-sol-spa","before":["De6jNPGHWBY","DKG_o52sB3l","DbZ43WrnKAG","DMuQbvapZMP","DL4Lxeotfvi"],
     "posts":["De6jNPGHWBY","DKG_o52sB3l","DbZ43WrnKAG","DMuQbvapZMP","DL4Lxeotfvi"]},
    {"destination":"moulin-rouge","before":["DfBhhlvAGem"],
     "posts":["DfBhhlvAGem","DBipQdVRn8F"]}
  ]$selection$::jsonb)
  LOOP
    PERFORM 1 FROM public.destinations WHERE id=card->>'destination' AND active FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Missing active card: %',card->>'destination'; END IF;
    PERFORM 1 FROM public.destination_posts WHERE destination_id=card->>'destination' FOR UPDATE;
    SELECT array_agg((regexp_match(post_url,'/(?:p|reel|reels)/([A-Za-z0-9_-]+)(?:/|[?]|$)'))[1] ORDER BY display_order,id)
      INTO current_codes FROM public.destination_posts WHERE destination_id=card->>'destination' AND active;
    SELECT array_agg(value ORDER BY ord) INTO before_codes
      FROM jsonb_array_elements_text(card->'before') WITH ORDINALITY AS t(value,ord);
    SELECT array_agg(value ORDER BY ord) INTO desired_codes
      FROM jsonb_array_elements_text(card->'posts') WITH ORDINALITY AS t(value,ord);
    IF current_codes IS NOT DISTINCT FROM desired_codes THEN CONTINUE; END IF;
    IF current_codes IS DISTINCT FROM before_codes THEN
      RAISE EXCEPTION 'Instagram selection changed since restoration review: %',card->>'destination';
    END IF;
    IF cardinality(desired_codes)>5 THEN RAISE EXCEPTION 'Too many Instagram embeds'; END IF;
    position:=0;
    FOREACH code IN ARRAY desired_codes LOOP
      SELECT * INTO STRICT selected_post FROM public.destination_posts
        WHERE destination_id=card->>'destination'
        AND (regexp_match(post_url,'/(?:p|reel|reels)/([A-Za-z0-9_-]+)(?:/|[?]|$)'))[1]=code;
      IF selected_post.embed_mode IS DISTINCT FROM 'embed' THEN
        RAISE EXCEPTION 'Do not restore a restricted Instagram post: %',code;
      END IF;
      UPDATE public.destination_posts SET active=true, display_order=position,
        post_url=CASE WHEN code='DfBhhlvAGem' THEN 'https://www.instagram.com/reel/DfBhhlvAGem/' ELSE post_url END
        WHERE id=selected_post.id AND (NOT active OR display_order IS DISTINCT FROM position
          OR (code='DfBhhlvAGem' AND post_url IS DISTINCT FROM 'https://www.instagram.com/reel/DfBhhlvAGem/'));
      position:=position+1;
    END LOOP;
  END LOOP;
END;
$restore$;
COMMIT;
