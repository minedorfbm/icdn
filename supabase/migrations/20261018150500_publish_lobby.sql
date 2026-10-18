-- Publish the existing reception destination as Lobby, preserving its canonical map association.
-- User-selected photos: lobby image 1.jpeg (card), lobby 2.jpeg (expanded cover).
-- Upload both WebP files to hub-images before applying.
BEGIN;
DO $lobby$
BEGIN
 PERFORM 1 FROM public.destinations WHERE id='reception' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Canonical reception destination missing'; END IF;
END $lobby$;
UPDATE public.destinations SET name='Lobby',level_id='heaven',active=true,
 short_description='A welcome above the bay, where striking architecture frames panoramic views from Heaven Level.',
 detail_description='Begin your stay at Heaven Level, where the lobby opens onto sweeping views of the resort and bay. Relax among the daybeds and water features, then step onto the balcony to take in the landscape. Bill Bensley’s distinctive architecture makes this arrival space a memorable place to pause and photograph.',
 image_key='https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/lobby-home-1f49ee3645a5.webp',
 detail_image_key='https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/lobby-detail-9e22a8d3e52a.webp',
 image_position='50% 50%',search_keywords=ARRAY['lobby','reception','arrival','check in','concierge','balcony','photo'], primary_link_id=NULL
WHERE id='reception' AND (NOT active OR name<>'Lobby' OR detail_description IS DISTINCT FROM 'Begin your stay at Heaven Level, where the lobby opens onto sweeping views of the resort and bay. Relax among the daybeds and water features, then step onto the balcony to take in the landscape. Bill Bensley’s distinctive architecture makes this arrival space a memorable place to pause and photograph.');
-- Retire the old placeholder Discover-to-contact link, without touching other actions.
UPDATE public.destination_links SET active=false
WHERE destination_id='reception' AND kind='DISCOVER' AND url='https://www.danang.intercontinental.com/contact-us/' AND active;
INSERT INTO public.destination_translations(destination_id,locale,description,source_description,detail_description,source_detail_description,published)
SELECT 'reception',locale,description,source_description,detail_description,source_detail_description,true
FROM jsonb_to_recordset($copy$[
  {
    "locale": "vi",
    "description": "Lời chào đón trên vịnh biển, nơi kiến trúc ấn tượng ôm trọn tầm nhìn toàn cảnh từ tầng Heaven.",
    "source_description": "A welcome above the bay, where striking architecture frames panoramic views from Heaven Level.",
    "detail_description": "Bắt đầu kỳ nghỉ tại tầng Heaven, nơi sảnh đón tiếp mở ra tầm nhìn bao quát khu nghỉ dưỡng và vịnh biển. Thư giãn bên những ghế nằm và tiểu cảnh nước, rồi bước ra ban công để ngắm cảnh. Kiến trúc đặc trưng của Bill Bensley biến không gian đón khách này thành một điểm dừng chân và chụp ảnh đáng nhớ.",
    "source_detail_description": "Begin your stay at Heaven Level, where the lobby opens onto sweeping views of the resort and bay. Relax among the daybeds and water features, then step onto the balcony to take in the landscape. Bill Bensley’s distinctive architecture makes this arrival space a memorable place to pause and photograph."
  },
  {
    "locale": "ru",
    "description": "Добро пожаловать над заливом: выразительная архитектура обрамляет панорамные виды с уровня Heaven.",
    "source_description": "A welcome above the bay, where striking architecture frames panoramic views from Heaven Level.",
    "detail_description": "Начните отдых на уровне Heaven: из вестибюля открывается широкий вид на курорт и залив. Отдохните среди лежаков и водных композиций, затем выйдите на балкон полюбоваться пейзажем. Самобытная архитектура Билла Бенсли делает это пространство для встречи гостей запоминающимся местом для отдыха и фотографий.",
    "source_detail_description": "Begin your stay at Heaven Level, where the lobby opens onto sweeping views of the resort and bay. Relax among the daybeds and water features, then step onto the balcony to take in the landscape. Bill Bensley’s distinctive architecture makes this arrival space a memorable place to pause and photograph."
  },
  {
    "locale": "zh",
    "description": "在 Heaven 层俯瞰海湾，以别致建筑为框，迎接开阔全景。",
    "source_description": "A welcome above the bay, where striking architecture frames panoramic views from Heaven Level.",
    "detail_description": "从 Heaven 层开启度假时光，大堂将度假村与海湾的开阔景致尽收眼底。在躺椅与水景之间放松片刻，再步入阳台欣赏风景。Bill Bensley 独具特色的建筑设计，让这处迎宾空间成为值得停留与拍照的地方。",
    "source_detail_description": "Begin your stay at Heaven Level, where the lobby opens onto sweeping views of the resort and bay. Relax among the daybeds and water features, then step onto the balcony to take in the landscape. Bill Bensley’s distinctive architecture makes this arrival space a memorable place to pause and photograph."
  },
  {
    "locale": "ko",
    "description": "Heaven 레벨에서 인상적인 건축과 탁 트인 전망이 만 위의 환영을 전합니다.",
    "source_description": "A welcome above the bay, where striking architecture frames panoramic views from Heaven Level.",
    "detail_description": "Heaven 레벨의 로비에서 리조트와 만의 탁 트인 전망을 바라보며 여행을 시작하세요. 데이베드와 수경 시설 사이에서 쉬다가 발코니로 나가 풍경을 감상해보세요. 빌 벤슬리 특유의 건축미가 도착의 순간을 잠시 머물며 사진으로 남기고 싶은 장면으로 만듭니다.",
    "source_detail_description": "Begin your stay at Heaven Level, where the lobby opens onto sweeping views of the resort and bay. Relax among the daybeds and water features, then step onto the balcony to take in the landscape. Bill Bensley’s distinctive architecture makes this arrival space a memorable place to pause and photograph."
  },
  {
    "locale": "ja",
    "description": "湾を見渡すHeavenレベルへ。印象的な建築が、雄大な眺めを美しく縁取ります。",
    "source_description": "A welcome above the bay, where striking architecture frames panoramic views from Heaven Level.",
    "detail_description": "Heavenレベルのロビーから、リゾートと湾を見渡す滞在が始まります。デイベッドや水景のそばでくつろぎ、バルコニーへ出て景色を楽しんでください。ビル・ベンズリーならではの建築が、到着のひとときを、立ち止まって写真に残したくなる時間に変えます。",
    "source_detail_description": "Begin your stay at Heaven Level, where the lobby opens onto sweeping views of the resort and bay. Relax among the daybeds and water features, then step onto the balcony to take in the landscape. Bill Bensley’s distinctive architecture makes this arrival space a memorable place to pause and photograph."
  }
]$copy$::jsonb)
AS t(locale text,description text,source_description text,detail_description text,source_detail_description text)
ON CONFLICT(destination_id,locale) DO UPDATE SET description=EXCLUDED.description,source_description=EXCLUDED.source_description,
 detail_description=EXCLUDED.detail_description,source_detail_description=EXCLUDED.source_detail_description,published=true
WHERE (destination_translations.description,destination_translations.source_description,destination_translations.detail_description,destination_translations.source_detail_description,destination_translations.published)
 IS DISTINCT FROM (EXCLUDED.description,EXCLUDED.source_description,EXCLUDED.detail_description,EXCLUDED.source_detail_description,true);
INSERT INTO public.map_destination_links(place_id,destination_id,display_order,is_primary,active)
VALUES('lobby','reception',0,true,true)
ON CONFLICT(place_id,destination_id) DO UPDATE SET active=true,is_primary=true
WHERE NOT map_destination_links.active OR NOT map_destination_links.is_primary;
UPDATE public.map_places SET level_id='heaven' WHERE id='lobby' AND level_id<>'heaven';
-- Media for Lobby and the Top 9 guide is imported together by the next migration.
COMMIT;
