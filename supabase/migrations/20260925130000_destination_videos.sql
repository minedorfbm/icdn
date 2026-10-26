-- Curated YouTube videos for expanded destination cards.
BEGIN;
CREATE TABLE IF NOT EXISTS public.destination_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id text NOT NULL REFERENCES public.destinations(id) ON DELETE RESTRICT,
  video_url text NOT NULL,
  title text NOT NULL CHECK (length(trim(title)) > 0),
  title_translations jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(title_translations) = 'object'),
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT destination_videos_unique_url UNIQUE (destination_id, video_url)
);

CREATE INDEX IF NOT EXISTS destination_videos_destination_idx
ON public.destination_videos (destination_id, display_order);

ALTER TABLE public.destination_videos ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.destination_videos TO anon, authenticated;
GRANT ALL ON public.destination_videos TO service_role;

DROP POLICY IF EXISTS "Active destination videos are publicly readable" ON public.destination_videos;
CREATE POLICY "Active destination videos are publicly readable"
ON public.destination_videos FOR SELECT TO anon, authenticated
USING (active AND EXISTS (
  SELECT 1 FROM public.destinations d WHERE d.id = destination_id AND d.active
));

CREATE OR REPLACE TRIGGER destination_videos_set_updated_at
BEFORE UPDATE ON public.destination_videos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- First video supplied by the resort team; no other destination receives a video.
INSERT INTO public.destination_videos (destination_id, video_url, title, active)
SELECT 'mi-sol-spa', 'https://www.youtube.com/watch?v=eAmMeJdRguw', 'Mi Sol Spa & Wellness', true
WHERE EXISTS (SELECT 1 FROM public.destinations WHERE id = 'mi-sol-spa')
ON CONFLICT (destination_id, video_url) DO NOTHING;
COMMIT;
