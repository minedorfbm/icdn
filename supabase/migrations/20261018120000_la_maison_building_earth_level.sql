-- Verified against the resort's official Bensley design tour and La Maison festival page:
-- https://www.danang.intercontinental.com/bensley-digital-design-tour/
-- https://www.danang.intercontinental.com/festival-signatures-at-la-maison-1888/
-- Earth is the permanent building location. Temporary dinner service at Heaven
-- remains a separate destination notice; no notices, media or coordinates are changed.
BEGIN;
UPDATE public.destinations
SET level_id = 'earth'
WHERE id IN ('la-maison-1888', 'buffalo-bar', 'wine-cellar') AND level_id = 'sky';

UPDATE public.map_places
SET level_id = 'earth'
WHERE id = 'la-maison-1888' AND level_id = 'sky';
COMMIT;
