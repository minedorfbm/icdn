-- Upload all files in selection-photos-digital-hub/upload-hub-images to the public
-- hub-images bucket, then verify their public URLs before applying this migration.
BEGIN;

UPDATE public.destinations AS d
SET image_key = reviewed.home_url,
    detail_image_key = reviewed.detail_url
FROM (VALUES
  ('terra-mare', 'https://www.danang.intercontinental.com/wp-content/uploads/2025/12/Terra-Mare-facade-scaled-e1765265386114.jpg', 'https://www.danang.intercontinental.com/wp-content/uploads/2025/12/Terra-Mare-3-scaled.jpg'),
  ('b-lounge', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/b-lounge-home-4986485f91.webp', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/b-lounge-detail-fde4599d44.webp'),
  ('long-bar', 'https://www.danang.intercontinental.com/wp-content/uploads/2026/04/Longbar_Landingpage.jpg', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/long-bar-detail-b65d537cae.webp'),
  ('soar-gym', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/soar-gym-home-e3a1f43f87.webp', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/soar-gym-detail-2e533d97b9.webp'),
  ('long-pool', 'https://www.danang.intercontinental.com/wp-content/uploads/2026/03/Long-Pool-Outside-2-scaled.jpg', 'https://www.danang.intercontinental.com/wp-content/uploads/2022/11/DSC05621.jpg'),
  ('planet-trekkers', 'https://www.danang.intercontinental.com/wp-content/uploads/2023/10/Planet-Trekker-2-Done-scaled.jpg', 'https://www.danang.intercontinental.com/wp-content/uploads/2021/10/Planet-Trekkers-Playing-with-Balloon-scaled.jpg'),
  ('family-pool', 'https://www.danang.intercontinental.com/wp-content/uploads/2021/07/05-08-0001_Family-Pool-Lifestyle-1-scaled.jpg', 'https://www.danang.intercontinental.com/wp-content/uploads/2021/07/Family-Pool-Lifestyle-2-Done-scaled.jpg'),
  ('kids-pool', 'https://www.danang.intercontinental.com/wp-content/uploads/2025/08/Pool-Friends-scaled.jpg', 'https://www.danang.intercontinental.com/wp-content/uploads/2022/03/ICDN-Resort-Pool-with-family-scaled-1.jpg'),
  ('garden-jacuzzi', 'https://www.danang.intercontinental.com/wp-content/uploads/2026/03/05-08-0006_Garden-Pool-2-scaled.jpg', 'https://www.danang.intercontinental.com/wp-content/uploads/2025/06/05-08-0008_Garden-Pool-Jacuzzi-1-scaled.jpg'),
  ('wall-of-lanterns', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/wall-of-lanterns-home-a461f92fce.webp', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/wall-of-lanterns-detail-1ac63adf52.webp'),
  ('nursery', 'https://www.danang.intercontinental.com/wp-content/uploads/2022/11/DSC02279-e1673927393394.jpg', 'https://www.danang.intercontinental.com/wp-content/uploads/2026/03/Kids-Club-2-scaled.jpg'),
  ('organic-garden', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/organic-garden-home-aae26ae34a.webp', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/organic-garden-detail-1de4a8911c.webp'),
  ('dia-tang', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/dia-tang-home-ffb5dee75c.webp', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/dia-tang-detail-59f672595c.webp'),
  ('things-to-do', 'https://www.danang.intercontinental.com/wp-content/uploads/2025/06/Lobby-Exterior-3.-9.16-scaled.jpg', 'https://www.danang.intercontinental.com/wp-content/uploads/2023/11/Kayak-2.jpg'),
  ('destination-experiences', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/destination-experiences-home-1c2739aeaa.webp', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/destination-experiences-detail-cdaac3dffb.webp'),
  ('nature-experiences', 'https://www.danang.intercontinental.com/wp-content/uploads/2026/03/Red-shanked-douc-Wildlife-scaled.jpg', 'https://www.danang.intercontinental.com/wp-content/uploads/2026/05/WhatsApp-Image-2026-05-20-at-4.56.04-PM.jpeg'),
  ('enchanted-holiday', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/offer-enchanted-a75b10e6aacb.webp', 'https://www.danang.intercontinental.com/wp-content/uploads/2026/07/section-3.png'),
  ('club-lounge', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/club-lounge-home-85dcc07916.webp', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/club-lounge-detail-1563bb44b4.webp'),
  ('ihg-one-rewards', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/ihg-one-rewards-home-43918a51e2.webp', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/ihg-one-rewards-detail-3615b80fe8.webp'),
  ('bensley-package', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/offer-bensley-dca5bf101a26.webp', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/bensley-package-detail-82fe653400.webp'),
  ('weddings', 'https://www.danang.intercontinental.com/wp-content/uploads/2022/11/DSC08835.jpg', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/weddings-detail-396d2c7bd2.webp'),
  ('nguoi-dan-loi', 'https://www.danang.intercontinental.com/wp-content/uploads/2023/10/Villa-Butler-2-Done-1024x683.jpg', 'https://www.danang.intercontinental.com/wp-content/uploads/2021/10/Villa-host.jpg'),
  ('instagram-spots', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/instagram-spots-home-8755d08eef.webp', 'https://www.danang.intercontinental.com/wp-content/uploads/2021/07/La-Maison-1888-Terrace-sunset-1.jpg'),
  ('the-summit', 'https://www.danang.intercontinental.com/wp-content/uploads/2022/10/Summit-Ariel-32-scaled.jpg', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/the-summit-detail-4b0105ba69.webp'),
  ('summit-conference-centre', 'https://www.danang.intercontinental.com/wp-content/uploads/2021/07/Summit-Meeting-Set-Up-scaled.jpg', 'https://www.danang.intercontinental.com/wp-content/uploads/2026/02/The-Summit-Great-Hall-Banquet-Setup-scaled.jpg'),
  ('summit-cinema', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/summit-cinema-home-7de3f7c699.webp', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/summit-cinema-detail-8314b0f948.webp'),
  ('m-club', 'https://www.danang.intercontinental.com/wp-content/uploads/2026/02/M-Club-Dance-Floor-scaled.jpg', 'https://www.danang.intercontinental.com/wp-content/uploads/2026/08/M-Club_After-Party.jpg'),
  ('sports-centre', 'https://www.danang.intercontinental.com/wp-content/uploads/2022/11/Tennis-Court-aerial-scaled-e1687256828998.jpg', 'https://www.danang.intercontinental.com/wp-content/uploads/2024/10/Tennis-Coaching-scaled.jpg'),
  ('apec-garden', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/apec-garden-home-717fa09e00.webp', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/apec-garden-detail-3205bdd68e.webp'),
  ('nam-tram', 'https://www.danang.intercontinental.com/wp-content/uploads/2023/11/Nam-Tram-2-Done-scaled.jpg', 'https://www.danang.intercontinental.com/wp-content/uploads/2021/10/ICDN-Nam-Tram-scaled.jpg'),
  ('moulin-rouge', 'https://www.danang.intercontinental.com/wp-content/uploads/2025/06/M-Rouge-Karaoke-2-scaled.jpg', 'https://www.danang.intercontinental.com/wp-content/uploads/2021/10/M-Rouge-Lounge-scaled.jpg'),
  ('relaxation-pavilion', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/relaxation-pavilion-home-eb498f1cc7.webp', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/relaxation-pavilion-detail-f0019fedbe.webp'),
  ('citron', 'https://www.danang.intercontinental.com/wp-content/uploads/2026/04/Citron_Landingpage.jpg', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/citron-detail-638d32b73a.webp'),
  ('hoi-an-digital-tour', 'https://www.danang.intercontinental.com/wp-content/uploads/2021/06/japanese-covered-bridge-hoi-unesco-world-heritage-vietnam-scaled.jpg', 'https://www.danang.intercontinental.com/wp-content/uploads/2023/02/Hoi-An-Lantern-shops-scaled.jpg'),
  ('mi-sol-spa', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/mi-sol-spa-home-7a3827738f.webp', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/mi-sol-spa-detail-d463f7fef7.webp'),
  ('nail-hair', 'https://www.danang.intercontinental.com/wp-content/uploads/2024/10/Hair-and-Nail-Salon-1B-scaled.jpg', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/nail-hair-detail-ef937d0e2c.webp'),
  ('marine-centre', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/marine-centre-home-8dfa4cf8c4.webp', 'https://www.danang.intercontinental.com/wp-content/uploads/2026/03/Frequency-Yoga-on-Beach-1-1-scaled.jpg'),
  ('coconut-beach', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/coconut-beach-home-96b9efe2d2.webp', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/coconut-beach-detail-2b89c4d421.webp'),
  ('family-beach', 'https://www.danang.intercontinental.com/wp-content/uploads/2026/07/section-5.png', 'https://www.danang.intercontinental.com/wp-content/uploads/2022/11/DSC09973.jpg'),
  ('club-beach', 'https://www.danang.intercontinental.com/wp-content/uploads/2026/02/Club-Beach-scaled.jpg', 'https://www.danang.intercontinental.com/wp-content/uploads/2023/04/DSC03809-2-2-scaled.jpg'),
  ('spa-lagoon-villas', 'https://www.danang.intercontinental.com/wp-content/uploads/2021/06/Spa-Lagoon-Villa-terrace-scaled.jpg', 'https://www.danang.intercontinental.com/wp-content/uploads/2021/06/Spa-Lagoon-Villa-treatment-room-with-therapist-scaled.jpg'),
  ('sea-experiences', 'https://www.danang.intercontinental.com/wp-content/uploads/2023/11/Kayak-2.jpg', 'https://www.danang.intercontinental.com/wp-content/uploads/2026/02/z4459883403599_32a8b89fa940541b1b0eab9f96eead70.jpg.jpeg'),
  ('yoga-pavilion', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/yoga-pavilion-home-c01d02d111.webp', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/yoga-pavilion-detail-6e88e375e5.webp'),
  ('daycation', 'https://www.danang.intercontinental.com/wp-content/uploads/2021/10/ICDN-Resort-Panorama-with-lady-1-scaled.jpg', 'https://www.danang.intercontinental.com/wp-content/uploads/2021/07/Family-Pool-Lifestyle-2-Done-scaled.jpg'),
  ('la-maison-1888', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/la-maison-1888-home-7fb234c5ca.webp', 'https://www.danang.intercontinental.com/wp-content/uploads/2021/07/La-Maison-1888-Le-Boudoir-de-Madame-with-guests-1-scaled-e1765417693579.jpg'),
  ('buffalo-bar', 'https://www.danang.intercontinental.com/wp-content/uploads/2023/10/La-Maison-Buffalo-Bar-Done-scaled.jpg', 'https://www.danang.intercontinental.com/wp-content/uploads/2021/10/Buffalo-Bar-_-with-Bartender-scaled-e1634709794933.jpg'),
  ('wine-cellar', 'https://www.danang.intercontinental.com/wp-content/uploads/2021/08/Wine-Cellar-2-scaled.jpg', 'https://www.danang.intercontinental.com/wp-content/uploads/2021/10/La-Maison-1888-Wine-Cellar.jpg'),
  ('tingara', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/tingara-home-0fce7209b7.webp', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/tingara-detail-6fbfb6722f.webp'),
  ('heritage-village', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/heritage-village-home-9b195066b2.webp', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/heritage-village-detail-9db978579b.webp'),
  ('bensley-gallery', 'https://www.danang.intercontinental.com/wp-content/uploads/2023/10/Bensley-Gallery-Done-scaled.jpg', 'https://www.danang.intercontinental.com/wp-content/uploads/2022/04/COUPLE-AT-BENSLEY-GALLERY-2-scaled.jpg'),
  ('kate-mccoy', 'https://www.danang.intercontinental.com/wp-content/uploads/2021/09/Temple-Flower-collection-campaign-shot-By-Kate-McCoy-Fine-Jewellery-1-scaled.jpg', 'https://www.danang.intercontinental.com/wp-content/uploads/2021/09/Bamboo-Collection-campaign-shot-By-Kate-McCoy-Fine-Jewellery-1-scaled.jpg'),
  ('sammys', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/sammys-home-7bbb7955d2.webp', 'https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/sammys-detail-3884bfda01.webp')
) AS reviewed(id, home_url, detail_url)
WHERE d.id = reviewed.id;

-- Keep the official Nature page and add the Nature Discovery PDF.
INSERT INTO public.destination_links (destination_id, kind, url, display_order, active)
SELECT 'nature-experiences', 'BROCHURE'::public.destination_link_type,
       l.url, 1, true
FROM public.destination_links AS l
WHERE l.destination_id = 'nature-discovery-guide'
  AND l.kind = 'BROCHURE'::public.destination_link_type
  AND l.active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.destination_links AS existing
    WHERE existing.destination_id = 'nature-experiences'
      AND existing.kind = 'BROCHURE'::public.destination_link_type
      AND existing.url = l.url
  );

UPDATE public.destinations SET active = false WHERE id = 'nature-discovery-guide';

COMMIT;
