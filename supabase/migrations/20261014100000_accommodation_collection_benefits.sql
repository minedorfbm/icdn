-- Additive preparation. Activate the 30 links only after the Benefits UI is deployed.
BEGIN;
CREATE TABLE public.accommodation_benefits (
 id text PRIMARY KEY CHECK (id ~ '^[a-z0-9-]{1,80}$'),
 name text NOT NULL,
 items text[] NOT NULL CHECK (cardinality(items) BETWEEN 1 AND 40),
 source_urls text[] NOT NULL CHECK (cardinality(source_urls)>0),
 verified_on date NOT NULL,
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.accommodation_benefit_translations (
 benefits_id text NOT NULL REFERENCES public.accommodation_benefits(id) ON DELETE CASCADE,
 locale text NOT NULL CHECK (locale IN ('en','vi','ru','zh','ko','ja')),
 items text[] NOT NULL CHECK (cardinality(items) BETWEEN 1 AND 40),
 source_items text[] NOT NULL,
 published boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(benefits_id,locale),
 CHECK (cardinality(items)=cardinality(source_items))
);
ALTER TABLE public.destination_links ADD COLUMN benefits_id text REFERENCES public.accommodation_benefits(id);
CREATE INDEX destination_links_benefits_idx ON public.destination_links(benefits_id) WHERE benefits_id IS NOT NULL;
CREATE UNIQUE INDEX destination_one_benefits_link ON public.destination_links(destination_id) WHERE benefits_id IS NOT NULL;
ALTER TABLE public.destination_links ADD CONSTRAINT benefits_link_is_info CHECK (benefits_id IS NULL OR kind='INFO');
ALTER TABLE public.accommodation_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accommodation_benefit_translations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.accommodation_benefits,public.accommodation_benefit_translations FROM anon,authenticated;
GRANT SELECT ON public.accommodation_benefits,public.accommodation_benefit_translations TO anon,authenticated;
GRANT ALL ON public.accommodation_benefits,public.accommodation_benefit_translations TO service_role;
CREATE POLICY "Benefits for visible accommodation links" ON public.accommodation_benefits FOR SELECT TO anon,authenticated USING (
 active AND EXISTS(SELECT 1 FROM public.destination_links l JOIN public.destinations d ON d.id=l.destination_id
 WHERE l.benefits_id=accommodation_benefits.id AND l.active AND d.active)
);
CREATE POLICY "Current published benefit translations" ON public.accommodation_benefit_translations FOR SELECT TO anon,authenticated USING (
 published AND EXISTS(SELECT 1 FROM public.accommodation_benefits b WHERE b.id=benefits_id AND b.items=source_items)
);
CREATE TRIGGER accommodation_benefits_updated_at BEFORE UPDATE ON public.accommodation_benefits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER accommodation_benefit_translations_updated_at BEFORE UPDATE ON public.accommodation_benefit_translations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
COMMENT ON COLUMN public.destination_links.benefits_id IS 'Opens the shared, translated Benefits dialog. url retains the official accommodation source as an external fallback.';
COMMENT ON COLUMN public.accommodation_benefit_translations.source_items IS 'Exact English source at translation time. Changed source hides stale translations until reviewed.';
DO $seed$
DECLARE payload jsonb := $data${
  "groups": [
    {
      "id": "standard",
      "name": "Complimentary resort benefits",
      "source_urls": [
        "https://www.danang.intercontinental.com/room-suites/resort-classic-room-oceanview/",
        "https://www.danang.intercontinental.com/room-suites/resort-classic-panoramic-room-oceanview/",
        "https://www.danang.intercontinental.com/room-suites/resort-terrace-suite-oceanview/"
      ],
      "verified_on": "2026-10-14",
      "items": [
        "Beach access and beach games.",
        "Recreational activities, including non-motorised watersports, beach games and tennis.",
        "Daily yoga and tai chi classes.",
        "Access to Soar Gym.",
        "Children under 6 eat free from the Kids’ Menu.",
        "Billiards and table tennis at Long Bar.",
        "Scheduled cinema screenings.",
        "Children’s access to Planet Trekkers Kids’ Club.",
        "Wi-Fi throughout the resort."
      ],
      "translations": {
        "vi": [
          "Sử dụng bãi biển và các trò chơi trên bãi biển.",
          "Các hoạt động giải trí, gồm thể thao dưới nước không động cơ, trò chơi bãi biển và quần vợt.",
          "Lớp yoga và thái cực quyền hằng ngày.",
          "Sử dụng phòng tập Soar Gym.",
          "Trẻ dưới 6 tuổi dùng bữa miễn phí từ thực đơn trẻ em.",
          "Bi-a và bóng bàn tại Long Bar.",
          "Các buổi chiếu phim theo lịch.",
          "Trẻ em được sử dụng câu lạc bộ Planet Trekkers.",
          "Wi-Fi trong toàn khu nghỉ dưỡng."
        ],
        "ru": [
          "Доступ к пляжу и пляжным играм.",
          "Развлечения, включая безмоторные водные виды спорта, пляжные игры и теннис.",
          "Ежедневные занятия йогой и тайцзи.",
          "Доступ в фитнес-центр Soar Gym.",
          "Бесплатное питание для детей до 6 лет по детскому меню.",
          "Бильярд и настольный теннис в Long Bar.",
          "Кинопоказы по расписанию.",
          "Доступ детей в детский клуб Planet Trekkers.",
          "Wi-Fi на всей территории курорта."
        ],
        "zh": [
          "使用海滩及沙滩游戏设施。",
          "休闲活动，包括非机动水上运动、沙滩游戏和网球。",
          "每日瑜伽和太极课程。",
          "使用 Soar Gym 健身中心。",
          "6岁以下儿童可免费享用儿童菜单。",
          "在 Long Bar 享用台球和乒乓球设施。",
          "按时安排的电影放映。",
          "儿童可使用 Planet Trekkers 儿童俱乐部。",
          "度假村内无线网络。"
        ],
        "ko": [
          "해변 및 해변 놀이 시설 이용.",
          "무동력 수상 스포츠, 해변 놀이, 테니스 등 레크리에이션 활동.",
          "매일 요가 및 태극권 수업.",
          "Soar Gym 피트니스 센터 이용.",
          "만 6세 미만 어린이는 키즈 메뉴 무료 이용.",
          "Long Bar에서 당구 및 탁구 이용.",
          "정기 영화 상영.",
          "Planet Trekkers 키즈 클럽 이용.",
          "리조트 전역 Wi-Fi 이용."
        ],
        "ja": [
          "ビーチとビーチゲーム施設の利用。",
          "非動力ウォータースポーツ、ビーチゲーム、テニスなどのレクリエーション。",
          "毎日のヨガと太極拳レッスン。",
          "Soar Gymの利用。",
          "6歳未満のお子様はキッズメニューのお食事が無料。",
          "Long Barでのビリヤードと卓球。",
          "定期映画上映。",
          "お子様のPlanet Trekkersキッズクラブ利用。",
          "リゾート全域でのWi-Fi利用。"
        ]
      }
    },
    {
      "id": "club",
      "name": "Club room and suite benefits",
      "source_urls": [
        "https://www.danang.intercontinental.com/room-suites/club-panoramic-room-oceanview/",
        "https://www.danang.intercontinental.com/room-suites/club-terrace-suite-panoramic-oceanview/"
      ],
      "verified_on": "2026-10-14",
      "items": [
        "Assistance from the dedicated butler team, available 24/7.",
        "Daily breakfast at the Club Lounge or Citron.",
        "Afternoon tea with premium teas and coffees at the Club Lounge, 14:00–16:00.",
        "Evening cocktails and canapés at the Club Lounge, including complimentary signature wines and cocktails, 16:30–18:30.",
        "Complimentary Club Lounge access for one additional accompanying guest."
      ],
      "translations": {
        "vi": [
          "Đội ngũ quản gia riêng hỗ trợ 24/7.",
          "Bữa sáng hằng ngày tại Club Lounge hoặc Citron.",
          "Trà chiều với trà và cà phê cao cấp tại Club Lounge, 14:00–16:00.",
          "Cocktail và canapé buổi tối tại Club Lounge, gồm rượu vang và cocktail đặc trưng miễn phí, 16:30–18:30.",
          "Một khách đi cùng bổ sung được sử dụng Club Lounge miễn phí."
        ],
        "ru": [
          "Помощь команды дворецких круглосуточно.",
          "Ежедневный завтрак в Club Lounge или Citron.",
          "Послеобеденный чай и премиальные чай и кофе в Club Lounge, 14:00–16:00.",
          "Вечерние коктейли и канапе в Club Lounge, включая бесплатные фирменные вина и коктейли, 16:30–18:30.",
          "Бесплатный доступ в Club Lounge для одного дополнительного сопровождающего гостя."
        ],
        "zh": [
          "专属管家团队全天候服务。",
          "每日在 Club Lounge 或 Citron 享用早餐。",
          "14:00–16:00 在 Club Lounge 享用下午茶及精选茶饮和咖啡。",
          "16:30–18:30 在 Club Lounge 享用晚间鸡尾酒和小食，包括免费特色葡萄酒和鸡尾酒。",
          "一位额外同行宾客可免费使用 Club Lounge。"
        ],
        "ko": [
          "전담 버틀러 팀의 24시간 지원.",
          "Club Lounge 또는 Citron에서 매일 조식.",
          "14:00–16:00 Club Lounge에서 프리미엄 차와 커피를 곁들인 애프터눈 티.",
          "16:30–18:30 Club Lounge에서 시그니처 와인과 칵테일이 무료로 포함된 이브닝 칵테일 및 카나페.",
          "추가 동반 투숙객 1명에게 Club Lounge 무료 이용 제공."
        ],
        "ja": [
          "専任バトラーチームによる24時間サポート。",
          "Club LoungeまたはCitronでの毎日の朝食。",
          "14:00～16:00、Club Loungeで上質な紅茶とコーヒーを楽しむアフタヌーンティー。",
          "16:30～18:30、Club Loungeでイブニングカクテルとカナッペ。シグネチャーワインとカクテルを無料で提供。",
          "追加の同伴ゲスト1名様はClub Loungeの利用無料。"
        ]
      }
    },
    {
      "id": "villa",
      "name": "Penthouse and seaside villa benefits",
      "source_urls": [
        "https://www.danang.intercontinental.com/room-suites/one-bedroom-heavenly-penthouse/",
        "https://www.danang.intercontinental.com/room-suites/one-bedroom-seaside-villa-by-the-beach/",
        "https://www.danang.intercontinental.com/room-suites/one-bedroom-seaside-villa-on-the-rocks/",
        "https://www.danang.intercontinental.com/room-suites/two-bedroom-seaside-villa-on-the-rocks/"
      ],
      "verified_on": "2026-10-14",
      "items": [
        "A dedicated Villa Host throughout your stay.",
        "Airport welcome on arrival and assistance with airline check-in on departure.",
        "A personalised itinerary tailored to your interests.",
        "Packing and unpacking service.",
        "Complimentary minibar with beer, soft drinks, juice and water, replenished daily.",
        "Round-trip airport transfers by private vehicle.",
        "Daily breakfast at the Club Lounge or Citron.",
        "Afternoon tea with premium teas and coffees at the Club Lounge, 14:00–16:00.",
        "Evening cocktails and canapés at the Club Lounge, including complimentary signature wines and cocktails, 16:30–18:30.",
        "Complimentary Club Lounge access for one additional accompanying guest."
      ],
      "translations": {
        "vi": [
          "Villa Host riêng hỗ trợ suốt kỳ nghỉ.",
          "Đón tại sân bay khi đến và hỗ trợ làm thủ tục hàng không khi khởi hành.",
          "Lịch trình riêng theo sở thích của bạn.",
          "Dịch vụ sắp xếp và thu dọn hành lý.",
          "Minibar miễn phí gồm bia, nước ngọt, nước trái cây và nước lọc, bổ sung hằng ngày.",
          "Đưa đón sân bay hai chiều bằng xe riêng.",
          "Bữa sáng hằng ngày tại Club Lounge hoặc Citron.",
          "Trà chiều với trà và cà phê cao cấp tại Club Lounge, 14:00–16:00.",
          "Cocktail và canapé buổi tối tại Club Lounge, gồm rượu vang và cocktail đặc trưng miễn phí, 16:30–18:30.",
          "Một khách đi cùng bổ sung được sử dụng Club Lounge miễn phí."
        ],
        "ru": [
          "Персональный Villa Host на протяжении всего пребывания.",
          "Встреча в аэропорту по прибытии и помощь с регистрацией на рейс при вылете.",
          "Индивидуальная программа с учётом ваших интересов.",
          "Помощь с распаковкой и упаковкой багажа.",
          "Бесплатный мини-бар с пивом, безалкогольными напитками, соками и водой, пополняемый ежедневно.",
          "Трансфер в аэропорт и обратно на частном автомобиле.",
          "Ежедневный завтрак в Club Lounge или Citron.",
          "Послеобеденный чай и премиальные чай и кофе в Club Lounge, 14:00–16:00.",
          "Вечерние коктейли и канапе в Club Lounge, включая бесплатные фирменные вина и коктейли, 16:30–18:30.",
          "Бесплатный доступ в Club Lounge для одного дополнительного сопровождающего гостя."
        ],
        "zh": [
          "入住期间专属 Villa Host 服务。",
          "抵达时机场迎接及离境时航班值机协助。",
          "根据您的兴趣定制行程。",
          "行李整理及打包服务。",
          "免费迷你吧，含啤酒、软饮、果汁及饮用水，每日补充。",
          "私人车辆往返机场接送。",
          "每日在 Club Lounge 或 Citron 享用早餐。",
          "14:00–16:00 在 Club Lounge 享用下午茶及精选茶饮和咖啡。",
          "16:30–18:30 在 Club Lounge 享用晚间鸡尾酒和小食，包括免费特色葡萄酒和鸡尾酒。",
          "一位额外同行宾客可免费使用 Club Lounge。"
        ],
        "ko": [
          "투숙 기간 동안 전담 Villa Host 서비스.",
          "도착 시 공항 환영 및 출발 시 항공편 체크인 지원.",
          "관심사에 맞춘 맞춤 일정.",
          "짐 풀기 및 짐 싸기 서비스.",
          "맥주, 청량음료, 주스, 생수가 포함된 무료 미니바, 매일 보충.",
          "전용 차량 왕복 공항 이동 서비스.",
          "Club Lounge 또는 Citron에서 매일 조식.",
          "14:00–16:00 Club Lounge에서 프리미엄 차와 커피를 곁들인 애프터눈 티.",
          "16:30–18:30 Club Lounge에서 시그니처 와인과 칵테일이 무료로 포함된 이브닝 칵테일 및 카나페.",
          "추가 동반 투숙객 1명에게 Club Lounge 무료 이용 제공."
        ],
        "ja": [
          "ご滞在中の専任Villa Hostサービス。",
          "到着時の空港でのお出迎えと出発時の搭乗手続きサポート。",
          "ご興味に合わせたオーダーメイドの旅程。",
          "荷解き・荷造りサービス。",
          "ビール、ソフトドリンク、ジュース、水を毎日補充する無料ミニバー。",
          "専用車による往復空港送迎。",
          "Club LoungeまたはCitronでの毎日の朝食。",
          "14:00～16:00、Club Loungeで上質な紅茶とコーヒーを楽しむアフタヌーンティー。",
          "16:30～18:30、Club Loungeでイブニングカクテルとカナッペ。シグネチャーワインとカクテルを無料で提供。",
          "追加の同伴ゲスト1名様はClub Loungeの利用無料。"
        ]
      }
    },
    {
      "id": "spa-lagoon",
      "name": "Spa Lagoon Villa benefits",
      "source_urls": [
        "https://www.danang.intercontinental.com/room-suites/one-bedroom-spa-lagoon-villa/"
      ],
      "verified_on": "2026-10-14",
      "items": [
        "A dedicated Villa Host throughout your stay.",
        "Airport welcome on arrival and assistance with airline check-in on departure.",
        "A personalised itinerary tailored to your interests.",
        "A 60-minute spa treatment for up to two adults, with a minimum three-night stay.",
        "Packing and unpacking service.",
        "Complimentary minibar with beer, soft drinks, juice and water, replenished daily.",
        "Round-trip airport transfers by private vehicle.",
        "Daily breakfast at the Club Lounge or Citron.",
        "Afternoon tea with premium teas and coffees at the Club Lounge, 14:00–16:00.",
        "Evening cocktails and canapés at the Club Lounge, including complimentary signature wines and cocktails, 16:30–18:30.",
        "Complimentary Club Lounge access for one additional accompanying guest."
      ],
      "translations": {
        "vi": [
          "Villa Host riêng hỗ trợ suốt kỳ nghỉ.",
          "Đón tại sân bay khi đến và hỗ trợ làm thủ tục hàng không khi khởi hành.",
          "Lịch trình riêng theo sở thích của bạn.",
          "Liệu trình spa 60 phút cho tối đa hai người lớn, áp dụng khi lưu trú tối thiểu ba đêm.",
          "Dịch vụ sắp xếp và thu dọn hành lý.",
          "Minibar miễn phí gồm bia, nước ngọt, nước trái cây và nước lọc, bổ sung hằng ngày.",
          "Đưa đón sân bay hai chiều bằng xe riêng.",
          "Bữa sáng hằng ngày tại Club Lounge hoặc Citron.",
          "Trà chiều với trà và cà phê cao cấp tại Club Lounge, 14:00–16:00.",
          "Cocktail và canapé buổi tối tại Club Lounge, gồm rượu vang và cocktail đặc trưng miễn phí, 16:30–18:30.",
          "Một khách đi cùng bổ sung được sử dụng Club Lounge miễn phí."
        ],
        "ru": [
          "Персональный Villa Host на протяжении всего пребывания.",
          "Встреча в аэропорту по прибытии и помощь с регистрацией на рейс при вылете.",
          "Индивидуальная программа с учётом ваших интересов.",
          "60-минутная спа-процедура для максимум двух взрослых при проживании от трёх ночей.",
          "Помощь с распаковкой и упаковкой багажа.",
          "Бесплатный мини-бар с пивом, безалкогольными напитками, соками и водой, пополняемый ежедневно.",
          "Трансфер в аэропорт и обратно на частном автомобиле.",
          "Ежедневный завтрак в Club Lounge или Citron.",
          "Послеобеденный чай и премиальные чай и кофе в Club Lounge, 14:00–16:00.",
          "Вечерние коктейли и канапе в Club Lounge, включая бесплатные фирменные вина и коктейли, 16:30–18:30.",
          "Бесплатный доступ в Club Lounge для одного дополнительного сопровождающего гостя."
        ],
        "zh": [
          "入住期间专属 Villa Host 服务。",
          "抵达时机场迎接及离境时航班值机协助。",
          "根据您的兴趣定制行程。",
          "入住至少三晚，可享最多两位成人的60分钟水疗护理。",
          "行李整理及打包服务。",
          "免费迷你吧，含啤酒、软饮、果汁及饮用水，每日补充。",
          "私人车辆往返机场接送。",
          "每日在 Club Lounge 或 Citron 享用早餐。",
          "14:00–16:00 在 Club Lounge 享用下午茶及精选茶饮和咖啡。",
          "16:30–18:30 在 Club Lounge 享用晚间鸡尾酒和小食，包括免费特色葡萄酒和鸡尾酒。",
          "一位额外同行宾客可免费使用 Club Lounge。"
        ],
        "ko": [
          "투숙 기간 동안 전담 Villa Host 서비스.",
          "도착 시 공항 환영 및 출발 시 항공편 체크인 지원.",
          "관심사에 맞춘 맞춤 일정.",
          "최소 3박 투숙 시 성인 최대 2명에게 60분 스파 트리트먼트 제공.",
          "짐 풀기 및 짐 싸기 서비스.",
          "맥주, 청량음료, 주스, 생수가 포함된 무료 미니바, 매일 보충.",
          "전용 차량 왕복 공항 이동 서비스.",
          "Club Lounge 또는 Citron에서 매일 조식.",
          "14:00–16:00 Club Lounge에서 프리미엄 차와 커피를 곁들인 애프터눈 티.",
          "16:30–18:30 Club Lounge에서 시그니처 와인과 칵테일이 무료로 포함된 이브닝 칵테일 및 카나페.",
          "추가 동반 투숙객 1명에게 Club Lounge 무료 이용 제공."
        ],
        "ja": [
          "ご滞在中の専任Villa Hostサービス。",
          "到着時の空港でのお出迎えと出発時の搭乗手続きサポート。",
          "ご興味に合わせたオーダーメイドの旅程。",
          "3泊以上のご滞在で、大人2名様まで60分のスパトリートメント。",
          "荷解き・荷造りサービス。",
          "ビール、ソフトドリンク、ジュース、水を毎日補充する無料ミニバー。",
          "専用車による往復空港送迎。",
          "Club LoungeまたはCitronでの毎日の朝食。",
          "14:00～16:00、Club Loungeで上質な紅茶とコーヒーを楽しむアフタヌーンティー。",
          "16:30～18:30、Club Loungeでイブニングカクテルとカナッペ。シグネチャーワインとカクテルを無料で提供。",
          "追加の同伴ゲスト1名様はClub Loungeの利用無料。"
        ]
      }
    },
    {
      "id": "residence",
      "name": "Residence and large villa benefits",
      "source_urls": [
        "https://www.danang.intercontinental.com/room-suites/two-bedroom-royal-residence-by-the-sea/",
        "https://www.danang.intercontinental.com/room-suites/two-bedroom-sun-peninsula-residence/",
        "https://www.danang.intercontinental.com/room-suites/three-bedroom-sun-peninsula-residence/",
        "https://www.danang.intercontinental.com/room-suites/three-bedroom-bai-bac-bay-villa/",
        "https://www.danang.intercontinental.com/room-suites/four-bedroom-pool-villa/"
      ],
      "verified_on": "2026-10-14",
      "items": [
        "A dedicated Villa Host throughout your stay.",
        "Airport welcome on arrival and assistance with airline check-in on departure.",
        "A personalised itinerary tailored to your interests.",
        "Welcome champagne and signature canapés in the villa.",
        "Private buggy service.",
        "Floating breakfast in your private pool, upon request.",
        "Packing and unpacking service.",
        "Complimentary minibar with beer, soft drinks, juice and water, replenished daily.",
        "Round-trip airport transfers by private vehicle.",
        "Children’s tent for in-room glamping, upon request.",
        "Daily breakfast at the Club Lounge or Citron.",
        "Afternoon tea with premium teas and coffees at the Club Lounge, 14:00–16:00.",
        "Evening cocktails and canapés at the Club Lounge, including complimentary signature wines and cocktails, 16:30–18:30.",
        "Complimentary Club Lounge access for one additional accompanying guest."
      ],
      "translations": {
        "vi": [
          "Villa Host riêng hỗ trợ suốt kỳ nghỉ.",
          "Đón tại sân bay khi đến và hỗ trợ làm thủ tục hàng không khi khởi hành.",
          "Lịch trình riêng theo sở thích của bạn.",
          "Champagne chào mừng và canapé đặc trưng tại biệt thự.",
          "Dịch vụ xe buggy riêng.",
          "Bữa sáng nổi tại hồ bơi riêng, theo yêu cầu.",
          "Dịch vụ sắp xếp và thu dọn hành lý.",
          "Minibar miễn phí gồm bia, nước ngọt, nước trái cây và nước lọc, bổ sung hằng ngày.",
          "Đưa đón sân bay hai chiều bằng xe riêng.",
          "Lều trẻ em để cắm trại trong phòng, theo yêu cầu.",
          "Bữa sáng hằng ngày tại Club Lounge hoặc Citron.",
          "Trà chiều với trà và cà phê cao cấp tại Club Lounge, 14:00–16:00.",
          "Cocktail và canapé buổi tối tại Club Lounge, gồm rượu vang và cocktail đặc trưng miễn phí, 16:30–18:30.",
          "Một khách đi cùng bổ sung được sử dụng Club Lounge miễn phí."
        ],
        "ru": [
          "Персональный Villa Host на протяжении всего пребывания.",
          "Встреча в аэропорту по прибытии и помощь с регистрацией на рейс при вылете.",
          "Индивидуальная программа с учётом ваших интересов.",
          "Приветственное шампанское и фирменные канапе на вилле.",
          "Персональный багги.",
          "Плавающий завтрак в частном бассейне по запросу.",
          "Помощь с распаковкой и упаковкой багажа.",
          "Бесплатный мини-бар с пивом, безалкогольными напитками, соками и водой, пополняемый ежедневно.",
          "Трансфер в аэропорт и обратно на частном автомобиле.",
          "Детская палатка для глэмпинга в номере по запросу.",
          "Ежедневный завтрак в Club Lounge или Citron.",
          "Послеобеденный чай и премиальные чай и кофе в Club Lounge, 14:00–16:00.",
          "Вечерние коктейли и канапе в Club Lounge, включая бесплатные фирменные вина и коктейли, 16:30–18:30.",
          "Бесплатный доступ в Club Lounge для одного дополнительного сопровождающего гостя."
        ],
        "zh": [
          "入住期间专属 Villa Host 服务。",
          "抵达时机场迎接及离境时航班值机协助。",
          "根据您的兴趣定制行程。",
          "别墅内迎宾香槟及特色小食。",
          "私人电瓶车服务。",
          "可应要求在私人泳池提供漂浮早餐。",
          "行李整理及打包服务。",
          "免费迷你吧，含啤酒、软饮、果汁及饮用水，每日补充。",
          "私人车辆往返机场接送。",
          "可应要求提供儿童帐篷，体验室内露营。",
          "每日在 Club Lounge 或 Citron 享用早餐。",
          "14:00–16:00 在 Club Lounge 享用下午茶及精选茶饮和咖啡。",
          "16:30–18:30 在 Club Lounge 享用晚间鸡尾酒和小食，包括免费特色葡萄酒和鸡尾酒。",
          "一位额外同行宾客可免费使用 Club Lounge。"
        ],
        "ko": [
          "투숙 기간 동안 전담 Villa Host 서비스.",
          "도착 시 공항 환영 및 출발 시 항공편 체크인 지원.",
          "관심사에 맞춘 맞춤 일정.",
          "빌라 내 웰컴 샴페인 및 시그니처 카나페.",
          "전용 버기 서비스.",
          "요청 시 전용 수영장에서 플로팅 조식 제공.",
          "짐 풀기 및 짐 싸기 서비스.",
          "맥주, 청량음료, 주스, 생수가 포함된 무료 미니바, 매일 보충.",
          "전용 차량 왕복 공항 이동 서비스.",
          "요청 시 객실 내 글램핑용 어린이 텐트 제공.",
          "Club Lounge 또는 Citron에서 매일 조식.",
          "14:00–16:00 Club Lounge에서 프리미엄 차와 커피를 곁들인 애프터눈 티.",
          "16:30–18:30 Club Lounge에서 시그니처 와인과 칵테일이 무료로 포함된 이브닝 칵테일 및 카나페.",
          "추가 동반 투숙객 1명에게 Club Lounge 무료 이용 제공."
        ],
        "ja": [
          "ご滞在中の専任Villa Hostサービス。",
          "到着時の空港でのお出迎えと出発時の搭乗手続きサポート。",
          "ご興味に合わせたオーダーメイドの旅程。",
          "ヴィラでのウェルカムシャンパンとシグネチャーカナッペ。",
          "専用バギーサービス。",
          "ご希望に応じてプライベートプールでのフローティングブレックファスト。",
          "荷解き・荷造りサービス。",
          "ビール、ソフトドリンク、ジュース、水を毎日補充する無料ミニバー。",
          "専用車による往復空港送迎。",
          "ご希望に応じてお部屋でグランピングを楽しめるお子様用テント。",
          "Club LoungeまたはCitronでの毎日の朝食。",
          "14:00～16:00、Club Loungeで上質な紅茶とコーヒーを楽しむアフタヌーンティー。",
          "16:30～18:30、Club Loungeでイブニングカクテルとカナッペ。シグネチャーワインとカクテルを無料で提供。",
          "追加の同伴ゲスト1名様はClub Loungeの利用無料。"
        ]
      }
    }
  ],
  "accommodations": [
    {
      "destination_id": "rooms",
      "source_url": "https://www.danang.intercontinental.com/room-suites/resort-classic-room-oceanview/",
      "floor_plan": "https://www.danang.intercontinental.com/wp-content/uploads/2021/09/Resort-Classic-Room-_-Son-Tra-Room-_-Club-InterContinental-Room.pdf",
      "benefits_selector": "#popup–alwayscom",
      "benefits_id": "standard",
      "floor_plan_link_id": "a55af8fd-d032-58d4-b73c-0e5ba0d20163",
      "benefits_link_id": "2a32bd27-550b-5dd2-ad9a-498b5720adaa"
    },
    {
      "destination_id": "resort-classic-panoramic-room-oceanview",
      "source_url": "https://www.danang.intercontinental.com/room-suites/resort-classic-panoramic-room-oceanview/",
      "floor_plan": "https://www.danang.intercontinental.com/wp-content/uploads/2025/11/Panoramic-Oceanview.pdf",
      "benefits_selector": "#popup–alwayscom",
      "benefits_id": "standard",
      "floor_plan_link_id": "691511e5-81c7-56a9-a549-ebd4a517c6c1",
      "benefits_link_id": "e7b05acd-5bee-5a82-b12e-ee9174534bbf"
    },
    {
      "destination_id": "club-panoramic-room-oceanview",
      "source_url": "https://www.danang.intercontinental.com/room-suites/club-panoramic-room-oceanview/",
      "floor_plan": "https://www.danang.intercontinental.com/wp-content/uploads/2021/09/Resort-Classic-Room-_-Son-Tra-Room-_-Club-InterContinental-Room.pdf",
      "benefits_selector": "#popup-club-rooms",
      "benefits_id": "club",
      "floor_plan_link_id": "81eaa2fd-7149-5bd6-b065-d141329f7b24",
      "benefits_link_id": "5c17a28a-6de1-5137-b8fa-e5d2887d3e3a"
    },
    {
      "destination_id": "resort-terrace-suite-oceanview",
      "source_url": "https://www.danang.intercontinental.com/room-suites/resort-terrace-suite-oceanview/",
      "floor_plan": "https://www.danang.intercontinental.com/wp-content/uploads/2024/01/Terrace-Suite-Floor-Plan.pdf",
      "benefits_selector": "#popup–alwayscom",
      "benefits_id": "standard",
      "floor_plan_link_id": "1cec6d60-11e1-51fd-9a58-76fdbc77b84d",
      "benefits_link_id": "811e8df7-3120-5923-9a98-e483656b6110"
    },
    {
      "destination_id": "club-terrace-suite-panoramic-oceanview",
      "source_url": "https://www.danang.intercontinental.com/room-suites/club-terrace-suite-panoramic-oceanview/",
      "floor_plan": "https://www.danang.intercontinental.com/wp-content/uploads/2024/01/Terrace-Suite-Floor-Plan.pdf",
      "benefits_selector": "#popup-club-rooms",
      "benefits_id": "club",
      "floor_plan_link_id": "c5391fbb-9d24-5454-967c-b5b993c8d631",
      "benefits_link_id": "9c52d20e-210d-579c-b577-59b12ecf0c10"
    },
    {
      "destination_id": "penthouses",
      "source_url": "https://www.danang.intercontinental.com/room-suites/one-bedroom-heavenly-penthouse/",
      "floor_plan": "https://www.danang.intercontinental.com/wp-content/uploads/2021/09/Heavenly-Penthouse.pdf",
      "benefits_selector": "#popup-penthouses",
      "benefits_id": "villa",
      "floor_plan_link_id": "e372ba5e-862d-565d-9271-5ee36f6e1c7f",
      "benefits_link_id": "b87bbdbd-7f5d-5139-9865-38080d32b3f8"
    },
    {
      "destination_id": "one-bedroom-seaside-villa-by-the-beach",
      "source_url": "https://www.danang.intercontinental.com/room-suites/one-bedroom-seaside-villa-by-the-beach/",
      "floor_plan": "https://www.danang.intercontinental.com/wp-content/uploads/2021/09/1BR-Sea-Side-Villa-on-the-Beach_on-the-Rocks.pdf",
      "benefits_selector": "#popup-penthouses",
      "benefits_id": "villa",
      "floor_plan_link_id": "6ab00a4f-3c21-5657-a39b-fde6afd6dac0",
      "benefits_link_id": "a6443371-0218-5b99-a745-2d440d282ee5"
    },
    {
      "destination_id": "one-bedroom-seaside-villa-on-the-rocks",
      "source_url": "https://www.danang.intercontinental.com/room-suites/one-bedroom-seaside-villa-on-the-rocks/",
      "floor_plan": "https://www.danang.intercontinental.com/wp-content/uploads/2021/09/1BR-Sea-Side-Villa-on-the-Beach_on-the-Rocks.pdf",
      "benefits_selector": "#popup-penthouses",
      "benefits_id": "villa",
      "floor_plan_link_id": "31160658-8fc4-5edf-8d85-06314cfab120",
      "benefits_link_id": "ee7b2c12-16a1-5200-9ab7-82cd4700a36e"
    },
    {
      "destination_id": "spa-lagoon-villas",
      "source_url": "https://www.danang.intercontinental.com/room-suites/one-bedroom-spa-lagoon-villa/",
      "floor_plan": "https://www.danang.intercontinental.com/wp-content/uploads/2021/09/1BR-Spa-Lagoon-Villa.pdf",
      "benefits_selector": "#popup-spa-lagoon",
      "benefits_id": "spa-lagoon",
      "floor_plan_link_id": "7dc92ae5-8a57-5273-9ade-9952e2dfa4b2",
      "benefits_link_id": "6f321383-e379-51ab-8b8b-dde574957326"
    },
    {
      "destination_id": "two-bedroom-seaside-villa-on-the-rocks",
      "source_url": "https://www.danang.intercontinental.com/room-suites/two-bedroom-seaside-villa-on-the-rocks/",
      "floor_plan": "https://www.danang.intercontinental.com/wp-content/uploads/2023/03/2BR-Seaside-Villa-on-the-Rocks.pdf",
      "benefits_selector": "#popup-penthouses",
      "benefits_id": "villa",
      "floor_plan_link_id": "2eb3e156-69e3-5e35-812e-0df954e65249",
      "benefits_link_id": "fad107e8-bee0-5d07-a214-c016ede8a3ab"
    },
    {
      "destination_id": "two-bedroom-royal-residence-by-the-sea",
      "source_url": "https://www.danang.intercontinental.com/room-suites/two-bedroom-royal-residence-by-the-sea/",
      "floor_plan": "https://www.danang.intercontinental.com/wp-content/uploads/2023/03/2BR-Royal-Residence-by-The-Sea.pdf",
      "benefits_selector": "#popup–2br",
      "benefits_id": "residence",
      "floor_plan_link_id": "df8c6fc8-083d-52e5-b1c3-1f55fd1e235a",
      "benefits_link_id": "c6240057-6909-504a-b4e9-2eb3dc6822e6"
    },
    {
      "destination_id": "two-bedroom-sun-peninsula-residence",
      "source_url": "https://www.danang.intercontinental.com/room-suites/two-bedroom-sun-peninsula-residence/",
      "floor_plan": "https://www.danang.intercontinental.com/wp-content/uploads/2023/01/2BR-residence-IXORA-VILLA-2.pdf",
      "benefits_selector": "#popup–2br",
      "benefits_id": "residence",
      "floor_plan_link_id": "4a3a9857-dcdc-5793-8bfd-70e1e75ac2fe",
      "benefits_link_id": "2c68b2c5-c01d-590e-a7ab-a5a6ae5d7fcf"
    },
    {
      "destination_id": "three-bedroom-sun-peninsula-residence",
      "source_url": "https://www.danang.intercontinental.com/room-suites/three-bedroom-sun-peninsula-residence/",
      "floor_plan": "https://www.danang.intercontinental.com/wp-content/uploads/2023/08/3BR-Sun-Peninsula-Residence-FRANGIPANI-VILLA.pdf",
      "benefits_selector": "#popup–3br",
      "benefits_id": "residence",
      "floor_plan_link_id": "fe65f464-f12d-59bb-a2ac-77471d574b41",
      "benefits_link_id": "0c1d16e5-0461-58d4-8650-7574469ae717"
    },
    {
      "destination_id": "three-bedroom-bai-bac-bay-villa",
      "source_url": "https://www.danang.intercontinental.com/room-suites/three-bedroom-bai-bac-bay-villa/",
      "floor_plan": "https://www.danang.intercontinental.com/wp-content/uploads/2023/06/BAI-BAC-BAY-VILLA.pdf",
      "benefits_selector": "#popup–2br",
      "benefits_id": "residence",
      "floor_plan_link_id": "797cf44e-82ba-57fc-8618-13493f834ea2",
      "benefits_link_id": "cd0fe6a9-01d1-5882-b310-dad13804d66e"
    },
    {
      "destination_id": "four-bedroom-pool-villa",
      "source_url": "https://www.danang.intercontinental.com/room-suites/four-bedroom-pool-villa/",
      "floor_plan": "https://www.danang.intercontinental.com/wp-content/uploads/2025/10/Floor-Plan_Four-Bedroom-Pool-Villa-25.pdf",
      "benefits_selector": "#popup–3br",
      "benefits_id": "residence",
      "floor_plan_link_id": "137717ec-801d-580f-8d88-549a5e5b7fbc",
      "benefits_link_id": "1c1de74b-d8c1-56c4-b9ed-142f9e773c2b"
    }
  ]
}$data$::jsonb;
 g jsonb; a jsonb; tr record;
BEGIN
 FOR g IN SELECT value FROM jsonb_array_elements(payload->'groups') LOOP
  INSERT INTO public.accommodation_benefits(id,name,items,source_urls,verified_on)
  VALUES(g->>'id',g->>'name',ARRAY(SELECT jsonb_array_elements_text(g->'items')),ARRAY(SELECT jsonb_array_elements_text(g->'source_urls')),(g->>'verified_on')::date);
  FOR tr IN SELECT * FROM jsonb_each(g->'translations') LOOP
   INSERT INTO public.accommodation_benefit_translations(benefits_id,locale,items,source_items,published)
   VALUES(g->>'id',tr.key,ARRAY(SELECT jsonb_array_elements_text(tr.value)),ARRAY(SELECT jsonb_array_elements_text(g->'items')),true);
  END LOOP;
 END LOOP;
 FOR a IN SELECT value FROM jsonb_array_elements(payload->'accommodations') LOOP
  IF NOT EXISTS(SELECT 1 FROM public.destinations WHERE id=a->>'destination_id' AND type='accommodation') THEN
   RAISE EXCEPTION 'Accommodation missing or changed: %',a->>'destination_id';
  END IF;
  IF EXISTS(SELECT 1 FROM public.destination_links WHERE destination_id=a->>'destination_id' AND (url=a->>'floor_plan' OR label IN ('Benefits','Floor plan'))) THEN
   RAISE EXCEPTION 'A plan or benefits link already exists for %',a->>'destination_id';
  END IF;
  INSERT INTO public.destination_links(id,destination_id,kind,label,url,display_order,active,benefits_id) VALUES
   ((a->>'floor_plan_link_id')::uuid,a->>'destination_id','BROCHURE','Floor plan',a->>'floor_plan',20,false,NULL),
   ((a->>'benefits_link_id')::uuid,a->>'destination_id','INFO','Benefits',a->>'source_url',21,false,a->>'benefits_id');
 END LOOP;
END;
$seed$;
COMMIT;
