-- External-media audit, 16 October 2026. Preserve posts and make fallback reversible.
BEGIN;
ALTER TABLE public.destination_posts ADD COLUMN IF NOT EXISTS embed_mode text
  NOT NULL DEFAULT 'embed' CHECK (embed_mode IN ('embed', 'link'));
COMMENT ON COLUMN public.destination_posts.embed_mode IS
  'embed: official Instagram player; link: direct post card when the provider cannot embed it.';

-- These five publications still exist, but their official embeds fail outside the hub too.
-- Limit the change to the six associations verified in the audit.
UPDATE public.destination_posts p SET embed_mode = 'link'
FROM (VALUES
  ('b-lounge', 'DGwwT3cCPE5'),
  ('buffalo-bar', 'DL9jFzytrOp'),
  ('la-maison-1888', 'DdQWW42D91g'),
  ('wine-cellar', 'DdQWW42D91g'),
  ('wine-cellar', 'DFfKmy2O0Bt'),
  ('wine-cellar', 'DMPkp9hM_nP')
) AS audited(destination_id, shortcode)
WHERE p.destination_id = audited.destination_id AND p.active
  AND (regexp_match(p.post_url, '/(?:p|reel|reels)/([A-Za-z0-9_-]+)(?:/|[?]|$)'))[1] = audited.shortcode;

DO $corrections$
DECLARE
  old_post public.destination_posts%ROWTYPE;
  replacement public.destination_posts%ROWTYPE;
  schedule public.destination_links%ROWTYPE;
  old_code CONSTANT text := 'Dc2etiKCC_C';
  new_code CONSTANT text := 'DTkauDdEt51';
  old_pdf CONSTANT text := 'https://www.danang.intercontinental.com/wp-content/uploads/2026/09/Your-Guide-to-Fun-Green-Season.pdf';
  new_pdf CONSTANT text := 'https://www.danang.intercontinental.com/wp-content/uploads/2026/08/Your-Guide-to-Fun-at-InterContinental-Danang.pdf';
BEGIN
  -- Serialize replacement against another editor touching this destination.
  PERFORM 1 FROM public.destinations WHERE id = 'la-maison-1888' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'La Maison destination missing'; END IF;
  BEGIN
    SELECT * INTO STRICT old_post FROM public.destination_posts
    WHERE destination_id = 'la-maison-1888'
      AND (regexp_match(post_url, '/(?:p|reel|reels)/([A-Za-z0-9_-]+)(?:/|[?]|$)'))[1] = old_code
    FOR UPDATE;
  EXCEPTION WHEN no_data_found THEN NULL;
  END;
  BEGIN
    SELECT * INTO STRICT replacement FROM public.destination_posts
    WHERE destination_id = 'la-maison-1888'
      AND (regexp_match(post_url, '/(?:p|reel|reels)/([A-Za-z0-9_-]+)(?:/|[?]|$)'))[1] = new_code
    FOR UPDATE;
  EXCEPTION WHEN no_data_found THEN NULL;
  END;
  IF old_post.active THEN
    UPDATE public.destination_posts SET active = false WHERE id = old_post.id;
    IF replacement.id IS NULL THEN
      INSERT INTO public.destination_posts(destination_id, post_url, account, display_order, active)
      VALUES ('la-maison-1888', 'https://www.instagram.com/p/' || new_code || '/', 'lamaison1888', old_post.display_order, true);
    ELSE
      UPDATE public.destination_posts SET active = true, embed_mode = 'embed', display_order = old_post.display_order
      WHERE id = replacement.id;
    END IF;
  ELSIF replacement.active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'La Maison posts changed since audit; stop rather than overwrite';
  END IF;

  -- Official Recreation page currently links this document; the old file returns 404.
  SELECT * INTO STRICT schedule FROM public.destination_links
  WHERE destination_id = 'things-to-do' AND kind = 'DAILY_SCHEDULE' AND active FOR UPDATE;
  IF schedule.url NOT IN (old_pdf, new_pdf) THEN
    RAISE EXCEPTION 'Things to Do schedule changed since audit';
  END IF;
  UPDATE public.destination_links SET url = new_pdf WHERE id = schedule.id AND url = old_pdf;
END;
$corrections$;

-- Empty settings are not rendered by the footer. Retain the setting for later correction.
UPDATE public.site_settings SET value = '' WHERE key = 'x' AND value = 'https://x.com/ICdanang';
COMMIT;
