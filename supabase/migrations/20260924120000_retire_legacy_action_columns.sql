-- SECOND STAGE ONLY: run after the Worker no longer selects legacy URL columns,
-- and after reviewing the four generic Discover placeholders listed below.
-- Never include this file in the first production SQL Editor batch.
BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.destinations d
    CROSS JOIN LATERAL (VALUES
      ('DISCOVER', d.discover_url),
      ('MENU', d.menu_url),
      ('BOOK', d.booking_url),
      ('INSTAGRAM', d.instagram_url),
      ('PRICE_LIST', d.price_list_url),
      ('BREAKFAST_MENU', d.breakfast_menu_url),
      ('LUNCH_MENU', d.lunch_menu_url),
      ('DINNER_MENU', d.dinner_menu_url),
      ('VEGETARIAN_MENU', d.vegetarian_menu_url),
      ('VEGAN_MENU', d.vegan_menu_url)
    ) old_link(kind, url)
    WHERE old_link.url IS NOT NULL
      AND trim(old_link.url) <> ''
      AND NOT (
        d.id IN ('instagram-spots', 'moulin-rouge',
                 'relaxation-pavilion', 'wall-of-lanterns')
        AND old_link.kind = 'DISCOVER'
        AND old_link.url = 'https://www.danang.intercontinental.com/'
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.destination_links l
        WHERE l.destination_id = d.id
          AND l.kind::text = old_link.kind
          AND l.url = old_link.url
          AND l.active
      )
  ) THEN
    RAISE EXCEPTION 'Legacy action URLs lack an active equivalent in destination_links';
  END IF;
END;
$$;

ALTER TABLE public.destinations
  DROP COLUMN discover_url,
  DROP COLUMN menu_url,
  DROP COLUMN booking_url,
  DROP COLUMN instagram_url,
  DROP COLUMN price_list_url,
  DROP COLUMN breakfast_menu_url,
  DROP COLUMN lunch_menu_url,
  DROP COLUMN dinner_menu_url,
  DROP COLUMN vegetarian_menu_url,
  DROP COLUMN vegan_menu_url;

COMMIT;
