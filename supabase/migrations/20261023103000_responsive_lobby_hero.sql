-- Independent portrait and landscape hero sources remain editable in the CMS.
-- The objects are published in hub-images before these references are applied.
INSERT INTO public.site_settings (key, value, label, display_order)
VALUES
  ('hero_image', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/hero-lobby-portrait-20261023.webp', 'Hero image · portrait', 0),
  ('hero_image_landscape', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/hero-lobby-landscape-20261023.webp', 'Hero image · landscape', 1)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, label = EXCLUDED.label;
