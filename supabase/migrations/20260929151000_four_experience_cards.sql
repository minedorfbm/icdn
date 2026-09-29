-- Editorial experiences: the resort's official pages remain the source of truth.
-- Apply after 20260929150000_daily_schedule_action.sql, in a separate SQL Editor run.
BEGIN;

INSERT INTO public.destinations (
  id, name, level_id, cluster, type, short_description,
  image_key, detail_image_key, content_kind, display_order
) VALUES
  (
    'hoi-an-digital-tour', 'The Quiet Magic of Hoi An', 'heaven', 'EXPERIENCES', 'experience',
    'A guided digital tour through Hoi An’s Old Town, its historic streets and living heritage.',
    'https://www.danang.intercontinental.com/wp-content/uploads/2025/04/New-A-scaled.jpg',
    'https://www.danang.intercontinental.com/wp-content/uploads/2025/04/New-A-scaled.jpg',
    'offer', 18
  ),
  (
    'nature-discovery-guide', 'Nature Discovery Guide', 'earth', 'EXPERIENCES', 'experience',
    'Meet the wildlife and native plants of Son Tra in the resort’s nature discovery guide.',
    'https://www.danang.intercontinental.com/wp-content/uploads/2026/03/Red-shanked-douc-Wildlife-1024x683.jpg',
    'https://www.danang.intercontinental.com/wp-content/uploads/2026/03/Red-shanked-douc-Wildlife-1024x683.jpg',
    'offer', 15
  ),
  (
    'daycation', 'Daycation', 'sea', 'EXPERIENCES', 'experience',
    'Spend a day at the resort with beach and pool access and a choice of dining or wellness experiences.',
    'https://www.danang.intercontinental.com/wp-content/uploads/2025/08/Pool-Friends-1024x683.jpg',
    'https://www.danang.intercontinental.com/wp-content/uploads/2025/08/Pool-Friends-1024x683.jpg',
    'offer', 10
  ),
  (
    'things-to-do', 'Things to Do', 'earth', 'EXPERIENCES', 'recreation',
    'Explore the resort’s recreation and discover the current daily activity schedule.',
    'https://www.danang.intercontinental.com/wp-content/uploads/2026/03/Long-Pool-Outside-2-1024x640.jpg',
    'https://www.danang.intercontinental.com/wp-content/uploads/2026/03/Long-Pool-Outside-2-1024x640.jpg',
    'offer', 16
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.destination_links (destination_id, kind, url, display_order)
SELECT links.destination_id, links.kind::public.destination_link_type, links.url, links.display_order
FROM (VALUES
  ('hoi-an-digital-tour', 'DISCOVER', 'https://www.danang.intercontinental.com/hoi-an-digital-tour/#section_158f05f1', 0),
  ('nature-discovery-guide', 'BROCHURE', 'https://www.danang.intercontinental.com/wp-content/uploads/2026/05/Nature-Discovery-Guide.pdf', 0),
  ('daycation', 'DISCOVER', 'https://www.danang.intercontinental.com/experiences/daycation/', 0),
  ('things-to-do', 'DISCOVER', 'https://www.danang.intercontinental.com/recreation/', 0),
  ('things-to-do', 'DAILY_SCHEDULE', 'https://www.danang.intercontinental.com/wp-content/uploads/2026/09/Your-Guide-to-Fun-Green-Season.pdf', 1)
) AS links(destination_id, kind, url, display_order)
WHERE EXISTS (SELECT 1 FROM public.destinations d WHERE d.id = links.destination_id)
  AND NOT EXISTS (
    SELECT 1 FROM public.destination_links existing
    WHERE existing.destination_id = links.destination_id
      AND existing.kind::text = links.kind
      AND existing.url = links.url
  );

INSERT INTO public.destination_translations (
  destination_id, locale, description, source_description, published
)
SELECT translations.destination_id, translations.locale, translations.description,
       d.short_description, true
FROM (VALUES
  ('hoi-an-digital-tour', 'vi', 'Khám phá phố cổ Hội An qua hành trình số có hướng dẫn, giữa những con phố lịch sử và di sản sống.'),
  ('hoi-an-digital-tour', 'ru', 'Откройте для себя старый город Хойана во время цифровой экскурсии по историческим улицам и живому наследию.'),
  ('hoi-an-digital-tour', 'zh', '通过导览式数字之旅，探索会安古城的历史街巷与鲜活文化遗产。'),
  ('hoi-an-digital-tour', 'ko', '가이드 디지털 투어를 따라 호이안 구시가지의 역사적인 거리와 살아 있는 유산을 만나보세요.'),
  ('hoi-an-digital-tour', 'ja', 'ガイド付きデジタルツアーで、ホイアン旧市街の歴史ある通りと今に息づく文化遺産を巡りましょう。'),
  ('nature-discovery-guide', 'vi', 'Tìm hiểu động vật hoang dã và thực vật bản địa Sơn Trà qua cẩm nang khám phá thiên nhiên của khu nghỉ dưỡng.'),
  ('nature-discovery-guide', 'ru', 'Познакомьтесь с дикой природой и местными растениями полуострова Шонча в путеводителе курорта по природе.'),
  ('nature-discovery-guide', 'zh', '通过度假村的自然探索指南，认识山茶半岛的野生动物与本地植物。'),
  ('nature-discovery-guide', 'ko', '리조트의 자연 탐험 가이드와 함께 선짜반도의 야생동물과 자생 식물을 만나보세요.'),
  ('nature-discovery-guide', 'ja', 'リゾートの自然観察ガイドで、ソンチャ半島の野生動物や在来植物に出会いましょう。'),
  ('daycation', 'vi', 'Tận hưởng một ngày tại khu nghỉ dưỡng với bãi biển, hồ bơi và lựa chọn trải nghiệm ẩm thực hoặc chăm sóc sức khỏe.'),
  ('daycation', 'ru', 'Проведите день на курорте: пляж, бассейны и выбор гастрономических или оздоровительных впечатлений.'),
  ('daycation', 'zh', '在度假村度过美好一天，畅享海滩、泳池，并选择餐饮或康养体验。'),
  ('daycation', 'ko', '리조트에서 하루를 보내며 해변과 수영장을 즐기고 다이닝 또는 웰니스 경험을 선택해 보세요.'),
  ('daycation', 'ja', 'ビーチやプールを楽しみ、ダイニングまたはウェルネス体験を選んで、リゾートで一日を過ごしましょう。'),
  ('things-to-do', 'vi', 'Khám phá các hoạt động giải trí tại khu nghỉ dưỡng và xem lịch hoạt động hằng ngày mới nhất.'),
  ('things-to-do', 'ru', 'Откройте для себя развлечения курорта и узнайте актуальное расписание мероприятий на день.'),
  ('things-to-do', 'zh', '探索度假村的休闲活动，并查看最新每日活动安排。'),
  ('things-to-do', 'ko', '리조트의 다양한 액티비티를 둘러보고 최신 일일 프로그램을 확인하세요.'),
  ('things-to-do', 'ja', 'リゾートのアクティビティを探し、最新のデイリースケジュールをご覧ください。')
) AS translations(destination_id, locale, description)
JOIN public.destinations d ON d.id = translations.destination_id
ON CONFLICT (destination_id, locale) DO NOTHING;

COMMIT;
