-- Owner-approved editorial allocation of cross-resort offers and guides.
-- Physical destinations and every map place/link remain unchanged.
BEGIN;

UPDATE public.destinations AS d
SET level_id = allocation.level_id
FROM (VALUES
  ('bensley-package', 'sky'),
  ('design-digital-tour', 'sky'),
  ('instagram-spots', 'sky'),
  ('ihg-one-rewards', 'sky'),
  ('experience-more', 'sky'),
  ('hoi-an-digital-tour', 'earth'),
  ('shuttle', 'earth'),
  ('weddings', 'sea'),
  ('enchanted-holiday', 'sea'),
  ('nguoi-dan-loi', 'sea'),
  ('club-intercontinental', 'sea'),
  ('culinary-activities', 'sea')
) AS allocation(id, level_id)
WHERE d.id = allocation.id
  AND d.active
  AND d.cluster = 'EXPERIENCES'
  AND d.level_id = 'heaven'
  AND NOT EXISTS (
    SELECT 1 FROM public.map_destination_links AS link
    WHERE link.destination_id = d.id
  );

UPDATE public.destinations AS d
SET display_order = ordering.display_order
FROM (VALUES
  ('citron', 'heaven', 1),
  ('club-lounge', 'heaven', 2),
  ('terra-mare', 'sea', 1),
  ('long-bar', 'sea', 2),
  ('b-lounge', 'sea', 3)
) AS ordering(id, level_id, display_order)
WHERE d.id = ordering.id AND d.level_id = ordering.level_id
  AND d.cluster = 'DINING' AND d.active
  AND d.display_order IS DISTINCT FROM ordering.display_order;

COMMIT;
