-- Approved chapter photography; the shared CSS displays it at 10% opacity.
UPDATE public.levels AS level
SET image_key = selected.image_key
FROM (VALUES
  ('heaven', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/heaven-6314fa39a2e6.webp'),
  ('sky', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/sky-de56a07a2dd3.webp'),
  ('earth', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/earth-9516751b330d.webp'),
  ('sea', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/sea-7e5599b59edf.webp')
) AS selected(id, image_key)
WHERE level.id = selected.id;
