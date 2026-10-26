CREATE TABLE public.destination_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  destination_id text NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  post_url text,
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX destination_photos_destination_idx ON public.destination_photos (destination_id, display_order);

GRANT SELECT ON public.destination_photos TO anon;
GRANT SELECT ON public.destination_photos TO authenticated;
GRANT ALL ON public.destination_photos TO service_role;

ALTER TABLE public.destination_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active destination photos are publicly readable"
  ON public.destination_photos
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE TRIGGER destination_photos_set_updated_at
  BEFORE UPDATE ON public.destination_photos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();