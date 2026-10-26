CREATE TYPE public.destination_link_type AS ENUM (
  'DISCOVER','INFO','DETAILS','MENU','BREAKFAST_MENU','LUNCH_MENU','DINNER_MENU',
  'VEGETARIAN_MENU','VEGAN_MENU','PRICE_LIST','BROCHURE','TREATMENTS','ACTIVITIES',
  'BOOK','INSTAGRAM','VISIT','HOURS','WEBSITE'
);

CREATE TABLE public.destination_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id text NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  kind public.destination_link_type NOT NULL,
  label text,
  url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.destination_links TO anon, authenticated;
GRANT ALL ON public.destination_links TO service_role;
ALTER TABLE public.destination_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active destination links are publicly readable"
  ON public.destination_links FOR SELECT TO anon, authenticated USING (active = true);
CREATE TRIGGER destination_links_set_updated_at
  BEFORE UPDATE ON public.destination_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX destination_links_destination_idx ON public.destination_links (destination_id, display_order);

CREATE TABLE public.destination_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id text NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  title text NOT NULL,
  schedule text[] NOT NULL DEFAULT '{}'::text[],
  description text NOT NULL DEFAULT '',
  url text,
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.destination_events TO anon, authenticated;
GRANT ALL ON public.destination_events TO service_role;
ALTER TABLE public.destination_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active destination events are publicly readable"
  ON public.destination_events FOR SELECT TO anon, authenticated USING (active = true);
CREATE TRIGGER destination_events_set_updated_at
  BEFORE UPDATE ON public.destination_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX destination_events_destination_idx ON public.destination_events (destination_id, display_order);

INSERT INTO public.destination_links (destination_id, kind, url, display_order)
SELECT id, k.kind, k.url, k.ord
FROM public.destinations d
CROSS JOIN LATERAL (VALUES
  ('DISCOVER'::public.destination_link_type, d.discover_url, 0),
  ('MENU', d.menu_url, 1),
  ('BREAKFAST_MENU', d.breakfast_menu_url, 2),
  ('LUNCH_MENU', d.lunch_menu_url, 3),
  ('DINNER_MENU', d.dinner_menu_url, 4),
  ('VEGETARIAN_MENU', d.vegetarian_menu_url, 5),
  ('VEGAN_MENU', d.vegan_menu_url, 6),
  ('PRICE_LIST', d.price_list_url, 7),
  ('BOOK', d.booking_url, 8),
  ('INSTAGRAM', d.instagram_url, 9)
) AS k(kind, url, ord)
WHERE k.url IS NOT NULL AND k.url <> '';

INSERT INTO public.destination_events (destination_id, title, schedule, description, url, display_order) VALUES
('citron','Sunday Champagne Brunch', ARRAY['EVERY SUNDAY','12:30 – 15:30'],
 'Enjoy a buffet artfully prepared by our talented chefs, and enjoy our recreational facilities for the whole day. Reservations begin from VND 2.599.000 per person depending on your choice of free flow package.',
 'https://www.danang.intercontinental.com/dining/citron/', 0),
('citron','Heavenly Afternoon Tea', ARRAY['14:30 – 16:30 (MONDAY – SATURDAY)','15:30 – 17:00 (SUNDAY)'],
 'Relish premium teas accompanied by mouthwatering bites. Enhance your experience with free-flow cocktails or champagne. For the ultimate indulgence, book one of our Non-La tables and upgrade to Royal Afternoon Tea, designed to delight all the senses.',
 'https://www.danang.intercontinental.com/dining/citron/', 1),
('la-maison-1888','Souvenirs de France Wine Tasting', ARRAY['MONDAY, WEDNESDAY AND FRIDAY','16:00 – 17:00'],
 'Uncork the chapters of some of the most famous vintages at La Maison 1888. France has many wine stories to tell, and our sommeliers love to tell them—and let you taste them! Reservations required by 17:00 the day prior.',
 'https://www.danang.intercontinental.com/dining/la-maison-1888/', 0),
('terra-mare','Beach BBQ Buffet & Bonfire', ARRAY['EVERY SATURDAY','18:00 – 21:30'],
 'Join us on the beach for our weekly Barbecue Buffet and Bonfire. Grilled meats and seafood are the stars of the show, accompanied by a tempting selection of side dishes and desserts!',
 'https://www.danang.intercontinental.com/dining/terra-mare/', 0);