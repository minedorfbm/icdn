-- Place Citron in Heaven and publish the two official resort videos.
-- Safe to run in production before GitHub merges this migration.
BEGIN;

UPDATE public.destinations
SET level_id = 'heaven', display_order = 17
WHERE id = 'citron' AND level_id IS DISTINCT FROM 'heaven';

INSERT INTO public.destination_videos
  (destination_id, video_url, title, title_translations, display_order, active)
VALUES
  (
    'bensley-package',
    'https://www.youtube.com/watch?v=pNOVYJjXN-c',
    'Bill Bensley''s Design Story',
    '{"vi":"Câu chuyện thiết kế của Bill Bensley","ru":"История дизайна Билла Бенсли","zh":"比尔·本斯利的设计故事","ko":"빌 벤슬리의 디자인 이야기","ja":"ビル・ベンスリーのデザインストーリー"}'::jsonb,
    0,
    true
  ),
  (
    'citron',
    'https://www.youtube.com/watch?v=PVN005yvGpY',
    'Vietnamese Cuisine with Chef Thu',
    '{"vi":"Ẩm thực Việt Nam cùng Bếp trưởng Thu","ru":"Вьетнамская кухня с шеф-поваром Тху","zh":"与 Thu 主厨一起探索越南美食","ko":"투 셰프와 함께하는 베트남 요리","ja":"トゥーシェフと楽しむベトナム料理"}'::jsonb,
    0,
    true
  )
ON CONFLICT (destination_id, video_url) DO UPDATE
SET title = EXCLUDED.title,
    title_translations = EXCLUDED.title_translations,
    display_order = EXCLUDED.display_order,
    active = EXCLUDED.active;

COMMIT;
