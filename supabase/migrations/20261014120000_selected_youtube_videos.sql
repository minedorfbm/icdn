-- User-selected videos from destination_videos_selection_20_cards.csv, verified 14 October 2026.
-- Existing videos on other cards remain published. La Maison's existing row is replaced in place.
-- Reuse an existing equivalent YouTube ID to prevent watch/shorts URL aliases creating duplicates.
BEGIN;
DO $import$
DECLARE rows jsonb := $selection$[
  {
    "destination_id": "bensley-gallery",
    "video_url": "https://www.youtube.com/watch?v=pNOVYJjXN-c",
    "title": "The Story Behind Bill Bensley's Design at InterContinental Danang Sun Peninsula Resort",
    "title_translations": {
      "vi": "Câu chuyện đằng sau thiết kế của Bill Bensley tại InterContinental Danang Sun Peninsula Resort",
      "ru": "История дизайна Билла Бенсли в InterContinental Danang Sun Peninsula Resort",
      "zh": "InterContinental Danang Sun Peninsula Resort 背后的比尔·本斯利设计故事",
      "ko": "InterContinental Danang Sun Peninsula Resort에 담긴 빌 벤슬리의 디자인 이야기",
      "ja": "InterContinental Danang Sun Peninsula Resortに息づくビル・ベンスリーのデザインストーリー"
    },
    "display_order": 0,
    "active": true,
    "video_id": "pNOVYJjXN-c"
  },
  {
    "destination_id": "club-intercontinental",
    "video_url": "https://www.youtube.com/watch?v=iMZ7Y1VwVRk",
    "title": "Introducing the Six-Bedroom Sun Peninsula Residence",
    "title_translations": {
      "vi": "Giới thiệu Sun Peninsula Residence sáu phòng ngủ",
      "ru": "Представляем Sun Peninsula Residence с шестью спальнями",
      "zh": "探索六卧室 Sun Peninsula Residence",
      "ko": "6베드룸 Sun Peninsula Residence 소개",
      "ja": "6ベッドルームのSun Peninsula Residenceをご紹介"
    },
    "display_order": 0,
    "active": true,
    "video_id": "iMZ7Y1VwVRk"
  },
  {
    "destination_id": "daycation",
    "video_url": "https://www.youtube.com/shorts/dSR0Cxfa8lc",
    "title": "Sun's Out",
    "title_translations": {
      "vi": "Nắng lên rồi",
      "ru": "Солнце вышло",
      "zh": "阳光正好",
      "ko": "햇살이 찾아왔어요",
      "ja": "太陽が顔を出したら"
    },
    "display_order": 0,
    "active": true,
    "video_id": "dSR0Cxfa8lc"
  },
  {
    "destination_id": "design-digital-tour",
    "video_url": "https://www.youtube.com/watch?v=pNOVYJjXN-c",
    "title": "The Story Behind Bill Bensley's Design at InterContinental Danang Sun Peninsula Resort",
    "title_translations": {
      "vi": "Câu chuyện đằng sau thiết kế của Bill Bensley tại InterContinental Danang Sun Peninsula Resort",
      "ru": "История дизайна Билла Бенсли в InterContinental Danang Sun Peninsula Resort",
      "zh": "InterContinental Danang Sun Peninsula Resort 背后的比尔·本斯利设计故事",
      "ko": "InterContinental Danang Sun Peninsula Resort에 담긴 빌 벤슬리의 디자인 이야기",
      "ja": "InterContinental Danang Sun Peninsula Resortに息づくビル・ベンスリーのデザインストーリー"
    },
    "display_order": 0,
    "active": true,
    "video_id": "pNOVYJjXN-c"
  },
  {
    "destination_id": "destination-experiences",
    "video_url": "https://www.youtube.com/watch?v=wOlIC6PrHKU",
    "title": "This is Danang - bold, breathtaking, and beautifully unforgettable.",
    "title_translations": {
      "vi": "Đây là Đà Nẵng — rực rỡ, ngoạn mục và đẹp khó quên",
      "ru": "Это Дананг — яркий, захватывающий и незабываемо прекрасный",
      "zh": "这就是岘港——热情奔放、令人惊叹，美得难忘",
      "ko": "이곳은 다낭 — 대담하고, 숨 막히게 아름답고, 잊을 수 없는 곳",
      "ja": "ここはダナン。鮮やかで、息をのむほど美しく、忘れられない場所"
    },
    "display_order": 0,
    "active": true,
    "video_id": "wOlIC6PrHKU"
  },
  {
    "destination_id": "four-bedroom-pool-villa",
    "video_url": "https://www.youtube.com/shorts/JAYTdVPPQcc",
    "title": "Discover the Four Bedroom Pool Villas of InterContinental Danang",
    "title_translations": {
      "vi": "Khám phá biệt thự hồ bơi bốn phòng ngủ tại InterContinental Danang",
      "ru": "Откройте виллы с четырьмя спальнями и бассейном в InterContinental Danang",
      "zh": "探索 InterContinental Danang 四卧室泳池别墅",
      "ko": "InterContinental Danang의 4베드룸 풀 빌라를 만나보세요",
      "ja": "InterContinental Danangの4ベッドルーム・プールヴィラをご紹介"
    },
    "display_order": 0,
    "active": true,
    "video_id": "JAYTdVPPQcc"
  },
  {
    "destination_id": "la-maison-1888",
    "video_url": "https://www.youtube.com/shorts/lS2GKpbnBWw",
    "title": "This is La Maison 1888 in motion",
    "title_translations": {
      "vi": "La Maison 1888 qua từng khoảnh khắc",
      "ru": "La Maison 1888 в движении",
      "zh": "镜头中的 La Maison 1888",
      "ko": "영상으로 만나는 La Maison 1888",
      "ja": "映像で感じるLa Maison 1888"
    },
    "display_order": 0,
    "active": true,
    "video_id": "lS2GKpbnBWw",
    "replace_id": "31fcb118-a825-4c1b-b2a5-2bc9b07f59ce",
    "replace_url": "https://www.youtube.com/shorts/7Iw_hUG-pD0"
  },
  {
    "destination_id": "long-bar",
    "video_url": "https://www.youtube.com/shorts/nlMHZZX7Gso",
    "title": "L_O_N_G Bar's long sunsets at InterContinental Danang",
    "title_translations": {
      "vi": "Hoàng hôn dài bất tận tại L_O_N_G Bar, InterContinental Danang",
      "ru": "Долгие закаты в L_O_N_G Bar, InterContinental Danang",
      "zh": "InterContinental Danang L_O_N_G Bar 的悠长日落",
      "ko": "InterContinental Danang L_O_N_G Bar의 오래도록 이어지는 노을",
      "ja": "InterContinental Danang、L_O_N_G Barのゆったりとした夕暮れ"
    },
    "display_order": 0,
    "active": true,
    "video_id": "nlMHZZX7Gso"
  },
  {
    "destination_id": "long-pool",
    "video_url": "https://www.youtube.com/shorts/twUPMrfdjZ8",
    "title": "Always something to discover at Vietnam's Best Resort, InterContinental Danang",
    "title_translations": {
      "vi": "Luôn có điều mới để khám phá tại InterContinental Danang, khu nghỉ dưỡng tốt nhất Việt Nam",
      "ru": "Всегда есть что открыть в InterContinental Danang, лучшем курорте Вьетнама",
      "zh": "在越南最佳度假村 InterContinental Danang，总有新的发现",
      "ko": "베트남 최고의 리조트 InterContinental Danang에는 언제나 새로운 발견이 있습니다",
      "ja": "ベトナム最高のリゾート、InterContinental Danangには、いつも新たな発見が待っています"
    },
    "display_order": 0,
    "active": true,
    "video_id": "twUPMrfdjZ8"
  },
  {
    "destination_id": "m-club",
    "video_url": "https://www.youtube.com/shorts/q7OwsvOM64M",
    "title": "M Club Tour",
    "title_translations": {
      "vi": "Khám phá M Club",
      "ru": "Знакомство с M Club",
      "zh": "探索 M Club",
      "ko": "M Club 둘러보기",
      "ja": "M Clubをご案内"
    },
    "display_order": 0,
    "active": true,
    "video_id": "q7OwsvOM64M"
  },
  {
    "destination_id": "moulin-rouge",
    "video_url": "https://www.youtube.com/shorts/aMTJoO5NlDk",
    "title": "Time travel through the decades at the Mrouge Karaoke Lounge at InterContinental Danang",
    "title_translations": {
      "vi": "Du hành qua các thập niên tại Mrouge Karaoke Lounge, InterContinental Danang",
      "ru": "Путешествие сквозь десятилетия в Mrouge Karaoke Lounge, InterContinental Danang",
      "zh": "在 InterContinental Danang 的 Mrouge Karaoke Lounge 穿越时光",
      "ko": "InterContinental Danang의 Mrouge Karaoke Lounge에서 시대를 넘나드는 여행",
      "ja": "InterContinental DanangのMrouge Karaoke Loungeで、時代を巡る旅へ"
    },
    "display_order": 0,
    "active": true,
    "video_id": "aMTJoO5NlDk"
  },
  {
    "destination_id": "nam-tram",
    "video_url": "https://www.youtube.com/shorts/ZXJKT8WTR9s",
    "title": "Nam Tram",
    "title_translations": {
      "vi": "Nam Tram",
      "ru": "Nam Tram",
      "zh": "Nam Tram",
      "ko": "Nam Tram",
      "ja": "Nam Tram"
    },
    "display_order": 0,
    "active": true,
    "video_id": "ZXJKT8WTR9s"
  },
  {
    "destination_id": "nature-experiences",
    "video_url": "https://www.youtube.com/shorts/xbIJCj3OkXQ",
    "title": "Son Tra Wildlife Expedition",
    "title_translations": {
      "vi": "Khám phá thiên nhiên hoang dã Sơn Trà",
      "ru": "Экспедиция к дикой природе Сонча",
      "zh": "探索山茶半岛野生动物",
      "ko": "선짜 야생동물 탐험",
      "ja": "ソンチャ半島の野生動物探訪"
    },
    "display_order": 0,
    "active": true,
    "video_id": "xbIJCj3OkXQ"
  },
  {
    "destination_id": "nguoi-dan-loi",
    "video_url": "https://www.youtube.com/watch?v=iMZ7Y1VwVRk",
    "title": "Introducing the Six-Bedroom Sun Peninsula Residence",
    "title_translations": {
      "vi": "Giới thiệu Sun Peninsula Residence sáu phòng ngủ",
      "ru": "Представляем Sun Peninsula Residence с шестью спальнями",
      "zh": "探索六卧室 Sun Peninsula Residence",
      "ko": "6베드룸 Sun Peninsula Residence 소개",
      "ja": "6ベッドルームのSun Peninsula Residenceをご紹介"
    },
    "display_order": 0,
    "active": true,
    "video_id": "iMZ7Y1VwVRk"
  },
  {
    "destination_id": "one-bedroom-seaside-villa-by-the-beach",
    "video_url": "https://www.youtube.com/shorts/K-MR2IE1-bI",
    "title": "The pleasure of Danang's leading Beach Villa at InterContinental Danang.",
    "title_translations": {
      "vi": "Tận hưởng biệt thự biển hàng đầu Đà Nẵng tại InterContinental Danang",
      "ru": "Наслаждение отдыхом в ведущей пляжной вилле Дананга, InterContinental Danang",
      "zh": "在 InterContinental Danang 尽享岘港顶级海滩别墅",
      "ko": "InterContinental Danang에서 즐기는 다낭 최고의 비치 빌라",
      "ja": "InterContinental Danangで楽しむ、ダナンを代表するビーチヴィラ"
    },
    "display_order": 0,
    "active": true,
    "video_id": "K-MR2IE1-bI"
  },
  {
    "destination_id": "penthouses",
    "video_url": "https://www.youtube.com/shorts/W44d8sGtPko",
    "title": "Special Villas for a Special Stay at InterContinental Danang",
    "title_translations": {
      "vi": "Biệt thự đặc biệt cho kỳ nghỉ đặc biệt tại InterContinental Danang",
      "ru": "Особенные виллы для особенного отдыха в InterContinental Danang",
      "zh": "InterContinental Danang 的非凡别墅，成就非凡假期",
      "ko": "InterContinental Danang의 특별한 빌라에서 보내는 특별한 휴식",
      "ja": "InterContinental Danangの特別なヴィラで、特別な滞在を"
    },
    "display_order": 0,
    "active": true,
    "video_id": "W44d8sGtPko"
  },
  {
    "destination_id": "spa-lagoon-villas",
    "video_url": "https://www.youtube.com/shorts/Nos7bF1W1Y0",
    "title": "A stay filled with rejuvenation and relaxation with our Spa Lagoon Villas at InterContinental Danang",
    "title_translations": {
      "vi": "Kỳ nghỉ phục hồi và thư giãn tại Spa Lagoon Villas, InterContinental Danang",
      "ru": "Отдых, полный восстановления и расслабления, в Spa Lagoon Villas, InterContinental Danang",
      "zh": "在 InterContinental Danang 的 Spa Lagoon Villas，享受焕活身心的放松假期",
      "ko": "InterContinental Danang Spa Lagoon Villas에서 재충전과 휴식으로 가득한 시간",
      "ja": "InterContinental DanangのSpa Lagoon Villasで、心身を癒すくつろぎの滞在"
    },
    "display_order": 0,
    "active": true,
    "video_id": "Nos7bF1W1Y0"
  },
  {
    "destination_id": "three-bedroom-bai-bac-bay-villa",
    "video_url": "https://www.youtube.com/shorts/Pj6zHnFGq3E",
    "title": "The perfect rainforest escape at the Bai Bac Bay Villa at InterContinental Danang",
    "title_translations": {
      "vi": "Chốn nghỉ dưỡng giữa rừng nhiệt đới tại Bai Bac Bay Villa, InterContinental Danang",
      "ru": "Идеальный отдых среди тропического леса в Bai Bac Bay Villa, InterContinental Danang",
      "zh": "在 InterContinental Danang 的 Bai Bac Bay Villa，开启理想的热带雨林假期",
      "ko": "InterContinental Danang Bai Bac Bay Villa에서 즐기는 완벽한 열대우림 휴식",
      "ja": "InterContinental DanangのBai Bac Bay Villaで、熱帯雨林に包まれる理想の休日"
    },
    "display_order": 0,
    "active": true,
    "video_id": "Pj6zHnFGq3E"
  },
  {
    "destination_id": "weddings",
    "video_url": "https://www.youtube.com/watch?v=pVQX1CcHE_Y",
    "title": "Where Happily Ever After Is Just The Beginning...",
    "title_translations": {
      "vi": "Nơi hạnh phúc mãi mãi chỉ là khởi đầu…",
      "ru": "Где «долго и счастливо» — лишь начало…",
      "zh": "幸福永远，从这里开始……",
      "ko": "행복한 결말이 새로운 시작이 되는 곳…",
      "ja": "末永い幸せの物語が、ここから始まる…"
    },
    "display_order": 0,
    "active": true,
    "video_id": "pVQX1CcHE_Y"
  },
  {
    "destination_id": "wine-cellar",
    "video_url": "https://www.youtube.com/shorts/7Iw_hUG-pD0",
    "title": "A dish is never alone at La Maison 1888",
    "title_translations": {
      "vi": "Mỗi món ăn đều có bạn đồng hành tại La Maison 1888",
      "ru": "Ни одно блюдо не бывает одиноким в La Maison 1888",
      "zh": "在 La Maison 1888，每道菜都有佳伴",
      "ko": "라 메종 1888에서는 모든 요리가 조화를 이룹니다",
      "ja": "ラ・メゾン1888では、料理は一皿だけでは完成しません"
    },
    "display_order": 0,
    "active": true,
    "video_id": "7Iw_hUG-pD0"
  }
]$selection$::jsonb;
 r jsonb; candidate uuid; matches integer; actual record;
BEGIN
 FOR r IN SELECT value FROM jsonb_array_elements(rows) LOOP
  IF NOT EXISTS(SELECT 1 FROM public.destinations WHERE id=r->>'destination_id' AND active) THEN
   RAISE EXCEPTION 'Selected destination is unavailable: %',r->>'destination_id';
  END IF;
  IF r ? 'replace_id' THEN
   SELECT * INTO actual FROM public.destination_videos WHERE id=(r->>'replace_id')::uuid FOR UPDATE;
   IF NOT FOUND OR actual.destination_id IS DISTINCT FROM r->>'destination_id' OR actual.video_url NOT IN (r->>'replace_url',r->>'video_url') THEN
    RAISE EXCEPTION 'La Maison video changed since selection';
   END IF;
   candidate:=actual.id;
   IF EXISTS(SELECT 1 FROM public.destination_videos v WHERE v.destination_id=r->>'destination_id' AND v.id<>candidate AND v.active) THEN
    RAISE EXCEPTION 'La Maison has an additional video; review before replacement';
   END IF;
  ELSE
   SELECT count(*), min(v.id::text)::uuid INTO matches,candidate FROM public.destination_videos v
   WHERE v.destination_id=r->>'destination_id' AND
    (regexp_match(v.video_url,'(?:[?&]v=|/shorts/|/embed/|youtu[.]be/)([A-Za-z0-9_-]{11})'))[1]=r->>'video_id';
   IF matches>1 THEN RAISE EXCEPTION 'Duplicate existing video IDs for %',r->>'destination_id'; END IF;
  END IF;
  IF candidate IS NULL THEN
   INSERT INTO public.destination_videos(destination_id,video_url,title,title_translations,display_order,active)
   VALUES(r->>'destination_id',r->>'video_url',r->>'title',r->'title_translations',(r->>'display_order')::integer,true);
  ELSE
   UPDATE public.destination_videos SET video_url=r->>'video_url',title=r->>'title',title_translations=r->'title_translations',display_order=(r->>'display_order')::integer,active=true
   WHERE id=candidate AND (video_url,title,title_translations,display_order,active) IS DISTINCT FROM
    (r->>'video_url',r->>'title',r->'title_translations',(r->>'display_order')::integer,true);
  END IF;
 END LOOP;
END;
$import$;
COMMIT;
