-- Import the owner-reviewed Instagram selections and add the culinary card.
-- Source: destinations_rows CSV supplied on 2026-09-30; only INSTA columns
-- are imported. Blank cells do not clear cards without a supplied link.
-- The CSV's non-Instagram fields are not authoritative for production.
BEGIN;

INSERT INTO public.destinations (
  id, name, level_id, cluster, type, short_description,
  image_key, detail_image_key, content_kind, display_order
) VALUES (
  'culinary-activities', 'Culinary Activities', 'heaven', 'EXPERIENCES',
  'experience',
  'Discover Vietnamese cooking, a market-to-table adventure, coffee art and tasting, and family pizza-making with the resort’s chefs.',
  'https://www.danang.intercontinental.com/wp-content/uploads/2024/05/Citron-Buffet-2-scaled.jpg',
  'https://www.danang.intercontinental.com/wp-content/uploads/2026/04/Citron_Landingpage.jpg',
  'offer', 19
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.destination_links (destination_id, kind, url, display_order)
SELECT 'culinary-activities', 'DISCOVER'::public.destination_link_type,
       'https://www.danang.intercontinental.com/recreation/culinary-activities/', 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.destination_links
  WHERE destination_id = 'culinary-activities'
    AND kind = 'DISCOVER'::public.destination_link_type
    AND url = 'https://www.danang.intercontinental.com/recreation/culinary-activities/'
);

INSERT INTO public.destination_translations
  (destination_id, locale, description, source_description, published)
SELECT 'culinary-activities', t.locale, t.description,
       d.short_description, true
FROM (VALUES
  ('vi', 'Khám phá ẩm thực Việt qua lớp nấu ăn, hành trình từ chợ đến bàn ăn, nghệ thuật cà phê và lớp làm pizza cùng các đầu bếp của khu nghỉ dưỡng.'),
  ('ru', 'Откройте для себя вьетнамскую кухню на кулинарных занятиях: экскурсия на рынок, приготовление блюд с шеф-поваром, кофейное искусство и пицца для всей семьи.'),
  ('zh', '与度假村厨师一起探索越南烹饪、市场到餐桌的美食之旅、咖啡拉花与品鉴，以及适合全家的披萨制作。'),
  ('ko', '리조트 셰프와 함께 베트남 요리, 시장부터 식탁까지의 미식 체험, 커피 아트와 시음, 가족 피자 만들기를 즐겨보세요.'),
  ('ja', 'リゾートのシェフとともに、ベトナム料理教室、市場から食卓への食体験、コーヒーアートと試飲、家族向けのピザ作りを楽しめます。')
) AS t(locale, description)
JOIN public.destinations AS d ON d.id = 'culinary-activities'
ON CONFLICT (destination_id, locale) DO NOTHING;

CREATE TEMP TABLE selected_instagram_posts (
  destination_id text NOT NULL, post_url text NOT NULL, display_order integer NOT NULL,
  PRIMARY KEY (destination_id, post_url),
  UNIQUE (destination_id, display_order)
) ON COMMIT DROP;

INSERT INTO selected_instagram_posts (destination_id, post_url, display_order) VALUES
  ('apec-garden', 'https://www.instagram.com/p/DZZJGpHlS_P/', 0),
  ('b-lounge', 'https://www.instagram.com/p/DNU4X10uB6X/', 0),
  ('b-lounge', 'https://www.instagram.com/p/DGwwT3cCPE5/', 1),
  ('bensley-gallery', 'https://www.instagram.com/p/DUzfo7tElRz/', 0),
  ('bensley-gallery', 'https://www.instagram.com/p/DQ_Z9yyEVPU/', 1),
  ('bensley-package', 'https://www.instagram.com/p/DcDFnE1ETps', 0),
  ('bensley-package', 'https://www.instagram.com/p/DWLJhxODrgx/', 1),
  ('bensley-package', 'https://www.instagram.com/p/DVK4hyuGYI2/', 2),
  ('bensley-package', 'https://www.instagram.com/p/DNAcxe1siwR', 3),
  ('buffalo-bar', 'https://www.instagram.com/p/DYjEa8-mU8Y', 0),
  ('buffalo-bar', 'https://www.instagram.com/p/DL9jFzytrOp/', 1),
  ('citron', 'https://www.instagram.com/p/DY1vLHJkT7G/', 0),
  ('citron', 'https://www.instagram.com/p/Dc7Mv1sD6yu/', 1),
  ('citron', 'https://www.instagram.com/p/DZjcU-NARYu/', 2),
  ('citron', 'https://www.instagram.com/p/DUkQlc1Dky3/', 3),
  ('citron', 'https://www.instagram.com/p/DRt0_eUj8wY/', 4),
  ('club-beach', 'https://www.instagram.com/p/DbpqNAmian-', 0),
  ('club-beach', 'https://www.instagram.com/p/DdleIn2jk8J/', 1),
  ('club-lounge', 'https://www.instagram.com/p/DdA4qqgHDkM', 0),
  ('club-lounge', 'https://www.instagram.com/p/DTuSwSVEfX9/', 1),
  ('club-lounge', 'https://www.instagram.com/p/DYRC3XoEgvF', 2),
  ('coconut-beach', 'https://www.instagram.com/reel/DZhkXY5gsYY/', 0),
  ('enchanted-holiday', 'https://www.instagram.com/p/DcupMNcgQjF/', 0),
  ('family-beach', 'https://www.instagram.com/p/DHlCvobMi0U/', 0),
  ('family-pool', 'https://www.instagram.com/p/DaHfZ-ckimq/', 0),
  ('garden-jacuzzi', 'https://www.instagram.com/p/DLtxuY2tHeJ/', 0),
  ('ihg-one-rewards', 'https://www.instagram.com/p/DdpMzrOkpSl/', 0),
  ('ihg-one-rewards', 'https://www.instagram.com/p/DbuG7E0jqZH/', 1),
  ('ihg-one-rewards', 'https://www.instagram.com/p/DdyxE8hl9XE/', 2),
  ('ihg-one-rewards', 'https://www.instagram.com/p/Ddlyrmkl97D/', 3),
  ('ihg-one-rewards', 'https://www.instagram.com/p/DdUwvhlDO-i/', 4),
  ('la-maison-1888', 'https://www.instagram.com/p/DbNEUtJiSro/', 0),
  ('la-maison-1888', 'https://www.instagram.com/p/DdVfCTwFhaw/', 1),
  ('la-maison-1888', 'https://www.instagram.com/p/DdQWW42D91g', 2),
  ('la-maison-1888', 'https://www.instagram.com/p/DdBZAppDyR5/', 3),
  ('la-maison-1888', 'https://www.instagram.com/p/Dc2etiKCC_C/', 4),
  ('long-bar', 'https://www.instagram.com/p/DdGCO6mDj5R/', 0),
  ('long-bar', 'https://www.instagram.com/p/DUmkx8nj3_t/', 1),
  ('long-bar', 'https://www.instagram.com/p/DWVctcvjsCi', 2),
  ('long-pool', 'https://www.instagram.com/p/DZol4xjEn1B/', 0),
  ('long-pool', 'https://www.instagram.com/p/DW0dF2ZDcMG/', 1),
  ('marine-centre', 'https://www.instagram.com/p/Dc2etiKCC_C/', 0),
  ('mi-sol-spa', 'https://www.instagram.com/reel/DKG_o52sB3l/', 0),
  ('mi-sol-spa', 'https://www.instagram.com/p/DbZ43WrnKAG/', 1),
  ('mi-sol-spa', 'https://www.instagram.com/p/DMuQbvapZMP/', 2),
  ('mi-sol-spa', 'https://www.instagram.com/p/DL4Lxeotfvi/', 3),
  ('mi-sol-spa', 'https://www.instagram.com/p/DGcGc3mMi4-/', 4),
  ('moulin-rouge', 'https://www.instagram.com/p/DBipQdVRn8F/', 0),
  ('nail-hair', 'https://www.instagram.com/p/DTKIxo5EovU', 0),
  ('nam-tram', 'https://www.instagram.com/p/DYTno_rDZvv/', 0),
  ('organic-garden', 'https://www.instagram.com/p/DZ9MQOsk0CN/', 0),
  ('planet-trekkers', 'https://www.instagram.com/p/DZHJ2ABHFOn/', 0),
  ('planet-trekkers', 'https://www.instagram.com/p/DS1NywcltAp/', 1),
  ('relaxation-pavilion', 'https://www.instagram.com/p/DZ1d30nk6E3/', 0),
  ('sammys', 'https://www.instagram.com/p/DOp2ncdkqiR/', 0),
  ('sea-experiences', 'https://www.instagram.com/p/Dc2etiKCC_C/', 0),
  ('sea-experiences', 'https://www.instagram.com/p/DahUPJ_kcAx', 1),
  ('soar-gym', 'https://www.instagram.com/p/DS_8d_fj4o0/', 0),
  ('soar-gym', 'https://www.instagram.com/p/DYJUek8nPZq/', 1),
  ('culinary-activities', 'https://www.instagram.com/p/DYGvsklD3iG', 0),
  ('spa-lagoon-villas', 'https://www.instagram.com/p/DYhB_mGGVvV', 0),
  ('spa-lagoon-villas', 'https://www.instagram.com/p/DUSLS6-jhnz/', 1),
  ('sports-centre', 'https://www.instagram.com/p/DZbt6gakmWB', 0),
  ('sports-centre', 'https://www.instagram.com/p/DNPkfckss1R/', 1),
  ('terra-mare', 'https://www.instagram.com/p/DSB8x9pju-n/', 0),
  ('terra-mare', 'https://www.instagram.com/p/DdfyVTEDXvl/', 1),
  ('terra-mare', 'https://www.instagram.com/p/DcfaVaxm2h0/', 2),
  ('terra-mare', 'https://www.instagram.com/p/DbF7usRH_D7/', 3),
  ('the-summit', 'https://www.instagram.com/p/DV-RiYhjqfR/', 0),
  ('tingara', 'https://www.instagram.com/p/DacyZ2QikyL/', 0),
  ('tingara', 'https://www.instagram.com/p/DcnsxRtIKsB/', 1),
  ('tingara', 'https://www.instagram.com/p/DdBh39ajzn4/', 2),
  ('tingara', 'https://www.instagram.com/p/Db4krZyE8PC/', 3),
  ('tingara', 'https://www.instagram.com/p/DawmyZUEyFn/', 4),
  ('weddings', 'https://www.instagram.com/p/DcU7Eo7z46I/', 0),
  ('weddings', 'https://www.instagram.com/p/DUILpGfki0p/?img_index=3', 1),
  ('weddings', 'https://www.instagram.com/p/Dcm_4NXCXCd', 2),
  ('weddings', 'https://www.instagram.com/p/DbgXwfImn7C/', 3),
  ('weddings', 'https://www.instagram.com/p/DbtNr_OFEg4/', 4),
  ('wine-cellar', 'https://www.instagram.com/p/DdQWW42D91g', 0),
  ('wine-cellar', 'https://www.instagram.com/p/DTkauDdEt51/', 1),
  ('wine-cellar', 'https://www.instagram.com/p/DMPkp9hM_nP', 2),
  ('wine-cellar', 'https://www.instagram.com/p/DFfKmy2O0Bt/', 3),
  ('yoga-pavilion', 'https://www.instagram.com/p/DdTZJ5wCSSr/', 0),
  ('yoga-pavilion', 'https://www.instagram.com/p/DdqumHJjElh/', 1),
  ('yoga-pavilion', 'https://www.instagram.com/p/DTcRN3QEkG3/', 2),
  ('destination-experiences', 'https://www.instagram.com/p/Da4bTpCDmds/', 0),
  ('destination-experiences', 'https://www.instagram.com/p/Dc5KSMOnJYY/', 1),
  ('destination-experiences', 'https://www.instagram.com/p/DcN-iGPG9SL', 2),
  ('destination-experiences', 'https://www.instagram.com/p/DYtXmtkFZhX', 3),
  ('destination-experiences', 'https://www.instagram.com/p/DX9FthUmdY7/', 4),
  ('nguoi-dan-loi', 'https://www.instagram.com/p/DU7bwxFjl8f/', 0),
  ('nguoi-dan-loi', 'https://www.instagram.com/p/DXBOObXlq50', 1),
  ('nguoi-dan-loi', 'https://www.instagram.com/p/DbXUFkkjG8Z/', 2),
  ('nguoi-dan-loi', 'https://www.instagram.com/p/DVu0y0EDkfZ/', 3),
  ('nature-experiences', 'https://www.instagram.com/p/Dcu3Mo9D4sp/', 0),
  ('nature-experiences', 'https://www.instagram.com/p/DZtvfNBkpQE/', 1),
  ('nature-experiences', 'https://www.instagram.com/p/DYoOCCInDqg/', 2),
  ('nature-experiences', 'https://www.instagram.com/p/DW8EobAkk_o', 3),
  ('nature-experiences', 'https://www.instagram.com/p/DWS35R-jhYx/', 4),
  ('hoi-an-digital-tour', 'https://www.instagram.com/p/DXHEb_vklaa', 0),
  ('hoi-an-digital-tour', 'https://www.instagram.com/p/DS4U64tEvZu/', 1),
  ('daycation', 'https://www.instagram.com/p/DXgHwVPFUrX/', 0),
  ('summit-cinema', 'https://www.instagram.com/p/DX_BUO2js_a', 0),
  ('summit-cinema', 'https://www.instagram.com/p/DTkC3HaEm8I/', 1),
  ('summit-conference-centre', 'https://www.instagram.com/p/DdleIn2jk8J/', 0);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM selected_instagram_posts AS chosen
    LEFT JOIN public.destinations AS destination ON destination.id = chosen.destination_id
    WHERE destination.id IS NULL
  ) THEN
    RAISE EXCEPTION 'An Instagram selection references a missing card';
  END IF;
  IF EXISTS (
    SELECT 1 FROM selected_instagram_posts
    WHERE post_url !~ '^https://www\.instagram\.com/(p|reel)/[A-Za-z0-9_-]+/?(\?img_index=[0-9]+)?$'
  ) THEN
    RAISE EXCEPTION 'Instagram selection has an invalid post URL';
  END IF;
END $$;

-- For edited cards, the supplied five slots are the desired visible selection.
-- Preserve old records for editorial history, but hide URLs outside the selection.
UPDATE public.destination_posts AS post
SET active = false
WHERE EXISTS (
  SELECT 1 FROM selected_instagram_posts AS chosen
  WHERE chosen.destination_id = post.destination_id
) AND NOT EXISTS (
  SELECT 1 FROM selected_instagram_posts AS chosen
  WHERE chosen.destination_id = post.destination_id AND chosen.post_url = post.post_url
) AND post.active;

-- If a URL is already recorded more than once, expose only the oldest row.
WITH ranked AS (
  SELECT post.id, row_number() OVER (
    PARTITION BY post.destination_id, post.post_url
    ORDER BY post.created_at, post.id
  ) AS position
  FROM public.destination_posts AS post
  JOIN selected_instagram_posts AS chosen
    ON chosen.destination_id = post.destination_id
   AND chosen.post_url = post.post_url
)
UPDATE public.destination_posts AS post
SET active = false
FROM ranked
WHERE post.id = ranked.id AND ranked.position > 1 AND post.active;

WITH ranked AS (
  SELECT post.id, chosen.display_order, row_number() OVER (
    PARTITION BY post.destination_id, post.post_url
    ORDER BY post.created_at, post.id
  ) AS position
  FROM public.destination_posts AS post
  JOIN selected_instagram_posts AS chosen
    ON chosen.destination_id = post.destination_id
   AND chosen.post_url = post.post_url
)
UPDATE public.destination_posts AS post
SET active = true, display_order = ranked.display_order
FROM ranked
WHERE post.id = ranked.id AND ranked.position = 1
  AND (NOT post.active OR post.display_order IS DISTINCT FROM ranked.display_order);

INSERT INTO public.destination_posts (destination_id, post_url, display_order)
SELECT chosen.destination_id, chosen.post_url, chosen.display_order
FROM selected_instagram_posts AS chosen
WHERE NOT EXISTS (
  SELECT 1 FROM public.destination_posts AS post
  WHERE post.destination_id = chosen.destination_id
    AND post.post_url = chosen.post_url
);

COMMIT;
