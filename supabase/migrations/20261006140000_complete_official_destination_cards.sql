-- Verified official catalogue additions. Existing accommodation IDs stay stable.
-- All 15 accommodation categories are published at the user's explicit request.
-- No local catalogue, new table, credentials or speculative map coordinates.
BEGIN;
DO $migration$
DECLARE
  cards constant jsonb := $cards$[
  {
    "id": "shuttle",
    "name": "Shuttle to Hoi An",
    "level": "heaven",
    "type": "service",
    "family": "resort",
    "desc": "A complimentary sightseeing shuttle to Hoi An for in-house guests. Reserve at least four hours ahead and consult the official schedule for meeting points and departures.",
    "translations": {
      "vi": "Xe đưa đón tham quan Hội An miễn phí dành cho khách lưu trú. Vui lòng đặt trước ít nhất bốn giờ và xem lịch chính thức để biết điểm đón và giờ khởi hành.",
      "ru": "Бесплатный экскурсионный трансфер в Хойан для гостей курорта. Бронируйте не менее чем за четыре часа; места встречи и время отправления указаны в официальном расписании.",
      "zh": "为住店宾客提供前往会安的免费观光接驳车。请至少提前四小时预约，并查看官方时刻表了解集合地点和发车时间。",
      "ko": "투숙객을 위한 호이안 무료 관광 셔틀입니다. 최소 4시간 전에 예약하고 공식 시간표에서 집합 장소와 출발 시간을 확인해 주세요.",
      "ja": "ご宿泊のお客様向けのホイアン無料観光シャトル。少なくとも4時間前にご予約のうえ、集合場所と出発時刻を公式時刻表でご確認ください。"
    },
    "url": "https://www.danang.intercontinental.com/wp-content/uploads/2025/12/Shuttle-Bus-Schedule-to-Hoi-An.pdf",
    "images": [
      "https://www.danang.intercontinental.com/wp-content/uploads/2021/06/japanese-covered-bridge-hoi-unesco-world-heritage-vietnam-scaled.jpg",
      "https://www.danang.intercontinental.com/wp-content/uploads/2023/02/Hoi-An-Lantern-shops-scaled.jpg"
    ],
    "pdf": true,
    "cluster": "EXPERIENCES",
    "audience": [
      "all"
    ],
    "alternates": []
  },
  {
    "id": "experience-more",
    "name": "Experience More",
    "level": "heaven",
    "type": "experience",
    "family": "offer",
    "desc": "A stay for two adults with daily breakfast, return airport transfers and USD 200 resort credit per day for dining, bars or spa. Credit expires nightly and is not cumulative.",
    "translations": {
      "vi": "Kỳ nghỉ dành cho hai người lớn với bữa sáng hằng ngày, đưa đón sân bay hai chiều và tín dụng 200 USD mỗi ngày để dùng tại nhà hàng, quầy bar hoặc spa. Tín dụng hết hạn mỗi đêm và không cộng dồn.",
      "ru": "Проживание для двух взрослых с ежедневным завтраком, трансфером из аэропорта и обратно и кредитом 200 долларов США в день на рестораны, бары или спа. Кредит не переносится на следующий день.",
      "zh": "双人住宿套餐含每日早餐、往返机场接送及每日200美元度假村消费额度，可用于餐饮、酒吧或水疗。额度每晚到期，不可累积。",
      "ko": "성인 두 명을 위한 숙박으로 매일 조식, 왕복 공항 이동, 레스토랑·바·스파에서 사용할 수 있는 하루 200달러 리조트 크레딧이 포함됩니다. 크레딧은 매일 밤 만료되며 누적되지 않습니다.",
      "ja": "大人2名様のご滞在に、毎日の朝食、往復空港送迎、ダイニング・バー・スパで使える1日200米ドルのリゾートクレジットを含みます。クレジットは毎晩失効し、繰り越せません。"
    },
    "url": "https://www.danang.intercontinental.com/offers/experience-more-offer/",
    "images": [
      "https://www.danang.intercontinental.com/wp-content/uploads/2022/10/Garden-Resort-with-guests-2-1024x683.jpg",
      "https://www.danang.intercontinental.com/wp-content/uploads/2026/04/Citron_Landingpage.jpg"
    ],
    "audience": [
      "adult"
    ],
    "alternates": [
      {
        "locale": "vi",
        "url": "https://www.danang.intercontinental.com/vn/offers/experience-more-offer/"
      },
      {
        "locale": "ja",
        "url": "https://www.danang.intercontinental.com/ja/offers/experience-more-offer/"
      },
      {
        "locale": "ko",
        "url": "https://www.danang.intercontinental.com/ko/offers/experience-more-offer/"
      },
      {
        "locale": "ru",
        "url": "https://www.danang.intercontinental.com/ru/offers/experience-more-offer/"
      },
      {
        "locale": "zh",
        "url": "https://www.danang.intercontinental.com/zh/offers/experience-more-offer/"
      }
    ],
    "cluster": "EXPERIENCES"
  },
  {
    "id": "nam-tram-dining",
    "name": "Nam Tram Dining Journey",
    "level": "heaven",
    "type": "experience",
    "family": "resort",
    "desc": "A private dining journey for two aboard the Nam Tram, with a curated dish at each of the four resort levels, from Heaven to Sea. Contact the resort for reservations.",
    "translations": {
      "vi": "Hành trình ẩm thực riêng tư dành cho hai người trên Nam Tràm, thưởng thức món ăn được tuyển chọn tại bốn tầng của khu nghỉ dưỡng, từ Heaven đến Sea. Liên hệ khu nghỉ dưỡng để đặt chỗ.",
      "ru": "Гастрономическое путешествие для двоих на фуникулёре Nam Tram с авторским блюдом на каждом из четырёх уровней курорта, от Heaven до Sea. Для бронирования свяжитесь с курортом.",
      "zh": "乘坐Nam Tram开启双人私享美食之旅，在度假村四个层级品尝精选菜肴，从Heaven一路至Sea。请联系度假村预约。",
      "ko": "남 트램을 타고 Heaven부터 Sea까지 리조트의 네 층에서 엄선된 요리를 맛보는 두 사람만의 다이닝 여행입니다. 예약은 리조트에 문의해 주세요.",
      "ja": "ナムトラムで巡るお二人のためのプライベートダイニング。HeavenからSeaまで、リゾートの4つのレベルで厳選された料理を楽しめます。ご予約はリゾートへお問い合わせください。"
    },
    "url": "https://www.danang.intercontinental.com/dining/nam-tram-dining-journey/",
    "images": [
      "https://www.danang.intercontinental.com/wp-content/uploads/2024/08/NAM-TRAM-DINING-Web-1024x683.jpg",
      "https://www.danang.intercontinental.com/wp-content/uploads/2024/08/NAM-TRAM-DINING-1-1024x683.jpg"
    ],
    "cluster": "DINING",
    "audience": [
      "adult"
    ],
    "alternates": [
      {
        "locale": "vi",
        "url": "https://www.danang.intercontinental.com/vn/dining/hanh-trinh-am-thuc-nam-tram/"
      }
    ]
  },
  {
    "id": "airport-lounge",
    "name": "InterContinental Airport Lounge",
    "level": "heaven",
    "type": "service",
    "family": "resort",
    "desc": "Extend your stay before a domestic flight at Da Nang International Airport. Enjoy complimentary refreshments; Club InterContinental and villa guests also receive a complimentary dining menu.",
    "translations": {
      "vi": "Tận hưởng dịch vụ của khu nghỉ dưỡng trước chuyến bay nội địa tại sân bay quốc tế Đà Nẵng. Đồ uống được phục vụ miễn phí; khách Club InterContinental và Villa còn được dùng thực đơn miễn phí.",
      "ru": "Продлите впечатления от отдыха перед внутренним рейсом из аэропорта Дананга. Гостям предлагаются бесплатные напитки, а гостям Club InterContinental и вилл — также бесплатное меню блюд.",
      "zh": "在岘港国际机场搭乘国内航班前，继续享受度假村的贴心服务。免费提供饮品；Club InterContinental及别墅宾客还可享用免费餐点菜单。",
      "ko": "다낭 국제공항 국내선 출발 전에 리조트의 환대를 이어 가세요. 무료 음료가 제공되며 Club InterContinental 및 빌라 투숙객은 무료 식사 메뉴도 이용할 수 있습니다.",
      "ja": "ダナン国際空港の国内線出発前にもリゾートのおもてなしを。無料のお飲み物に加え、Club InterContinentalとヴィラのお客様には無料のお食事メニューをご用意しています。"
    },
    "url": "https://www.danang.intercontinental.com/amenities/airport-lounges/",
    "images": [
      "https://www.danang.intercontinental.com/wp-content/uploads/2021/10/Sun-Peninsula-Airport-Lounge-Reception-1024x534.jpg",
      "https://www.danang.intercontinental.com/wp-content/uploads/2021/10/Sun-Peninsula-Airport-Lounge-1-scaled.jpg"
    ],
    "alternates": [
      {
        "locale": "vi",
        "url": "https://www.danang.intercontinental.com/vn/amenities/airport-lounge/"
      },
      {
        "locale": "ja",
        "url": "https://www.danang.intercontinental.com/ja/amenities/airport-lounge/"
      },
      {
        "locale": "ko",
        "url": "https://www.danang.intercontinental.com/ko/amenities/airport-lounge/"
      },
      {
        "locale": "ru",
        "url": "https://www.danang.intercontinental.com/ru/amenities/airport-lounge/"
      },
      {
        "locale": "zh",
        "url": "https://www.danang.intercontinental.com/zh/amenities/airport-lounges/"
      }
    ],
    "cluster": "EXPERIENCES",
    "audience": [
      "all"
    ]
  },
  {
    "id": "design-digital-tour",
    "name": "Bill Bensley Digital Design Tour",
    "level": "heaven",
    "type": "experience",
    "family": "storytelling",
    "desc": "A self-guided digital walking tour revealing Bill Bensley’s architecture, Vietnamese inspirations and hidden design stories, from the lobby and Citron to the gallery, beach and spa.",
    "translations": {
      "vi": "Tour đi bộ kỹ thuật số tự hướng dẫn khám phá kiến trúc của Bill Bensley, cảm hứng Việt Nam và những câu chuyện thiết kế ẩn giấu, từ sảnh và Citron đến phòng tranh, bãi biển và spa.",
      "ru": "Самостоятельная цифровая прогулка по архитектуре Билла Бенсли, вьетнамским мотивам и скрытым историям дизайна — от лобби и Citron до галереи, пляжа и спа.",
      "zh": "通过自助数字徒步导览，探索Bill Bensley的建筑、越南文化灵感与隐藏的设计故事，从大堂和Citron走向画廊、海滩及水疗中心。",
      "ko": "로비와 Citron에서 갤러리, 해변, 스파까지 이어지는 셀프 디지털 도보 투어로 Bill Bensley의 건축과 베트남에서 얻은 영감, 숨겨진 디자인 이야기를 만나보세요.",
      "ja": "ロビーとCitronからギャラリー、ビーチ、スパへ。セルフガイドのデジタル散策で、Bill Bensleyの建築、ベトナムからの着想、隠れたデザインの物語を探ります。"
    },
    "url": "https://www.danang.intercontinental.com/bensley-digital-design-tour/",
    "images": [
      "https://www.danang.intercontinental.com/wp-content/uploads/2024/07/1.jpg",
      "https://www.danang.intercontinental.com/wp-content/uploads/2024/07/2a-scaled.jpg"
    ],
    "alternates": [],
    "cluster": "EXPERIENCES",
    "audience": [
      "all"
    ]
  },
  {
    "id": "club-intercontinental",
    "name": "Club InterContinental",
    "level": "heaven",
    "type": "service",
    "family": "resort",
    "desc": "Exclusive stay privileges for Club room, Club suite, penthouse and villa guests, including lounge access, breakfast, afternoon tea and evening cocktails. Other guests may enquire about paid lounge access.",
    "translations": {
      "vi": "Đặc quyền lưu trú dành cho khách Club Room, Club Suite, Penthouse và Villa, gồm sử dụng lounge, bữa sáng, trà chiều và cocktail tối. Khách khác có thể hỏi về dịch vụ vào lounge có thu phí.",
      "ru": "Особые привилегии для гостей номеров и люксов Club, пентхаусов и вилл: доступ в лаунж, завтрак, послеобеденный чай и вечерние коктейли. Остальные гости могут уточнить возможность платного посещения лаунжа.",
      "zh": "Club客房、Club套房、顶层套房和别墅宾客的专属住宿礼遇，包括贵宾休息室使用权、早餐、下午茶及晚间鸡尾酒。其他宾客可咨询付费使用休息室。",
      "ko": "Club 객실·스위트, 펜트하우스, 빌라 투숙객을 위한 라운지 이용, 조식, 애프터눈 티, 저녁 칵테일 등 특별한 숙박 혜택입니다. 그 외 투숙객은 유료 라운지 이용을 문의할 수 있습니다.",
      "ja": "Club客室・スイート、ペントハウス、ヴィラのお客様専用の宿泊特典。ラウンジ利用、朝食、アフタヌーンティー、夕方のカクテルを含みます。他のお客様は有料ラウンジ利用をご相談いただけます。"
    },
    "url": "https://www.danang.intercontinental.com/amenities/club-intercontinental/",
    "images": [
      "https://www.danang.intercontinental.com/wp-content/uploads/2021/10/Club-InterContinental-Elite-Butlers-scaled.jpg",
      "https://www.danang.intercontinental.com/wp-content/uploads/2023/04/03-05-0051_POA_8029-Edit.jpg"
    ],
    "audience": [
      "adult",
      "kids"
    ],
    "alternates": [
      {
        "locale": "vi",
        "url": "https://www.danang.intercontinental.com/vn/amenities/club-intercontinental/"
      },
      {
        "locale": "ja",
        "url": "https://www.danang.intercontinental.com/ja/amenities/club-intercontinental/"
      },
      {
        "locale": "ko",
        "url": "https://www.danang.intercontinental.com/ko/amenities/club-intercontinental/"
      },
      {
        "locale": "ru",
        "url": "https://www.danang.intercontinental.com/ru/amenities/club-intercontinental/"
      },
      {
        "locale": "zh",
        "url": "https://www.danang.intercontinental.com/zh/amenities/club-intercontinental/"
      }
    ],
    "cluster": "EXPERIENCES"
  },
  {
    "id": "rooms",
    "name": "Resort Classic Room Oceanview",
    "level": "heaven",
    "type": "accommodation",
    "family": "resort",
    "desc": "A 70 sqm room with Vietnamese-inspired design, a private terrace and views of the gardens and sea.",
    "translations": {
      "vi": "Phòng 70 m² với thiết kế lấy cảm hứng Việt Nam, sân hiên riêng và tầm nhìn ra vườn cùng biển.",
      "ru": "Номер площадью 70 м² с вьетнамскими мотивами, собственной террасой и видом на сад и море.",
      "zh": "70平方米客房融入越南风格设计，设有私人露台，可欣赏花园与海景。",
      "ko": "베트남에서 영감을 얻은 디자인, 전용 테라스, 정원과 바다 전망을 갖춘 70㎡ 객실입니다.",
      "ja": "ベトナムらしいデザインの70㎡の客室。専用テラスから庭園と海を望めます。"
    },
    "url": "https://www.danang.intercontinental.com/room-suites/resort-classic-room-oceanview/",
    "images": [
      "https://www.danang.intercontinental.com/wp-content/uploads/2022/10/Resort-Classic-Room-bedroom-web-1024x683.jpg",
      "https://www.danang.intercontinental.com/wp-content/uploads/2021/06/Resort-Classic-Room-Twin-low-res-Web.jpg"
    ],
    "audience": [
      "adult",
      "kids"
    ],
    "alternates": [
      {
        "locale": "vi",
        "url": "https://www.danang.intercontinental.com/vn/room-suites/resort-classic-room-oceanview/"
      },
      {
        "locale": "ja",
        "url": "https://www.danang.intercontinental.com/ja/room-suites/resort-classic-room-oceanview/"
      },
      {
        "locale": "ko",
        "url": "https://www.danang.intercontinental.com/ko/room-suites/resort-classic-room-oceanview/"
      },
      {
        "locale": "ru",
        "url": "https://www.danang.intercontinental.com/ru/room-suites/resort-classic-room-oceanview/"
      },
      {
        "locale": "zh",
        "url": "https://www.danang.intercontinental.com/zh/room-suites/resort-classic-room-oceanview/"
      }
    ],
    "preserve_images": false,
    "cluster": "EXPERIENCES"
  },
  {
    "id": "resort-classic-panoramic-room-oceanview",
    "name": "Resort Classic Panoramic Room Oceanview",
    "level": "heaven",
    "type": "accommodation",
    "family": "resort",
    "desc": "A 70 sqm room with a private terrace and panoramic views of the mountains, gardens and sea.",
    "translations": {
      "vi": "Phòng 70 m² với sân hiên riêng và tầm nhìn toàn cảnh núi, vườn và biển.",
      "ru": "Номер площадью 70 м² с собственной террасой и панорамой гор, садов и моря.",
      "zh": "70平方米客房设有私人露台，尽览山峦、花园与海洋的全景。",
      "ko": "전용 테라스에서 산과 정원, 바다의 파노라마를 감상하는 70㎡ 객실입니다.",
      "ja": "専用テラスから山々、庭園、海のパノラマを楽しむ70㎡の客室です。"
    },
    "url": "https://www.danang.intercontinental.com/room-suites/resort-classic-panoramic-room-oceanview/",
    "images": [
      "https://www.danang.intercontinental.com/wp-content/uploads/2022/10/Resort-Classic-Panoramic-bedroom-web-1024x683.jpg",
      "https://www.danang.intercontinental.com/wp-content/uploads/2022/03/Bathroom-Resort-Classic-Panoramic-Club-Terrace-Suite-Panoramic-scaled.jpg"
    ],
    "audience": [
      "adult",
      "kids"
    ],
    "alternates": [
      {
        "locale": "vi",
        "url": "https://www.danang.intercontinental.com/vn/room-suites/resort-classic-panoramic-oceanview/"
      },
      {
        "locale": "ja",
        "url": "https://www.danang.intercontinental.com/ja/room-suites/resort-classic-panoramic-oceanview/"
      },
      {
        "locale": "ko",
        "url": "https://www.danang.intercontinental.com/ko/room-suites/resort-classic-panoramic-oceanview/"
      },
      {
        "locale": "ru",
        "url": "https://www.danang.intercontinental.com/ru/room-suites/resort-classic-panoramic-oceanview/"
      },
      {
        "locale": "zh",
        "url": "https://www.danang.intercontinental.com/zh/room-suites/resort-classic-panoramic-oceanview/"
      }
    ],
    "preserve_images": false,
    "cluster": "EXPERIENCES"
  },
  {
    "id": "club-panoramic-room-oceanview",
    "name": "Club Panoramic Room Oceanview",
    "level": "heaven",
    "type": "accommodation",
    "family": "resort",
    "desc": "A 70 sqm ocean-view room with a terrace and exclusive Club InterContinental lounge privileges.",
    "translations": {
      "vi": "Phòng 70 m² hướng biển, có sân hiên và đặc quyền lounge Club InterContinental.",
      "ru": "Номер площадью 70 м² с видом на море, террасой и привилегиями лаунжа Club InterContinental.",
      "zh": "70平方米海景客房设有露台，并提供Club InterContinental贵宾休息室专属礼遇。",
      "ko": "테라스와 Club InterContinental 라운지 혜택을 갖춘 70㎡ 오션뷰 객실입니다.",
      "ja": "テラスとClub InterContinentalラウンジ特典を備えた70㎡のオーシャンビュー客室です。"
    },
    "url": "https://www.danang.intercontinental.com/room-suites/club-panoramic-room-oceanview/",
    "images": [
      "https://www.danang.intercontinental.com/wp-content/uploads/2025/05/Resort-Classic-Room-Twin-1024x674.jpg",
      "https://www.danang.intercontinental.com/wp-content/uploads/2021/06/Resort-Classic-Room-bedside-detail-scaled.jpg"
    ],
    "audience": [
      "adult",
      "kids"
    ],
    "alternates": [
      {
        "locale": "vi",
        "url": "https://www.danang.intercontinental.com/vn/room-suites/club-panoramic-room-oceanview/"
      },
      {
        "locale": "ja",
        "url": "https://www.danang.intercontinental.com/ja/room-suites/club-panoramic-room-oceanview/"
      },
      {
        "locale": "ko",
        "url": "https://www.danang.intercontinental.com/ko/room-suites/club-panoramic-room-oceanview/"
      },
      {
        "locale": "ru",
        "url": "https://www.danang.intercontinental.com/ru/room-suites/club-panoramic-room-oceanview/"
      },
      {
        "locale": "zh",
        "url": "https://www.danang.intercontinental.com/zh/room-suites/club-panoramic-room-oceanview/"
      }
    ],
    "preserve_images": false,
    "cluster": "EXPERIENCES"
  },
  {
    "id": "resort-terrace-suite-oceanview",
    "name": "Resort Terrace Suite Oceanview",
    "level": "heaven",
    "type": "accommodation",
    "family": "resort",
    "desc": "An 80 sqm corner suite with a generous outdoor terrace and views of the beach and bay.",
    "translations": {
      "vi": "Suite góc 80 m² với sân hiên rộng ngoài trời và tầm nhìn ra bãi biển cùng vịnh.",
      "ru": "Угловой люкс площадью 80 м² с просторной открытой террасой и видом на пляж и залив.",
      "zh": "80平方米转角套房设有宽敞户外露台，俯瞰海滩与海湾。",
      "ko": "넓은 야외 테라스와 해변·만 전망을 갖춘 80㎡ 코너 스위트입니다.",
      "ja": "広い屋外テラスとビーチ・湾の眺めが魅力の80㎡のコーナースイートです。"
    },
    "url": "https://www.danang.intercontinental.com/room-suites/resort-terrace-suite-oceanview/",
    "images": [
      "https://www.danang.intercontinental.com/wp-content/uploads/2022/10/Resort-Terrace-Suite-bedroom-1024x703.jpg",
      "https://www.danang.intercontinental.com/wp-content/uploads/2022/03/Resort-Terrace-Suite-terrace-scaled.jpg"
    ],
    "audience": [
      "adult",
      "kids"
    ],
    "alternates": [
      {
        "locale": "vi",
        "url": "https://www.danang.intercontinental.com/vn/room-suites/resort-terrace-suite-oceanview/"
      },
      {
        "locale": "ja",
        "url": "https://www.danang.intercontinental.com/ja/room-suites/resort-terrace-suite-oceanview/"
      },
      {
        "locale": "ko",
        "url": "https://www.danang.intercontinental.com/ko/room-suites/resort-terrace-suite-oceanview/"
      },
      {
        "locale": "ru",
        "url": "https://www.danang.intercontinental.com/ru/room-suites/resort-terrace-suite-oceanview/"
      },
      {
        "locale": "zh",
        "url": "https://www.danang.intercontinental.com/zh/room-suites/resort-terrace-suite-oceanview/"
      }
    ],
    "preserve_images": false,
    "cluster": "EXPERIENCES"
  },
  {
    "id": "club-terrace-suite-panoramic-oceanview",
    "name": "Club Terrace Suite Panoramic Oceanview",
    "level": "heaven",
    "type": "accommodation",
    "family": "resort",
    "desc": "An 80 sqm terrace suite with panoramic ocean and jungle views and Club InterContinental privileges.",
    "translations": {
      "vi": "Suite 80 m² với sân hiên, toàn cảnh biển và rừng cùng đặc quyền Club InterContinental.",
      "ru": "Люкс площадью 80 м² с террасой, панорамой моря и джунглей и привилегиями Club InterContinental.",
      "zh": "80平方米露台套房尽览海洋与丛林全景，并享有Club InterContinental礼遇。",
      "ko": "바다와 숲의 파노라마, 테라스, Club InterContinental 혜택을 갖춘 80㎡ 스위트입니다.",
      "ja": "海と森のパノラマを望む80㎡のテラススイート。Club InterContinental特典付きです。"
    },
    "url": "https://www.danang.intercontinental.com/room-suites/club-terrace-suite-panoramic-oceanview/",
    "images": [
      "https://www.danang.intercontinental.com/wp-content/uploads/2022/10/Club-Terrace-Suite-Oceanview-Panoramic-bedroom-1024x662.jpg",
      "https://www.danang.intercontinental.com/wp-content/uploads/2022/10/Club-Terrace-Suite-terrace-2-scaled.jpg"
    ],
    "audience": [
      "adult",
      "kids"
    ],
    "alternates": [
      {
        "locale": "vi",
        "url": "https://www.danang.intercontinental.com/vn/room-suites/club-terrace-suite-panoramic-oceanview/"
      },
      {
        "locale": "ja",
        "url": "https://www.danang.intercontinental.com/ja/room-suites/club-terrace-suite-panoramic-oceanview/"
      },
      {
        "locale": "ko",
        "url": "https://www.danang.intercontinental.com/ko/room-suites/club-terrace-suite-panoramic-oceanview/"
      },
      {
        "locale": "ru",
        "url": "https://www.danang.intercontinental.com/ru/room-suites/club-terrace-suite-panoramic-oceanview/"
      },
      {
        "locale": "zh",
        "url": "https://www.danang.intercontinental.com/zh/room-suites/club-terrace-suite-panoramic-oceanview/"
      }
    ],
    "preserve_images": false,
    "cluster": "EXPERIENCES"
  },
  {
    "id": "penthouses",
    "name": "One-Bedroom Heavenly Penthouse",
    "level": "heaven",
    "type": "accommodation",
    "family": "resort",
    "desc": "A one-bedroom rooftop penthouse with a private pool, wraparound terrace and Club InterContinental privileges.",
    "translations": {
      "vi": "Penthouse một phòng ngủ trên tầng mái, có hồ bơi riêng, sân hiên bao quanh và đặc quyền Club InterContinental.",
      "ru": "Пентхаус с одной спальней, собственным бассейном, террасой вокруг здания и привилегиями Club InterContinental.",
      "zh": "单卧室顶层套房设有私人泳池、环绕露台，并享有Club InterContinental礼遇。",
      "ko": "전용 수영장과 둘레 테라스, Club InterContinental 혜택을 갖춘 루프톱 원베드룸 펜트하우스입니다.",
      "ja": "専用プールと周囲を囲むテラスを備えた1ベッドルームのペントハウス。Club InterContinental特典付きです。"
    },
    "url": "https://www.danang.intercontinental.com/room-suites/one-bedroom-heavenly-penthouse/",
    "images": [
      "https://www.danang.intercontinental.com/wp-content/uploads/2022/10/Heavenly-Penthouse-living-room-web-1024x683.jpg",
      "https://www.danang.intercontinental.com/wp-content/uploads/2022/10/Heavenly-Penthouse-bedroom-scaled.jpg"
    ],
    "audience": [
      "adult",
      "kids"
    ],
    "alternates": [
      {
        "locale": "vi",
        "url": "https://www.danang.intercontinental.com/vn/room-suites/one-bedroom-heavenly-penthouse/"
      },
      {
        "locale": "ja",
        "url": "https://www.danang.intercontinental.com/ja/room-suites/one-bedroom-heavenly-penthouse/"
      },
      {
        "locale": "ko",
        "url": "https://www.danang.intercontinental.com/ko/room-suites/one-bedroom-heavenly-penthouse/"
      },
      {
        "locale": "ru",
        "url": "https://www.danang.intercontinental.com/ru/room-suites/one-bedroom-heavenly-penthouse/"
      },
      {
        "locale": "zh",
        "url": "https://www.danang.intercontinental.com/zh/room-suites/one-bedroom-heavenly-penthouse/"
      }
    ],
    "preserve_images": false,
    "cluster": "EXPERIENCES"
  },
  {
    "id": "one-bedroom-seaside-villa-by-the-beach",
    "name": "One-Bedroom Seaside Villa on the Beach",
    "level": "sea",
    "type": "accommodation",
    "family": "resort",
    "desc": "A one-bedroom seaside villa with a private infinity pool and a staircase leading directly to the beach.",
    "translations": {
      "vi": "Villa một phòng ngủ bên biển, có hồ bơi vô cực riêng và cầu thang dẫn thẳng xuống bãi biển.",
      "ru": "Вилла с одной спальней у моря, собственным пейзажным бассейном и лестницей прямо к пляжу.",
      "zh": "单卧室海滨别墅设有私人无边泳池及直达海滩的阶梯。",
      "ko": "전용 인피니티 풀과 해변으로 바로 이어지는 계단을 갖춘 원베드룸 해변 빌라입니다.",
      "ja": "専用インフィニティプールとビーチへ直接降りる階段を備えた1ベッドルームの海辺のヴィラです。"
    },
    "url": "https://www.danang.intercontinental.com/room-suites/one-bedroom-seaside-villa-by-the-beach/",
    "images": [
      "https://www.danang.intercontinental.com/wp-content/uploads/2022/10/Beach-Villa-bedroom-and-view-1024x683.jpg",
      "https://www.danang.intercontinental.com/wp-content/uploads/2022/10/Beach-Villa-terrace-and-pool-scaled.jpg"
    ],
    "audience": [
      "adult",
      "kids"
    ],
    "alternates": [
      {
        "locale": "vi",
        "url": "https://www.danang.intercontinental.com/vn/room-suites/one-bedroom-seaside-villa-by-the-beach/"
      },
      {
        "locale": "ja",
        "url": "https://www.danang.intercontinental.com/ja/room-suites/one-bedroom-seaside-villa-by-the-beach/"
      },
      {
        "locale": "ko",
        "url": "https://www.danang.intercontinental.com/ko/room-suites/one-bedroom-seaside-villa-by-the-beach/"
      },
      {
        "locale": "ru",
        "url": "https://www.danang.intercontinental.com/ru/room-suites/one-bedroom-seaside-villa-by-the-beach/"
      },
      {
        "locale": "zh",
        "url": "https://www.danang.intercontinental.com/zh/room-suites/one-bedroom-seaside-villa-by-the-beach/"
      }
    ],
    "preserve_images": false,
    "cluster": "EXPERIENCES"
  },
  {
    "id": "one-bedroom-seaside-villa-on-the-rocks",
    "name": "One-Bedroom Seaside Villa on the Rocks",
    "level": "sea",
    "type": "accommodation",
    "family": "resort",
    "desc": "A one-bedroom villa above the rocks, with a private infinity pool, sun terrace and sea views.",
    "translations": {
      "vi": "Villa một phòng ngủ trên ghềnh đá, có hồ bơi vô cực riêng, sân hiên tắm nắng và tầm nhìn ra biển.",
      "ru": "Вилла с одной спальней над скалами, собственным пейзажным бассейном, солнечной террасой и видом на море.",
      "zh": "单卧室临岩别墅设有私人无边泳池、日光露台及海景。",
      "ko": "바위 위에 자리한 원베드룸 빌라로 전용 인피니티 풀, 선 테라스, 바다 전망을 갖추고 있습니다.",
      "ja": "岩場の上に佇む1ベッドルームのヴィラ。専用インフィニティプールとサンテラスから海を望めます。"
    },
    "url": "https://www.danang.intercontinental.com/room-suites/one-bedroom-seaside-villa-on-the-rocks/",
    "images": [
      "https://www.danang.intercontinental.com/wp-content/uploads/2022/10/Rock-Villa-terrace-and-pool-1024x683.jpg",
      "https://www.danang.intercontinental.com/wp-content/uploads/2022/10/Rock-Villa-bedroom-scaled.jpg"
    ],
    "audience": [
      "adult",
      "kids"
    ],
    "alternates": [
      {
        "locale": "vi",
        "url": "https://www.danang.intercontinental.com/vn/room-suites/one-bedroom-seaside-villa-on-the-rocks/"
      },
      {
        "locale": "ja",
        "url": "https://www.danang.intercontinental.com/ja/room-suites/one-bedroom-seaside-villa-on-the-rocks/"
      },
      {
        "locale": "ko",
        "url": "https://www.danang.intercontinental.com/ko/room-suites/one-bedroom-seaside-villa-on-the-rocks/"
      },
      {
        "locale": "ru",
        "url": "https://www.danang.intercontinental.com/ru/room-suites/one-bedroom-seaside-villa-on-the-rocks/"
      },
      {
        "locale": "zh",
        "url": "https://www.danang.intercontinental.com/zh/room-suites/one-bedroom-seaside-villa-on-the-rocks/"
      }
    ],
    "preserve_images": false,
    "cluster": "EXPERIENCES"
  },
  {
    "id": "spa-lagoon-villas",
    "name": "One-Bedroom Spa Lagoon Villa",
    "level": "sea",
    "type": "accommodation",
    "family": "resort",
    "desc": "A secluded one-bedroom lagoon villa with a private treatment room, steam room, sauna and outdoor jacuzzi.",
    "translations": {
      "vi": "Villa một phòng ngủ yên tĩnh bên đầm, có phòng trị liệu riêng, phòng xông hơi ướt, sauna và jacuzzi ngoài trời.",
      "ru": "Уединённая вилла с одной спальней у лагуны, собственной процедурной, парной, сауной и джакузи на открытом воздухе.",
      "zh": "幽静的单卧室泻湖别墅设有私人护理室、蒸汽房、桑拿及户外按摩浴池。",
      "ko": "전용 트리트먼트룸, 스팀룸, 사우나, 야외 자쿠지를 갖춘 한적한 원베드룸 라군 빌라입니다.",
      "ja": "専用トリートメントルーム、スチームルーム、サウナ、屋外ジャグジーを備えた静かな1ベッドルームのラグーンヴィラです。"
    },
    "url": "https://www.danang.intercontinental.com/room-suites/one-bedroom-spa-lagoon-villa/",
    "images": [
      "https://www.danang.intercontinental.com/wp-content/uploads/2022/10/Spa-Lagoon-Villa-living-room-1024x662.jpg",
      "https://www.danang.intercontinental.com/wp-content/uploads/2021/06/Spa-Lagoon-Villa-bedroom-scaled.jpg"
    ],
    "audience": [
      "adult",
      "kids"
    ],
    "alternates": [
      {
        "locale": "vi",
        "url": "https://www.danang.intercontinental.com/vn/room-suites/one-bedroom-spa-lagoon-villa/"
      },
      {
        "locale": "ja",
        "url": "https://www.danang.intercontinental.com/ja/room-suites/one-bedroom-spa-lagoon-villa/"
      },
      {
        "locale": "ko",
        "url": "https://www.danang.intercontinental.com/ko/room-suites/one-bedroom-spa-lagoon-villa/"
      },
      {
        "locale": "ru",
        "url": "https://www.danang.intercontinental.com/ru/room-suites/one-bedroom-spa-lagoon-villa/"
      },
      {
        "locale": "zh",
        "url": "https://www.danang.intercontinental.com/zh/room-suites/one-bedroom-spa-lagoon-villa/"
      }
    ],
    "preserve_images": true,
    "cluster": "WELLNESS"
  },
  {
    "id": "two-bedroom-seaside-villa-on-the-rocks",
    "name": "Two-Bedroom Seaside Villa on the Rocks",
    "level": "sea",
    "type": "accommodation",
    "family": "resort",
    "desc": "A two-bedroom seaside villa above the rocks, with a private infinity pool and multiple terraces.",
    "translations": {
      "vi": "Villa hai phòng ngủ bên biển trên ghềnh đá, có hồ bơi vô cực riêng và nhiều sân hiên.",
      "ru": "Вилла с двумя спальнями над прибрежными скалами, собственным пейзажным бассейном и несколькими террасами.",
      "zh": "双卧室临岩海滨别墅设有私人无边泳池及多处露台。",
      "ko": "전용 인피니티 풀과 여러 테라스를 갖춘 투베드룸 해변 바위 빌라입니다.",
      "ja": "専用インフィニティプールと複数のテラスを備えた、海辺の岩場に佇む2ベッドルームのヴィラです。"
    },
    "url": "https://www.danang.intercontinental.com/room-suites/two-bedroom-seaside-villa-on-the-rocks/",
    "images": [
      "https://www.danang.intercontinental.com/wp-content/uploads/2022/10/2BR-Rock-Villa-terrace-and-plunge-pool-1024x683.jpg",
      "https://www.danang.intercontinental.com/wp-content/uploads/2022/10/2BR-Rock-Villa-master-bedroom-scaled.jpg"
    ],
    "audience": [
      "adult",
      "kids"
    ],
    "alternates": [
      {
        "locale": "vi",
        "url": "https://www.danang.intercontinental.com/vn/room-suites/two-bedroom-seaside-villa-on-the-rocks/"
      },
      {
        "locale": "ja",
        "url": "https://www.danang.intercontinental.com/ja/room-suites/two-bedroom-seaside-villa-on-the-rocks/"
      },
      {
        "locale": "ko",
        "url": "https://www.danang.intercontinental.com/ko/room-suites/two-bedroom-seaside-villa-on-the-rocks/"
      },
      {
        "locale": "ru",
        "url": "https://www.danang.intercontinental.com/ru/room-suites/two-bedroom-seaside-villa-on-the-rocks/"
      },
      {
        "locale": "zh",
        "url": "https://www.danang.intercontinental.com/zh/room-suites/two-bedroom-seaside-villa-on-the-rocks/"
      }
    ],
    "preserve_images": false,
    "cluster": "EXPERIENCES"
  },
  {
    "id": "two-bedroom-royal-residence-by-the-sea",
    "name": "Two-Bedroom Royal Residence by the Sea",
    "level": "sea",
    "type": "accommodation",
    "family": "resort",
    "desc": "A two-bedroom residence by the sea with a 13-metre infinity pool, private dining pavilion and media room.",
    "translations": {
      "vi": "Dinh thự hai phòng ngủ bên biển, có hồ bơi vô cực 13 mét, nhà ăn riêng và phòng giải trí.",
      "ru": "Резиденция с двумя спальнями у моря, 13-метровым пейзажным бассейном, отдельным обеденным павильоном и медиакомнатой.",
      "zh": "双卧室海滨住宅设有13米无边泳池、私人餐亭及影音室。",
      "ko": "13m 인피니티 풀과 전용 다이닝 파빌리온, 미디어룸을 갖춘 투베드룸 해변 레지던스입니다.",
      "ja": "13メートルのインフィニティプール、専用ダイニングパビリオン、メディアルームを備えた海辺の2ベッドルームのレジデンスです。"
    },
    "url": "https://www.danang.intercontinental.com/room-suites/two-bedroom-royal-residence-by-the-sea/",
    "images": [
      "https://www.danang.intercontinental.com/wp-content/uploads/2022/10/2BR-Royal-Residence-terrace-and-plunge-pool-1024x653.jpg",
      "https://www.danang.intercontinental.com/wp-content/uploads/2022/10/2BR-Royal-Residence-living-room-scaled.jpg"
    ],
    "audience": [
      "adult",
      "kids"
    ],
    "alternates": [
      {
        "locale": "vi",
        "url": "https://www.danang.intercontinental.com/vn/room-suites/two-bedroom-royal-residence-by-the-sea/"
      },
      {
        "locale": "ja",
        "url": "https://www.danang.intercontinental.com/ja/room-suites/two-bedroom-royal-residence-by-the-sea/"
      },
      {
        "locale": "ko",
        "url": "https://www.danang.intercontinental.com/ko/room-suites/two-bedroom-royal-residence-by-the-sea/"
      },
      {
        "locale": "ru",
        "url": "https://www.danang.intercontinental.com/ru/room-suites/two-bedroom-royal-residence-by-the-sea/"
      },
      {
        "locale": "zh",
        "url": "https://www.danang.intercontinental.com/zh/room-suites/two-bedroom-royal-residence-by-the-sea/"
      }
    ],
    "preserve_images": false,
    "cluster": "EXPERIENCES"
  },
  {
    "id": "two-bedroom-sun-peninsula-residence",
    "name": "Two-Bedroom Sun Peninsula Residence",
    "level": "sea",
    "type": "accommodation",
    "family": "resort",
    "desc": "An 800 sqm two-bedroom residence with two infinity pools, outdoor living spaces and a dedicated resort host.",
    "translations": {
      "vi": "Dinh thự hai phòng ngủ 800 m², có hai hồ bơi vô cực, không gian sinh hoạt ngoài trời và Người Dẫn Lối riêng.",
      "ru": "Резиденция площадью 800 м² с двумя спальнями, двумя пейзажными бассейнами, открытыми зонами отдыха и персональным сопровождающим.",
      "zh": "800平方米双卧室住宅设有两座无边泳池、户外起居空间及专属管家。",
      "ko": "두 개의 인피니티 풀과 야외 생활 공간, 전담 호스트를 갖춘 800㎡ 투베드룸 레지던스입니다.",
      "ja": "2つのインフィニティプール、屋外リビング、専任ホストを備えた800㎡の2ベッドルームのレジデンスです。"
    },
    "url": "https://www.danang.intercontinental.com/room-suites/two-bedroom-sun-peninsula-residence/",
    "images": [
      "https://www.danang.intercontinental.com/wp-content/uploads/2022/10/2BR-SP-Residence-aerial-1-1024x768.jpg",
      "https://www.danang.intercontinental.com/wp-content/uploads/2022/10/2BR-SP-Residence-pool-and-living-room-1-scaled.jpg"
    ],
    "audience": [
      "adult",
      "kids"
    ],
    "alternates": [
      {
        "locale": "vi",
        "url": "https://www.danang.intercontinental.com/vn/room-suites/two-bedroom-sun-peninsula-residence/"
      },
      {
        "locale": "ja",
        "url": "https://www.danang.intercontinental.com/ja/room-suites/two-bedroom-sun-peninsula-residence/"
      },
      {
        "locale": "ko",
        "url": "https://www.danang.intercontinental.com/ko/room-suites/two-bedroom-sun-peninsula-residence/"
      },
      {
        "locale": "ru",
        "url": "https://www.danang.intercontinental.com/ru/room-suites/two-bedroom-sun-peninsula-residence/"
      },
      {
        "locale": "zh",
        "url": "https://www.danang.intercontinental.com/zh/room-suites/two-bedroom-sun-peninsula-residence/"
      }
    ],
    "preserve_images": false,
    "cluster": "EXPERIENCES"
  },
  {
    "id": "three-bedroom-sun-peninsula-residence",
    "name": "Three-Bedroom Sun Peninsula Residence",
    "level": "sea",
    "type": "accommodation",
    "family": "resort",
    "desc": "A 1,000 sqm three-bedroom residence with two infinity pools, direct beach access and a dedicated resort host.",
    "translations": {
      "vi": "Dinh thự ba phòng ngủ 1.000 m², có hai hồ bơi vô cực, lối đi thẳng ra biển và Người Dẫn Lối riêng.",
      "ru": "Резиденция площадью 1 000 м² с тремя спальнями, двумя пейзажными бассейнами, прямым выходом к пляжу и персональным сопровождающим.",
      "zh": "1000平方米三卧室住宅设有两座无边泳池、直达海滩的通道及专属管家。",
      "ko": "두 개의 인피니티 풀과 해변 직접 출입, 전담 호스트를 갖춘 1,000㎡ 쓰리베드룸 레지던스입니다.",
      "ja": "2つのインフィニティプール、ビーチへの直接アクセス、専任ホストを備えた1,000㎡の3ベッドルームのレジデンスです。"
    },
    "url": "https://www.danang.intercontinental.com/room-suites/three-bedroom-sun-peninsula-residence/",
    "images": [
      "https://www.danang.intercontinental.com/wp-content/uploads/2022/10/3BR-SP-Residence-aerial-1-1024x768.jpg",
      "https://www.danang.intercontinental.com/wp-content/uploads/2022/10/3BR-SP-Residence-living-area-garden-and-pool-scaled.jpg"
    ],
    "audience": [
      "adult",
      "kids"
    ],
    "alternates": [
      {
        "locale": "vi",
        "url": "https://www.danang.intercontinental.com/vn/room-suites/three-bedroom-sun-peninsula-residence/"
      },
      {
        "locale": "ja",
        "url": "https://www.danang.intercontinental.com/ja/room-suites/three-bedroom-sun-peninsula-residence/"
      },
      {
        "locale": "ko",
        "url": "https://www.danang.intercontinental.com/ko/room-suites/three-bedroom-sun-peninsula-residence/"
      },
      {
        "locale": "ru",
        "url": "https://www.danang.intercontinental.com/ru/room-suites/three-bedroom-sun-peninsula-residence/"
      },
      {
        "locale": "zh",
        "url": "https://www.danang.intercontinental.com/zh/room-suites/three-bedroom-sun-peninsula-residence/"
      }
    ],
    "preserve_images": false,
    "cluster": "EXPERIENCES"
  },
  {
    "id": "three-bedroom-bai-bac-bay-villa",
    "name": "Three-Bedroom Bai Bac Bay Villa",
    "level": "sea",
    "type": "accommodation",
    "family": "resort",
    "desc": "A secluded three-bedroom hillside villa with three infinity pools, sea views and a dedicated resort host.",
    "translations": {
      "vi": "Villa ba phòng ngủ yên tĩnh trên sườn đồi, có ba hồ bơi vô cực, tầm nhìn ra biển và Người Dẫn Lối riêng.",
      "ru": "Уединённая вилла с тремя спальнями на склоне, тремя пейзажными бассейнами, видом на море и персональным сопровождающим.",
      "zh": "幽静的三卧室山坡别墅设有三座无边泳池、海景及专属管家。",
      "ko": "세 개의 인피니티 풀과 바다 전망, 전담 호스트를 갖춘 한적한 언덕 위 쓰리베드룸 빌라입니다.",
      "ja": "3つのインフィニティプール、海の眺め、専任ホストを備えた静かな丘の斜面の3ベッドルームのヴィラです。"
    },
    "url": "https://www.danang.intercontinental.com/room-suites/three-bedroom-bai-bac-bay-villa/",
    "images": [
      "https://www.danang.intercontinental.com/wp-content/uploads/2022/10/Bai-Bac-Bay-Villa-aerial-2-1024x768.jpg",
      "https://www.danang.intercontinental.com/wp-content/uploads/2022/10/Bai-Bac-Bay-Villa-aerial-1-scaled.jpg"
    ],
    "audience": [
      "adult",
      "kids"
    ],
    "alternates": [
      {
        "locale": "vi",
        "url": "https://www.danang.intercontinental.com/vn/room-suites/three-bedroom-bai-bac-bay-villa/"
      },
      {
        "locale": "ja",
        "url": "https://www.danang.intercontinental.com/ja/room-suites/three-bedroom-bai-bac-bay-villa/"
      },
      {
        "locale": "ko",
        "url": "https://www.danang.intercontinental.com/ko/room-suites/three-bedroom-bai-bac-bay-villa/"
      },
      {
        "locale": "ru",
        "url": "https://www.danang.intercontinental.com/ru/room-suites/three-bedroom-bai-bac-bay-villa/"
      },
      {
        "locale": "zh",
        "url": "https://www.danang.intercontinental.com/zh/room-suites/three-bedroom-bai-bac-bay-villa/"
      }
    ],
    "preserve_images": false,
    "cluster": "EXPERIENCES"
  },
  {
    "id": "four-bedroom-pool-villa",
    "name": "Four-Bedroom Pool Villa",
    "level": "earth",
    "type": "accommodation",
    "family": "resort",
    "desc": "A four-bedroom residence on Earth level with three private pools, separate living rooms and a dedicated resort host.",
    "translations": {
      "vi": "Dinh thự bốn phòng ngủ tại tầng Earth, có ba hồ bơi riêng, phòng khách riêng cho từng phòng ngủ và Người Dẫn Lối riêng.",
      "ru": "Резиденция с четырьмя спальнями на уровне Earth, тремя собственными бассейнами, отдельными гостиными и персональным сопровождающим.",
      "zh": "位于Earth层级的四卧室住宅设有三座私人泳池、独立起居室及专属管家。",
      "ko": "Earth 층에 위치한 포베드룸 레지던스로 세 개의 전용 수영장과 별도 거실, 전담 호스트를 갖추고 있습니다.",
      "ja": "Earthレベルの4ベッドルームのレジデンス。3つの専用プール、独立したリビング、専任ホストを備えています。"
    },
    "url": "https://www.danang.intercontinental.com/room-suites/four-bedroom-pool-villa/",
    "images": [
      "https://www.danang.intercontinental.com/wp-content/uploads/2023/04/4-Bedroom-Pool-Villa-Aerial-1024x575.jpg",
      "https://www.danang.intercontinental.com/wp-content/uploads/2023/10/4-Bedroom-Villa-Living-2-Done-scaled.jpg"
    ],
    "audience": [
      "adult",
      "kids"
    ],
    "alternates": [
      {
        "locale": "vi",
        "url": "https://www.danang.intercontinental.com/vn/room-suites/four-bedroom-pool-villa/"
      },
      {
        "locale": "ja",
        "url": "https://www.danang.intercontinental.com/ja/room-suites/four-bedroom-pool-villa/"
      },
      {
        "locale": "ko",
        "url": "https://www.danang.intercontinental.com/ko/room-suites/four-bedroom-pool-villa/"
      },
      {
        "locale": "zh",
        "url": "https://www.danang.intercontinental.com/zh/room-suites/four-bedroom-pool-villa/"
      }
    ],
    "preserve_images": false,
    "cluster": "EXPERIENCES"
  }
]$cards$::jsonb;
  card jsonb;
  translation record;
  variant jsonb;
  action_id uuid;
  action_kind public.destination_link_type;
  next_order integer;
BEGIN
  FOR card IN SELECT value FROM jsonb_array_elements(cards) LOOP
    SELECT coalesce(max(display_order), 0) + 1 INTO next_order
    FROM public.destinations WHERE level_id = card->>'level';
    INSERT INTO public.destinations (
      id,name,level_id,cluster,type,short_description,image_key,detail_image_key,
      content_family,audience_tags,offer_duration,storytelling_scope,display_order,active
    ) VALUES (
      card->>'id',card->>'name',card->>'level',card->>'cluster',
      (card->>'type')::public.destination_type,card->>'desc',
      card->'images'->>0,card->'images'->>1,card->>'family',
      ARRAY(SELECT jsonb_array_elements_text(card->'audience')),
      CASE WHEN card->>'family'='offer' THEN 'ongoing' END,
      CASE WHEN card->>'family'='storytelling' THEN 'resort' END,next_order,true
    ) ON CONFLICT (id) DO UPDATE SET
      name=EXCLUDED.name,level_id=EXCLUDED.level_id,cluster=EXCLUDED.cluster,
      type=EXCLUDED.type,short_description=EXCLUDED.short_description,
      image_key=CASE WHEN card->>'preserve_images'='true' THEN coalesce(destinations.image_key,EXCLUDED.image_key) ELSE EXCLUDED.image_key END,
      detail_image_key=CASE WHEN card->>'preserve_images'='true' THEN coalesce(destinations.detail_image_key,EXCLUDED.detail_image_key) ELSE EXCLUDED.detail_image_key END,
      content_family=EXCLUDED.content_family,audience_tags=EXCLUDED.audience_tags,
      offer_duration=EXCLUDED.offer_duration,storytelling_scope=EXCLUDED.storytelling_scope,
      active=true;

    -- Reuse the old cards rather than keeping a generic Rooms/Penthouses duplicate.
    -- Retain menus and booking links; replace only obsolete discovery destinations.
    UPDATE public.destination_links SET active=false
    WHERE destination_id=card->>'id' AND kind='DISCOVER'
      AND card->>'id' IN ('rooms','penthouses','spa-lagoon-villas')
      AND url<>card->>'url' AND active;
    action_kind := CASE WHEN card->>'pdf'='true' THEN 'MENU'::public.destination_link_type ELSE 'DISCOVER'::public.destination_link_type END;
    SELECT id INTO action_id FROM public.destination_links
    WHERE destination_id=card->>'id' AND kind=action_kind AND url=card->>'url'
    ORDER BY display_order,id LIMIT 1;
    IF action_id IS NULL THEN
      INSERT INTO public.destination_links(destination_id,kind,label,url,display_order,active)
      VALUES(card->>'id',action_kind,CASE WHEN card->>'pdf'='true' THEN 'Shuttle schedule' END,card->>'url',0,true)
      RETURNING id INTO action_id;
    ELSE
      UPDATE public.destination_links SET active=true WHERE id=action_id;
    END IF;
    FOR variant IN SELECT value FROM jsonb_array_elements(card->'alternates') LOOP
      INSERT INTO public.destination_link_translations(link_id,locale,url,source_url,active)
      VALUES(action_id,variant->>'locale',variant->>'url',card->>'url',true)
      ON CONFLICT(link_id,locale) DO UPDATE SET url=EXCLUDED.url,source_url=EXCLUDED.source_url,active=true;
    END LOOP;
    FOR translation IN SELECT key,value FROM jsonb_each_text(card->'translations') LOOP
      INSERT INTO public.destination_translations(destination_id,locale,description,source_description,published)
      VALUES(card->>'id',translation.key,translation.value,card->>'desc',true)
      ON CONFLICT(destination_id,locale) DO UPDATE SET
        description=EXCLUDED.description,source_description=EXCLUDED.source_description,published=true;
    END LOOP;
    IF (SELECT count(*) FROM public.destination_translations
        WHERE destination_id=card->>'id' AND published AND source_description=card->>'desc')<>5 THEN
      RAISE EXCEPTION 'Incomplete translations for %',card->>'id';
    END IF;
  END LOOP;
END
$migration$;
COMMIT;
