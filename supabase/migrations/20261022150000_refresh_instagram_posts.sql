-- User-selected Instagram refresh, 22 October 2026.
-- Archive replaced associations; never delete posts or change unrelated cards.
-- Explicit replacements: Tingara DacyZ2QikyL; Terra Mare DSB8x9pju-n and DbF7usRH_D7;
-- Culinary Activities DYGvsklD3iG; Bensley DQ_Z9yyEVPU (five-post limit).
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
  FOR card IN SELECT value FROM jsonb_array_elements($selection$[{"destination":"bensley-gallery","before":["DUzfo7tElRz","DQ_Z9yyEVPU"],"posts":[{"code":"DZKVG-zPM0E","url":"https://www.instagram.com/p/DZKVG-zPM0E/","account":null,"date":null},{"code":"DYo76WKIRlI","url":"https://www.instagram.com/p/DYo76WKIRlI/","account":null,"date":null},{"code":"DYj8LFcPLnG","url":"https://www.instagram.com/p/DYj8LFcPLnG/","account":null,"date":null},{"code":"DNSY9YGOs8H","url":"https://www.instagram.com/p/DNSY9YGOs8H/","account":null,"date":null},{"code":"DUzfo7tElRz","url":"https://www.instagram.com/p/DUzfo7tElRz/","account":null,"date":null}]},{"destination":"tingara","before":["DacyZ2QikyL","DcnsxRtIKsB","DdBh39ajzn4","Db4krZyE8PC","DawmyZUEyFn"],"posts":[{"code":"DewW7hxl6tm","url":"https://www.instagram.com/p/DewW7hxl6tm/","account":"intercontinentaldanang","date":"2026-10-21"},{"code":"DcnsxRtIKsB","url":"https://www.instagram.com/p/DcnsxRtIKsB/","account":null,"date":null},{"code":"DdBh39ajzn4","url":"https://www.instagram.com/p/DdBh39ajzn4/","account":null,"date":null},{"code":"Db4krZyE8PC","url":"https://www.instagram.com/p/Db4krZyE8PC/","account":null,"date":null},{"code":"DawmyZUEyFn","url":"https://www.instagram.com/p/DawmyZUEyFn/","account":null,"date":null}]},{"destination":"terra-mare","before":["DSB8x9pju-n","DdfyVTEDXvl","DcfaVaxm2h0","DbF7usRH_D7"],"posts":[{"code":"DetrRZ0lm8O","url":"https://www.instagram.com/p/DetrRZ0lm8O/","account":"intercontinentaldanang","date":"2026-10-20"},{"code":"DegsZRPFZKb","url":"https://www.instagram.com/reel/DegsZRPFZKb/","account":"intercontinentaldanang","date":"2026-10-15"},{"code":"DdfyVTEDXvl","url":"https://www.instagram.com/p/DdfyVTEDXvl/","account":null,"date":null},{"code":"DcfaVaxm2h0","url":"https://www.instagram.com/p/DcfaVaxm2h0/","account":null,"date":null}]},{"destination":"culinary-activities","before":["DYGvsklD3iG"],"posts":[{"code":"Del810GFy6C","url":"https://www.instagram.com/p/Del810GFy6C/","account":"intercontinentaldanang","date":"2026-10-17"}]}]$selection$::jsonb)
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
COMMIT;
