-- Four wellness themes, split into five correctly located event associations.
-- Detailed venue/day allocations verified in the official programme on 16 October 2026.
-- Yoga Flow overview says daily; the detailed programme has Yoga Wheel Stretch on Tuesday/Sunday.
BEGIN;
DO $wellness$
DECLARE p jsonb; t record; event_record public.destination_events%ROWTYPE;
  translation_record public.event_translations%ROWTYPE; next_order integer; match_count integer;
BEGIN
 FOR p IN SELECT value FROM jsonb_array_elements($data$[
  {
    "key": "yoga-flow",
    "destination_id": "yoga-pavilion",
    "title": "Yoga Flow",
    "schedule": [
      "MONDAY & WEDNESDAY–SATURDAY",
      "07:30 – 08:30"
    ],
    "description": "A complimentary morning yoga class with the resort’s wellness team, welcoming beginners and experienced practitioners. Register with the Concierge by 17:00 the day before.",
    "translations": {
      "vi": [
        "Yoga Flow",
        [
          "THỨ HAI & THỨ TƯ–THỨ BẢY",
          "07:30 – 08:30"
        ],
        "Lớp yoga buổi sáng miễn phí cùng đội ngũ chăm sóc sức khỏe của khu nghỉ dưỡng, phù hợp với cả người mới bắt đầu và người đã có kinh nghiệm. Đăng ký với bộ phận Concierge trước 17:00 ngày hôm trước."
      ],
      "ru": [
        "Йога-флоу",
        [
          "ПОНЕДЕЛЬНИК И СРЕДА–СУББОТА",
          "07:30 – 08:30"
        ],
        "Бесплатное утреннее занятие йогой с командой велнес-специалистов курорта для начинающих и опытных участников. Запишитесь у консьержа до 17:00 накануне."
      ],
      "zh": [
        "流瑜伽",
        [
          "周一及周三至周六",
          "07:30 – 08:30"
        ],
        "与度假村康养团队一起参加免费晨间瑜伽课程，初学者和有经验的练习者均可参加。请于前一天17:00前向礼宾部报名。"
      ],
      "ko": [
        "요가 플로우",
        [
          "월요일 및 수요일–토요일",
          "07:30 – 08:30"
        ],
        "리조트 웰니스 팀과 함께하는 무료 아침 요가 수업입니다. 초보자부터 숙련자까지 참여할 수 있습니다. 전날 17:00까지 컨시어지에 신청해 주세요."
      ],
      "ja": [
        "ヨガフロー",
        [
          "月曜・水曜～土曜",
          "07:30 – 08:30"
        ],
        "リゾートのウェルネスチームによる無料の朝ヨガです。初心者から経験者までご参加いただけます。前日の17:00までにコンシェルジュへお申し込みください。"
      ]
    },
    "url": "https://www.danang.intercontinental.com/wp-content/uploads/2026/08/Your-Guide-to-Fun-at-InterContinental-Danang.pdf"
  },
  {
    "key": "aerial-yoga",
    "destination_id": "yoga-pavilion",
    "title": "Aerial Yoga",
    "schedule": [
      "EVERY DAY",
      "10:30 – 11:30"
    ],
    "description": "Explore supported stretches and balance at the beachside Yoga Pavilion. Register with the Concierge by 17:00 the day before.",
    "translations": {
      "vi": [
        "Yoga bay",
        [
          "HẰNG NGÀY",
          "10:30 – 11:30"
        ],
        "Khám phá các động tác giãn cơ có hỗ trợ và rèn luyện thăng bằng tại Yoga Pavilion bên biển. Đăng ký với bộ phận Concierge trước 17:00 ngày hôm trước."
      ],
      "ru": [
        "Аэройога",
        [
          "ЕЖЕДНЕВНО",
          "10:30 – 11:30"
        ],
        "Откройте для себя растяжку с поддержкой и упражнения на равновесие в павильоне йоги у пляжа. Запишитесь у консьержа до 17:00 накануне."
      ],
      "zh": [
        "空中瑜伽",
        [
          "每日",
          "10:30 – 11:30"
        ],
        "在海滨瑜伽亭体验辅助伸展与平衡练习。请于前一天17:00前向礼宾部报名。"
      ],
      "ko": [
        "에어리얼 요가",
        [
          "매일",
          "10:30 – 11:30"
        ],
        "해변의 요가 파빌리온에서 지지 도구를 활용한 스트레칭과 균형 운동을 경험하세요. 전날 17:00까지 컨시어지에 신청해 주세요."
      ],
      "ja": [
        "エアリアルヨガ",
        [
          "毎日",
          "10:30 – 11:30"
        ],
        "ビーチサイドのヨガパビリオンで、サポートを使ったストレッチとバランスの練習を体験してください。前日の17:00までにコンシェルジュへお申し込みください。"
      ]
    },
    "url": "https://www.danang.intercontinental.com/wp-content/uploads/2026/08/Your-Guide-to-Fun-at-InterContinental-Danang.pdf"
  },
  {
    "key": "tai-chi",
    "destination_id": "yoga-pavilion",
    "title": "Tai Chi with a Master",
    "schedule": [
      "TUESDAY, THURSDAY AND SATURDAY",
      "15:00 – 16:00"
    ],
    "description": "Practice balance, mindful movement and focus with an experienced Tai Chi master. Private sessions are also available on request. Register with the Concierge by 17:00 the day before.",
    "translations": {
      "vi": [
        "Thái Cực Quyền cùng chuyên gia",
        [
          "THỨ BA, THỨ NĂM VÀ THỨ BẢY",
          "15:00 – 16:00"
        ],
        "Rèn luyện sự thăng bằng, chuyển động có ý thức và khả năng tập trung cùng chuyên gia Thái Cực Quyền giàu kinh nghiệm. Có lớp riêng theo yêu cầu. Đăng ký với bộ phận Concierge trước 17:00 ngày hôm trước."
      ],
      "ru": [
        "Тайцзи с мастером",
        [
          "ВТОРНИК, ЧЕТВЕРГ И СУББОТА",
          "15:00 – 16:00"
        ],
        "Развивайте равновесие, осознанность движений и концентрацию с опытным мастером тайцзи. По запросу доступны индивидуальные занятия. Запишитесь у консьержа до 17:00 накануне."
      ],
      "zh": [
        "太极大师课程",
        [
          "周二、周四及周六",
          "15:00 – 16:00"
        ],
        "跟随经验丰富的太极老师练习平衡、专注与身心协调。亦可预约私人课程。请于前一天17:00前向礼宾部报名。"
      ],
      "ko": [
        "마스터와 함께하는 태극권",
        [
          "화요일·목요일·토요일",
          "15:00 – 16:00"
        ],
        "숙련된 태극권 마스터와 함께 균형감, 의식적인 움직임, 집중력을 기르세요. 요청 시 개인 수업도 가능합니다. 전날 17:00까지 컨시어지에 신청해 주세요."
      ],
      "ja": [
        "マスターと学ぶ太極拳",
        [
          "火曜・木曜・土曜",
          "15:00 – 16:00"
        ],
        "経験豊かな太極拳の指導者と、バランス、意識的な動き、集中力を養いましょう。プライベートレッスンも承ります。前日の17:00までにコンシェルジュへお申し込みください。"
      ]
    },
    "url": "https://www.danang.intercontinental.com/wp-content/uploads/2026/08/Your-Guide-to-Fun-at-InterContinental-Danang.pdf"
  },
  {
    "key": "spa-workshops",
    "destination_id": "mi-sol-spa",
    "title": "Complimentary Wellness & Beauty Experiences",
    "schedule": [
      "MONDAY–THURSDAY",
      "12:15 – 13:00"
    ],
    "description": "Complimentary spa workshops at Mi Sol Spa reception, with a different ritual from Monday to Thursday. Register by 17:00 the day before with the Concierge or Mi Sol Spa.",
    "translations": {
      "vi": [
        "Trải nghiệm chăm sóc sức khỏe & sắc đẹp miễn phí",
        [
          "THỨ HAI–THỨ NĂM",
          "12:15 – 13:00"
        ],
        "Các buổi hướng dẫn spa miễn phí tại quầy lễ tân Mi Sol Spa, với một nghi thức khác nhau từ thứ Hai đến thứ Năm. Đăng ký trước 17:00 ngày hôm trước với bộ phận Concierge hoặc Mi Sol Spa."
      ],
      "ru": [
        "Бесплатные велнес- и бьюти-практики",
        [
          "ПОНЕДЕЛЬНИК–ЧЕТВЕРГ",
          "12:15 – 13:00"
        ],
        "Бесплатные спа-мастер-классы у стойки регистрации Mi Sol Spa: с понедельника по четверг каждый день посвящён новой практике. Запишитесь до 17:00 накануне у консьержа или в Mi Sol Spa."
      ],
      "zh": [
        "免费康养与美容体验",
        [
          "周一至周四",
          "12:15 – 13:00"
        ],
        "在 Mi Sol Spa 接待处参加免费水疗工作坊，周一至周四每天体验不同的护理仪式。请于前一天17:00前向礼宾部或 Mi Sol Spa 报名。"
      ],
      "ko": [
        "무료 웰니스 & 뷰티 체험",
        [
          "월요일–목요일",
          "12:15 – 13:00"
        ],
        "Mi Sol Spa 리셉션에서 월요일부터 목요일까지 매일 다른 스파 케어를 배우는 무료 워크숍입니다. 전날 17:00까지 컨시어지 또는 Mi Sol Spa에 신청해 주세요."
      ],
      "ja": [
        "無料ウェルネス＆ビューティー体験",
        [
          "月曜～木曜",
          "12:15 – 13:00"
        ],
        "Mi Sol Spaのレセプションで、月曜から木曜まで日替わりの無料スパワークショップを開催します。前日の17:00までにコンシェルジュまたはMi Sol Spaへお申し込みください。"
      ]
    },
    "url": "https://www.danang.intercontinental.com/wp-content/uploads/2026/08/Your-Guide-to-Fun-at-InterContinental-Danang.pdf"
  },
  {
    "key": "beauty-workshops",
    "destination_id": "nail-hair",
    "title": "Complimentary Wellness & Beauty Experiences",
    "schedule": [
      "FRIDAY–SUNDAY",
      "12:15 – 13:00"
    ],
    "description": "Complimentary beauty and self-care workshops at The Nail & Hair Studio from Friday to Sunday. Register by 17:00 the day before with the Concierge or Mi Sol Spa.",
    "translations": {
      "vi": [
        "Trải nghiệm chăm sóc sức khỏe & sắc đẹp miễn phí",
        [
          "THỨ SÁU–CHỦ NHẬT",
          "12:15 – 13:00"
        ],
        "Các buổi hướng dẫn làm đẹp và tự chăm sóc miễn phí tại The Nail & Hair Studio từ thứ Sáu đến Chủ nhật. Đăng ký trước 17:00 ngày hôm trước với bộ phận Concierge hoặc Mi Sol Spa."
      ],
      "ru": [
        "Бесплатные велнес- и бьюти-практики",
        [
          "ПЯТНИЦА–ВОСКРЕСЕНЬЕ",
          "12:15 – 13:00"
        ],
        "Бесплатные мастер-классы по красоте и уходу за собой в The Nail & Hair Studio с пятницы по воскресенье. Запишитесь до 17:00 накануне у консьержа или в Mi Sol Spa."
      ],
      "zh": [
        "免费康养与美容体验",
        [
          "周五至周日",
          "12:15 – 13:00"
        ],
        "周五至周日在 The Nail & Hair Studio 参加免费的美容及自我护理工作坊。请于前一天17:00前向礼宾部或 Mi Sol Spa 报名。"
      ],
      "ko": [
        "무료 웰니스 & 뷰티 체험",
        [
          "금요일–일요일",
          "12:15 – 13:00"
        ],
        "금요일부터 일요일까지 The Nail & Hair Studio에서 열리는 무료 뷰티 및 셀프 케어 워크숍입니다. 전날 17:00까지 컨시어지 또는 Mi Sol Spa에 신청해 주세요."
      ],
      "ja": [
        "無料ウェルネス＆ビューティー体験",
        [
          "金曜～日曜",
          "12:15 – 13:00"
        ],
        "金曜から日曜まで、The Nail & Hair Studioで無料のビューティー＆セルフケアワークショップを開催します。前日の17:00までにコンシェルジュまたはMi Sol Spaへお申し込みください。"
      ]
    },
    "url": "https://www.danang.intercontinental.com/wp-content/uploads/2026/08/Your-Guide-to-Fun-at-InterContinental-Danang.pdf"
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
   SELECT coalesce(max(display_order),-1)+1 INTO next_order FROM public.destination_events
    WHERE destination_id=p->>'destination_id';
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
COMMIT;
