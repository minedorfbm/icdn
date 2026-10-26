-- Use the same three collections throughout the hub, including inactive
-- records so a future republication cannot bring back a retired label.
BEGIN;

-- Register the new keys before reassigning destinations. Both integrity
-- triggers remain enabled during the transition.
UPDATE public.levels
SET clusters = ARRAY(
  SELECT DISTINCT key
  FROM unnest(clusters || ARRAY['DINING', 'WELLNESS', 'EXPERIENCES']) AS entries(key)
);

UPDATE public.destinations
SET cluster = CASE
  WHEN type IN ('restaurant', 'bar') OR id = 'club-lounge' THEN 'DINING'
  WHEN type IN ('spa', 'fitness', 'pool', 'beach')
    OR id IN ('relaxation-pavilion', 'nail-hair', 'spa-lagoon-villas', 'yoga-pavilion')
    THEN 'WELLNESS'
  ELSE 'EXPERIENCES'
END;

UPDATE public.destinations
SET active = false
WHERE id IN ('reception', 'information') AND active;

-- Empty collections stay configured for editors; the hub displays only
-- collections containing active destinations.
UPDATE public.levels
SET clusters = ARRAY['DINING', 'WELLNESS', 'EXPERIENCES'];

COMMIT;
