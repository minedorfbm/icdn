-- Retain both accommodation records and their related content, but remove
-- their cards from the public hub until they are intentionally republished.
UPDATE public.destinations
SET active = false
WHERE id IN ('penthouses', 'rooms') AND active;
