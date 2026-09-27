-- Spatial anchors from adj-interactive-resort-map, registered to the illustrated plan.
-- The hub's Supabase destinations remain the editorial and level reference.
CREATE TABLE IF NOT EXISTS public.map_places (
 id text PRIMARY KEY,
 name text NOT NULL CHECK (length(btrim(name)) > 0),
 level_id text NOT NULL REFERENCES public.levels(id),
 pin integer NOT NULL UNIQUE CHECK (pin > 0),
 x double precision NOT NULL CHECK (x BETWEEN -100 AND 1600),
 y double precision NOT NULL CHECK (y BETWEEN -100 AND 1200),
 zoom double precision NOT NULL DEFAULT 1.8 CHECK (zoom BETWEEN 1 AND 4.2),
 active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.map_destination_links (
 place_id text NOT NULL REFERENCES public.map_places(id) ON DELETE CASCADE,
 destination_id text NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
 display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
 is_primary boolean NOT NULL DEFAULT false,
 active boolean NOT NULL DEFAULT true,
 PRIMARY KEY (place_id, destination_id)
);
CREATE INDEX IF NOT EXISTS map_destination_links_destination_idx ON public.map_destination_links(destination_id);
CREATE UNIQUE INDEX IF NOT EXISTS map_destination_links_primary_idx ON public.map_destination_links(destination_id) WHERE is_primary AND active;
ALTER TABLE public.map_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_destination_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.map_places, public.map_destination_links FROM anon, authenticated;
GRANT SELECT ON public.map_places, public.map_destination_links TO anon, authenticated;
GRANT ALL ON public.map_places, public.map_destination_links TO service_role;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='map_places' AND policyname='Published map places are readable') THEN
  CREATE POLICY "Published map places are readable" ON public.map_places FOR SELECT TO anon, authenticated USING (active);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='map_destination_links' AND policyname='Published map links are readable') THEN
  CREATE POLICY "Published map links are readable" ON public.map_destination_links FOR SELECT TO anon, authenticated USING (active AND EXISTS (SELECT 1 FROM public.destinations d WHERE d.id=destination_id AND d.active) AND EXISTS (SELECT 1 FROM public.map_places p WHERE p.id=place_id AND p.active));
 END IF;
END $$;

INSERT INTO public.map_places (id, name, level_id, pin, x, y, zoom, active) VALUES
('sports-centre', 'Sports Centre', 'heaven', 1, 972.9, 854.6, 1.85, true),
('summit', 'The Summit', 'heaven', 2, 883.5, 670.1, 1.85, true),
('carpark-apec', 'APEC Sculpture Garden', 'heaven', 3, 829.5, 562.7, 1.72, true),
('lobby', 'Reception Lobby', 'heaven', 4, 748.2, 522.8, 1.95, true),
('club-lounge', 'Club InterContinental Lounge', 'heaven', 5, 770.7, 497, 1.72, true),
('nam-tram', 'Nam Tram', 'heaven', 6, 735, 477.2, 2, true),
('moulin-rouge', 'Moulin Rouge Karaoke Club', 'heaven', 7, 704.4, 478.7, 1.72, true),
('citron', 'Citron', 'heaven', 8, 670.8, 477.5, 2.05, true),
('tingara', 'Tingara', 'sky', 9, 636.9, 462.8, 1.72, true),
('relaxation-pavilion', 'Relaxation Pavilion', 'heaven', 10, 238.8, 146, 1.8, true),
('heritage-village', 'BENSLEY Outsider Gallery', 'sky', 11, 707.1, 407.9, 2, true),
('la-maison-1888', 'La Maison 1888', 'sky', 12, 721.8, 373.7, 2, true),
('terra-mare', 'Terra Mare', 'earth', 13, 744.9, 297.5, 2, true),
('garden-pool', 'Garden Pool & Jacuzzi', 'earth', 14, 813.9, 291.5, 1.72, true),
('nail-hair-studio', 'The Nail & Hair Studio', 'sea', 15, 794.1, 324.2, 1.72, true),
('mi-sol-reception', 'Mi Sol Spa · Reception', 'sea', 16, 817.8, 330.8, 1.72, true),
('long-bar', 'L_O_N_G Bar & Pool', 'earth', 17, 882.6, 303.8, 2, true),
('beach-activity-centre', 'Beach Activity Centre', 'sea', 18, 957.6, 244.7, 1.72, true),
('yoga-pavilion', 'Yoga Pavilion', 'sea', 19, 996.3, 203.9, 1.72, true),
('organic-garden', 'Nursery & Organic Garden', 'earth', 20, 953.7, 329.9, 1.72, true),
('spirit-house', 'Spirit House', 'earth', 21, 990.3, 308, 1.72, true),
('mi-sol-lagoon', 'Mi Sol Spa & Wellness', 'sea', 22, 1077.9, 379.4, 1.9, true),
('wall-of-lanterns', 'Wall of Lanterns', 'earth', 23, 808.5, 357.8, 2, true),
('coconut-beach', 'Coconut Beach', 'sea', 24, 996, 184.4, 1.8, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.map_destination_links (place_id, destination_id, display_order, is_primary, active) VALUES
('sports-centre', 'sports-centre', 0, true, true),
('summit', 'the-summit', 0, true, true),
('carpark-apec', 'apec-garden', 0, true, true),
('lobby', 'reception', 0, true, true),
('club-lounge', 'club-lounge', 0, true, true),
('nam-tram', 'nam-tram', 0, true, true),
('moulin-rouge', 'moulin-rouge', 0, true, true),
('citron', 'citron', 0, true, true),
('tingara', 'tingara', 0, true, true),
('relaxation-pavilion', 'relaxation-pavilion', 0, true, true),
('heritage-village', 'heritage-village', 0, true, true),
('heritage-village', 'bensley-gallery', 1, true, true),
('heritage-village', 'sammys', 2, true, true),
('la-maison-1888', 'la-maison-1888', 0, true, true),
('la-maison-1888', 'buffalo-bar', 1, true, true),
('la-maison-1888', 'wine-cellar', 2, true, true),
('terra-mare', 'terra-mare', 0, true, true),
('garden-pool', 'garden-jacuzzi', 0, true, true),
('garden-pool', 'kids-pool', 1, true, true),
('nail-hair-studio', 'nail-hair', 0, true, true),
('mi-sol-reception', 'mi-sol-spa', 0, false, true),
('long-bar', 'long-bar', 0, true, true),
('long-bar', 'long-pool', 1, true, true),
('long-bar', 'soar-gym', 2, true, true),
('long-bar', 'planet-trekkers', 3, true, true),
('beach-activity-centre', 'marine-centre', 0, true, true),
('yoga-pavilion', 'yoga-pavilion', 0, true, true),
('organic-garden', 'organic-garden', 0, true, true),
('organic-garden', 'nursery', 1, true, true),
('spirit-house', 'dia-tang', 0, true, true),
('mi-sol-lagoon', 'mi-sol-spa', 0, true, true),
('wall-of-lanterns', 'wall-of-lanterns', 0, true, true),
('coconut-beach', 'coconut-beach', 0, true, true)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.map_places IS 'Illustrated spatial anchors. No GPS or room-level positioning. Editorial content belongs to destinations.';
COMMENT ON TABLE public.map_destination_links IS 'Explicit many-to-many associations. Hidden destinations are never publicly exposed.';
