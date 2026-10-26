CREATE TYPE public.destination_type AS ENUM (
  'restaurant','bar','spa','experience','pool','fitness','kids','retail','gallery','accommodation','service','beach','recreation'
);

CREATE TABLE public.levels (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  line TEXT NOT NULL,
  image_key TEXT,
  clusters TEXT[] NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.levels TO anon;
GRANT SELECT ON public.levels TO authenticated;
GRANT ALL ON public.levels TO service_role;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Levels are publicly readable" ON public.levels FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.destinations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level_id TEXT NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  cluster TEXT,
  type public.destination_type NOT NULL,
  short_description TEXT NOT NULL DEFAULT '',
  image_key TEXT,
  discover_url TEXT,
  menu_url TEXT,
  booking_url TEXT,
  instagram_url TEXT,
  booking_message TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX destinations_level_order_idx ON public.destinations (level_id, display_order);

GRANT SELECT ON public.destinations TO anon;
GRANT SELECT ON public.destinations TO authenticated;
GRANT ALL ON public.destinations TO service_role;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active destinations are publicly readable" ON public.destinations FOR SELECT TO anon, authenticated USING (active = true);

CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  label TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Site settings are publicly readable" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER levels_set_updated_at BEFORE UPDATE ON public.levels FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER destinations_set_updated_at BEFORE UPDATE ON public.destinations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER site_settings_set_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.levels (id, title, line, image_key, clusters, display_order) VALUES
  ('heaven','HEAVEN','Above the bay.','heaven','{}',1),
  ('sky','SKY','Where the horizon opens.','sky','{}',2),
  ('earth','EARTH','Where the resort comes alive.','earth','{EAT,MOVE,PLAY}',3),
  ('sea','SEA','Where everything slows down.','sea','{}',4);

INSERT INTO public.site_settings (key, value, label, display_order) VALUES
  ('website','https://www.danang.intercontinental.com/','Official Website',1),
  ('adj','https://www.danang.intercontinental.com/','Art Digital Journey',2),
  ('ihg','https://www.ihg.com/onerewards/content/us/en/home','IHG One Rewards',3),
  ('instagram','https://www.instagram.com/intercontinentaldanang/','Instagram',4),
  ('map','https://www.danang.intercontinental.com/','Resort Map',5),
  ('contact','tel:+842363938888','Contact',6),
  ('dining','https://www.danang.intercontinental.com/','Dining',7),
  ('spa','https://www.danang.intercontinental.com/','Spa',8),
  ('booking_channel','whatsapp','Booking channel',9),
  ('booking_destination','842363938888','Booking destination',10);

INSERT INTO public.destinations (id, name, level_id, cluster, type, short_description, image_key, discover_url, instagram_url, booking_message, display_order) VALUES
  ('reception','Reception','heaven',NULL,'service','Arrival at the highest point of the resort.',NULL,'https://www.danang.intercontinental.com/',NULL,NULL,1),
  ('club-lounge','Club InterContinental Lounge','heaven',NULL,'service','Private lounge above the bay.',NULL,'https://www.danang.intercontinental.com/',NULL,NULL,2),
  ('penthouses','Heavenly Penthouses','heaven',NULL,'accommodation','Panoramic suites at the summit.',NULL,'https://www.danang.intercontinental.com/',NULL,NULL,3),
  ('the-summit','The Summit','heaven',NULL,'experience','Events and ceremonies in the clouds.','d-tram','https://www.danang.intercontinental.com/',NULL,'Hello, I''m interested in booking The Summit. Could you please assist me?',4),
  ('rooms','Rooms & Villas','heaven',NULL,'accommodation','Bensley design, level by level.',NULL,'https://www.danang.intercontinental.com/',NULL,NULL,5),
  ('m-club','Conference · Cinema · M-Club','heaven',NULL,'experience','Gatherings, screenings, celebrations.',NULL,'https://www.danang.intercontinental.com/',NULL,NULL,6),
  ('sports-centre','Sports Centre','heaven',NULL,'fitness','Tennis and mountaintop play.',NULL,'https://www.danang.intercontinental.com/',NULL,NULL,7),
  ('apec-garden','APEC Sculpture Garden','heaven',NULL,'gallery','Sculpture along the ridge.','d-gallery','https://www.danang.intercontinental.com/',NULL,NULL,8),
  ('nam-tram','Nam Tram','heaven',NULL,'service','The funicular between the four worlds.','d-tram','https://www.danang.intercontinental.com/',NULL,NULL,9),
  ('information','Information Desk','heaven',NULL,'service','Concierge and guest assistance.',NULL,'https://www.danang.intercontinental.com/',NULL,NULL,10),

  ('citron','Citron','sky',NULL,'restaurant','Vietnamese cuisine in hanging nest pods.','d-citron','https://www.danang.intercontinental.com/','https://www.instagram.com/intercontinentaldanang/','Hello, I would like to reserve a table at Citron. Could you please assist me?',1),
  ('la-maison-1888','La Maison 1888','sky',NULL,'restaurant','MICHELIN-recognised French dining.',NULL,'https://www.danang.intercontinental.com/','https://www.instagram.com/intercontinentaldanang/','Hello, I would like to reserve a table at La Maison 1888. Could you please assist me?',2),
  ('buffalo-bar','Buffalo Bar','sky',NULL,'bar','Cocktails beneath the Heritage Village.',NULL,'https://www.danang.intercontinental.com/',NULL,NULL,3),
  ('wine-cellar','The Wine Cellar','sky',NULL,'bar','Rare vintages in a hidden room.','d-wine','https://www.danang.intercontinental.com/',NULL,NULL,4),
  ('tingara','Tingara','sky',NULL,'bar','Sunset drinks above the horizon.','d-citron','https://www.danang.intercontinental.com/',NULL,NULL,5),
  ('heritage-village','Heritage Village','sky',NULL,'experience','Vietnamese craft and architecture.',NULL,'https://www.danang.intercontinental.com/',NULL,NULL,6),
  ('bensley-gallery','Bensley Outsider Gallery','sky',NULL,'gallery','The world of the resort''s architect.','d-gallery','https://www.danang.intercontinental.com/',NULL,NULL,7),
  ('kate-mccoy','Kate McCoy','sky',NULL,'retail','Contemporary resort wear.',NULL,'https://www.danang.intercontinental.com/',NULL,NULL,8),
  ('sammys','Sammy''s Boutique','sky',NULL,'retail','Curated pieces and keepsakes.',NULL,'https://www.danang.intercontinental.com/',NULL,NULL,9),

  ('terra-mare','Terra Mare','earth','EAT','restaurant','Land and sea, all day long.','d-french-dining','https://www.danang.intercontinental.com/','https://www.instagram.com/intercontinentaldanang/','Hello, I would like to reserve a table at Terra Mare. Could you please assist me?',1),
  ('b-lounge','B Lounge','earth','EAT','bar','Afternoon tea in the trees.',NULL,'https://www.danang.intercontinental.com/',NULL,NULL,2),
  ('long-bar','L_O_N_G Bar','earth','EAT','bar','The long line above the jungle.',NULL,'https://www.danang.intercontinental.com/',NULL,NULL,3),
  ('soar-gym','Soar Gym','earth','MOVE','fitness','Train inside the canopy.',NULL,'https://www.danang.intercontinental.com/',NULL,NULL,4),
  ('yoga-pavilion','Yoga Pavilion','earth','MOVE','experience','Breath among the leaves.','d-spa','https://www.danang.intercontinental.com/',NULL,'Hello, I''m interested in booking a session at the Yoga Pavilion. Could you please assist me?',5),
  ('long-pool','L_O_N_G Pool','earth','MOVE','pool','Green water, endless length.',NULL,'https://www.danang.intercontinental.com/',NULL,NULL,6),
  ('planet-trekkers','Planet Trekkers','earth','PLAY','kids','A world for younger explorers.',NULL,'https://www.danang.intercontinental.com/',NULL,NULL,7),
  ('family-pool','Family Pool','earth','PLAY','pool','Shallow, shaded, together.',NULL,'https://www.danang.intercontinental.com/',NULL,NULL,8),
  ('kids-pool','Kids Pool','earth','PLAY','pool','Small water for small guests.',NULL,'https://www.danang.intercontinental.com/',NULL,NULL,9),
  ('garden-jacuzzi','Garden Jacuzzi','earth','PLAY','pool','Warm water in the vegetation.',NULL,'https://www.danang.intercontinental.com/',NULL,NULL,10),
  ('nail-hair','The Nail & Hair Studio','earth','PLAY','retail','Quiet care between swims.',NULL,'https://www.danang.intercontinental.com/',NULL,NULL,11),
  ('nursery','Nursery','earth','PLAY','kids','Care for the youngest guests.','d-spa','https://www.danang.intercontinental.com/',NULL,NULL,12),
  ('organic-garden','Organic Garden','earth','PLAY','experience','Where the kitchens begin.','d-gallery','https://www.danang.intercontinental.com/',NULL,NULL,13),
  ('dia-tang','Địa Tạng Shrine','earth','PLAY','experience','A pause in the hillside.','d-gallery','https://www.danang.intercontinental.com/',NULL,NULL,14),

  ('mi-sol-spa','Mi Sol Spa & Wellness','sea',NULL,'spa','Sound. Stillness. Renewal.',NULL,'https://www.danang.intercontinental.com/',NULL,'Hello, I''m interested in booking Mi Sol Spa. Could you please assist me?',1),
  ('marine-centre','Marine Recreation Centre','sea',NULL,'recreation','Explore the bay.',NULL,'https://www.danang.intercontinental.com/',NULL,NULL,2),
  ('coconut-beach','Coconut Beach','sea',NULL,'beach','At the edge of Son Tra.',NULL,'https://www.danang.intercontinental.com/',NULL,NULL,3),
  ('family-beach','Family Beach','sea',NULL,'beach','Soft sand, calm water.',NULL,'https://www.danang.intercontinental.com/',NULL,NULL,4),
  ('club-beach','Club InterContinental Beach','sea',NULL,'beach','Private shoreline for Club guests.',NULL,'https://www.danang.intercontinental.com/',NULL,NULL,5),
  ('spa-lagoon-villas','Spa Lagoon Villas','sea',NULL,'accommodation','Sleep beside still water.',NULL,'https://www.danang.intercontinental.com/',NULL,NULL,6),
  ('sea-experiences','Seaside Experiences','sea',NULL,'experience','Sunrise sailing and quiet dives.',NULL,'https://www.danang.intercontinental.com/',NULL,'Hello, I''m interested in booking a seaside experience. Could you please assist me?',7);