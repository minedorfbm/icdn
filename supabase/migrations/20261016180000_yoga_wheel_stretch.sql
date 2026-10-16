-- Yoga Wheel Stretch is distinct from Yoga Flow, as clarified by the owner.
-- Tuesday/Sunday 07:30 slot from the official detailed programme.
BEGIN;
DO $wellness$
DECLARE p jsonb; t record; event_record public.destination_events%ROWTYPE;
  translation_record public.event_translations%ROWTYPE; next_order integer; match_count integer;
BEGIN
 FOR p IN SELECT value FROM jsonb_array_elements($data$[
  {
    "key": "yoga-wheel-stretch",
    "destination_id": "yoga-pavilion",
    "title": "Yoga Wheel Stretch",
    "schedule": [
      "TUESDAY AND SUNDAY",
      "07:30 – 08:30"
    ],
    "description": "Explore supported stretches using a yoga wheel at the beachside Yoga Pavilion. Register with the Concierge by 17:00 the day before.",
    "url": "https://www.danang.intercontinental.com/wp-content/uploads/2026/08/Your-Guide-to-Fun-at-InterContinental-Danang.pdf",
    "translations": {
      "vi": [
        "Giãn cơ với vòng yoga",
        [
          "THỨ BA VÀ CHỦ NHẬT",
          "07:30 – 08:30"
        ],
        "Khám phá các động tác giãn cơ có hỗ trợ bằng vòng yoga tại Yoga Pavilion bên biển. Đăng ký với bộ phận Concierge trước 17:00 ngày hôm trước."
      ],
      "ru": [
        "Растяжка с колесом для йоги",
        [
          "ВТОРНИК И ВОСКРЕСЕНЬЕ",
          "07:30 – 08:30"
        ],
        "Попробуйте растяжку с опорой на колесо для йоги в павильоне у пляжа. Запишитесь у консьержа до 17:00 накануне."
      ],
      "zh": [
        "瑜伽轮伸展",
        [
          "周二及周日",
          "07:30 – 08:30"
        ],
        "在海滨瑜伽亭体验使用瑜伽轮辅助的伸展练习。请于前一天17:00前向礼宾部报名。"
      ],
      "ko": [
        "요가 휠 스트레칭",
        [
          "화요일·일요일",
          "07:30 – 08:30"
        ],
        "해변의 요가 파빌리온에서 요가 휠을 활용한 스트레칭을 경험하세요. 전날 17:00까지 컨시어지에 신청해 주세요."
      ],
      "ja": [
        "ヨガホイールストレッチ",
        [
          "火曜・日曜",
          "07:30 – 08:30"
        ],
        "ビーチサイドのヨガパビリオンで、ヨガホイールを使ったストレッチを体験してください。前日の17:00までにコンシェルジュへお申し込みください。"
      ]
    }
  }
]$data$::jsonb) LOOP
  PERFORM 1 FROM public.destinations WHERE id=p->>'destination_id' AND active FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing active wellness card: %',p->>'destination_id'; END IF;
  SELECT count(*) INTO match_count FROM public.destination_events
   WHERE destination_id=p->>'destination_id' AND lower(trim(title))=lower(p->>'title');
  IF match_count>1 THEN RAISE EXCEPTION 'Duplicate wellness event: %',p->>'key'; END IF;
  IF match_count=1 THEN
   SELECT * INTO STRICT event_record FROM public.destination_events
    WHERE destination_id=p->>'destination_id' AND lower(trim(title))=lower(p->>'title') FOR UPDATE;
   IF NOT event_record.active OR event_record.title IS DISTINCT FROM p->>'title'
    OR to_jsonb(event_record.schedule) IS DISTINCT FROM p->'schedule'
    OR event_record.description IS DISTINCT FROM p->>'description'
    OR event_record.url IS DISTINCT FROM p->>'url' THEN
    RAISE EXCEPTION 'Wellness event changed since selection: %',p->>'key';
   END IF;
  ELSE
   next_order := 1;
   INSERT INTO public.destination_events(destination_id,title,schedule,description,url,display_order,active)
    VALUES(p->>'destination_id',p->>'title',ARRAY(SELECT jsonb_array_elements_text(p->'schedule')),
      p->>'description',p->>'url',next_order,true) RETURNING * INTO event_record;
  END IF;
  FOR t IN SELECT * FROM jsonb_each(p->'translations') LOOP
   SELECT * INTO translation_record FROM public.event_translations
    WHERE event_id=event_record.id AND locale=t.key FOR UPDATE;
   IF FOUND THEN
    IF NOT translation_record.published OR translation_record.title IS DISTINCT FROM t.value->>0
     OR to_jsonb(translation_record.schedule) IS DISTINCT FROM t.value->1
     OR translation_record.description IS DISTINCT FROM t.value->>2
     OR translation_record.source_title IS DISTINCT FROM event_record.title
     OR translation_record.source_schedule IS DISTINCT FROM event_record.schedule
     OR translation_record.source_description IS DISTINCT FROM event_record.description THEN
     RAISE EXCEPTION 'Wellness translation changed since selection: % / %',p->>'key',t.key;
    END IF;
   ELSE
    INSERT INTO public.event_translations(event_id,locale,title,schedule,description,
      source_title,source_schedule,source_description,published)
     VALUES(event_record.id,t.key,t.value->>0,ARRAY(SELECT jsonb_array_elements_text(t.value->1)),
       t.value->>2,event_record.title,event_record.schedule,event_record.description,true);
   END IF;
  END LOOP;
 END LOOP;
END $wellness$;

-- Keep morning classes together; preserve any unexpected editorial reordering.
DO $ordering$
DECLARE selected record; current_order integer;
BEGIN
 FOR selected IN SELECT * FROM (VALUES
  ('Aerial Yoga',1,2),('Tai Chi with a Master',2,3)
 ) AS selection(title,old_order,new_order) LOOP
  SELECT display_order INTO STRICT current_order FROM public.destination_events
   WHERE destination_id='yoga-pavilion' AND title=selected.title AND active FOR UPDATE;
  IF current_order NOT IN (selected.old_order,selected.new_order) THEN
   RAISE EXCEPTION 'Yoga event order changed since selection: %',selected.title;
  END IF;
  UPDATE public.destination_events SET display_order=selected.new_order
   WHERE destination_id='yoga-pavilion' AND title=selected.title AND display_order<>selected.new_order;
 END LOOP;
END $ordering$;

COMMIT;
