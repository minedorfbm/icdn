-- Facebook exposes this official Terra Mare video as a vertical reel (720 x 1280).
-- Reuse the existing curated-video table, permissions and publication controls.
BEGIN;
INSERT INTO public.destination_videos
  (destination_id, video_url, title, title_translations, display_order, active)
VALUES
  ('terra-mare', 'https://www.facebook.com/reel/2019955602291134/',
   'Terra Mare', '{}'::jsonb, 0, true)
ON CONFLICT (destination_id, video_url) DO NOTHING;
COMMIT;
