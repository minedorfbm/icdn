-- Publish the two official resort Shorts in their matching destination cards.
BEGIN;

INSERT INTO public.destination_videos
  (destination_id, video_url, title, title_translations, display_order, active)
VALUES
  (
    'la-maison-1888',
    'https://www.youtube.com/shorts/7Iw_hUG-pD0',
    'A dish is never alone at La Maison 1888',
    '{"vi":"Mỗi món ăn đều có bạn đồng hành tại La Maison 1888","ru":"Ни одно блюдо не бывает одиноким в La Maison 1888","zh":"在 La Maison 1888，每道菜都有佳伴","ko":"라 메종 1888에서는 모든 요리가 조화를 이룹니다","ja":"ラ・メゾン1888では、料理は一皿だけでは完成しません"}'::jsonb,
    0,
    true
  ),
  (
    'tingara',
    'https://www.youtube.com/shorts/U0wEetsXMuE',
    'Lobster on the Grill at Tingara Modern Japanese Danang',
    '{"vi":"Tôm hùm nướng tại Tingara Modern Japanese Đà Nẵng","ru":"Лобстер на гриле в Tingara Modern Japanese Danang","zh":"岘港 Tingara 现代日式餐厅的烤龙虾","ko":"다낭 팅가라 모던 재패니즈의 그릴 랍스터","ja":"ダナンのTingara Modern Japaneseで味わうロブスターのグリル"}'::jsonb,
    0,
    true
  )
ON CONFLICT (destination_id, video_url) DO UPDATE
SET title = EXCLUDED.title,
    title_translations = EXCLUDED.title_translations,
    display_order = EXCLUDED.display_order,
    active = EXCLUDED.active;

COMMIT;
