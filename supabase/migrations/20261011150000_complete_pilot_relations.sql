-- Extend the pilot using existing catalogue cards; retain Maison's Wine Cellar relation.
INSERT INTO public.destination_relations (
  destination_id, related_destination_id, display_order, active
) VALUES
  ('buffalo-bar', 'la-maison-1888', 1, true),
  ('long-bar', 'long-pool', 0, true),
  ('mi-sol-spa', 'spa-lagoon-villas', 0, true)
ON CONFLICT (destination_id, related_destination_id)
DO UPDATE SET active = EXCLUDED.active;
