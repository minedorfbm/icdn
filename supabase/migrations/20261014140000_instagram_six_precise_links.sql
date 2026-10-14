-- Additional user-selected Instagram posts, from instagram_nouveaux_6_liens_precis.csv.
-- Preserve existing active posts and their order. Append only the supplied complements.
-- Canonical post/reel URLs omit the account prefix; account and supplied publication date are retained.
BEGIN;
DO $posts$
DECLARE selection jsonb := $data$[
  {
    "destination_id": "experience-more",
    "post_url": "https://www.instagram.com/reel/DFuv4IwON2d/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/reel/DFuv4IwON2d/",
    "shortcode": "DFuv4IwON2d",
    "account": "intercontinentaldanang",
    "posted_at": "2025-02-06",
    "display_order": 0
  },
  {
    "destination_id": "one-bedroom-seaside-villa-by-the-beach",
    "post_url": "https://www.instagram.com/p/Dd8suoBl5Fm/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/p/Dd8suoBl5Fm/",
    "shortcode": "Dd8suoBl5Fm",
    "account": "intercontinentaldanang",
    "posted_at": "2026-10-01",
    "display_order": 0
  },
  {
    "destination_id": "one-bedroom-seaside-villa-on-the-rocks",
    "post_url": "https://www.instagram.com/reel/DX8adF0CZk6/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/reel/DX8adF0CZk6/",
    "shortcode": "DX8adF0CZk6",
    "account": "intercontinentaldanang",
    "posted_at": "2026-05-04",
    "display_order": 0
  },
  {
    "destination_id": "penthouses",
    "post_url": "https://www.instagram.com/reel/C4KD70gqR7x/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/reel/C4KD70gqR7x/",
    "shortcode": "C4KD70gqR7x",
    "account": "intercontinentaldanang",
    "posted_at": "2024-03-05",
    "display_order": 0
  },
  {
    "destination_id": "three-bedroom-sun-peninsula-residence",
    "post_url": "https://www.instagram.com/p/DXLhalpjBu_/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/p/DXLhalpjBu_/",
    "shortcode": "DXLhalpjBu_",
    "account": "intercontinentaldanang",
    "posted_at": "2026-04-15",
    "display_order": 0
  },
  {
    "destination_id": "two-bedroom-sun-peninsula-residence",
    "post_url": "https://www.instagram.com/p/DQeKpAuj-U6/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/p/DQeKpAuj-U6/",
    "shortcode": "DQeKpAuj-U6",
    "account": "intercontinentaldanang",
    "posted_at": "2025-10-31",
    "display_order": 0
  }
]$data$::jsonb;
 r jsonb; candidate uuid; actual record; matches integer; expected integer;
BEGIN
 FOR r IN SELECT value FROM jsonb_array_elements(selection) LOOP
  PERFORM 1 FROM public.destinations WHERE id=r->>'destination_id' AND active FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Instagram destination missing: %',r->>'destination_id'; END IF;
  SELECT count(*),min(p.id::text)::uuid INTO matches,candidate FROM public.destination_posts p
  WHERE p.destination_id=r->>'destination_id' AND (regexp_match(p.post_url,'/(?:p|reel|reels)/([A-Za-z0-9_-]+)(?:/|[?]|$)'))[1]=r->>'shortcode';
  IF matches>1 THEN RAISE EXCEPTION 'Duplicate existing shortcode for %',r->>'destination_id'; END IF;
  IF candidate IS NOT NULL THEN
   SELECT * INTO actual FROM public.destination_posts WHERE id=candidate FOR UPDATE;
   IF actual.active THEN
    -- A current equivalent post already fulfils this request. Preserve its editorial metadata.
    CONTINUE;
   END IF;
  END IF;
  SELECT count(*) INTO expected FROM public.destination_posts WHERE destination_id=r->>'destination_id' AND active;
  IF expected>=5 THEN RAISE EXCEPTION 'Instagram carousel full: %',r->>'destination_id'; END IF;
  IF EXISTS(SELECT 1 FROM public.destination_posts WHERE destination_id=r->>'destination_id' AND active AND display_order=(r->>'display_order')::integer) THEN
   RAISE EXCEPTION 'Instagram order changed since selection: %',r->>'destination_id';
  END IF;
  IF candidate IS NULL THEN
   INSERT INTO public.destination_posts(destination_id,post_url,account,posted_at,display_order,active)
   VALUES(r->>'destination_id',r->>'post_url',r->>'account',(r->>'posted_at')::date,(r->>'display_order')::integer,true);
  ELSE
   UPDATE public.destination_posts SET post_url=r->>'post_url',account=r->>'account',posted_at=(r->>'posted_at')::date,display_order=(r->>'display_order')::integer,active=true WHERE id=candidate;
  END IF;
 END LOOP;
END;
$posts$;
COMMIT;
