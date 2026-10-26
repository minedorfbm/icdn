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

DO $seed$
DECLARE
 places_seed CONSTANT jsonb := $json$
[
  {"id":"sports-centre","name":"Sports Centre","level_id":"heaven","pin":1,"x":972.9,"y":854.6,"zoom":1.85,"active":true,"links":[{"destination_id":"sports-centre","display_order":0,"is_primary":true,"active":true}]},
  {"id":"summit","name":"The Summit","level_id":"heaven","pin":2,"x":883.5,"y":670.1,"zoom":1.85,"active":true,"links":[{"destination_id":"the-summit","display_order":0,"is_primary":true,"active":true}]},
  {"id":"carpark-apec","name":"APEC Sculpture Garden","level_id":"heaven","pin":3,"x":829.5,"y":562.7,"zoom":1.72,"active":true,"links":[{"destination_id":"apec-garden","display_order":0,"is_primary":true,"active":true}]},
  {"id":"lobby","name":"Reception Lobby","level_id":"heaven","pin":4,"x":748.2,"y":522.8,"zoom":1.95,"active":true,"links":[{"destination_id":"reception","display_order":0,"is_primary":true,"active":true}]},
  {"id":"club-lounge","name":"Club InterContinental Lounge","level_id":"heaven","pin":5,"x":770.7,"y":497,"zoom":1.72,"active":true,"links":[{"destination_id":"club-lounge","display_order":0,"is_primary":true,"active":true}]},
  {"id":"nam-tram","name":"Nam Tram","level_id":"heaven","pin":6,"x":735,"y":477.2,"zoom":2,"active":true,"links":[{"destination_id":"nam-tram","display_order":0,"is_primary":true,"active":true}]},
  {"id":"moulin-rouge","name":"Moulin Rouge Karaoke Club","level_id":"heaven","pin":7,"x":704.4,"y":478.7,"zoom":1.72,"active":true,"links":[{"destination_id":"moulin-rouge","display_order":0,"is_primary":true,"active":true}]},
  {"id":"citron","name":"Citron","level_id":"heaven","pin":8,"x":670.8,"y":477.5,"zoom":2.05,"active":true,"links":[{"destination_id":"citron","display_order":0,"is_primary":true,"active":true}]},
  {"id":"tingara","name":"Tingara","level_id":"sky","pin":9,"x":636.9,"y":462.8,"zoom":1.72,"active":true,"links":[{"destination_id":"tingara","display_order":0,"is_primary":true,"active":true}]},
  {"id":"relaxation-pavilion","name":"Relaxation Pavilion","level_id":"heaven","pin":10,"x":238.8,"y":146,"zoom":1.8,"active":true,"links":[{"destination_id":"relaxation-pavilion","display_order":0,"is_primary":true,"active":true}]},
  {"id":"heritage-village","name":"BENSLEY Outsider Gallery","level_id":"sky","pin":11,"x":707.1,"y":407.9,"zoom":2,"active":true,"links":[{"destination_id":"heritage-village","display_order":0,"is_primary":true,"active":true},{"destination_id":"bensley-gallery","display_order":1,"is_primary":true,"active":true},{"destination_id":"sammys","display_order":2,"is_primary":true,"active":true}]},
  {"id":"la-maison-1888","name":"La Maison 1888","level_id":"sky","pin":12,"x":721.8,"y":373.7,"zoom":2,"active":true,"links":[{"destination_id":"la-maison-1888","display_order":0,"is_primary":true,"active":true},{"destination_id":"buffalo-bar","display_order":1,"is_primary":true,"active":true},{"destination_id":"wine-cellar","display_order":2,"is_primary":true,"active":true}]},
  {"id":"terra-mare","name":"Terra Mare","level_id":"earth","pin":13,"x":744.9,"y":297.5,"zoom":2,"active":true,"links":[{"destination_id":"terra-mare","display_order":0,"is_primary":true,"active":true}]},
  {"id":"garden-pool","name":"Garden Pool & Jacuzzi","level_id":"earth","pin":14,"x":813.9,"y":291.5,"zoom":1.72,"active":true,"links":[{"destination_id":"garden-jacuzzi","display_order":0,"is_primary":true,"active":true},{"destination_id":"kids-pool","display_order":1,"is_primary":true,"active":true}]},
  {"id":"nail-hair-studio","name":"The Nail & Hair Studio","level_id":"sea","pin":15,"x":794.1,"y":324.2,"zoom":1.72,"active":true,"links":[{"destination_id":"nail-hair","display_order":0,"is_primary":true,"active":true}]},
  {"id":"mi-sol-reception","name":"Mi Sol Spa · Reception","level_id":"sea","pin":16,"x":817.8,"y":330.8,"zoom":1.72,"active":true,"links":[{"destination_id":"mi-sol-spa","display_order":0,"is_primary":false,"active":true}]},
  {"id":"long-bar","name":"L_O_N_G Bar & Pool","level_id":"earth","pin":17,"x":882.6,"y":303.8,"zoom":2,"active":true,"links":[{"destination_id":"long-bar","display_order":0,"is_primary":true,"active":true},{"destination_id":"long-pool","display_order":1,"is_primary":true,"active":true},{"destination_id":"soar-gym","display_order":2,"is_primary":true,"active":true},{"destination_id":"planet-trekkers","display_order":3,"is_primary":true,"active":true}]},
  {"id":"beach-activity-centre","name":"Beach Activity Centre","level_id":"sea","pin":18,"x":957.6,"y":244.7,"zoom":1.72,"active":true,"links":[{"destination_id":"marine-centre","display_order":0,"is_primary":true,"active":true}]},
  {"id":"yoga-pavilion","name":"Yoga Pavilion","level_id":"sea","pin":19,"x":996.3,"y":203.9,"zoom":1.72,"active":true,"links":[{"destination_id":"yoga-pavilion","display_order":0,"is_primary":true,"active":true}]},
  {"id":"organic-garden","name":"Nursery & Organic Garden","level_id":"earth","pin":20,"x":953.7,"y":329.9,"zoom":1.72,"active":true,"links":[{"destination_id":"organic-garden","display_order":0,"is_primary":true,"active":true},{"destination_id":"nursery","display_order":1,"is_primary":true,"active":true}]},
  {"id":"spirit-house","name":"Spirit House","level_id":"earth","pin":21,"x":990.3,"y":308,"zoom":1.72,"active":true,"links":[{"destination_id":"dia-tang","display_order":0,"is_primary":true,"active":true}]},
  {"id":"mi-sol-lagoon","name":"Mi Sol Spa & Wellness","level_id":"sea","pin":22,"x":1077.9,"y":379.4,"zoom":1.9,"active":true,"links":[{"destination_id":"mi-sol-spa","display_order":0,"is_primary":true,"active":true}]},
  {"id":"wall-of-lanterns","name":"Wall of Lanterns","level_id":"earth","pin":23,"x":808.5,"y":357.8,"zoom":2,"active":true,"links":[{"destination_id":"wall-of-lanterns","display_order":0,"is_primary":true,"active":true}]},
  {"id":"coconut-beach","name":"Coconut Beach","level_id":"sea","pin":24,"x":996,"y":184.4,"zoom":1.8,"active":true,"links":[{"destination_id":"coconut-beach","display_order":0,"is_primary":true,"active":true}]}
]
$json$::jsonb;
BEGIN
 INSERT INTO public.map_places (id, name, level_id, pin, x, y, zoom, active)
 SELECT id, name, level_id, pin, x, y, zoom, active
 FROM jsonb_to_recordset(places_seed) AS p(id text, name text, level_id text, pin integer, x double precision, y double precision, zoom double precision, active boolean)
 ON CONFLICT DO NOTHING;

 INSERT INTO public.map_destination_links (place_id, destination_id, display_order, is_primary, active)
 SELECT p->>'id', l.destination_id, l.display_order, l.is_primary, l.active
 FROM jsonb_array_elements(places_seed) AS p
 CROSS JOIN LATERAL jsonb_to_recordset(p->'links') AS l(destination_id text, display_order integer, is_primary boolean, active boolean)
 ON CONFLICT DO NOTHING;
END
$seed$;

COMMENT ON TABLE public.map_places IS 'Illustrated spatial anchors. No GPS or room-level positioning. Editorial content belongs to destinations.';
COMMENT ON TABLE public.map_destination_links IS 'Explicit many-to-many associations. Hidden destinations are never publicly exposed.';
