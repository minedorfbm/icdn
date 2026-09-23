-- The original seed predates the editorial catalog. Align a fresh preview
-- database without overwriting edited production rows.
BEGIN;

INSERT INTO public.destinations
  (id, name, level_id, cluster, type, short_description, image_key, display_order)
VALUES
  ('bensley-package', 'The Bensley Design Discovery Package', 'heaven', NULL, 'experience', 'Two nights in the Heavenly Penthouse, a private Design Tour, Champagne art viewing at the Bensley Outsider Gallery and Heavenly Afternoon Tea.', 'offer-bensley', 3),
  ('moulin-rouge', 'Moulin Rouge Karaoke Club', 'heaven', NULL, 'experience', 'Sing the night away with family and friends in a playful private club.', 'd-bar', 15),
  ('relaxation-pavilion', 'Relaxation Pavilion', 'heaven', NULL, 'experience', 'A quiet lookout above the bay — the resort''s highest place to simply sit and breathe.', 'd-gallery', 16),
  ('instagram-spots', 'Top 9 Instagram Spots', 'heaven', NULL, 'experience', 'The nine most photographed places of the resort, from the Reception Hall to Coconut Beach.', 'g-terrace-detail', 6),
  ('wall-of-lanterns', 'Wall of Lanterns', 'earth', 'PLAY', 'experience', 'A glowing wall of Hoi An lanterns on the way down to the pools — one of the resort''s signature photo spots.', 'g-architecture-detail', 11),
  ('ihg-one-rewards', 'IHG One Rewards', 'heaven', NULL, 'service', 'The loyalty programme of IHG Hotels & Resorts — earn and enjoy worldwide.', 'ihg-rewards', 2),
  ('enchanted-holiday', 'Enchanted Holiday Escape', 'heaven', NULL, 'experience', 'Christmas 2026 — a festive stay with daily breakfast, Afternoon Tea, celebratory drinks and Charles''s nature discovery trail.', 'offer-enchanted', 0),
  ('weddings', 'Weddings & Celebrations', 'heaven', NULL, 'experience', 'Say ''I do'' above the bay — beachfront ceremonies, bespoke receptions and honeymoon moments crafted by our wedding specialists.', 'offer-wedding', 4)
ON CONFLICT (id) DO NOTHING;

UPDATE public.destinations SET active = false
WHERE id = 'm-club' AND active;

-- Change only original seed text. Later editorial changes remain untouched.
UPDATE public.destinations AS d
SET short_description = v.description
FROM (VALUES
  ('reception', 'Arrival at the highest point of the resort.', 'Reception Lobby, Concierge and Executive Office — arrival at the highest point of the resort.'),
  ('the-summit', 'Events and ceremonies in the clouds.', 'The Summit Conference Centre, the Auditorium-Cinema and M Club — gatherings, screenings and celebrations.'),
  ('sports-centre', 'Tennis and mountaintop play.', 'Tennis and pickleball courts, football pitch and mountaintop play.'),
  ('bensley-gallery', 'The world of the resort''s architect.', 'Bold, colourful paintings by Bill Bensley, the architect behind the resort — with Kate McCoy''s high-end diamond jewelry. Open Wed–Sun.'),
  ('marine-centre', 'Explore the bay.', 'Water sports and guided activities along the shoreline.')
) AS v(id, old_description, description)
WHERE d.id = v.id AND d.short_description = v.old_description;

COMMIT;
