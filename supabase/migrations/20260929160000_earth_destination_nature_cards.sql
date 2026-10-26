-- Two editorial experience collections on EARTH. Their official pages remain editable links.
BEGIN;

INSERT INTO public.destinations (
  id, name, level_id, cluster, type, short_description,
  image_key, detail_image_key, content_kind, display_order
) VALUES
  (
    'destination-experiences', 'Destination', 'earth', 'EXPERIENCES', 'experience',
    'Explore Hoi An, Da Nang and Central Vietnam’s cultural landmarks with ideas from the resort concierge.',
    'https://www.danang.intercontinental.com/wp-content/uploads/2023/02/happy-woman-wearing-ao-dai-vietnamese-dress-with-colorful-lanterns-traveler-sightseeing-hoi-ancient-town-central-vietnamlandmark-tourist-attractionsvietnam-southeast-travel-concept-1024x683.jpg',
    'https://www.danang.intercontinental.com/wp-content/uploads/2023/02/happy-woman-wearing-ao-dai-vietnamese-dress-with-colorful-lanterns-traveler-sightseeing-hoi-ancient-town-central-vietnamlandmark-tourist-attractionsvietnam-southeast-travel-concept-1024x683.jpg',
    'offer', 17
  ),
  (
    'nature-experiences', 'Nature', 'earth', 'EXPERIENCES', 'experience',
    'Discover Son Tra’s forest, wildlife and guided nature experiences around the resort.',
    'https://www.danang.intercontinental.com/wp-content/uploads/2021/06/4.-1000-Year-Old-Banyan-Tree-in-Son-Tra-Peninsula.jpg',
    'https://www.danang.intercontinental.com/wp-content/uploads/2021/06/4.-1000-Year-Old-Banyan-Tree-in-Son-Tra-Peninsula.jpg',
    'offer', 18
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.destination_links (destination_id, kind, url, display_order)
SELECT links.destination_id, 'DISCOVER'::public.destination_link_type, links.url, 0
FROM (VALUES
  ('destination-experiences', 'https://www.danang.intercontinental.com/experiences/destination/'),
  ('nature-experiences', 'https://www.danang.intercontinental.com/experiences/nature/')
) AS links(destination_id, url)
WHERE EXISTS (SELECT 1 FROM public.destinations d WHERE d.id = links.destination_id)
  AND NOT EXISTS (
    SELECT 1 FROM public.destination_links existing
    WHERE existing.destination_id = links.destination_id
      AND existing.kind = 'DISCOVER'::public.destination_link_type
      AND existing.url = links.url
  );

INSERT INTO public.destination_translations (
  destination_id, locale, description, source_description, published
)
SELECT translations.destination_id, translations.locale, translations.description,
       d.short_description, true
FROM (VALUES
  ('destination-experiences', 'vi', 'Khám phá Hội An, Đà Nẵng và các di sản văn hóa miền Trung qua gợi ý của đội ngũ concierge khu nghỉ dưỡng.'),
  ('destination-experiences', 'ru', 'Откройте для себя Хойан, Дананг и культурные достопримечательности Центрального Вьетнама с советами консьержа курорта.'),
  ('destination-experiences', 'zh', '跟随度假村礼宾团队的推荐，探索会安、岘港及越南中部的文化名胜。'),
  ('destination-experiences', 'ko', '리조트 컨시어지의 추천을 따라 호이안과 다낭, 베트남 중부의 문화 명소를 탐험해 보세요.'),
  ('destination-experiences', 'ja', 'リゾートのコンシェルジュのおすすめを参考に、ホイアン、ダナン、ベトナム中部の文化名所を巡りましょう。'),
  ('nature-experiences', 'vi', 'Khám phá rừng Sơn Trà, động vật hoang dã và những trải nghiệm thiên nhiên có hướng dẫn quanh khu nghỉ dưỡng.'),
  ('nature-experiences', 'ru', 'Откройте для себя лес Шонча, его дикую природу и прогулки с гидом вокруг курорта.'),
  ('nature-experiences', 'zh', '探索山茶半岛的森林、野生动物，以及度假村周边的导览自然体验。'),
  ('nature-experiences', 'ko', '리조트 주변에서 선짜반도의 숲과 야생동물을 만나고 가이드와 함께 자연을 탐험해 보세요.'),
  ('nature-experiences', 'ja', 'リゾート周辺でソンチャ半島の森や野生動物に出会い、ガイド付きの自然体験を楽しみましょう。')
) AS translations(destination_id, locale, description)
JOIN public.destinations d ON d.id = translations.destination_id
ON CONFLICT (destination_id, locale) DO NOTHING;

COMMIT;
