-- Small, editable visitor collections within the four existing Nam Tram levels.
-- Keep level_id, category/type and all destination content unchanged.
BEGIN;

-- Register new collections before assigning destinations: the integrity trigger
-- checks each destination against its level's clusters.
UPDATE public.levels SET clusters = ARRAY['STAY', 'DISCOVER', 'GATHER', 'WELLNESS']
WHERE id = 'heaven';

UPDATE public.levels SET clusters = ARRAY['DINE', 'DISCOVER']
WHERE id = 'sky';

-- PLAY remains temporarily while existing Earth destinations are reassigned.
UPDATE public.levels SET clusters = ARRAY['EAT', 'MOVE', 'FAMILY', 'DISCOVER', 'PLAY']
WHERE id = 'earth';

UPDATE public.levels SET clusters = ARRAY['WELLNESS', 'BEACH', 'DISCOVER']
WHERE id = 'sea';

UPDATE public.destinations AS d
SET cluster = collection.cluster
FROM (VALUES
  ('enchanted-holiday', 'STAY'),
  ('club-lounge', 'STAY'),
  ('ihg-one-rewards', 'STAY'),
  ('bensley-package', 'STAY'),
  ('penthouses', 'STAY'),
  ('rooms', 'STAY'),
  ('reception', 'DISCOVER'),
  ('instagram-spots', 'DISCOVER'),
  ('the-summit', 'DISCOVER'),
  ('apec-garden', 'DISCOVER'),
  ('nam-tram', 'DISCOVER'),
  ('information', 'DISCOVER'),
  ('weddings', 'GATHER'),
  ('moulin-rouge', 'GATHER'),
  ('citron', 'GATHER'),
  ('sports-centre', 'WELLNESS'),
  ('relaxation-pavilion', 'WELLNESS'),
  ('la-maison-1888', 'DINE'),
  ('buffalo-bar', 'DINE'),
  ('wine-cellar', 'DINE'),
  ('tingara', 'DINE'),
  ('heritage-village', 'DISCOVER'),
  ('bensley-gallery', 'DISCOVER'),
  ('kate-mccoy', 'DISCOVER'),
  ('sammys', 'DISCOVER'),
  ('planet-trekkers', 'FAMILY'),
  ('family-pool', 'FAMILY'),
  ('kids-pool', 'FAMILY'),
  ('garden-jacuzzi', 'FAMILY'),
  ('nursery', 'FAMILY'),
  ('wall-of-lanterns', 'DISCOVER'),
  ('organic-garden', 'DISCOVER'),
  ('dia-tang', 'DISCOVER'),
  ('mi-sol-spa', 'WELLNESS'),
  ('nail-hair', 'WELLNESS'),
  ('spa-lagoon-villas', 'WELLNESS'),
  ('yoga-pavilion', 'WELLNESS'),
  ('coconut-beach', 'BEACH'),
  ('family-beach', 'BEACH'),
  ('club-beach', 'BEACH'),
  ('marine-centre', 'DISCOVER'),
  ('sea-experiences', 'DISCOVER')
) AS collection(id, cluster)
WHERE d.id = collection.id AND d.cluster IS DISTINCT FROM collection.cluster;

-- Existing EAT/MOVE places keep their assignment. Retain PLAY only if an
-- editor has added an unlisted destination to it since this migration was made.
UPDATE public.levels SET clusters = ARRAY['EAT', 'MOVE', 'FAMILY', 'DISCOVER']
WHERE id = 'earth'
  AND NOT EXISTS (
    SELECT 1 FROM public.destinations
    WHERE level_id = 'earth' AND cluster = 'PLAY'
  );

COMMIT;
