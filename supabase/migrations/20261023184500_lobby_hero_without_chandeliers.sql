-- The supplied retouched photographs preserve an open sky for the hero wordmark.
-- Upload the versioned public objects before applying these references.
INSERT INTO public.site_settings (key, value, label, display_order)
VALUES
  ('hero_image', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/hero-lobby-portrait-no-chandelier-e29f7810e97a.webp', 'Hero image · portrait', 0),
  ('hero_image_landscape', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/hero-lobby-landscape-no-chandelier-f06bd383569a.webp', 'Hero image · landscape', 1)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, label = EXCLUDED.label;
