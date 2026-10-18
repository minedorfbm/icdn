-- The resort's September 2025 highlights locate B Lounge on Barefoot's outdoor
-- deck at Sea Level. Only the card's level changes; map coordinates are untouched.
-- https://www.danang.intercontinental.com/wp-content/uploads/2025/09/IC-Danang-Resort-Highlights-EN-0925.pdf
BEGIN;
UPDATE public.destinations
SET level_id = 'sea'
WHERE id = 'b-lounge' AND level_id = 'earth';
COMMIT;
