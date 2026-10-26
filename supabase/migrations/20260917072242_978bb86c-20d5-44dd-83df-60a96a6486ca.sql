CREATE TABLE public.destination_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  destination_id text NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  post_url text NOT NULL,
  account text,
  caption text,
  image_url text,
  posted_at date,
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.destination_posts TO anon;
GRANT SELECT ON public.destination_posts TO authenticated;
GRANT ALL ON public.destination_posts TO service_role;

ALTER TABLE public.destination_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active destination posts are publicly readable"
  ON public.destination_posts FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE TRIGGER destination_posts_set_updated_at
  BEFORE UPDATE ON public.destination_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.destination_posts (destination_id, post_url, account, caption, posted_at, display_order)
SELECT 'weddings', 'https://www.instagram.com/p/Db-zN6-Gorb/', 'intercontinentaldanang',
  'A celebration above the bay — weddings at InterContinental Danang Sun Peninsula Resort.', NULL, 0
WHERE EXISTS (SELECT 1 FROM public.destinations WHERE id = 'weddings');