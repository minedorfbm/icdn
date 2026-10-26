-- User-approved nine A–I map locations; culinary photography belongs to La Maison, not a tenth spot.
-- Sources: official Top Instagrammable Spots article, official resort map and Swimming Pools page.
-- Localized Discover routes were verified through hreflang on 2026-10-18.
-- The official article body remains English; all hub summaries below are translated.
BEGIN;
DO $guard$
BEGIN
 PERFORM 1 FROM public.destinations WHERE id='instagram-spots' AND active FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Instagram Spots card is not published'; END IF;
END $guard$;
INSERT INTO public.destination_collection_items
(destination_id,key,target_destination_id,title,description,translations,display_order,active)
SELECT destination_id,key,target_destination_id,title,description,translations,display_order,true
FROM jsonb_to_recordset($items$[
  {
    "destination_id": "instagram-spots",
    "key": "A",
    "target_destination_id": "the-summit",
    "title": "The Reception Hall",
    "description": "White interiors, soaring ceilings and soft daylight make The Summit’s reception hall a striking architectural setting.",
    "translations": {
      "vi": {
        "title": {
          "source": "The Reception Hall",
          "value": "Sảnh tiệc The Reception Hall"
        },
        "description": {
          "source": "White interiors, soaring ceilings and soft daylight make The Summit’s reception hall a striking architectural setting.",
          "value": "Không gian trắng, trần cao và ánh sáng tự nhiên tạo nên vẻ đẹp kiến trúc ấn tượng cho sảnh tiệc tại The Summit."
        }
      },
      "ru": {
        "title": {
          "source": "The Reception Hall",
          "value": "Зал Reception Hall"
        },
        "description": {
          "source": "White interiors, soaring ceilings and soft daylight make The Summit’s reception hall a striking architectural setting.",
          "value": "Белые интерьеры, высокие потолки и мягкий дневной свет подчёркивают выразительную архитектуру зала The Summit."
        }
      },
      "zh": {
        "title": {
          "source": "The Reception Hall",
          "value": "迎宾厅"
        },
        "description": {
          "source": "White interiors, soaring ceilings and soft daylight make The Summit’s reception hall a striking architectural setting.",
          "value": "The Summit 迎宾厅以纯白内饰、高挑天花板和柔和自然光，呈现鲜明的建筑美感。"
        }
      },
      "ko": {
        "title": {
          "source": "The Reception Hall",
          "value": "리셉션 홀"
        },
        "description": {
          "source": "White interiors, soaring ceilings and soft daylight make The Summit’s reception hall a striking architectural setting.",
          "value": "하얀 실내와 높은 천장, 부드러운 자연광이 The Summit 리셉션 홀의 건축미를 돋보이게 합니다."
        }
      },
      "ja": {
        "title": {
          "source": "The Reception Hall",
          "value": "レセプションホール"
        },
        "description": {
          "source": "White interiors, soaring ceilings and soft daylight make The Summit’s reception hall a striking architectural setting.",
          "value": "白い内装、高い天井、柔らかな自然光が、The Summitのレセプションホールの建築美を引き立てます。"
        }
      }
    },
    "display_order": 0
  },
  {
    "destination_id": "instagram-spots",
    "key": "B",
    "target_destination_id": "reception",
    "title": "Reception Lobby",
    "description": "Pause on the lobby balcony for panoramic resort views, framed by daybeds and reflecting water.",
    "translations": {
      "vi": {
        "title": {
          "source": "Reception Lobby",
          "value": "Sảnh đón tiếp"
        },
        "description": {
          "source": "Pause on the lobby balcony for panoramic resort views, framed by daybeds and reflecting water.",
          "value": "Dừng chân tại ban công sảnh để ngắm toàn cảnh khu nghỉ dưỡng, bên những ghế nằm thư giãn và mặt nước phản chiếu."
        }
      },
      "ru": {
        "title": {
          "source": "Reception Lobby",
          "value": "Главный вестибюль"
        },
        "description": {
          "source": "Pause on the lobby balcony for panoramic resort views, framed by daybeds and reflecting water.",
          "value": "С балкона вестибюля открывается панорама курорта; лежаки и водные зеркала дополняют кадр."
        }
      },
      "zh": {
        "title": {
          "source": "Reception Lobby",
          "value": "接待大堂"
        },
        "description": {
          "source": "Pause on the lobby balcony for panoramic resort views, framed by daybeds and reflecting water.",
          "value": "在大堂阳台稍作停留，将度假村全景、休憩躺椅与水面倒影一同收入镜头。"
        }
      },
      "ko": {
        "title": {
          "source": "Reception Lobby",
          "value": "리셉션 로비"
        },
        "description": {
          "source": "Pause on the lobby balcony for panoramic resort views, framed by daybeds and reflecting water.",
          "value": "로비 발코니에서 데이베드와 물빛 반사가 어우러진 리조트 전경을 담아보세요."
        }
      },
      "ja": {
        "title": {
          "source": "Reception Lobby",
          "value": "レセプションロビー"
        },
        "description": {
          "source": "Pause on the lobby balcony for panoramic resort views, framed by daybeds and reflecting water.",
          "value": "ロビーのバルコニーでひと休み。デイベッドと水面のきらめきを添えて、リゾートの全景を写真に。"
        }
      }
    },
    "display_order": 1
  },
  {
    "destination_id": "instagram-spots",
    "key": "C",
    "target_destination_id": "citron",
    "title": "Citron · Nón Lá Tables",
    "description": "Vietnamese conical hats inspire these floating tables, with sweeping views over the bay.",
    "translations": {
      "vi": {
        "title": {
          "source": "Citron · Nón Lá Tables",
          "value": "Citron · Bàn Nón Lá"
        },
        "description": {
          "source": "Vietnamese conical hats inspire these floating tables, with sweeping views over the bay.",
          "value": "Lấy cảm hứng từ chiếc nón lá Việt Nam, những bàn ăn lơ lửng mở ra tầm nhìn bao quát vịnh biển."
        }
      },
      "ru": {
        "title": {
          "source": "Citron · Nón Lá Tables",
          "value": "Citron · столики Nón Lá"
        },
        "description": {
          "source": "Vietnamese conical hats inspire these floating tables, with sweeping views over the bay.",
          "value": "Эти парящие столики вдохновлены вьетнамской конической шляпой и открывают широкий вид на залив."
        }
      },
      "zh": {
        "title": {
          "source": "Citron · Nón Lá Tables",
          "value": "Citron · Nón Lá 餐桌"
        },
        "description": {
          "source": "Vietnamese conical hats inspire these floating tables, with sweeping views over the bay.",
          "value": "悬空餐桌的造型源于越南斗笠，宽阔海湾尽收眼底。"
        }
      },
      "ko": {
        "title": {
          "source": "Citron · Nón Lá Tables",
          "value": "Citron · Nón Lá 테이블"
        },
        "description": {
          "source": "Vietnamese conical hats inspire these floating tables, with sweeping views over the bay.",
          "value": "베트남 전통 원뿔 모자에서 영감을 얻은 공중 테이블 너머로 만의 풍경이 펼쳐집니다."
        }
      },
      "ja": {
        "title": {
          "source": "Citron · Nón Lá Tables",
          "value": "Citron · Nón Láテーブル"
        },
        "description": {
          "source": "Vietnamese conical hats inspire these floating tables, with sweeping views over the bay.",
          "value": "ベトナムの笠をモチーフにした宙に浮かぶようなテーブルから、湾を一望できます。"
        }
      }
    },
    "display_order": 2
  },
  {
    "destination_id": "instagram-spots",
    "key": "D",
    "target_destination_id": "la-maison-1888",
    "title": "La Maison 1888",
    "description": "Capture the mansion’s timeless interiors and terrace, then the beautifully composed creations of chef Christian Le Squer.",
    "translations": {
      "vi": {
        "title": {
          "source": "La Maison 1888",
          "value": "La Maison 1888"
        },
        "description": {
          "source": "Capture the mansion’s timeless interiors and terrace, then the beautifully composed creations of chef Christian Le Squer.",
          "value": "Ghi lại vẻ đẹp vượt thời gian của nội thất và hiên biệt thự, rồi đến những món ăn được trình bày tinh tế của bếp trưởng Christian Le Squer."
        }
      },
      "ru": {
        "title": {
          "source": "La Maison 1888",
          "value": "La Maison 1888"
        },
        "description": {
          "source": "Capture the mansion’s timeless interiors and terrace, then the beautifully composed creations of chef Christian Le Squer.",
          "value": "Снимите элегантные интерьеры и террасу особняка, а затем — изысканные композиции блюд шефа Кристиана Ле Скера."
        }
      },
      "zh": {
        "title": {
          "source": "La Maison 1888",
          "value": "La Maison 1888"
        },
        "description": {
          "source": "Capture the mansion’s timeless interiors and terrace, then the beautifully composed creations of chef Christian Le Squer.",
          "value": "先记录宅邸隽永的室内空间与露台，再将主厨 Christian Le Squer 精心呈现的美食创作收入镜头。"
        }
      },
      "ko": {
        "title": {
          "source": "La Maison 1888",
          "value": "La Maison 1888"
        },
        "description": {
          "source": "Capture the mansion’s timeless interiors and terrace, then the beautifully composed creations of chef Christian Le Squer.",
          "value": "저택의 우아한 실내와 테라스를 담은 뒤, 크리스티앙 르 스케르 셰프가 정교하게 완성한 요리도 사진으로 남겨보세요."
        }
      },
      "ja": {
        "title": {
          "source": "La Maison 1888",
          "value": "La Maison 1888"
        },
        "description": {
          "source": "Capture the mansion’s timeless interiors and terrace, then the beautifully composed creations of chef Christian Le Squer.",
          "value": "邸宅の趣ある内装とテラスを撮影したら、シェフ、クリスチャン・ル・スケールの美しく盛り付けられた料理も一枚。"
        }
      }
    },
    "display_order": 3
  },
  {
    "destination_id": "instagram-spots",
    "key": "E",
    "target_destination_id": "wall-of-lanterns",
    "title": "Wall of Lanterns",
    "description": "Hoi An lanterns bring colour and a warm glow to this memorable backdrop near the pools.",
    "translations": {
      "vi": {
        "title": {
          "source": "Wall of Lanterns",
          "value": "Bức tường đèn lồng"
        },
        "description": {
          "source": "Hoi An lanterns bring colour and a warm glow to this memorable backdrop near the pools.",
          "value": "Những chiếc đèn lồng Hội An mang sắc màu và ánh sáng ấm áp đến góc chụp đáng nhớ gần các hồ bơi."
        }
      },
      "ru": {
        "title": {
          "source": "Wall of Lanterns",
          "value": "Стена фонарей"
        },
        "description": {
          "source": "Hoi An lanterns bring colour and a warm glow to this memorable backdrop near the pools.",
          "value": "Хойанские фонари наполняют этот уголок у бассейнов яркими красками и тёплым светом."
        }
      },
      "zh": {
        "title": {
          "source": "Wall of Lanterns",
          "value": "灯笼墙"
        },
        "description": {
          "source": "Hoi An lanterns bring colour and a warm glow to this memorable backdrop near the pools.",
          "value": "会安灯笼为泳池附近这处难忘的拍照背景增添缤纷色彩与温暖光芒。"
        }
      },
      "ko": {
        "title": {
          "source": "Wall of Lanterns",
          "value": "등불 벽"
        },
        "description": {
          "source": "Hoi An lanterns bring colour and a warm glow to this memorable backdrop near the pools.",
          "value": "호이안 등불의 색채와 따뜻한 빛이 수영장 근처에 인상적인 사진 배경을 만듭니다."
        }
      },
      "ja": {
        "title": {
          "source": "Wall of Lanterns",
          "value": "ランタンの壁"
        },
        "description": {
          "source": "Hoi An lanterns bring colour and a warm glow to this memorable backdrop near the pools.",
          "value": "プール近くの印象的な撮影スポット。ホイアンのランタンが彩りと温かな光を添えます。"
        }
      }
    },
    "display_order": 4
  },
  {
    "destination_id": "instagram-spots",
    "key": "F",
    "target_destination_id": "garden-jacuzzi",
    "title": "Garden Pool · Jacuzzi",
    "description": "A quiet jacuzzi beside the Garden Pool, framed by lush greenery just steps from the beach.",
    "translations": {
      "vi": {
        "title": {
          "source": "Garden Pool · Jacuzzi",
          "value": "Garden Pool · Bồn sục"
        },
        "description": {
          "source": "A quiet jacuzzi beside the Garden Pool, framed by lush greenery just steps from the beach.",
          "value": "Bồn sục yên tĩnh cạnh Garden Pool, được bao quanh bởi cây xanh tươi tốt và chỉ cách bãi biển vài bước chân."
        }
      },
      "ru": {
        "title": {
          "source": "Garden Pool · Jacuzzi",
          "value": "Garden Pool · джакузи"
        },
        "description": {
          "source": "A quiet jacuzzi beside the Garden Pool, framed by lush greenery just steps from the beach.",
          "value": "Тихое джакузи рядом с Garden Pool, в обрамлении пышной зелени и в нескольких шагах от пляжа."
        }
      },
      "zh": {
        "title": {
          "source": "Garden Pool · Jacuzzi",
          "value": "花园泳池 · 按摩池"
        },
        "description": {
          "source": "A quiet jacuzzi beside the Garden Pool, framed by lush greenery just steps from the beach.",
          "value": "花园泳池旁的宁静按摩池被葱郁绿意环绕，距海滩仅几步之遥。"
        }
      },
      "ko": {
        "title": {
          "source": "Garden Pool · Jacuzzi",
          "value": "가든 풀 · 자쿠지"
        },
        "description": {
          "source": "A quiet jacuzzi beside the Garden Pool, framed by lush greenery just steps from the beach.",
          "value": "해변에서 몇 걸음 떨어진 가든 풀 옆, 싱그러운 녹음에 둘러싸인 조용한 자쿠지입니다."
        }
      },
      "ja": {
        "title": {
          "source": "Garden Pool · Jacuzzi",
          "value": "ガーデンプール · ジャグジー"
        },
        "description": {
          "source": "A quiet jacuzzi beside the Garden Pool, framed by lush greenery just steps from the beach.",
          "value": "ビーチからすぐ、豊かな緑に囲まれたガーデンプールの隣にある静かなジャグジーです。"
        }
      }
    },
    "display_order": 5
  },
  {
    "destination_id": "instagram-spots",
    "key": "G",
    "target_destination_id": "long-bar",
    "title": "The L_O_N_G Bar",
    "description": "Daybeds, sweeping fans and basket-inspired swings create a playful beachfront scene.",
    "translations": {
      "vi": {
        "title": {
          "source": "The L_O_N_G Bar",
          "value": "The L_O_N_G Bar"
        },
        "description": {
          "source": "Daybeds, sweeping fans and basket-inspired swings create a playful beachfront scene.",
          "value": "Ghế nằm thư giãn, quạt trần lớn và xích đu lấy cảm hứng từ giỏ tre tạo nên khung cảnh vui tươi bên biển."
        }
      },
      "ru": {
        "title": {
          "source": "The L_O_N_G Bar",
          "value": "The L_O_N_G Bar"
        },
        "description": {
          "source": "Daybeds, sweeping fans and basket-inspired swings create a playful beachfront scene.",
          "value": "Лежаки, широкие веера и качели в форме корзин создают игривую атмосферу у моря."
        }
      },
      "zh": {
        "title": {
          "source": "The L_O_N_G Bar",
          "value": "The L_O_N_G Bar"
        },
        "description": {
          "source": "Daybeds, sweeping fans and basket-inspired swings create a playful beachfront scene.",
          "value": "休憩躺椅、宽幅吊扇与竹篮造型秋千，构成趣味十足的海滨画面。"
        }
      },
      "ko": {
        "title": {
          "source": "The L_O_N_G Bar",
          "value": "The L_O_N_G Bar"
        },
        "description": {
          "source": "Daybeds, sweeping fans and basket-inspired swings create a playful beachfront scene.",
          "value": "데이베드와 커다란 부채형 천장 선풍기, 바구니 모양 그네가 경쾌한 해변 풍경을 만듭니다."
        }
      },
      "ja": {
        "title": {
          "source": "The L_O_N_G Bar",
          "value": "The L_O_N_G Bar"
        },
        "description": {
          "source": "Daybeds, sweeping fans and basket-inspired swings create a playful beachfront scene.",
          "value": "デイベッド、大きな扇、籠をモチーフにしたブランコが、遊び心あふれる海辺の風景をつくります。"
        }
      }
    },
    "display_order": 6
  },
  {
    "destination_id": "instagram-spots",
    "key": "H",
    "target_destination_id": "long-pool",
    "title": "The L_O_N_G Pool",
    "description": "The 50-metre infinity pool pairs clean lines with mountain and beach panoramas, especially beautiful at sunset.",
    "translations": {
      "vi": {
        "title": {
          "source": "The L_O_N_G Pool",
          "value": "The L_O_N_G Pool"
        },
        "description": {
          "source": "The 50-metre infinity pool pairs clean lines with mountain and beach panoramas, especially beautiful at sunset.",
          "value": "Hồ bơi vô cực dài 50 mét kết hợp đường nét thanh thoát với toàn cảnh núi và biển, đặc biệt đẹp lúc hoàng hôn."
        }
      },
      "ru": {
        "title": {
          "source": "The L_O_N_G Pool",
          "value": "The L_O_N_G Pool"
        },
        "description": {
          "source": "The 50-metre infinity pool pairs clean lines with mountain and beach panoramas, especially beautiful at sunset.",
          "value": "Чёткие линии 50-метрового инфинити-бассейна сочетаются с панорамой гор и пляжа, особенно красивой на закате."
        }
      },
      "zh": {
        "title": {
          "source": "The L_O_N_G Pool",
          "value": "The L_O_N_G Pool"
        },
        "description": {
          "source": "The 50-metre infinity pool pairs clean lines with mountain and beach panoramas, especially beautiful at sunset.",
          "value": "50米长的无边泳池以简洁线条衬托山海全景，日落时分尤为迷人。"
        }
      },
      "ko": {
        "title": {
          "source": "The L_O_N_G Pool",
          "value": "The L_O_N_G Pool"
        },
        "description": {
          "source": "The 50-metre infinity pool pairs clean lines with mountain and beach panoramas, especially beautiful at sunset.",
          "value": "50m 인피니티 풀의 깔끔한 선과 산, 해변의 전경이 어우러지며 해 질 무렵 특히 아름답습니다."
        }
      },
      "ja": {
        "title": {
          "source": "The L_O_N_G Pool",
          "value": "The L_O_N_G Pool"
        },
        "description": {
          "source": "The 50-metre infinity pool pairs clean lines with mountain and beach panoramas, especially beautiful at sunset.",
          "value": "50メートルのインフィニティプールの端正なラインと、山とビーチの眺め。夕暮れにはひときわ美しく映えます。"
        }
      }
    },
    "display_order": 7
  },
  {
    "destination_id": "instagram-spots",
    "key": "I",
    "target_destination_id": "coconut-beach",
    "title": "Coconut Beach",
    "description": "Frame the shoreline and palms from the sand, or enjoy a new perspective over the calm bay by kayak.",
    "translations": {
      "vi": {
        "title": {
          "source": "Coconut Beach",
          "value": "Bãi biển Coconut"
        },
        "description": {
          "source": "Frame the shoreline and palms from the sand, or enjoy a new perspective over the calm bay by kayak.",
          "value": "Chụp bờ biển và hàng dừa từ bãi cát, hoặc chèo kayak để ngắm vịnh biển êm đềm từ một góc nhìn mới."
        }
      },
      "ru": {
        "title": {
          "source": "Coconut Beach",
          "value": "Пляж Coconut Beach"
        },
        "description": {
          "source": "Frame the shoreline and palms from the sand, or enjoy a new perspective over the calm bay by kayak.",
          "value": "Снимите берег и пальмы с песчаного пляжа или откройте новый ракурс спокойного залива с каяка."
        }
      },
      "zh": {
        "title": {
          "source": "Coconut Beach",
          "value": "椰林海滩"
        },
        "description": {
          "source": "Frame the shoreline and palms from the sand, or enjoy a new perspective over the calm bay by kayak.",
          "value": "从沙滩取景，记录海岸与棕榈；也可乘皮划艇，从平静海湾欣赏不同视角。"
        }
      },
      "ko": {
        "title": {
          "source": "Coconut Beach",
          "value": "코코넛 비치"
        },
        "description": {
          "source": "Frame the shoreline and palms from the sand, or enjoy a new perspective over the calm bay by kayak.",
          "value": "모래사장에서 해안선과 야자수를 담거나, 카약을 타고 잔잔한 만을 새로운 시선으로 바라보세요."
        }
      },
      "ja": {
        "title": {
          "source": "Coconut Beach",
          "value": "ココナッツビーチ"
        },
        "description": {
          "source": "Frame the shoreline and palms from the sand, or enjoy a new perspective over the calm bay by kayak.",
          "value": "砂浜から海岸線とヤシを切り取る一枚を。カヤックなら、穏やかな湾を違った角度から楽しめます。"
        }
      }
    },
    "display_order": 8
  }
]$items$::jsonb)
AS i(destination_id text,key text,target_destination_id text,title text,description text,translations jsonb,display_order integer)
ON CONFLICT (destination_id,key) DO NOTHING;
-- Lobby is the existing reception destination, now explicitly approved for publication.
DO $links$
DECLARE link uuid; source text := 'https://www.danang.intercontinental.com/top-instagrammable-spots/'; r record;
BEGIN
 SELECT id INTO STRICT link FROM public.destination_links
 WHERE destination_id='instagram-spots' AND kind='DISCOVER' AND url=source;
EXCEPTION WHEN NO_DATA_FOUND THEN
 IF EXISTS(SELECT 1 FROM public.destination_links WHERE destination_id='instagram-spots' AND kind='DISCOVER' AND active) THEN
  RAISE EXCEPTION 'Discover link changed since selection';
 END IF;
 INSERT INTO public.destination_links(destination_id,kind,url,display_order,active)
 VALUES('instagram-spots','DISCOVER',source,0,true);
END $links$;
UPDATE public.destination_links SET active=true
WHERE destination_id='instagram-spots' AND kind='DISCOVER'
 AND url='https://www.danang.intercontinental.com/top-instagrammable-spots/' AND NOT active;
INSERT INTO public.destination_link_translations(link_id,locale,url,source_url,active)
SELECT l.id,lang.locale,'https://www.danang.intercontinental.com/'||lang.path||'/top-instagrammable-spots/',l.url,true
FROM public.destination_links l
CROSS JOIN (VALUES('vi','vn'),('ru','ru'),('zh','zh'),('ko','ko'),('ja','ja')) AS lang(locale,path)
WHERE l.destination_id='instagram-spots' AND l.kind='DISCOVER'
 AND l.url='https://www.danang.intercontinental.com/top-instagrammable-spots/'
ON CONFLICT(link_id,locale) DO NOTHING;
-- Shared media import for the guide and Lobby, preserving per-card order and replay guards.
DO $video$
DECLARE destination text; candidate uuid; matches integer; next_order integer;
BEGIN
 FOREACH destination IN ARRAY ARRAY['instagram-spots','reception'] LOOP
 SELECT count(*),min(id::text)::uuid INTO matches,candidate FROM public.destination_videos
 WHERE destination_id=destination AND
 (regexp_match(video_url,'(?:[?&]v=|youtu.be/|/(?:shorts|embed|live)/)([A-Za-z0-9_-]{11})(?:[?&#/]|$)'))[1]='pNOVYJjXN-c';
 IF matches>1 THEN RAISE EXCEPTION 'Duplicate existing YouTube video'; END IF;
 IF candidate IS NOT NULL AND EXISTS(SELECT 1 FROM public.destination_videos WHERE id=candidate AND active) THEN CONTINUE; END IF;
 SELECT coalesce(max(display_order),-1)+1 INTO next_order FROM public.destination_videos WHERE destination_id=destination;
 IF candidate IS NULL THEN
 INSERT INTO public.destination_videos(destination_id,video_url,title,title_translations,display_order,active)
 VALUES(destination,'https://www.youtube.com/watch?v=pNOVYJjXN-c',
 'The Story Behind Bill Bensley’s Design at InterContinental Danang',
 $titles${"vi":"Câu chuyện đằng sau thiết kế của Bill Bensley tại InterContinental Danang","ru":"История дизайна Билла Бенсли в InterContinental Danang","zh":"InterContinental Danang：Bill Bensley 设计背后的故事","ko":"InterContinental Danang에 담긴 빌 벤슬리의 디자인 이야기","ja":"InterContinental Danangを彩るビル・ベンズリーのデザインの物語"}$titles$::jsonb,
 next_order,true);
 ELSE
 UPDATE public.destination_videos SET active=true,display_order=next_order WHERE id=candidate;
 END IF;
 END LOOP;
END $video$;
DO $posts$
DECLARE r jsonb; candidate uuid; matches integer; next_order integer;
BEGIN
 FOR r IN SELECT value FROM jsonb_array_elements($selection$[
  {
    "destination": "instagram-spots",
    "url": "https://www.instagram.com/p/DeWjgLQDULr/",
    "shortcode": "DeWjgLQDULr",
    "date": "2026-10-11"
  },
  {
    "destination": "instagram-spots",
    "url": "https://www.instagram.com/p/Dd_YYuejI_1/",
    "shortcode": "Dd_YYuejI_1",
    "date": "2026-10-02"
  },
  {
    "destination": "instagram-spots",
    "url": "https://www.instagram.com/reel/DdGCO6mDj5R/",
    "shortcode": "DdGCO6mDj5R",
    "date": "2026-09-09"
  },
  {
    "destination": "instagram-spots",
    "url": "https://www.instagram.com/p/DahUPJ_kcAx/",
    "shortcode": "DahUPJ_kcAx",
    "date": "2026-07-07"
  },
  {
    "destination": "instagram-spots",
    "url": "https://www.instagram.com/reel/DYTno_rDZvv/",
    "shortcode": "DYTno_rDZvv",
    "date": "2026-05-13"
  },
  {
    "destination": "reception",
    "url": "https://www.instagram.com/p/C_cqjLcsoGL/",
    "shortcode": "C_cqjLcsoGL"
  },
  {
    "destination": "reception",
    "url": "https://www.instagram.com/p/DVK4hyuGYI2/",
    "shortcode": "DVK4hyuGYI2"
  }
]$selection$::jsonb) LOOP
 SELECT count(*),min(id::text)::uuid INTO matches,candidate FROM public.destination_posts
 WHERE destination_id=r->>'destination' AND
 (regexp_match(post_url,'/(?:p|reel|reels)/([A-Za-z0-9_-]+)(?:/|[?]|$)'))[1]=r->>'shortcode';
 IF matches>1 THEN RAISE EXCEPTION 'Duplicate existing Instagram shortcode: %',r->>'shortcode'; END IF;
 IF candidate IS NOT NULL AND EXISTS(SELECT 1 FROM public.destination_posts WHERE id=candidate AND active) THEN CONTINUE; END IF;
 SELECT coalesce(max(display_order),-1)+1 INTO next_order FROM public.destination_posts WHERE destination_id=r->>'destination';
 IF candidate IS NULL THEN
 INSERT INTO public.destination_posts(destination_id,post_url,account,posted_at,display_order,active)
 VALUES(r->>'destination',r->>'url',NULL,(r->>'date')::date,next_order,true);
 ELSE
 UPDATE public.destination_posts SET active=true,display_order=next_order WHERE id=candidate;
 END IF;
 END LOOP;
END $posts$;
COMMIT;
