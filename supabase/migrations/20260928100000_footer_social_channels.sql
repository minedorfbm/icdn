-- Public channels linked from the official resort website.
-- Dining/Spa settings remain available; they are no longer footer entries.
INSERT INTO public.site_settings (key, value) VALUES
  ('youtube', 'https://www.youtube.com/@ICDanang'),
  ('x', 'https://x.com/ICdanang')
ON CONFLICT (key) DO NOTHING;
