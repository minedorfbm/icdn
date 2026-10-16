-- Four user-selected additions from instagram_things_to_do_4_ajouts.csv.
-- Append to Things to Do only; preserve existing posts and their metadata.
BEGIN;
DO $posts$
DECLARE
  selected record;
  matches integer;
  next_order integer;
BEGIN
  PERFORM 1 FROM public.destinations WHERE id = 'things-to-do' AND active FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Things to Do must exist and be active';
  END IF;

  FOR selected IN
    SELECT * FROM (VALUES
      (1, 'DeB5v5MjKSV', 'https://www.instagram.com/p/DeB5v5MjKSV/', DATE '2026-10-03'),
      (2, 'DThay1Lksbj', 'https://www.instagram.com/p/DThay1Lksbj/', DATE '2026-01-14'),
      (3, 'DQOWKlCj7-M', 'https://www.instagram.com/p/DQOWKlCj7-M/', DATE '2025-10-25'),
      (4, 'DLrapcEP3SQ', 'https://www.instagram.com/reel/DLrapcEP3SQ/', DATE '2025-07-04')
    ) AS selection(rank, shortcode, post_url, posted_at)
    ORDER BY rank
  LOOP
    SELECT count(*) INTO matches FROM public.destination_posts
    WHERE destination_id = 'things-to-do'
      AND (regexp_match(post_url, '/(?:p|reel|reels)/([A-Za-z0-9_-]+)(?:/|[?]|$)'))[1] = selected.shortcode;
    IF matches > 1 THEN
      RAISE EXCEPTION 'Duplicate existing Instagram shortcode: %', selected.shortcode;
    ELSIF matches = 1 THEN
      -- Skip existing associations, including inactive ones, without changing editorial choices.
      CONTINUE;
    END IF;

    IF (SELECT count(*) FROM public.destination_posts WHERE destination_id = 'things-to-do' AND active) >= 5 THEN
      RAISE EXCEPTION 'Things to Do Instagram carousel is already full';
    END IF;
    SELECT COALESCE(max(display_order), -1) + 1 INTO next_order
    FROM public.destination_posts WHERE destination_id = 'things-to-do';

    INSERT INTO public.destination_posts(destination_id, post_url, account, posted_at, display_order, active)
    VALUES ('things-to-do', selected.post_url, 'intercontinentaldanang', selected.posted_at, next_order, true);
  END LOOP;
END;
$posts$;
COMMIT;
