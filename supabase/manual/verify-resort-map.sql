-- Expect 24 anchors and 33 total links (32 visible anonymously); a hidden reception link exists for editors only.
SELECT 'map_places' AS content, count(*) FROM public.map_places
UNION ALL SELECT 'map_destination_links', count(*) FROM public.map_destination_links;
-- Should return no rows. Every anchor level follows its primary editorial location.
SELECT p.id, p.level_id, d.id AS destination, d.level_id AS hub_level
FROM public.map_places p JOIN public.map_destination_links l ON l.place_id=p.id AND l.display_order=0
JOIN public.destinations d ON d.id=l.destination_id WHERE p.level_id<>d.level_id;
SELECT tablename, policyname, roles, cmd FROM pg_policies WHERE schemaname='public' AND tablename IN ('map_places','map_destination_links');
