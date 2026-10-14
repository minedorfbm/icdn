-- Additional user-selected Instagram posts, from instagram_complements_uniquement.csv.
-- Preserve existing active posts and their order. Append only the supplied complements.
-- Canonical post/reel URLs omit the account prefix; account and supplied publication date are retained.
BEGIN;
DO $posts$
DECLARE selection jsonb := $data$[
  {
    "destination_id": "buffalo-bar",
    "post_url": "https://www.instagram.com/p/DWVctcvjsCi/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/p/DWVctcvjsCi/",
    "shortcode": "DWVctcvjsCi",
    "account": "intercontinentaldanang",
    "posted_at": "2026-03-25",
    "display_order": 2
  },
  {
    "destination_id": "club-intercontinental",
    "post_url": "https://www.instagram.com/p/DdA4qqgHDkM/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/p/DdA4qqgHDkM/",
    "shortcode": "DdA4qqgHDkM",
    "account": "intercontinentaldanang",
    "posted_at": "2026-09-07",
    "display_order": 0
  },
  {
    "destination_id": "club-intercontinental",
    "post_url": "https://www.instagram.com/p/DbXUFkkjG8Z/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/p/DbXUFkkjG8Z/",
    "shortcode": "DbXUFkkjG8Z",
    "account": "intercontinentaldanang",
    "posted_at": "2026-07-28",
    "display_order": 1
  },
  {
    "destination_id": "club-intercontinental",
    "post_url": "https://www.instagram.com/p/DYhB_mGGVvV/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/p/DYhB_mGGVvV/",
    "shortcode": "DYhB_mGGVvV",
    "account": "intercontinentaldanang",
    "posted_at": "2026-05-19",
    "display_order": 2
  },
  {
    "destination_id": "club-intercontinental",
    "post_url": "https://www.instagram.com/p/DYRC3XoEgvF/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/p/DYRC3XoEgvF/",
    "shortcode": "DYRC3XoEgvF",
    "account": "intercontinentaldanang",
    "posted_at": "2026-05-12",
    "display_order": 3
  },
  {
    "destination_id": "club-intercontinental",
    "post_url": "https://www.instagram.com/p/DUSLS6-jhnz/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/p/DUSLS6-jhnz/",
    "shortcode": "DUSLS6-jhnz",
    "account": "intercontinentaldanang",
    "posted_at": "2026-02-02",
    "display_order": 4
  },
  {
    "destination_id": "design-digital-tour",
    "post_url": "https://www.instagram.com/p/DcDFnE1ETps/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/p/DcDFnE1ETps/",
    "shortcode": "DcDFnE1ETps",
    "account": "intercontinentaldanang",
    "posted_at": "2026-08-14",
    "display_order": 0
  },
  {
    "destination_id": "design-digital-tour",
    "post_url": "https://www.instagram.com/p/DNAcxe1siwR/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/p/DNAcxe1siwR/",
    "shortcode": "DNAcxe1siwR",
    "account": "intercontinentaldanang",
    "posted_at": "2025-08-06",
    "display_order": 1
  },
  {
    "destination_id": "family-beach",
    "post_url": "https://www.instagram.com/p/DbpqNAmian-/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/p/DbpqNAmian-/",
    "shortcode": "DbpqNAmian-",
    "account": "intercontinentaldanang",
    "posted_at": "2026-08-05",
    "display_order": 1
  },
  {
    "destination_id": "four-bedroom-pool-villa",
    "post_url": "https://www.instagram.com/p/DXBOObXlq50/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/p/DXBOObXlq50/",
    "shortcode": "DXBOObXlq50",
    "account": "intercontinentaldanang",
    "posted_at": "2026-04-11",
    "display_order": 0
  },
  {
    "destination_id": "garden-jacuzzi",
    "post_url": "https://www.instagram.com/reel/DdTZJ5wCSSr/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/reel/DdTZJ5wCSSr/",
    "shortcode": "DdTZJ5wCSSr",
    "account": "intercontinentaldanang",
    "posted_at": "2026-09-15",
    "display_order": 1
  },
  {
    "destination_id": "long-bar",
    "post_url": "https://www.instagram.com/p/Dd_YYuejI_1/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/p/Dd_YYuejI_1/",
    "shortcode": "Dd_YYuejI_1",
    "account": "intercontinentaldanang",
    "posted_at": "2026-10-02",
    "display_order": 3
  },
  {
    "destination_id": "long-pool",
    "post_url": "https://www.instagram.com/p/Dd_YYuejI_1/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/p/Dd_YYuejI_1/",
    "shortcode": "Dd_YYuejI_1",
    "account": "intercontinentaldanang",
    "posted_at": "2026-10-02",
    "display_order": 2
  },
  {
    "destination_id": "nguoi-dan-loi",
    "post_url": "https://www.instagram.com/p/DebwlcyjHoh/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/p/DebwlcyjHoh/",
    "shortcode": "DebwlcyjHoh",
    "account": "intercontinentaldanang",
    "posted_at": "2026-10-13",
    "display_order": 4
  },
  {
    "destination_id": "planet-trekkers",
    "post_url": "https://www.instagram.com/p/DHlCvobMi0U/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/p/DHlCvobMi0U/",
    "shortcode": "DHlCvobMi0U",
    "account": "intercontinentaldanang",
    "posted_at": "2025-03-24",
    "display_order": 2
  },
  {
    "destination_id": "shuttle",
    "post_url": "https://www.instagram.com/p/DcN-iGPG9SL/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/p/DcN-iGPG9SL/",
    "shortcode": "DcN-iGPG9SL",
    "account": "intercontinentaldanang",
    "posted_at": "2026-08-19",
    "display_order": 0
  },
  {
    "destination_id": "shuttle",
    "post_url": "https://www.instagram.com/p/DXHEb_vklaa/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/p/DXHEb_vklaa/",
    "shortcode": "DXHEb_vklaa",
    "account": "intercontinentaldanang",
    "posted_at": "2026-04-14",
    "display_order": 1
  },
  {
    "destination_id": "shuttle",
    "post_url": "https://www.instagram.com/p/DS4U64tEvZu/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/p/DS4U64tEvZu/",
    "shortcode": "DS4U64tEvZu",
    "account": "intercontinentaldanang",
    "posted_at": "2025-12-30",
    "display_order": 2
  },
  {
    "destination_id": "summit-conference-centre",
    "post_url": "https://www.instagram.com/p/DX_BUO2js_a/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/p/DX_BUO2js_a/",
    "shortcode": "DX_BUO2js_a",
    "account": "intercontinentaldanang",
    "posted_at": "2026-05-05",
    "display_order": 1
  },
  {
    "destination_id": "three-bedroom-bai-bac-bay-villa",
    "post_url": "https://www.instagram.com/p/DbXUFkkjG8Z/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/p/DbXUFkkjG8Z/",
    "shortcode": "DbXUFkkjG8Z",
    "account": "intercontinentaldanang",
    "posted_at": "2026-07-28",
    "display_order": 0
  },
  {
    "destination_id": "two-bedroom-royal-residence-by-the-sea",
    "post_url": "https://www.instagram.com/p/DebwlcyjHoh/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/p/DebwlcyjHoh/",
    "shortcode": "DebwlcyjHoh",
    "account": "intercontinentaldanang",
    "posted_at": "2026-10-13",
    "display_order": 0
  },
  {
    "destination_id": "two-bedroom-seaside-villa-on-the-rocks",
    "post_url": "https://www.instagram.com/p/DVu0y0EDkfZ/",
    "source_url": "https://www.instagram.com/intercontinentaldanang/p/DVu0y0EDkfZ/",
    "shortcode": "DVu0y0EDkfZ",
    "account": "intercontinentaldanang",
    "posted_at": "2026-03-10",
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
