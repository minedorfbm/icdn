-- Expanded descriptions are independent of the short swipe-card intro.
-- Sources reviewed 2026-10-06; all current public cards and five translations.
BEGIN;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS detail_description text;
ALTER TABLE public.destination_translations ADD COLUMN IF NOT EXISTS detail_description text;
ALTER TABLE public.destination_translations ADD COLUMN IF NOT EXISTS source_detail_description text;
COMMENT ON COLUMN public.destinations.detail_description IS 'Expanded card copy; keep short_description as the swipe-card intro.';
COMMENT ON COLUMN public.destination_translations.source_detail_description IS 'English expanded copy reviewed for this translation. Stale text falls back to English in the hub.';
DO $migration$
DECLARE
 cards constant jsonb := $copy$[
  {
    "id": "citron",
    "description": "Explore the flavours of northern, central and southern Vietnam in Citron’s vivid yellow-and-green setting. Its signature Non-La dining pods overlook the bay, turning a meal or afternoon tea into a memorable moment above the sea.",
    "translations": {
      "vi": "Khám phá hương vị Bắc, Trung, Nam trong không gian vàng xanh của Citron. Những bàn ăn Nón Lá nổi tiếng nhìn ra vịnh, tạo nên khoảnh khắc đáng nhớ khi dùng bữa hoặc thưởng thức trà chiều.",
      "ru": "Откройте вкусы севера, центра и юга Вьетнама в ярком интерьере Citron. Знаменитые столики Non-La с видом на бухту превращают обед или послеобеденный чай в особенный момент над морем.",
      "zh": "在Citron鲜明的黄绿空间里，探索越南北部、中部与南部的风味。标志性的Non-La斗笠餐桌俯瞰海湾，让用餐或下午茶成为海天之间难忘的时刻。",
      "ko": "Citron의 노란색과 초록색 공간에서 베트남 북부·중부·남부의 맛을 만나보세요. 만을 내려다보는 상징적인 Non-La 테이블에서 식사나 애프터눈 티를 즐기며 바다 위의 특별한 순간을 경험하세요.",
      "ja": "鮮やかな黄緑色のCitronで、ベトナム北部・中部・南部の味を巡りましょう。湾を見渡す象徴的なNon-Laの席が、食事やアフタヌーンティーを海上の忘れられないひとときにします。"
    }
  },
  {
    "id": "terra-mare",
    "description": "Enjoy coastal Italian cooking in an open pavilion beside the beach. Fresh seafood, handmade pasta and artisanal pizza bring generous flavours to leisurely meals, surrounded by sea breezes and Bill Bensley’s playful design.",
    "translations": {
      "vi": "Thưởng thức ẩm thực Ý miền biển trong nhà hàng mở bên bãi biển. Hải sản tươi, mì pasta thủ công và pizza mang đến bữa ăn thư thái giữa gió biển và thiết kế đầy thú vị của Bill Bensley.",
      "ru": "Насладитесь итальянской прибрежной кухней в открытом павильоне у пляжа. Свежие морепродукты, домашняя паста и пицца дополняют неспешную трапезу, морской бриз и игривый дизайн Билла Бенсли.",
      "zh": "在海滩旁的开放式亭阁享用意大利海岸料理。鲜美海鲜、手工意面与匠心披萨，为悠闲用餐增添丰盛滋味，伴随海风及Bill Bensley充满趣味的设计。",
      "ko": "해변 옆 개방형 파빌리온에서 이탈리아 해안 요리를 즐기세요. 신선한 해산물, 수제 파스타와 피자를 바닷바람과 Bill Bensley의 유쾌한 디자인 속에서 여유롭게 맛볼 수 있습니다.",
      "ja": "ビーチ沿いの開放的なパビリオンで、イタリアの海辺の料理を。新鮮な魚介、手作りパスタ、職人のピザを、潮風とBill Bensleyの遊び心あるデザインに包まれてゆっくりお楽しみください。"
    }
  },
  {
    "id": "tingara",
    "description": "Watch Japanese teppanyaki unfold at a chef-led counter, with premium seafood, exceptional beef and carefully chosen wine and sake. Bill Bensley’s circular bird’s-nest design and rainforest views frame this intimate culinary experience.",
    "translations": {
      "vi": "Trải nghiệm teppanyaki Nhật Bản tại quầy đầu bếp với hải sản cao cấp, thịt bò tuyển chọn, rượu vang và sake. Thiết kế tổ chim tròn của Bill Bensley cùng tầm nhìn rừng nhiệt đới tạo nên không gian ẩm thực thân mật.",
      "ru": "Наблюдайте за приготовлением японского теппанъяки за стойкой шефа: морепродукты, отборная говядина, вина и саке. Круглый интерьер в форме птичьего гнезда и виды тропического леса создают камерную атмосферу.",
      "zh": "在主厨料理台前欣赏日式铁板烧，品味优质海鲜、精选牛肉及搭配的葡萄酒与清酒。Bill Bensley的圆形鸟巢设计与雨林景致，共同呈现亲密而精彩的美食体验。",
      "ko": "셰프 카운터에서 프리미엄 해산물과 엄선한 소고기로 펼쳐지는 일본식 테판야키를 만나보세요. 와인과 사케, Bill Bensley의 원형 새 둥지 디자인과 열대우림 전망이 특별한 식사를 완성합니다.",
      "ja": "シェフのカウンターで、上質な魚介と牛肉の鉄板焼きを味わうひととき。厳選したワインや日本酒、Bill Bensleyの丸い鳥の巣のデザイン、熱帯雨林の眺めが親密な食体験を彩ります。"
    },
    "intro": "Japanese teppanyaki above the rainforest.",
    "intro_translations": {
      "vi": "Teppanyaki Nhật Bản trên rừng nhiệt đới.",
      "ru": "Японское теппанъяки над тропическим лесом.",
      "zh": "雨林之上的日式铁板烧。",
      "ko": "열대우림 위에서 즐기는 일본식 테판야키.",
      "ja": "熱帯雨林を望む日本の鉄板焼き。"
    }
  },
  {
    "id": "la-maison-1888",
    "description": "Discover refined French cuisine inspired by Chef Christian Le Squer, with thoughtful wine pairings. During the restaurant’s refurbishment, the dining experience is temporarily hosted on Heaven level with a five-course menu; reservations are recommended.",
    "translations": {
      "vi": "Khám phá ẩm thực Pháp tinh tế theo cảm hứng của đầu bếp Christian Le Squer, cùng rượu vang kết hợp hài hòa. Trong thời gian cải tạo, trải nghiệm tạm thời diễn ra tại tầng Heaven với thực đơn năm món; nên đặt bàn trước.",
      "ru": "Откройте французскую кухню шефа Кристиана Ле Скера с продуманными винными сочетаниями. На время ремонта ужин временно проходит на уровне Heaven с меню из пяти блюд; рекомендуется предварительное бронирование.",
      "zh": "探索由Christian Le Squer主厨启发的精致法国料理与用心搭配的葡萄酒。餐厅翻修期间，用餐体验暂设于Heaven层级，提供五道式菜单；建议提前预约。",
      "ko": "Christian Le Squer 셰프의 영감을 담은 프랑스 요리와 와인 페어링을 즐기세요. 레스토랑 보수 기간에는 Heaven 층에서 5코스 메뉴로 임시 운영하며, 사전 예약을 권장합니다.",
      "ja": "Christian Le Squerシェフによる洗練されたフランス料理とワインの組み合わせを。改装期間中はHeaven階で5品のコースを一時的に提供しています。事前のご予約をおすすめします。"
    }
  },
  {
    "id": "buffalo-bar",
    "description": "An intimate bar within La Maison 1888, known for aperitifs, Champagne and signature cocktails before or after dinner. It is temporarily unavailable during the restaurant’s refurbishment; check the official page for reopening information.",
    "translations": {
      "vi": "Quầy bar thân mật tại La Maison 1888, nổi tiếng với rượu khai vị, Champagne và cocktail trước hoặc sau bữa tối. Hiện tạm ngừng phục vụ trong thời gian cải tạo; vui lòng xem trang chính thức để cập nhật ngày mở lại.",
      "ru": "Камерный бар в La Maison 1888 для аперитивов, шампанского и авторских коктейлей до или после ужина. Временно недоступен из-за ремонта ресторана; сведения об открытии смотрите на официальной странице.",
      "zh": "位于La Maison 1888内的私密酒吧，以餐前酒、香槟及招牌鸡尾酒闻名，适合晚餐前后小酌。餐厅翻修期间暂不开放，请查看官方页面了解重新开放的信息。",
      "ko": "La Maison 1888 안의 아늑한 바로, 저녁 식사 전후 아페리티프, 샴페인과 시그니처 칵테일을 즐기기 좋습니다. 레스토랑 보수 기간에는 임시 휴업하며, 재개장 정보는 공식 페이지에서 확인하세요.",
      "ja": "La Maison 1888内の落ち着いたバー。夕食の前後にアペリティフ、シャンパン、オリジナルカクテルを楽しめます。レストラン改装中は休業しています。再開情報は公式ページをご確認ください。"
    }
  },
  {
    "id": "long-bar",
    "description": "Stretch out on an oversized daybed or settle into a swinging basket chair at this 50-metre bar. Signature cocktails, light bites and games meet distinctive black-and-white design, with the beach and gardens just outside.",
    "translations": {
      "vi": "Thư giãn trên giường nghỉ lớn hoặc ghế treo tại quầy bar dài 50 mét. Cocktail đặc trưng, món nhẹ và trò chơi kết hợp với thiết kế đen trắng nổi bật, ngay cạnh bãi biển và khu vườn.",
      "ru": "Расположитесь на большом лежаке или в подвесном кресле этого 50-метрового бара. Авторские коктейли, лёгкие блюда и игры сочетаются с выразительным чёрно-белым дизайном рядом с пляжем и садом.",
      "zh": "在这间50米长的酒吧，躺上宽大的日床或坐进悬挂篮椅。招牌鸡尾酒、轻食与游戏融入鲜明的黑白设计，门外就是海滩和花园。",
      "ko": "50미터 길이의 바에서 넓은 데이베드나 흔들리는 바스켓 의자에 편히 앉아보세요. 시그니처 칵테일, 가벼운 요리와 게임을 흑백 디자인 속에서 즐기며 바로 곁의 해변과 정원을 느껴보세요.",
      "ja": "50メートルのバーで、大きなデイベッドや揺れるバスケットチェアにくつろいで。特徴的な白黒のデザインに囲まれ、カクテル、軽食、ゲームを楽しめます。すぐ外にはビーチと庭園が広がります。"
    }
  },
  {
    "id": "wine-cellar",
    "description": "Explore La Maison 1888’s collection of rare vintages and renowned wine estates. The sommelier team can help shape a personalised tasting or pairing experience; enquire with the resort about availability while the restaurant is being refurbished.",
    "translations": {
      "vi": "Khám phá bộ sưu tập vang quý hiếm và các nhà rượu danh tiếng của La Maison 1888. Đội ngũ sommelier có thể tư vấn trải nghiệm thử vang hoặc kết hợp món ăn; hãy hỏi resort về khả năng phục vụ trong thời gian cải tạo.",
      "ru": "Познакомьтесь с редкими винами и известными хозяйствами коллекции La Maison 1888. Сомелье помогут подобрать дегустацию или сочетания с блюдами; доступность во время ремонта ресторана уточняйте у курорта.",
      "zh": "探索La Maison 1888珍稀年份佳酿与著名酒庄的收藏。侍酒师团队可协助安排个性化品鉴或餐酒搭配；餐厅翻修期间，请向度假村确认体验是否可用。",
      "ko": "La Maison 1888의 희귀 빈티지와 유명 와이너리 컬렉션을 만나보세요. 소믈리에 팀이 맞춤 시음이나 음식 페어링을 안내해 드립니다. 레스토랑 보수 기간 중 이용 가능 여부는 리조트에 문의하세요.",
      "ja": "La Maison 1888が収蔵する希少なヴィンテージや名門ワイナリーのワインを。ソムリエがお好みに合わせた試飲やペアリングをご案内します。改装中の利用についてはリゾートにお問い合わせください。"
    }
  },
  {
    "id": "club-lounge",
    "description": "A private retreat on Heaven level with sweeping views of the bay. Eligible guests enjoy breakfast, afternoon tea and evening cocktails in a calm setting, with dedicated family rooms welcoming guests travelling with children.",
    "translations": {
      "vi": "Không gian riêng tại tầng Heaven với tầm nhìn rộng ra vịnh. Khách đủ điều kiện được dùng bữa sáng, trà chiều và cocktail tối trong không gian yên tĩnh; phòng dành riêng cho gia đình chào đón khách có trẻ em.",
      "ru": "Приватное пространство на уровне Heaven с панорамой бухты. Гости с доступом в клуб могут наслаждаться завтраком, послеобеденным чаем и вечерними коктейлями; отдельные семейные комнаты принимают гостей с детьми.",
      "zh": "Heaven层级的私享空间，可欣赏开阔海湾景致。符合条件的宾客在宁静氛围中享用早餐、下午茶及晚间鸡尾酒；专属家庭房也欢迎携儿童出行的宾客。",
      "ko": "Heaven 층에서 만의 탁 트인 전망을 즐기는 프라이빗 공간입니다. 이용 자격을 갖춘 고객은 조식, 애프터눈 티와 저녁 칵테일을 즐길 수 있으며, 어린이 동반 가족을 위한 별도 공간도 마련되어 있습니다.",
      "ja": "Heaven階にある、湾を一望するプライベートな空間。対象のお客様は朝食、アフタヌーンティー、イブニングカクテルを楽しめます。お子様連れのご家族には専用のファミリールームがあります。"
    }
  },
  {
    "id": "nam-tram-dining",
    "description": "Board a private Nam Tram cabin for a dining journey designed for two. A curated course awaits at each resort level as you travel from Heaven to Sea, pairing rainforest scenery with an unusual romantic experience.",
    "translations": {
      "vi": "Lên cabin Nam Tram riêng để trải nghiệm hành trình ẩm thực dành cho hai người. Một món ăn được tuyển chọn chờ ở mỗi tầng từ Heaven đến Sea, kết hợp cảnh rừng nhiệt đới với khoảnh khắc lãng mạn khác biệt.",
      "ru": "Отправьтесь вдвоём в гастрономическое путешествие в приватной кабине Nam Tram. На каждом уровне от Heaven до Sea вас ждёт новое блюдо, а виды тропического леса создают необычную романтическую атмосферу.",
      "zh": "登上私享Nam Tram车厢，开启专为两人设计的美食旅程。从Heaven驶向Sea，每个层级都有一道精选料理，雨林风景为这场别致的浪漫体验增添魅力。",
      "ko": "두 사람을 위한 프라이빗 Nam Tram 식사 여행을 떠나보세요. Heaven에서 Sea까지 각 층마다 준비된 요리를 맛보며, 열대우림 풍경과 함께 색다른 로맨틱한 경험을 즐길 수 있습니다.",
      "ja": "二人だけのNam Tramキャビンで美食の旅へ。HeavenからSeaまで、各階で特別な一皿が待っています。熱帯雨林の眺めとともに、趣あるロマンティックな体験をお楽しみください。"
    }
  },
  {
    "id": "mi-sol-spa",
    "description": "Retreat to a lagoon-side sanctuary where sound and vibration shape the spa experience. Personalised rituals, body treatments and facials invite you to slow down, reconnect and choose the care that suits your moment of relaxation.",
    "translations": {
      "vi": "Tìm đến không gian bên đầm nước, nơi âm thanh và rung động định hình trải nghiệm spa. Nghi thức riêng, liệu pháp toàn thân và chăm sóc mặt giúp bạn chậm lại, kết nối với bản thân và chọn cách thư giãn phù hợp.",
      "ru": "Уединитесь у лагуны в спа, где звук и вибрации лежат в основе процедур. Индивидуальные ритуалы, уход за телом и лицом помогают замедлиться, побыть с собой и выбрать подходящий отдых.",
      "zh": "步入泻湖旁的静谧空间，感受以声音和振动为灵感的水疗体验。个性化仪式、身体护理与面部疗程，让您放慢步调、与自己重新连接，选择此刻最适合的放松方式。",
      "ko": "소리와 진동이 스파 경험을 이끄는 라군 옆의 고요한 공간으로 떠나보세요. 맞춤 리추얼, 바디 및 페이셜 관리로 속도를 늦추고 자신에게 집중하며 원하는 휴식을 선택할 수 있습니다.",
      "ja": "音と振動を大切にする、ラグーン沿いの静かなスパへ。お好みに合わせたリチュアル、ボディケア、フェイシャルを通じて歩みを緩め、自分と向き合う穏やかな時間をお選びください。"
    }
  },
  {
    "id": "nail-hair",
    "description": "Take time for expert manicure, pedicure and hair care in a tranquil studio. Treatments feature the Margaret Dabbs London collection and attentive professional care; the salon welcomes guests aged 16 and over.",
    "translations": {
      "vi": "Dành thời gian chăm sóc móng tay, móng chân và tóc tại studio yên tĩnh. Liệu trình sử dụng bộ sản phẩm Margaret Dabbs London cùng đội ngũ chuyên nghiệp tận tâm; salon đón khách từ 16 tuổi trở lên.",
      "ru": "Посвятите время маникюру, педикюру и уходу за волосами в спокойной студии. Процедуры с коллекцией Margaret Dabbs London проводят внимательные профессионалы; салон принимает гостей от 16 лет.",
      "zh": "在宁静的工作室享受专业美甲、美足及头发护理。疗程采用Margaret Dabbs London系列产品，由细致的专业团队提供服务；沙龙欢迎16岁及以上宾客。",
      "ko": "조용한 스튜디오에서 전문 매니큐어, 페디큐어와 헤어 관리를 받아보세요. Margaret Dabbs London 제품과 세심한 전문가의 케어를 경험할 수 있으며, 16세 이상 고객이 이용할 수 있습니다.",
      "ja": "静かなスタジオで、専門家によるマニキュア、ペディキュア、ヘアケアを。Margaret Dabbs London製品と丁寧な施術をお楽しみいただけます。16歳以上のお客様をお迎えしています。"
    }
  },
  {
    "id": "yoga-pavilion",
    "description": "Make space for movement, breath and quiet attention through the resort’s wellness programme. Discover group yoga or ask about a private session suited to your experience; the daily schedule confirms the current class locations and times.",
    "translations": {
      "vi": "Dành thời gian vận động, hít thở và tĩnh tâm với chương trình chăm sóc sức khỏe của resort. Tham gia yoga nhóm hoặc hỏi về buổi riêng phù hợp; lịch hằng ngày cung cấp địa điểm và giờ học hiện tại.",
      "ru": "Найдите время для движения, дыхания и спокойствия в программе велнеса курорта. Выберите групповую йогу или индивидуальное занятие; актуальные места и время указаны в ежедневном расписании.",
      "zh": "通过度假村的身心健康计划，为运动、呼吸与专注留出空间。参加团体瑜伽或咨询适合您经验的私人课程；当日活动表会列出最新上课地点与时间。",
      "ko": "리조트 웰니스 프로그램에서 움직임, 호흡과 고요한 집중을 경험하세요. 그룹 요가나 수준에 맞는 개인 수업을 문의할 수 있습니다. 현재 수업 장소와 시간은 일일 일정에서 확인하세요.",
      "ja": "リゾートのウェルネスプログラムで、動き、呼吸、静かな集中の時間を。グループヨガやご経験に合う個人レッスンをご相談ください。開催場所と時刻は当日のスケジュールでご確認いただけます。"
    }
  },
  {
    "id": "soar-gym",
    "description": "Keep your routine in an air-conditioned gym equipped with Technogym machines, cardio stations and free weights. Stretch, train at your own pace or enquire about a private session for a programme tailored to your goals.",
    "translations": {
      "vi": "Duy trì thói quen tập luyện trong phòng gym điều hòa với máy Technogym, thiết bị cardio và tạ tự do. Giãn cơ, tập theo nhịp riêng hoặc hỏi về buổi tập cá nhân phù hợp với mục tiêu của bạn.",
      "ru": "Поддерживайте форму в кондиционируемом зале с оборудованием Technogym, кардиотренажёрами и свободными весами. Тренируйтесь в своём темпе или запросите персональное занятие с программой под ваши цели.",
      "zh": "在配备Technogym器械、有氧训练设备及自由重量的空调健身房延续运动习惯。舒展身体、按自己的节奏训练，或咨询符合个人目标的私人课程。",
      "ko": "Technogym 기구, 유산소 장비와 프리 웨이트를 갖춘 냉방 체육관에서 운동 루틴을 이어가세요. 스트레칭과 자유 운동을 즐기거나 목표에 맞춘 개인 트레이닝을 문의할 수 있습니다.",
      "ja": "Technogymの機器、有酸素運動マシン、フリーウェイトを備えた空調付きジムで、いつもの習慣を。ご自分のペースで運動したり、目標に合わせた個人トレーニングをご相談いただけます。"
    }
  },
  {
    "id": "long-pool",
    "description": "Swim laps or unwind beside the resort’s 50-metre infinity pool, overlooking the peninsula. Temperature-controlled water, a built-in Jacuzzi and attentive pool service create a peaceful retreat reserved for adults.",
    "translations": {
      "vi": "Bơi hoặc thư giãn cạnh hồ bơi vô cực dài 50 mét nhìn ra bán đảo. Nước được kiểm soát nhiệt độ, Jacuzzi tích hợp và dịch vụ tận tình tạo nên không gian yên bình chỉ dành cho người lớn.",
      "ru": "Плавайте или отдыхайте у 50-метрового панорамного бассейна с видом на полуостров. Вода с регулируемой температурой, встроенное джакузи и внимательный сервис создают спокойное пространство только для взрослых.",
      "zh": "在度假村50米长的无边泳池畅泳或放松，欣赏半岛风景。恒温池水、内设按摩池及细致的池畔服务，共同营造仅供成人享用的宁静空间。",
      "ko": "반도를 내려다보는 50미터 인피니티 풀에서 수영하거나 휴식을 즐기세요. 온도 조절 수영장, 내장 자쿠지와 세심한 풀 서비스가 어우러지는 성인 전용 공간입니다.",
      "ja": "半島を望む50メートルのインフィニティプールで、泳いだりゆっくり休んだり。温度調節された水、併設のジャグジー、丁寧なサービスを備えた大人専用の静かな空間です。"
    }
  },
  {
    "id": "garden-jacuzzi",
    "description": "Find a leafy retreat just steps from the beach and L_O_N_G Bar. The Garden Pool’s quiet corners, lawn and adjacent Jacuzzi invite an unhurried pause, with pool attendants on hand for food and drinks.",
    "translations": {
      "vi": "Tìm không gian xanh chỉ cách bãi biển và L_O_N_G Bar vài bước. Các góc yên tĩnh, thảm cỏ và Jacuzzi cạnh Garden Pool mời bạn thư giãn thong thả, với nhân viên hỗ trợ đồ ăn và thức uống.",
      "ru": "Уединитесь среди зелени в нескольких шагах от пляжа и L_O_N_G Bar. Тихие уголки Garden Pool, лужайка и соседнее джакузи располагают к отдыху; сотрудники помогут заказать еду и напитки.",
      "zh": "在距海滩及L_O_N_G Bar仅几步之遥的绿意空间休憩。Garden Pool的安静角落、草坪与相邻按摩池让时光慢下来，池畔团队可协助点餐及饮品服务。",
      "ko": "해변과 L_O_N_G Bar에서 가까운 초록빛 휴식 공간입니다. Garden Pool의 조용한 코너, 잔디밭과 옆 자쿠지에서 여유를 즐기세요. 풀 직원이 음식과 음료 주문을 도와드립니다.",
      "ja": "ビーチとL_O_N_G Barからすぐの、緑に包まれた憩いの場。Garden Poolの静かな一角、芝生、隣接するジャグジーでゆったりお過ごしください。スタッフがお食事や飲み物をお手伝いします。"
    }
  },
  {
    "id": "kids-pool",
    "description": "A dedicated pool for younger guests, located beside the Garden Pool. Make it part of a relaxed family day by the water, with the resort’s wider pool facilities nearby; children should remain under an accompanying adult’s supervision.",
    "translations": {
      "vi": "Hồ bơi dành cho khách nhỏ tuổi nằm cạnh Garden Pool. Cùng gia đình tận hưởng ngày thư giãn bên nước, gần các tiện ích hồ bơi khác; trẻ cần luôn được người lớn đi cùng giám sát.",
      "ru": "Бассейн для юных гостей рядом с Garden Pool. Он дополняет спокойный семейный отдых у воды, рядом с другими бассейнами курорта; дети должны находиться под присмотром сопровождающего взрослого.",
      "zh": "专为年轻宾客准备的泳池，位于Garden Pool旁。可将这里纳入悠闲的家庭亲水时光，邻近度假村其他泳池设施；儿童应始终由同行成人看护。",
      "ko": "Garden Pool 옆에 자리한 어린이 전용 수영장입니다. 가까운 리조트 수영장 시설과 함께 여유로운 가족 물놀이를 즐기세요. 어린이는 동반 성인의 보호 아래 이용해야 합니다.",
      "ja": "Garden Poolに隣接する、お子様向けのプール。周辺のプール施設と合わせて、ご家族でゆったり水辺の一日をお楽しみください。お子様は同行の大人の見守りのもとでご利用ください。"
    }
  },
  {
    "id": "family-pool",
    "description": "Plan a shared poolside pause close to the resort’s Garden Pool and children’s swimming area. Enjoy a swim or time together by the water, and ask the pool team which facilities best suit your family.",
    "translations": {
      "vi": "Cùng gia đình nghỉ ngơi bên khu Garden Pool và hồ bơi trẻ em của resort. Bơi hoặc dành thời gian bên nhau cạnh nước, rồi hỏi đội ngũ hồ bơi về tiện ích phù hợp nhất cho gia đình.",
      "ru": "Отдохните всей семьёй рядом с Garden Pool и детской зоной для плавания. Наслаждайтесь водой и временем вместе; сотрудники помогут выбрать бассейн и удобства, подходящие вашей семье.",
      "zh": "在度假村Garden Pool与儿童泳池区域附近，安排一段家庭池畔时光。畅泳或在水边相伴，向泳池团队咨询最适合家人的设施。",
      "ko": "리조트 Garden Pool과 어린이 수영장 근처에서 가족과 함께 쉬어가세요. 수영하거나 물가에서 시간을 보내고, 가족에게 적합한 시설은 수영장 팀에 문의하세요.",
      "ja": "Garden Poolやお子様向けの遊泳エリアの近くで、ご家族そろってひと休み。泳いだり水辺で過ごしたり、ご家族に合う施設はプールのスタッフにご相談ください。"
    }
  },
  {
    "id": "marine-centre",
    "description": "Head to the beach activity team for kayaking, paddleboarding, sailing and other non-motorised water sports. They can help choose an activity suited to you; availability depends on the day’s weather and sea conditions.",
    "translations": {
      "vi": "Gặp đội ngũ hoạt động bãi biển để chèo kayak, SUP, đi thuyền buồm và các môn không động cơ khác. Nhân viên giúp chọn hoạt động phù hợp; khả năng tổ chức tùy thời tiết và điều kiện biển trong ngày.",
      "ru": "Обратитесь к пляжной команде за каякингом, сапбордингом, парусными и другими безмоторными водными занятиями. Вам помогут выбрать подходящее; доступность зависит от погоды и состояния моря в этот день.",
      "zh": "向海滩活动团队咨询皮划艇、立式划桨、帆船及其他非机动水上运动。工作人员可帮助选择适合您的项目；是否开放取决于当日天气与海况。",
      "ko": "해변 활동 팀에서 카약, 패들보드, 세일링과 기타 무동력 수상 스포츠를 안내받으세요. 자신에게 맞는 활동을 선택할 수 있으며, 이용 여부는 당일 날씨와 바다 상태에 따라 달라집니다.",
      "ja": "ビーチのアクティビティチームが、カヤック、パドルボード、セーリングなどの非動力水上スポーツをご案内します。ご自分に合う活動をご相談ください。実施は当日の天候と海況によります。"
    }
  },
  {
    "id": "coconut-beach",
    "description": "Slow down where the resort’s sandy shoreline meets a shady coconut grove. Take a beachside stroll, settle with a book or enjoy the sea breeze, with the sheltered bay and surrounding greenery setting the mood.",
    "translations": {
      "vi": "Chậm lại nơi bờ cát của resort gặp rặng dừa rợp bóng. Dạo biển, đọc sách hoặc tận hưởng gió biển giữa không gian vịnh kín và cây xanh bao quanh.",
      "ru": "Замедлитесь там, где песчаный берег встречается с тенистой кокосовой рощей. Прогуляйтесь, почитайте книгу или насладитесь морским бризом в окружении зелени и защищённой бухты.",
      "zh": "在度假村沙岸与椰林树荫交汇处放慢脚步。沿海散步、静读一本书或感受海风，让平静海湾与周围绿意为休憩定下基调。",
      "ko": "리조트 모래 해변과 그늘진 코코넛 숲이 만나는 곳에서 쉬어가세요. 해변 산책, 독서와 바닷바람을 즐기며 아늑한 만과 주변 초록 풍경을 느껴보세요.",
      "ja": "砂浜と木陰をつくるココナッツの木々が出会う場所で、歩みを緩めて。海辺の散歩や読書、潮風を楽しみながら、穏やかな湾と緑に包まれた時間をお過ごしください。"
    }
  },
  {
    "id": "family-beach",
    "description": "Spend time together on the resort’s secluded sandy bay, with space for beach walks and relaxed play. The activity team can suggest beach games or water sports; always check the current swimming and weather guidance.",
    "translations": {
      "vi": "Dành thời gian bên nhau trên bãi cát yên tĩnh của resort, dạo biển hoặc vui chơi thư thái. Đội ngũ hoạt động có thể gợi ý trò chơi và môn thể thao nước; hãy kiểm tra hướng dẫn bơi và thời tiết hiện tại.",
      "ru": "Проводите время вместе на уединённом песчаном берегу курорта, гуляйте и играйте. Команда предложит пляжные игры и водные занятия; перед купанием уточняйте рекомендации и погодные условия.",
      "zh": "在度假村僻静的沙湾共度时光，散步或悠闲玩耍。活动团队可推荐沙滩游戏或水上项目；请始终确认最新的游泳指引与天气情况。",
      "ko": "리조트의 한적한 모래 해변에서 함께 산책하고 여유롭게 놀아보세요. 활동 팀이 해변 게임과 수상 스포츠를 안내해 드립니다. 현재 수영 안내와 날씨 상황을 확인하세요.",
      "ja": "静かな砂浜の湾で、ご家族と散歩や遊びの時間を。アクティビティチームがビーチゲームや水上スポーツをご提案します。遊泳案内と当日の天候は必ずご確認ください。"
    }
  },
  {
    "id": "club-beach",
    "description": "Discover the shoreline associated with the Club InterContinental experience, within the resort’s sheltered bay. Make time for quiet seaside relaxation, and ask the Club team about access, seating and the services included with your stay.",
    "translations": {
      "vi": "Khám phá khu bờ biển gắn với trải nghiệm Club InterContinental trong vịnh của resort. Dành thời gian thư giãn yên tĩnh và hỏi đội ngũ Club về quyền sử dụng, chỗ ngồi cùng dịch vụ đi kèm kỳ nghỉ.",
      "ru": "Познакомьтесь с пляжной зоной Club InterContinental в защищённой бухте курорта. Насладитесь спокойствием у моря и уточните у клубной команды доступ, места для отдыха и услуги вашего проживания.",
      "zh": "探索度假村静谧海湾中与Club InterContinental体验相连的海岸空间。享受宁静海边时光，并向Club团队确认使用资格、座位及住宿所包含的服务。",
      "ko": "리조트의 아늑한 만에서 Club InterContinental 경험과 연결된 해변을 만나보세요. 조용한 해변 휴식을 즐기며 이용 자격, 좌석과 숙박에 포함된 서비스는 Club 팀에 문의하세요.",
      "ja": "リゾートの穏やかな湾にある、Club InterContinentalの体験に結びつく海辺のエリア。静かな休息を楽しみ、利用条件や席、ご滞在に含まれるサービスはClubチームにご確認ください。"
    }
  },
  {
    "id": "sea-experiences",
    "description": "Discover the peninsula from the water through the resort’s beach and nature experiences. Choose between active exploration and time by the bay, with the team advising on suitable activities and conditions before you set out.",
    "translations": {
      "vi": "Khám phá bán đảo từ mặt nước qua hoạt động biển và thiên nhiên của resort. Chọn trải nghiệm năng động hoặc thư giãn bên vịnh; đội ngũ tư vấn hoạt động phù hợp và điều kiện trước khi khởi hành.",
      "ru": "Откройте полуостров с воды через пляжные и природные занятия курорта. Выберите активное исследование или отдых у бухты; сотрудники подскажут подходящие варианты и условия перед выходом.",
      "zh": "通过度假村的海滩与自然体验，从水上发现半岛。选择活力探索或海湾休憩，出发前由团队协助确认合适的活动与条件。",
      "ko": "리조트의 해변과 자연 활동을 통해 물 위에서 반도를 발견하세요. 활동적인 탐험이나 만에서의 휴식 중 선택하고, 출발 전 팀의 안내로 적합한 활동과 상황을 확인하세요.",
      "ja": "リゾートのビーチや自然体験を通して、水辺から半島を発見しましょう。アクティブな探索も湾での休息も、出発前にスタッフが適した活動と状況をご案内します。"
    }
  },
  {
    "id": "sports-centre",
    "description": "Keep active at the recreation complex across from the main gate, with tennis and pickleball courts. Borrow rackets and balls, ask about a playing partner, or plan a friendly game with the resort’s activity team.",
    "translations": {
      "vi": "Vận động tại khu thể thao đối diện cổng chính với sân tennis và pickleball. Mượn vợt, bóng, hỏi về bạn chơi hoặc cùng đội ngũ hoạt động tổ chức trận đấu vui vẻ.",
      "ru": "Поддерживайте активность в комплексе напротив главных ворот с теннисом и пиклболом. Возьмите ракетки и мячи, попросите подобрать партнёра или организуйте дружескую игру с командой курорта.",
      "zh": "在主入口对面的运动中心保持活力，体验网球与匹克球场。可借用球拍和球具、咨询球友安排，或与度假村活动团队策划一场友谊赛。",
      "ko": "정문 맞은편 레크리에이션 단지에서 테니스와 피클볼을 즐기세요. 라켓과 공을 빌리고 함께할 파트너를 문의하거나 리조트 활동 팀과 친선 경기를 계획할 수 있습니다.",
      "ja": "正門の向かいにあるスポーツ施設で、テニスやピックルボールを。ラケットとボールを借りたり、対戦相手をご相談したり、スタッフと気軽なゲームを計画できます。"
    }
  },
  {
    "id": "planet-trekkers",
    "description": "Young explorers discover crafts, Vietnamese lantern-making and outdoor adventures with trained supervision. Designed for children aged four to twelve, the club also welcomes younger children accompanied by a guardian or nanny; consult the daily activity schedule.",
    "translations": {
      "vi": "Các nhà thám hiểm nhỏ khám phá thủ công, làm đèn lồng Việt Nam và hoạt động ngoài trời với nhân viên được đào tạo. Club dành cho trẻ 4–12 tuổi; trẻ nhỏ hơn cần người giám hộ hoặc bảo mẫu đi cùng. Xem lịch hằng ngày.",
      "ru": "Юные исследователи занимаются творчеством, делают вьетнамские фонарики и участвуют в приключениях под присмотром специалистов. Клуб рассчитан на детей 4–12 лет; младшие приходят с сопровождающим. Занятия смотрите в ежедневном расписании.",
      "zh": "小小探索者在专业人员看护下，体验手工、越南灯笼制作及户外冒险。俱乐部面向4至12岁儿童；更年幼的孩子需由监护人或保姆陪同，请查看当日活动表。",
      "ko": "전문가의 지도 아래 공예, 베트남 등 만들기와 야외 모험을 즐기는 어린이 공간입니다. 4~12세를 위한 클럽이며, 더 어린 아이는 보호자나 보모와 함께 이용하세요. 일일 활동표를 확인해 주세요.",
      "ja": "専門スタッフの見守りのもと、工作、ベトナムの灯籠作り、屋外の冒険を。4～12歳向けのクラブです。より小さなお子様は保護者やナニーとご一緒に。毎日の活動予定をご確認ください。"
    }
  },
  {
    "id": "shuttle",
    "description": "Let the resort team arrange airport transfers, visits to Hoi An or Da Nang, and journeys tailored to your plans. Confirm availability and rates with the concierge; the complimentary Hoi An sightseeing shuttle follows its own schedule.",
    "translations": {
      "vi": "Đội ngũ resort sắp xếp đưa đón sân bay, chuyến đi Hội An, Đà Nẵng và hành trình theo kế hoạch của bạn. Xác nhận dịch vụ và giá với concierge; xe tham quan Hội An miễn phí có lịch riêng.",
      "ru": "Команда курорта организует трансферы, поездки в Хойан и Дананг и индивидуальные маршруты. Доступность и стоимость уточняйте у консьержа; бесплатный экскурсионный шаттл в Хойан работает по отдельному расписанию.",
      "zh": "由度假村团队安排机场接送、会安或岘港游览，以及符合您计划的个性化出行。请向礼宾团队确认供应与费用；免费会安观光接驳车依照独立时刻表运行。",
      "ko": "리조트 팀이 공항 이동, 호이안·다낭 방문과 맞춤 여정을 준비합니다. 이용 가능 여부와 요금은 컨시어지에 확인하세요. 호이안 무료 관광 셔틀은 별도 시간표로 운영됩니다.",
      "ja": "空港送迎、ホイアンやダナンへのお出かけ、ご希望に合わせた移動をリゾートが手配します。空き状況と料金はコンシェルジュへ。ホイアン無料観光シャトルには専用の時刻表があります。"
    }
  },
  {
    "id": "airport-lounge",
    "description": "Continue the resort welcome before your domestic flight from Da Nang. The lounge sits on the mezzanine after security, offering complimentary refreshments; Club InterContinental and villa guests also enjoy a complimentary dining menu.",
    "translations": {
      "vi": "Tiếp tục tận hưởng sự chăm sóc của resort trước chuyến bay nội địa từ Đà Nẵng. Lounge nằm ở tầng lửng sau kiểm tra an ninh, phục vụ thức uống miễn phí; khách Club và Villa được dùng thực đơn ăn miễn phí.",
      "ru": "Продлите гостеприимство курорта перед внутренним рейсом из Дананга. Лаунж расположен на мезонине после контроля безопасности и предлагает бесплатные напитки; гостям Club и вилл также предоставляется бесплатное меню питания.",
      "zh": "在岘港搭乘国内航班前，继续享受度假村的欢迎与关怀。贵宾室位于安检后夹层，免费提供饮品；Club InterContinental及别墅宾客还可享用免费餐点菜单。",
      "ko": "다낭에서 국내선을 타기 전 리조트의 환대를 이어가세요. 보안 검색 후 메자닌 층의 라운지에서 무료 음료를 제공합니다. Club InterContinental 및 빌라 고객은 무료 식사 메뉴도 이용할 수 있습니다.",
      "ja": "ダナン発の国内線に搭乗する前も、リゾートのおもてなしを。保安検査後の中二階にあるラウンジで無料の飲み物を提供し、Clubやヴィラのお客様には無料のお食事メニューもご用意しています。"
    }
  },
  {
    "id": "club-intercontinental",
    "description": "Enhance your stay with privileges for Club rooms, Club suites, penthouses and villas. Lounge access, breakfast, afternoon tea and evening cocktails bring a more personal rhythm to your visit; other guests may enquire about paid lounge access.",
    "translations": {
      "vi": "Nâng tầm kỳ nghỉ với đặc quyền dành cho phòng Club, suite Club, penthouse và villa. Lounge, bữa sáng, trà chiều và cocktail tối mang đến nhịp nghỉ dưỡng riêng; khách khác có thể hỏi về quyền sử dụng lounge có phí.",
      "ru": "Дополните проживание привилегиями Club-номеров, Club-сьютов, пентхаусов и вилл. Лаунж, завтрак, чай и вечерние коктейли задают особенный ритм отдыху; остальные гости могут узнать о платном доступе.",
      "zh": "享受Club客房、Club套房、顶层套房及别墅专属礼遇。休息室使用权、早餐、下午茶和晚间鸡尾酒，让住宿更具个人节奏；其他宾客可咨询付费使用休息室。",
      "ko": "Club 객실·스위트, 펜트하우스와 빌라의 특별한 혜택으로 숙박을 더 풍성하게 즐기세요. 라운지, 조식, 애프터눈 티와 저녁 칵테일이 여유를 더합니다. 다른 고객은 유료 라운지 이용을 문의할 수 있습니다.",
      "ja": "Clubルームやスイート、ペントハウス、ヴィラの特典で滞在をさらに豊かに。ラウンジ、朝食、アフタヌーンティー、イブニングカクテルが特別な時間をつくります。対象外のお客様は有料利用をご相談ください。"
    }
  },
  {
    "id": "nguoi-dan-loi",
    "description": "Penthouse and villa guests are welcomed by a dedicated resort host, known as “the one who leads the way”. Personalised planning, discreet assistance and thoughtful Vietnamese rituals shape a stay around your pace and preferences.",
    "translations": {
      "vi": "Khách penthouse và villa được chào đón bởi Người Dẫn Lối, người đồng hành riêng trong kỳ nghỉ. Kế hoạch cá nhân hóa, hỗ trợ kín đáo và nghi thức Việt Nam tinh tế được chăm chút theo nhịp sống và sở thích của bạn.",
      "ru": "Гостей пентхаусов и вилл встречает персональный хозяин Người Dẫn Lối — «тот, кто ведёт». Индивидуальное планирование, деликатная помощь и вьетнамские ритуалы формируют отдых в соответствии с вашим ритмом и пожеланиями.",
      "zh": "顶层套房与别墅宾客由专属度假村管家欢迎，称为“引路人”。个性化规划、细致而不打扰的协助，以及体贴的越南仪式，让住宿贴合您的节奏与喜好。",
      "ko": "펜트하우스와 빌라 고객을 ‘길을 안내하는 사람’이라는 전담 호스트가 맞이합니다. 맞춤 일정, 세심하고 절제된 지원과 베트남식 환영 의식이 취향과 속도에 맞는 숙박을 만들어 드립니다.",
      "ja": "ペントハウスやヴィラでは、「道を導く人」と呼ばれる専属ホストがお迎えします。個別の計画、控えめなサポート、心のこもったベトナムの儀式で、ご希望とペースに寄り添う滞在を。"
    }
  },
  {
    "id": "experience-more",
    "description": "Make each day your own with a stay for two, daily breakfast and return airport transfers. A USD 200 daily credit can be spent on dining, bars or spa; unused credit expires each night and does not accumulate.",
    "translations": {
      "vi": "Tận hưởng kỳ nghỉ cho hai người với bữa sáng hằng ngày và đưa đón sân bay hai chiều. Tín dụng 200 USD mỗi ngày dùng tại nhà hàng, bar hoặc spa; phần chưa dùng hết hạn mỗi đêm, không cộng dồn.",
      "ru": "Проведите отдых вдвоём с ежедневным завтраком и трансферами в обе стороны. Кредит 200 долларов в день доступен для ресторанов, баров и спа; остаток истекает каждый вечер и не переносится.",
      "zh": "以双人住宿、每日早餐及往返机场接送，随心安排每一天。每天200美元消费额度可用于餐饮、酒吧或水疗；未使用部分每晚到期，不可累积。",
      "ko": "두 사람을 위한 숙박, 매일 조식과 왕복 공항 이동으로 하루를 자유롭게 계획하세요. 매일 200달러 크레딧을 식사·바·스파에 사용할 수 있으며, 남은 금액은 매일 밤 만료되어 누적되지 않습니다.",
      "ja": "二人の宿泊、毎日の朝食、空港往復送迎で、自由な一日を。毎日200米ドルのクレジットを食事、バー、スパに利用できます。未使用分は毎晩失効し、翌日には繰り越せません。"
    }
  },
  {
    "id": "enchanted-holiday",
    "description": "Celebrate the festive season with breakfast, a festive afternoon tea and a special cocktail or mocktail. Charles the monkey’s discovery trail adds family fun; this minimum two-night offer runs from 20 November 2026 to 10 January 2027.",
    "translations": {
      "vi": "Đón mùa lễ hội với bữa sáng, trà chiều lễ hội và cocktail hoặc mocktail đặc biệt. Hành trình khám phá của chú khỉ Charles thêm niềm vui gia đình; ưu đãi tối thiểu hai đêm từ 20/11/2026 đến 10/1/2027.",
      "ru": "Празднуйте сезон с завтраком, праздничным чаем и коктейлем или моктейлем. Семейное приключение по тропе обезьянки Чарльза дополняет предложение от двух ночей, действующее с 20 ноября 2026 до 10 января 2027.",
      "zh": "以早餐、节日下午茶及特色鸡尾酒或无酒精饮品庆祝佳节。Charles猴子的探索路线增添家庭乐趣；此优惠需至少入住两晚，适用期为2026年11月20日至2027年1月10日。",
      "ko": "조식, 축제 애프터눈 티와 특별한 칵테일 또는 목테일로 연말을 즐기세요. 원숭이 Charles의 탐험 코스가 가족의 재미를 더합니다. 최소 2박 상품으로 2026년 11월 20일부터 2027년 1월 10일까지 적용됩니다.",
      "ja": "朝食、フェスティブ・アフタヌーンティー、特別なカクテルまたはモクテルで祝祭の季節を。猿のCharlesの探索コースも家族の楽しみに。2026年11月20日～2027年1月10日、2泊以上のプランです。"
    }
  },
  {
    "id": "weddings",
    "description": "Create a celebration shaped around you, from intimate beachfront vows to a grand reception. Secluded settings, personalised dining and Bill Bensley’s architecture provide the backdrop, while the wedding team helps coordinate the details of your occasion.",
    "translations": {
      "vi": "Tạo lễ kỷ niệm theo phong cách riêng, từ lời thề bên biển thân mật đến tiệc lớn. Không gian riêng tư, ẩm thực cá nhân hóa và kiến trúc Bill Bensley làm nền, với đội ngũ cưới hỗ trợ từng chi tiết.",
      "ru": "Создайте праздник по своему сценарию — от камерной церемонии на пляже до большого приёма. Уединённая обстановка, персональные меню и архитектура Бенсли дополняются помощью свадебной команды в организации деталей.",
      "zh": "从私密海滩誓言到盛大婚宴，打造贴合您的庆典。僻静场地、个性化餐饮与Bill Bensley建筑共同构成背景，婚礼团队协助协调重要日子的每个细节。",
      "ko": "아늑한 해변 서약식부터 성대한 리셉션까지 나만의 축하를 계획하세요. 프라이빗한 공간, 맞춤 다이닝과 Bill Bensley의 건축을 배경으로 웨딩 팀이 세부 준비를 도와드립니다.",
      "ja": "親しい方との海辺の挙式から盛大な披露宴まで、お二人らしいお祝いを。静かな会場、個別の料理、Bill Bensleyの建築を背景に、ウェディングチームが細やかな準備をお手伝いします。"
    }
  },
  {
    "id": "bensley-package",
    "description": "Immerse yourself in Bill Bensley’s creative world with two nights in a Heavenly Penthouse. A private design tour, Champagne art viewing and afternoon tea at a Non-La table connect architecture, art and the resort’s signature hospitality.",
    "translations": {
      "vi": "Đắm mình trong thế giới sáng tạo Bill Bensley với hai đêm tại Heavenly Penthouse. Tour thiết kế riêng, xem nghệ thuật cùng Champagne và trà chiều ở bàn Nón Lá kết nối kiến trúc, nghệ thuật và sự hiếu khách đặc trưng.",
      "ru": "Погрузитесь в мир Билла Бенсли за две ночи в Heavenly Penthouse. Приватный дизайн-тур, просмотр искусства с шампанским и чай за столиком Non-La соединяют архитектуру, творчество и гостеприимство курорта.",
      "zh": "入住Heavenly Penthouse两晚，沉浸Bill Bensley的创意世界。私人设计导览、香槟艺术鉴赏与Non-La餐桌下午茶，将建筑、艺术及度假村特色款待串联起来。",
      "ko": "Heavenly Penthouse에서 2박하며 Bill Bensley의 창작 세계에 빠져보세요. 프라이빗 디자인 투어, 샴페인 아트 감상과 Non-La 테이블의 애프터눈 티가 건축·예술·환대를 연결합니다.",
      "ja": "Heavenly Penthouseで2泊し、Bill Bensleyの創造の世界へ。専用デザインツアー、シャンパンを楽しむ作品鑑賞、Non-Laの席でのアフタヌーンティーが、建築、芸術、おもてなしを結びます。"
    }
  },
  {
    "id": "daycation",
    "description": "Enjoy a resort day without an overnight stay, with beach, pool and gym access. Choose afternoon tea, a Vietnamese lunch or a beauty treatment experience; advance reservations are required, and water sports are not included.",
    "translations": {
      "vi": "Tận hưởng resort trong ngày không cần lưu trú qua đêm, với bãi biển, hồ bơi và gym. Chọn trà chiều, bữa trưa Việt Nam hoặc trải nghiệm chăm sóc sắc đẹp; cần đặt trước và không bao gồm thể thao nước.",
      "ru": "Проведите день на курорте без ночёвки, с доступом к пляжу, бассейнам и спортзалу. Выберите чай, вьетнамский обед или уход за собой; требуется предварительная бронь, водные виды спорта не включены.",
      "zh": "无需过夜也能享受度假村一日体验，使用海滩、泳池及健身房。可选择下午茶、越南午餐或美容护理；需提前预约，水上运动不包含在内。",
      "ko": "숙박 없이 해변·수영장·체육관을 이용하며 리조트에서 하루를 보내세요. 애프터눈 티, 베트남식 점심 또는 뷰티 관리를 선택할 수 있습니다. 사전 예약이 필요하며 수상 스포츠는 포함되지 않습니다.",
      "ja": "宿泊なしでも、ビーチ、プール、ジムを利用してリゾートの一日を。アフタヌーンティー、ベトナム料理のランチ、美容ケアから選べます。事前予約が必要で、水上スポーツは含まれません。"
    }
  },
  {
    "id": "ihg-one-rewards",
    "description": "Bring your travels together through the IHG Hotels & Resorts loyalty programme. Earn points on eligible stays and explore reward nights and member benefits; the official account page explains current membership terms and how to use your rewards.",
    "translations": {
      "vi": "Kết nối những chuyến đi qua chương trình khách hàng thân thiết IHG Hotels & Resorts. Tích điểm từ kỳ nghỉ đủ điều kiện, khám phá đêm thưởng và đặc quyền; trang chính thức giải thích điều kiện và cách dùng phần thưởng.",
      "ru": "Объедините путешествия в программе лояльности IHG Hotels & Resorts. Получайте баллы за подходящие проживания, изучайте премиальные ночи и преимущества; актуальные правила и использование наград описаны на официальной странице.",
      "zh": "通过IHG Hotels & Resorts会员计划串联您的旅程。符合条件的住宿可累积积分，并探索奖励住宿与会员礼遇；官方账户页面说明最新条款及奖励使用方式。",
      "ko": "IHG Hotels & Resorts 로열티 프로그램으로 여행을 연결하세요. 해당 숙박으로 포인트를 적립하고 리워드 숙박과 회원 혜택을 알아보세요. 현재 회원 조건과 사용 방법은 공식 계정 페이지에서 안내합니다.",
      "ja": "IHG Hotels & Resortsの会員プログラムで旅をつなぎましょう。対象の宿泊でポイントを貯め、特典宿泊や会員の優待を。最新の条件や特典の使い方は公式アカウントページをご確認ください。"
    }
  },
  {
    "id": "things-to-do",
    "description": "Build a day around your mood, from beach games and swimming to fitness, cultural discoveries and creative classes. The resort’s daily schedule helps you choose what is available; activities may change with weather and local conditions.",
    "translations": {
      "vi": "Lên kế hoạch theo tâm trạng, từ trò chơi biển, bơi đến thể thao, văn hóa và lớp sáng tạo. Lịch hằng ngày giúp chọn hoạt động đang có; chương trình có thể thay đổi theo thời tiết và điều kiện địa phương.",
      "ru": "Выберите день по настроению: пляжные игры, плавание, фитнес, культурные открытия или творчество. Ежедневное расписание показывает доступные занятия; программа может меняться в зависимости от погоды и условий.",
      "zh": "随心安排一天，从沙滩游戏、游泳到健身、文化探索与创意课程。度假村当日活动表帮助您选择可参与的项目；活动可能因天气及当地条件调整。",
      "ko": "해변 게임과 수영부터 피트니스, 문화 체험과 창작 수업까지 기분에 맞게 하루를 계획하세요. 일일 일정에서 가능한 활동을 확인할 수 있으며, 날씨와 현지 상황에 따라 변경될 수 있습니다.",
      "ja": "ビーチゲームや水泳、運動、文化体験、創作レッスンなど、気分に合わせた一日を。毎日のスケジュールから参加できる活動を選べます。内容は天候や状況により変更される場合があります。"
    }
  },
  {
    "id": "culinary-activities",
    "description": "Discover Vietnamese flavours through hands-on cooking, market visits and the resort’s organic garden. Coffee art, tasting sessions and family pizza-making offer other ways to learn; ask the activity team about the current programme and reservations.",
    "translations": {
      "vi": "Khám phá hương vị Việt qua nấu ăn thực hành, tham quan chợ và vườn hữu cơ. Nghệ thuật cà phê, buổi nếm và làm pizza gia đình thêm cách học; hỏi đội ngũ hoạt động về chương trình và đặt chỗ.",
      "ru": "Откройте вьетнамские вкусы через приготовление блюд, рынки и органический сад. Кофейное искусство, дегустации и семейная пицца дополняют занятия; программу и бронирование уточняйте у команды.",
      "zh": "通过动手烹饪、市场探访及度假村有机花园，发现越南风味。咖啡拉花、品鉴与家庭披萨制作提供更多学习方式；请向活动团队咨询当前安排与预约。",
      "ko": "요리 실습, 시장 방문과 리조트 유기농 정원에서 베트남의 맛을 발견하세요. 커피 아트·시음과 가족 피자 만들기도 즐길 수 있습니다. 현재 프로그램과 예약은 활동 팀에 문의하세요.",
      "ja": "実際の調理、市場巡り、有機農園を通じてベトナムの味を発見。コーヒーアート、試飲、家族でのピザ作りも楽しめます。実施内容と予約はアクティビティチームにご相談ください。"
    }
  },
  {
    "id": "organic-garden",
    "description": "Follow the journey from garden to table in the resort’s organic growing space. Discover fresh herbs and ingredients used in culinary experiences, or enquire about garden-led cooking, group activities and farm-to-table dining.",
    "translations": {
      "vi": "Theo hành trình từ vườn đến bàn ăn tại khu trồng hữu cơ của resort. Khám phá thảo mộc và nguyên liệu tươi cho trải nghiệm ẩm thực, hoặc hỏi về lớp nấu ăn, hoạt động nhóm và dùng bữa tại vườn.",
      "ru": "Проследите путь от сада к столу в органическом саду курорта. Откройте свежие травы и ингредиенты для кулинарных занятий или узнайте о приготовлении блюд, групповых программах и обедах из садовых продуктов.",
      "zh": "在度假村有机种植空间，追随从花园到餐桌的旅程。认识烹饪体验使用的新鲜香草与食材，或咨询花园烹饪、团体活动及农园餐饮。",
      "ko": "리조트 유기농 재배 공간에서 정원부터 식탁까지의 여정을 따라가세요. 요리 체험에 쓰이는 신선한 허브와 재료를 알아보고 정원 요리 수업, 그룹 활동과 팜투테이블 다이닝을 문의하세요.",
      "ja": "リゾートの有機農園で、庭から食卓への道のりを。料理体験に使う新鮮なハーブや食材に触れ、農園での料理教室、グループ活動、ファーム・トゥ・テーブルの食事をご相談ください。"
    }
  },
  {
    "id": "nature-experiences",
    "description": "Explore Son Tra’s rainforest with the resort’s naturalist-led experiences and Nature Discovery Guide. Learn about native plants, birds and red-shanked douc langurs; wildlife sightings are never guaranteed, and current tour availability should be checked before booking.",
    "translations": {
      "vi": "Khám phá rừng Sơn Trà qua trải nghiệm cùng nhà tự nhiên học và Nature Discovery Guide. Tìm hiểu cây, chim và voọc chà vá chân nâu; không đảm bảo gặp động vật, cần xác nhận tour trước khi đặt.",
      "ru": "Исследуйте лес Сонча с натуралистом курорта и путеводителем Nature Discovery Guide. Узнайте о растениях, птицах и дуках; встречи с животными не гарантированы, доступность экскурсий уточняйте заранее.",
      "zh": "跟随度假村自然向导及Nature Discovery Guide探索山茶雨林，认识本地植物、鸟类与红腿白臀叶猴。野生动物出现无法保证；预约前请确认当前导览是否开放。",
      "ko": "리조트 자연 전문가의 체험과 Nature Discovery Guide로 손트라 우림을 탐험하세요. 토종 식물, 새와 붉은정강이두크원숭이를 알아보세요. 야생동물 목격은 보장되지 않으며 투어 운영 여부는 예약 전 확인해야 합니다.",
      "ja": "リゾートの自然ガイドとNature Discovery Guideでソンチャの森へ。植物、鳥、アカアシドゥクラングールについて学べます。野生動物との遭遇は保証されません。ツアーの実施状況を事前にご確認ください。"
    }
  },
  {
    "id": "destination-experiences",
    "description": "Discover Central Vietnam beyond the resort, from Hoi An’s historic streets to Da Nang’s markets and cultural landmarks. The concierge can help plan a half-day or full-day excursion, with transport and activities adapted to your interests.",
    "translations": {
      "vi": "Khám phá miền Trung ngoài resort, từ phố cổ Hội An đến chợ và điểm văn hóa Đà Nẵng. Concierge giúp lên tour nửa ngày hoặc cả ngày với phương tiện và hoạt động phù hợp sở thích.",
      "ru": "Откройте Центральный Вьетнам: исторические улицы Хойана, рынки и культурные места Дананга. Консьерж поможет спланировать поездку на полдня или целый день с транспортом и занятиями по вашим интересам.",
      "zh": "走出度假村，发现越南中部，从会安历史街巷到岘港市场与文化地标。礼宾团队可协助规划半日或全日行程，并按您的兴趣安排交通与活动。",
      "ko": "호이안의 역사 거리부터 다낭의 시장과 문화 명소까지 리조트 밖 베트남 중부를 발견하세요. 컨시어지가 취향에 맞춘 교통과 활동으로 반나절 또는 하루 여행 계획을 도와드립니다.",
      "ja": "ホイアンの歴史ある街並みやダナンの市場、文化スポットへ、リゾートの外の中部ベトナムを発見。コンシェルジュがご興味に合わせて、半日や一日の移動と活動を計画します。"
    }
  },
  {
    "id": "hoi-an-digital-tour",
    "description": "Walk through Hoi An’s Old Town with a self-guided digital story beginning at YALY. Discover assembly halls, a lively market and layers of trading history at your own pace, using your phone to follow the route.",
    "translations": {
      "vi": "Dạo phố cổ Hội An theo câu chuyện số tự hướng dẫn, bắt đầu tại YALY. Khám phá hội quán, chợ sống động và lịch sử thương cảng theo nhịp riêng, dùng điện thoại để theo tuyến.",
      "ru": "Пройдите старый Хойан по самостоятельному цифровому маршруту от YALY. Откройте общинные залы, оживлённый рынок и торговую историю в своём темпе, следуя подсказкам на телефоне.",
      "zh": "从YALY出发，以自助数字故事漫步会安古城。按自己的节奏探索会馆、热闹市场与层层商贸历史，通过手机跟随路线。",
      "ko": "YALY에서 시작하는 셀프 디지털 이야기로 호이안 구시가를 걸어보세요. 휴대전화의 경로를 따라 회관, 활기찬 시장과 무역의 역사를 나만의 속도로 발견할 수 있습니다.",
      "ja": "YALYから始まるセルフガイドのデジタルストーリーで、ホイアン旧市街を歩きましょう。スマートフォンの案内に沿って、会館、市場、交易の歴史を自分のペースで発見できます。"
    }
  },
  {
    "id": "design-digital-tour",
    "description": "Start at Reception and follow a self-guided walk into Bill Bensley’s imaginative world. Your phone reveals Vietnamese inspirations, hidden architectural details and the stories linking the lobby, Citron, Heritage Village and the resort’s lower levels.",
    "translations": {
      "vi": "Bắt đầu ở Reception và tự đi bộ vào thế giới sáng tạo Bill Bensley. Điện thoại hé lộ cảm hứng Việt Nam, chi tiết kiến trúc và câu chuyện nối sảnh, Citron, Heritage Village cùng các tầng thấp hơn.",
      "ru": "Начните у Reception самостоятельную прогулку по миру Билла Бенсли. Телефон откроет вьетнамские мотивы, скрытые архитектурные детали и истории, связывающие лобби, Citron, Heritage Village и нижние уровни курорта.",
      "zh": "从Reception开始，自助步行进入Bill Bensley的想象世界。手机揭示越南灵感、隐藏的建筑细节，以及连接大堂、Citron、Heritage Village和度假村较低层级的故事。",
      "ko": "Reception에서 시작해 Bill Bensley의 상상 세계를 셀프 도보로 탐험하세요. 휴대전화가 베트남의 영감, 숨은 건축 디테일과 로비·Citron·Heritage Village·아래층을 연결하는 이야기를 들려줍니다.",
      "ja": "Receptionを出発し、Bill Bensleyの想像の世界をセルフ散策。スマートフォンがベトナムの着想、隠れた建築の細部、ロビー、Citron、Heritage Villageと下層階を結ぶ物語をご案内します。"
    }
  },
  {
    "id": "nam-tram",
    "description": "Ride the resort’s boat-shaped funicular between Heaven, Sky, Earth and Sea. Inspired by Vietnamese basket boats, the Nam Tram turns travelling through the hillside into part of the experience, with rainforest scenery along the way.",
    "translations": {
      "vi": "Đi funicular hình thuyền giữa Heaven, Sky, Earth và Sea. Lấy cảm hứng từ thuyền thúng Việt Nam, Nam Tram biến hành trình qua sườn đồi thành trải nghiệm với khung cảnh rừng nhiệt đới dọc đường.",
      "ru": "Прокатитесь на лодкообразном фуникулёре между Heaven, Sky, Earth и Sea. Вдохновлённый вьетнамскими лодками-корзинами, Nam Tram превращает перемещение по склону в приключение среди тропического леса.",
      "zh": "乘坐船形缆车往返Heaven、Sky、Earth及Sea。Nam Tram以越南篮船为灵感，让山坡间的移动成为体验的一部分，沿途可欣赏雨林风景。",
      "ko": "배 모양의 푸니쿨라를 타고 Heaven·Sky·Earth·Sea를 이동하세요. 베트남 바구니 배에서 영감을 받은 Nam Tram이 열대우림 풍경 속 언덕 이동을 특별한 경험으로 바꿔줍니다.",
      "ja": "船の形をしたケーブルカーでHeaven、Sky、Earth、Seaを移動。ベトナムの籠舟に着想を得たNam Tramは、熱帯雨林の眺めとともに丘の移動そのものを体験に変えてくれます。"
    }
  },
  {
    "id": "heritage-village",
    "description": "Explore a corner of the resort where Vietnamese-inspired architecture meets art and shopping. On Sky level, the Heritage Village brings the Bensley Outsider Gallery and Sammy’s Boutique into a walk through the resort’s creative character.",
    "translations": {
      "vi": "Khám phá góc resort nơi kiến trúc Việt Nam gặp nghệ thuật và mua sắm. Tại tầng Sky, Heritage Village nối Bensley Outsider Gallery với Sammy’s Boutique trong chuyến dạo qua nét sáng tạo của resort.",
      "ru": "Откройте уголок курорта, где вьетнамская архитектура встречается с искусством и магазинами. На уровне Sky Heritage Village соединяет галерею Бенсли и Sammy’s Boutique в прогулку по творческому миру курорта.",
      "zh": "探索越南风格建筑、艺术与购物相遇的度假村角落。位于Sky层级的Heritage Village，将Bensley Outsider Gallery与Sammy’s Boutique串联成一段创意漫步。",
      "ko": "베트남식 건축, 예술과 쇼핑이 만나는 리조트의 한편을 탐험하세요. Sky 층의 Heritage Village에서 Bensley Outsider Gallery와 Sammy’s Boutique를 걸으며 리조트의 창작 개성을 느낄 수 있습니다.",
      "ja": "ベトナム風の建築、アート、ショッピングが出会う一角へ。Sky階のHeritage Villageでは、Bensley Outsider GalleryとSammy’s Boutiqueを巡り、リゾートの創造的な魅力に触れられます。"
    }
  },
  {
    "id": "bensley-gallery",
    "description": "Step into Bill Bensley’s colourful artistic world on Sky level. Original paintings draw inspiration from his travels and nature, while Kate McCoy’s fine jewellery adds another creative perspective; ask the gallery team about viewing or purchasing a piece.",
    "translations": {
      "vi": "Bước vào thế giới nghệ thuật đầy màu sắc của Bill Bensley tại tầng Sky. Tranh gốc lấy cảm hứng từ du lịch và thiên nhiên, cùng trang sức Kate McCoy; hỏi nhân viên về xem hoặc mua tác phẩm.",
      "ru": "Погрузитесь в красочный мир Билла Бенсли на уровне Sky. Его картины вдохновлены путешествиями и природой, рядом представлены украшения Кейт Маккой; сотрудники расскажут о просмотре и приобретении работ.",
      "zh": "在Sky层级步入Bill Bensley色彩鲜明的艺术世界。原创画作汲取旅行与自然灵感，Kate McCoy珠宝增添另一创意视角；可向画廊团队咨询鉴赏或购买作品。",
      "ko": "Sky 층에서 Bill Bensley의 다채로운 예술 세계를 만나보세요. 여행과 자연에서 영감을 받은 원화와 Kate McCoy의 파인 주얼리가 함께합니다. 작품 감상과 구매는 갤러리 팀에 문의하세요.",
      "ja": "Sky階でBill Bensleyの色彩豊かな芸術の世界へ。旅や自然に着想を得た原画とKate McCoyのジュエリーが並びます。作品の鑑賞や購入はギャラリーのスタッフへご相談ください。"
    }
  },
  {
    "id": "apec-garden",
    "description": "Discover sculptures representing the economies that gathered for the 2017 APEC meeting. The garden connects a memorable moment in the resort’s history with an outdoor art walk; the official resort experiences page introduces the collection and guidebook.",
    "translations": {
      "vi": "Khám phá tác phẩm đại diện các nền kinh tế tham dự APEC 2017. Khu vườn nối khoảnh khắc lịch sử của resort với chuyến đi nghệ thuật ngoài trời; trang trải nghiệm chính thức giới thiệu bộ sưu tập và cẩm nang.",
      "ru": "Откройте скульптуры экономик, участвовавших во встрече APEC 2017. Сад соединяет историю курорта с прогулкой среди искусства; официальная страница впечатлений знакомит с коллекцией и путеводителем.",
      "zh": "探索代表2017年APEC会议参与经济体的雕塑。花园将度假村历史中的重要时刻与户外艺术漫步相连；官方度假村体验页面介绍作品与指南。",
      "ko": "2017 APEC 회의에 참여한 경제체를 대표하는 조각을 만나보세요. 정원은 리조트의 역사적 순간과 야외 예술 산책을 연결합니다. 공식 리조트 경험 페이지에서 컬렉션과 가이드북을 소개합니다.",
      "ja": "2017年のAPEC会合に集った各エコノミーの彫刻を発見。庭園では、リゾートの歴史を屋外アートの散策とともに感じられます。公式体験ページで作品とガイドブックをご紹介しています。"
    }
  },
  {
    "id": "instagram-spots",
    "description": "Explore a selection of the resort’s most photographed settings, from architectural details to seaside views. Use the photo-spot map to plan your walk, find your own perspective and enjoy each place while respecting other guests’ privacy.",
    "translations": {
      "vi": "Khám phá các điểm được chụp ảnh nhiều của resort, từ chi tiết kiến trúc đến cảnh biển. Dùng bản đồ điểm chụp để lên tuyến, tìm góc nhìn riêng và tôn trọng sự riêng tư của khách khác.",
      "ru": "Исследуйте фотогеничные уголки курорта, от архитектурных деталей до морских видов. Планируйте прогулку по карте фототочек, находите собственный ракурс и уважайте приватность других гостей.",
      "zh": "探索度假村备受拍摄的场景，从建筑细节到海滨景色。用拍照点地图规划步行路线、找到自己的视角，并在欣赏每处风景时尊重其他宾客的隐私。",
      "ko": "건축 디테일부터 바다 전망까지 리조트의 인기 사진 명소를 탐험하세요. 포토 스폿 지도에서 산책을 계획하고 나만의 구도를 찾으며 다른 고객의 사생활도 존중해 주세요.",
      "ja": "建築の細部から海辺の景色まで、人気の撮影スポットへ。写真スポットの地図で散策を計画し、ご自身の視点を見つけましょう。他のお客様のプライバシーにもご配慮ください。"
    }
  },
  {
    "id": "wall-of-lanterns",
    "description": "Pause beside a glowing display of Hoi An lanterns on the way towards the pools. Their colours and repeating shapes make this a signature photo stop, and a small reminder of Central Vietnam’s living craft traditions.",
    "translations": {
      "vi": "Dừng bên bức tường đèn lồng Hội An rực sáng trên đường xuống hồ bơi. Màu sắc và hình dáng tạo điểm chụp ảnh đặc trưng, gợi nhắc truyền thống thủ công sống động của miền Trung.",
      "ru": "Остановитесь у сияющих фонариков Хойана по пути к бассейнам. Цвета и повторяющиеся формы создают выразительную фототочку и напоминают о живых ремесленных традициях Центрального Вьетнама.",
      "zh": "在通往泳池的路上，驻足欣赏会安灯笼的明亮陈列。色彩与重复造型让这里成为特色拍照点，也轻轻提醒着越南中部延续至今的手工传统。",
      "ko": "수영장으로 향하는 길에 빛나는 호이안 등불 벽을 만나보세요. 색채와 반복되는 형태가 상징적인 사진 명소를 만들며 베트남 중부의 살아 있는 공예 전통을 떠올리게 합니다.",
      "ja": "プールへ向かう途中、輝くホイアンの灯籠の壁で足を止めて。色彩と繰り返す形が印象的な撮影スポットをつくり、中部ベトナムに息づく手仕事の伝統を感じさせます。"
    }
  },
  {
    "id": "relaxation-pavilion",
    "description": "Take a quieter break at this hillside lookout above the bay. Sit, enjoy the view and let the resort’s landscape become the experience; it is a simple pause between exploring the levels and returning to the beach.",
    "translations": {
      "vi": "Nghỉ yên tĩnh ở điểm ngắm cảnh sườn đồi trên vịnh. Ngồi ngắm nhìn để cảnh quan trở thành trải nghiệm; đây là khoảnh khắc nghỉ giữa khám phá các tầng và trở lại bãi biển.",
      "ru": "Сделайте спокойную паузу на смотровой площадке над бухтой. Посидите и насладитесь пейзажем — простым моментом отдыха между исследованием уровней курорта и возвращением на пляж.",
      "zh": "在海湾上方的山坡观景处安静休息。坐下欣赏风景，让度假村景观本身成为体验；在探索各层级与返回海滩之间，享受一段简单的停顿。",
      "ko": "만 위 언덕의 전망 공간에서 조용히 쉬어가세요. 앉아서 풍경을 감상하고 리조트의 경관 자체를 경험해 보세요. 여러 층 탐험과 해변 복귀 사이의 편안한 휴식입니다.",
      "ja": "湾を見下ろす丘の展望スペースで、静かなひと休みを。腰かけて景色そのものを楽しみましょう。各階の探索とビーチへ戻る合間に、穏やかな時間を過ごせます。"
    }
  },
  {
    "id": "dia-tang",
    "description": "Discover a quiet spirit-house setting within the resort’s hillside landscape. A short pause here offers another perspective on the surroundings; approach respectfully and follow any local guidance when visiting this contemplative corner.",
    "translations": {
      "vi": "Khám phá không gian miếu nhỏ yên tĩnh trên sườn đồi của resort. Dừng chân để cảm nhận cảnh quan theo góc nhìn khác; hãy ghé thăm với sự tôn trọng và tuân theo hướng dẫn tại chỗ.",
      "ru": "Откройте тихий уголок с домиком духов на склоне курорта. Пауза здесь позволяет иначе взглянуть на пейзаж; посещайте с уважением и следуйте местным указаниям.",
      "zh": "发现度假村山坡景观中的宁静灵屋空间。短暂停留，换个角度感受周围环境；请怀着尊重参观，并遵守现场指引。",
      "ko": "리조트 언덕 풍경 속 조용한 영혼의 집을 만나보세요. 잠시 멈추어 주변을 다른 시각으로 바라볼 수 있습니다. 존중하는 마음으로 방문하고 현장 안내를 따라주세요.",
      "ja": "リゾートの丘の風景にある、静かなスピリットハウスの一角へ。短い休息が周囲を別の視点で見せてくれます。敬意を持って訪れ、現地の案内に従ってください。"
    }
  },
  {
    "id": "rooms",
    "description": "Settle into a spacious 70 sqm room with Vietnamese-inspired details and a private terrace. Garden and sea views bring the resort’s natural setting indoors, creating an inviting base for quiet mornings and days exploring the peninsula.",
    "translations": {
      "vi": "Nghỉ trong phòng 70 m² với chi tiết lấy cảm hứng Việt Nam và sân hiên riêng. Tầm nhìn vườn và biển đưa thiên nhiên vào phòng, tạo điểm nghỉ thoải mái cho buổi sáng yên tĩnh và khám phá bán đảo.",
      "ru": "Расположитесь в просторном номере 70 м² с вьетнамскими деталями и приватной террасой. Виды сада и моря наполняют интерьер природой, создавая уютную основу для спокойных утренних часов и прогулок по полуострову.",
      "zh": "入住宽敞的70平方米客房，感受越南风格细节与私人露台。花园及海景将自然氛围引入室内，为宁静早晨和半岛探索提供舒适的休憩基地。",
      "ko": "베트남에서 영감을 받은 디테일과 전용 테라스가 있는 넓은 70㎡ 객실에서 쉬어가세요. 정원과 바다 전망이 자연을 실내로 들이며 고요한 아침과 반도 탐험의 편안한 거점이 됩니다.",
      "ja": "ベトナム風の細部と専用テラスを備えた、広々とした70㎡の客室へ。庭と海の眺めが室内に自然を運び、静かな朝や半島を巡る一日の快適な拠点になります。"
    }
  },
  {
    "id": "resort-classic-panoramic-room-oceanview",
    "description": "Enjoy a 70 sqm retreat inspired by Vietnamese architecture, with a private terrace opening onto panoramic scenery. Mountains, gardens and sea frame your stay, offering room to unwind between the resort’s dining, wellness and outdoor discoveries.",
    "translations": {
      "vi": "Tận hưởng phòng 70 m² lấy cảm hứng kiến trúc Việt Nam với sân hiên riêng hướng toàn cảnh. Núi, vườn và biển làm nền cho kỳ nghỉ, nơi thư giãn giữa trải nghiệm ẩm thực, chăm sóc sức khỏe và khám phá ngoài trời.",
      "ru": "Отдохните в номере 70 м² с вьетнамской архитектурой и приватной панорамной террасой. Горы, сады и море обрамляют проживание, оставляя пространство для отдыха между ресторанами, велнесом и прогулками.",
      "zh": "在受越南建筑启发的70平方米空间中休憩，私人露台面向全景。山峦、花园及海洋环绕住宿，让您在美食、身心健康与户外探索之间自在放松。",
      "ko": "베트남 건축에서 영감을 받은 70㎡ 객실과 파노라마 전용 테라스를 즐기세요. 산·정원·바다가 머무름을 감싸며 다이닝, 웰니스와 야외 탐험 사이 여유로운 휴식을 제공합니다.",
      "ja": "ベトナム建築に着想を得た70㎡の客室と、景色に開かれた専用テラスを。山々、庭園、海が滞在を彩り、食事やウェルネス、屋外の発見の合間にくつろげます。"
    }
  },
  {
    "id": "club-panoramic-room-oceanview",
    "description": "Combine a 70 sqm ocean-view room and private terrace with Club InterContinental privileges. Vietnamese-inspired design creates an elegant retreat, while lounge access, breakfast and afternoon tea add a distinctive rhythm to your stay.",
    "translations": {
      "vi": "Kết hợp phòng 70 m² nhìn biển, sân hiên riêng và đặc quyền Club InterContinental. Thiết kế Việt Nam tạo nơi nghỉ thanh lịch; lounge, bữa sáng và trà chiều thêm nhịp riêng cho kỳ nghỉ.",
      "ru": "Совместите номер 70 м² с видом на океан и террасой с привилегиями Club InterContinental. Вьетнамский дизайн создаёт элегантное уединение, а лаунж, завтрак и чай добавляют отдыху особый ритм.",
      "zh": "将70平方米海景客房、私人露台与Club InterContinental礼遇结合。越南风格设计营造优雅休憩空间，休息室使用权、早餐和下午茶为住宿增添独特节奏。",
      "ko": "70㎡ 오션뷰 객실과 전용 테라스에 Club InterContinental 혜택을 더하세요. 베트남식 디자인의 우아한 공간과 라운지 이용, 조식 및 애프터눈 티가 특별한 숙박 리듬을 만듭니다.",
      "ja": "70㎡の海を望む客室と専用テラスに、Club InterContinentalの特典を。ベトナム風の優雅な空間でくつろぎ、ラウンジ、朝食、アフタヌーンティーが滞在に特別なリズムを添えます。"
    }
  },
  {
    "id": "resort-terrace-suite-oceanview",
    "description": "Choose an 80 sqm corner suite with light arriving from two sides and a generous outdoor terrace. Beach and bay views accompany a stay designed for extra space, privacy and an easy flow between indoor comfort and open-air relaxation.",
    "translations": {
      "vi": "Chọn suite góc 80 m² nhận ánh sáng từ hai phía với sân hiên rộng. Cảnh bãi biển và vịnh đi cùng không gian riêng tư, rộng rãi, nối sự thoải mái trong phòng với thư giãn ngoài trời.",
      "ru": "Выберите угловой сьют 80 м², освещённый с двух сторон, с просторной террасой. Виды пляжа и бухты дополняют пространство и приватность, соединяя домашний комфорт с отдыхом на свежем воздухе.",
      "zh": "选择80平方米转角套房，享受双侧采光与宽阔户外露台。海滩及海湾景致相伴，为住宿增添空间与私密感，自然衔接室内舒适和露天休憩。",
      "ko": "양쪽에서 빛이 들어오는 80㎡ 코너 스위트와 넓은 야외 테라스를 선택하세요. 해변·만 전망과 넉넉한 공간, 프라이버시가 실내의 편안함과 야외 휴식을 자연스럽게 연결합니다.",
      "ja": "二方向から光が届く80㎡のコーナースイートと、ゆとりある屋外テラスを。ビーチと湾の眺め、広さ、プライバシーが、室内の快適さと外でのくつろぎを自然につなぎます。"
    }
  },
  {
    "id": "club-terrace-suite-panoramic-oceanview",
    "description": "Retreat to an 80 sqm suite with an expansive terrace and views across ocean and jungle. Club InterContinental privileges enrich the experience, pairing generous private space with lounge access and the pleasures of breakfast, afternoon tea and evening cocktails.",
    "translations": {
      "vi": "Nghỉ trong suite 80 m² với sân hiên rộng nhìn biển và rừng. Đặc quyền Club InterContinental thêm trải nghiệm với lounge, bữa sáng, trà chiều và cocktail tối, bên cạnh không gian riêng rộng rãi.",
      "ru": "Уединитесь в сьюте 80 м² с большой террасой и видами океана и джунглей. Привилегии Club дополняют приватное пространство лаунжем, завтраком, послеобеденным чаем и вечерними коктейлями.",
      "zh": "在80平方米套房休憩，宽敞露台面向海洋与丛林。Club InterContinental礼遇增添体验，将私享空间与休息室使用权、早餐、下午茶及晚间鸡尾酒结合。",
      "ko": "바다와 정글이 보이는 넓은 테라스의 80㎡ 스위트에서 쉬어가세요. Club InterContinental 혜택으로 개인 공간에 라운지, 조식, 애프터눈 티와 저녁 칵테일의 즐거움을 더합니다.",
      "ja": "広いテラスから海とジャングルを望む80㎡のスイートでくつろいで。Club InterContinentalの特典が、ゆとりある私的空間にラウンジ、朝食、アフタヌーンティー、カクテルの楽しみを添えます。"
    }
  },
  {
    "id": "penthouses",
    "description": "Rise above the resort in a one-bedroom penthouse with panoramic views, a rooftop infinity pool and a wraparound terrace. Indoor and outdoor living spaces, a kitchen and Club InterContinental privileges create a private setting for an exceptional escape.",
    "translations": {
      "vi": "Nghỉ trên cao trong penthouse một phòng ngủ với toàn cảnh, hồ vô cực trên mái và sân hiên bao quanh. Không gian trong ngoài, bếp và đặc quyền Club InterContinental tạo kỳ nghỉ riêng tư khác biệt.",
      "ru": "Поднимитесь над курортом в пентхаус с одной спальней, панорамой, бассейном на крыше и круговой террасой. Внутренние и внешние пространства, кухня и привилегии Club создают приватное место для особенного отдыха.",
      "zh": "在度假村上方入住单卧室顶层套房，享受全景、屋顶无边泳池与环绕露台。室内外起居空间、厨房和Club InterContinental礼遇，共同打造非凡的私享假期。",
      "ko": "파노라마 전망, 루프톱 인피니티 풀과 둘레 테라스가 있는 1베드룸 펜트하우스에서 리조트 위를 느껴보세요. 실내외 거실, 주방과 Club InterContinental 혜택이 프라이빗한 특별한 휴식을 완성합니다.",
      "ja": "リゾートを見下ろす1ベッドルームのペントハウスへ。パノラマ、屋上のインフィニティプール、周囲を巡るテラスに加え、内外の居住空間、キッチン、Clubの特典が特別な休暇をつくります。"
    }
  },
  {
    "id": "one-bedroom-seaside-villa-by-the-beach",
    "description": "Step from a one-bedroom seaside villa to the beach by your own staircase. A shaded terrace and private infinity pool make staying in just as inviting, while Club InterContinental privileges bring further comfort to your coastal retreat.",
    "translations": {
      "vi": "Từ villa biển một phòng ngủ, đi cầu thang riêng xuống bãi biển. Sân hiên rợp bóng và hồ vô cực riêng khiến nghỉ tại villa hấp dẫn không kém; đặc quyền Club InterContinental thêm thoải mái cho kỳ nghỉ.",
      "ru": "Спуститесь из прибрежной виллы с одной спальней на пляж по собственной лестнице. Тенистая терраса и приватный бассейн располагают остаться дома, а привилегии Club добавляют комфорта морскому отдыху.",
      "zh": "从单卧室海滨别墅沿私人阶梯直达沙滩。阴凉露台与私人无边泳池，让留在别墅同样惬意；Club InterContinental礼遇为海岸休憩增添舒适。",
      "ko": "1베드룸 해변 빌라에서 개인 계단으로 바로 해변에 내려가세요. 그늘진 테라스와 전용 인피니티 풀에서 머무는 즐거움을 느끼고 Club InterContinental 혜택으로 더욱 편안한 해안 휴식을 즐길 수 있습니다.",
      "ja": "1ベッドルームの海辺のヴィラから、専用階段でビーチへ。日陰のテラスとプライベートプールは、ヴィラに留まる時間も魅力的に。Club InterContinentalの特典が海辺の休息を豊かにします。"
    }
  },
  {
    "id": "one-bedroom-seaside-villa-on-the-rocks",
    "description": "Listen to the surf from a one-bedroom villa set above the rocks at a quiet end of the beach. Your private infinity pool and sun terrace invite lingering sea views, complemented by Club InterContinental privileges.",
    "translations": {
      "vi": "Nghe sóng từ villa một phòng ngủ trên ghềnh đá ở cuối bãi biển yên tĩnh. Hồ vô cực riêng và sân tắm nắng mời bạn ngắm biển lâu hơn, cùng đặc quyền Club InterContinental.",
      "ru": "Слушайте прибой в вилле с одной спальней над скалами у тихого края пляжа. Приватный бассейн и солнечная терраса располагают любоваться морем, а привилегии Club дополняют отдых.",
      "zh": "在海滩安静一端、岩石上方的单卧室别墅聆听海浪。私人无边泳池及阳光露台让您慢慢欣赏海景，并享受Club InterContinental礼遇。",
      "ko": "해변의 조용한 끝, 바위 위 1베드룸 빌라에서 파도 소리를 들어보세요. 전용 인피니티 풀과 선 테라스에서 바다를 여유롭게 감상하며 Club InterContinental 혜택을 즐길 수 있습니다.",
      "ja": "ビーチの静かな端、岩場の上にある1ベッドルームのヴィラで波音を。専用のインフィニティプールとサンテラスで海をゆっくり眺め、Club InterContinentalの特典もお楽しみください。"
    }
  },
  {
    "id": "spa-lagoon-villas",
    "description": "Find seclusion in a one-bedroom villa overlooking a quiet part of the spa lagoon. A private treatment room, steam room, sauna and outdoor Jacuzzi turn the villa into a personal retreat for restorative time at your own pace.",
    "translations": {
      "vi": "Tìm sự riêng tư trong villa một phòng ngủ hướng khu đầm spa yên tĩnh. Phòng trị liệu riêng, phòng hơi nước, sauna và Jacuzzi ngoài trời tạo nơi nghỉ cá nhân, dành thời gian thư giãn theo nhịp riêng.",
      "ru": "Уединитесь в вилле с одной спальней у спокойной части спа-лагуны. Приватная процедурная, парная, сауна и открытое джакузи превращают её в личное пространство для неспешного отдыха.",
      "zh": "在面向水疗泻湖安静角落的单卧室别墅享受隐逸。私人护理室、蒸汽房、桑拿及户外按摩池，将别墅化作个人休憩空间，让您按自己的节奏放松。",
      "ko": "스파 라군의 조용한 곳을 바라보는 1베드룸 빌라에서 프라이버시를 즐기세요. 개인 트리트먼트룸, 스팀룸, 사우나와 야외 자쿠지가 나만의 속도로 쉬는 개인 휴식처를 만들어 줍니다.",
      "ja": "スパのラグーンの静かな一角に面した1ベッドルームのヴィラへ。専用の施術室、スチームルーム、サウナ、屋外ジャグジーが、自分のペースで休める個人的な隠れ家をつくります。"
    }
  },
  {
    "id": "two-bedroom-seaside-villa-on-the-rocks",
    "description": "Share a spacious two-bedroom villa above the shoreline, with the sound of waves below. Multiple terraces, sundecks and a private infinity pool offer different places to gather or unwind, creating a seaside escape for time together.",
    "translations": {
      "vi": "Cùng ở villa hai phòng ngủ rộng rãi trên bờ biển, nghe sóng phía dưới. Nhiều sân hiên, khu tắm nắng và hồ vô cực riêng tạo nơi tụ họp hoặc thư giãn, dành kỳ nghỉ biển bên nhau.",
      "ru": "Разделите отдых в просторной вилле с двумя спальнями над берегом под шум волн. Террасы, площадки для загара и приватный бассейн предлагают места для встреч и уединения в морском пейзаже.",
      "zh": "共享海岸上方的宽敞双卧室别墅，聆听下方波浪。多处露台、日光平台与私人无边泳池，为相聚或放松提供不同角落，打造共度时光的海滨假期。",
      "ko": "해안 위 넓은 2베드룸 빌라에서 아래의 파도 소리와 함께 머무세요. 여러 테라스, 선덱과 전용 인피니티 풀에서 모이거나 쉬며 함께하는 해변 휴가를 즐길 수 있습니다.",
      "ja": "波音が届く海辺の広々とした2ベッドルームのヴィラを、ご一緒に。複数のテラス、サンデッキ、専用プールが、集まる時間にも一人でくつろぐ時間にも合う場所を用意しています。"
    }
  },
  {
    "id": "two-bedroom-royal-residence-by-the-sea",
    "description": "Enjoy an exceptionally private two-storey residence beside the water. Two bedrooms, a dining pavilion over the sea, a media room and a 13-metre infinity pool bring generous space for shared meals, quiet evenings and coastal views.",
    "translations": {
      "vi": "Nghỉ trong residence hai tầng riêng tư bên nước. Hai phòng ngủ, nhà ăn trên biển, phòng giải trí và hồ vô cực 13 mét tạo không gian rộng cho bữa ăn chung, buổi tối yên tĩnh và ngắm biển.",
      "ru": "Отдохните в уединённой двухэтажной резиденции у воды. Две спальни, павильон для ужинов над морем, медиакомната и 13-метровый бассейн создают простор для общих трапез и спокойных вечеров.",
      "zh": "在水边享受格外私密的双层宅邸。两间卧室、海上餐饮亭阁、影音室与13米无边泳池，为共享用餐、宁静夜晚和海岸景致提供宽裕空间。",
      "ko": "물가의 매우 프라이빗한 2층 레지던스에서 쉬어가세요. 침실 두 개, 바다 위 다이닝 파빌리온, 미디어룸과 13미터 인피니티 풀이 함께하는 식사와 조용한 저녁을 위한 넉넉한 공간을 제공합니다.",
      "ja": "水辺のプライベートな2階建てレジデンスでくつろいで。2つの寝室、海上のダイニングパビリオン、メディアルーム、13メートルのプールが、食事や静かな夜の時間にゆとりを添えます。"
    }
  },
  {
    "id": "two-bedroom-sun-peninsula-residence",
    "description": "Gather in an 800 sqm residence with two bedrooms, two infinity pools and spacious outdoor living areas. A dedicated Người Dẫn Lối host and Club InterContinental privileges help shape a private stay around your family or friends.",
    "translations": {
      "vi": "Quây quần trong residence 800 m² với hai phòng ngủ, hai hồ vô cực và khu sinh hoạt ngoài trời rộng. Người Dẫn Lối riêng cùng đặc quyền Club InterContinental giúp tạo kỳ nghỉ riêng theo gia đình hoặc bạn bè.",
      "ru": "Соберитесь в резиденции 800 м² с двумя спальнями, двумя бассейнами и просторными открытыми зонами. Персональный Người Dẫn Lối и привилегии Club помогают создать приватный отдых для семьи или друзей.",
      "zh": "在800平方米宅邸相聚，享有双卧室、两座无边泳池及宽敞户外起居区。专属Người Dẫn Lối管家与Club InterContinental礼遇，为家人或朋友打造私享住宿。",
      "ko": "침실 두 개, 인피니티 풀 두 곳과 넓은 야외 공간을 갖춘 800㎡ 레지던스에서 모여보세요. 전담 Người Dẫn Lối 호스트와 Club 혜택이 가족·친구에 맞춘 프라이빗한 숙박을 돕습니다.",
      "ja": "2つの寝室、2つのインフィニティプール、広い屋外空間のある800㎡のレジデンスへ。専属のNgười Dẫn LốiホストとClubの特典が、ご家族やご友人との私的な滞在を支えます。"
    }
  },
  {
    "id": "three-bedroom-sun-peninsula-residence",
    "description": "Make room for time together in a 1,000 sqm, three-bedroom residence with direct private beach access. Two infinity pools and generous terraces invite outdoor living, with a dedicated resort host and Club InterContinental privileges enhancing the stay.",
    "translations": {
      "vi": "Dành không gian bên nhau trong residence 1.000 m², ba phòng ngủ với lối xuống biển riêng. Hai hồ vô cực và sân hiên rộng mời sinh hoạt ngoài trời; host riêng và đặc quyền Club InterContinental nâng tầm kỳ nghỉ.",
      "ru": "Проведите время вместе в резиденции 1000 м² с тремя спальнями и прямым выходом на приватный пляж. Два бассейна, просторные террасы, персональный хозяин и привилегии Club дополняют проживание.",
      "zh": "在1000平方米三卧室宅邸共度时光，享有直达私人海滩的通道。两座无边泳池与宽阔露台适合户外生活，专属管家和Club InterContinental礼遇丰富住宿。",
      "ko": "전용 해변으로 바로 이어지는 1,000㎡ 3베드룸 레지던스에서 함께하는 시간을 만드세요. 인피니티 풀 두 곳과 넓은 테라스, 전담 호스트와 Club 혜택이 야외 생활과 숙박을 풍성하게 합니다.",
      "ja": "専用ビーチへ直接出られる1,000㎡の3ベッドルーム・レジデンスで、共に過ごす時間を。2つのプールと広いテラス、専属ホスト、Clubの特典が滞在を充実させます。"
    }
  },
  {
    "id": "three-bedroom-bai-bac-bay-villa",
    "description": "Retreat to a secluded hillside villa with three bedrooms and views over the beach. Three infinity pools give your group room to relax, while a dedicated Người Dẫn Lối host helps coordinate the details of your stay.",
    "translations": {
      "vi": "Nghỉ trong villa sườn đồi riêng tư với ba phòng ngủ nhìn xuống biển. Ba hồ vô cực cho cả nhóm không gian thư giãn; Người Dẫn Lối riêng hỗ trợ sắp xếp từng chi tiết kỳ nghỉ.",
      "ru": "Уединитесь в вилле на склоне с тремя спальнями и видом на пляж. Три бассейна оставляют группе пространство для отдыха, а персональный Người Dẫn Lối помогает организовать детали проживания.",
      "zh": "在僻静山坡上的三卧室别墅休憩，俯瞰海滩。三座无边泳池为同行宾客留出放松空间，专属Người Dẫn Lối管家协助协调住宿细节。",
      "ko": "해변을 내려다보는 한적한 언덕의 3베드룸 빌라에서 쉬어가세요. 인피니티 풀 세 곳에서 일행과 여유를 즐기고 전담 Người Dẫn Lối 호스트가 숙박의 세부 준비를 도와드립니다.",
      "ja": "ビーチを見渡す、静かな丘の3ベッドルーム・ヴィラでくつろいで。3つのプールが皆様の休息にゆとりを用意し、専属のNgười Dẫn Lốiホストが滞在の細部をお手伝いします。"
    }
  },
  {
    "id": "four-bedroom-pool-villa",
    "description": "Celebrate time together in a four-bedroom residence on Earth level, with separate living spaces and three private pools. Expansive terraces and a dedicated resort host make it a flexible setting for family holidays or a gathering with friends.",
    "translations": {
      "vi": "Cùng tận hưởng residence bốn phòng ngủ tại Earth với phòng khách riêng và ba hồ bơi. Sân hiên rộng cùng host riêng tạo không gian linh hoạt cho kỳ nghỉ gia đình hoặc gặp gỡ bạn bè.",
      "ru": "Проведите время вместе в резиденции с четырьмя спальнями на уровне Earth, отдельными гостиными и тремя бассейнами. Большие террасы и персональный хозяин создают гибкое пространство для семьи или друзей.",
      "zh": "在Earth层级的四卧室宅邸共度欢聚时光，享有独立起居区和三座私人泳池。宽阔露台与专属管家，让这里适合家庭假期或朋友聚会。",
      "ko": "Earth 층의 4베드룸 레지던스에서 분리된 거실 공간과 전용 수영장 세 곳으로 함께하는 시간을 즐기세요. 넓은 테라스와 전담 호스트가 가족 휴가나 친구 모임을 편안하게 준비합니다.",
      "ja": "Earth階の4ベッドルーム・レジデンスで集いの時間を。独立した居住空間、3つの専用プール、広いテラス、専属ホストが、ご家族の休暇にも友人との集まりにも応えます。"
    }
  },
  {
    "id": "nursery",
    "description": "Travelling with very young children calls for a little extra planning. Use this card to connect with the resort team about suitable spaces and support, and confirm age requirements, supervision and any childcare arrangements before making plans.",
    "translations": {
      "vi": "Đi cùng trẻ nhỏ cần thêm chuẩn bị. Card giúp liên hệ đội ngũ resort về không gian và hỗ trợ phù hợp; hãy xác nhận yêu cầu tuổi, giám sát và việc trông trẻ trước khi lên kế hoạch.",
      "ru": "Путешествие с малышами требует дополнительного планирования. Через эту карточку уточните у курорта подходящие пространства и помощь, возрастные условия, присмотр и услуги ухода до составления планов.",
      "zh": "携幼儿出行需要多一点准备。通过这张卡片联系度假村团队，了解合适空间与协助；安排活动前，请确认年龄要求、看护及托育服务。",
      "ko": "어린아이와 여행할 때는 조금 더 준비가 필요합니다. 이 카드에서 리조트 팀에 적합한 공간과 지원을 문의하고, 계획 전 연령 조건·보호·돌봄 준비를 확인하세요.",
      "ja": "小さなお子様との旅行には、少し丁寧な準備を。このカードからリゾートに適した場所やサポートをご相談いただき、年齢条件、見守り、託児の手配を事前にご確認ください。"
    }
  },
  {
    "id": "moulin-rouge",
    "description": "Gather family, friends or colleagues for a private karaoke evening on Heaven level. The resort’s M Rouge lounge has six equipped karaoke rooms, offering a playful setting for celebrations and team activities; enquire about reservations.",
    "translations": {
      "vi": "Cùng gia đình, bạn bè hoặc đồng nghiệp hát karaoke riêng tại Heaven. M Rouge có sáu phòng được trang bị, phù hợp kỷ niệm và hoạt động nhóm; hãy hỏi về đặt chỗ.",
      "ru": "Соберите близких или коллег на приватный караоке-вечер на уровне Heaven. В M Rouge шесть оборудованных комнат для праздников и командного досуга; бронирование уточняйте у курорта.",
      "zh": "在Heaven层级，与家人、朋友或同事享受私人卡拉OK之夜。M Rouge设有六间设备齐全的歌房，适合庆祝与团体活动；请咨询预约安排。",
      "ko": "Heaven 층에서 가족·친구·동료와 프라이빗 노래방의 밤을 즐기세요. M Rouge의 장비를 갖춘 여섯 객실은 축하와 팀 활동에 적합합니다. 예약은 리조트에 문의하세요.",
      "ja": "Heaven階で家族や友人、同僚とプライベートなカラオケの夜を。M Rougeには設備の整った6室があり、お祝いにもチームの交流にもぴったりです。予約はご相談ください。"
    }
  },
  {
    "id": "b-lounge",
    "description": "Choose a quiet lounge pause between exploring the resort and returning to your room. Ask the team about the current setting, drinks and dining service before visiting, so your plans reflect what is available during your stay.",
    "translations": {
      "vi": "Chọn khoảnh khắc nghỉ yên tĩnh tại lounge giữa khám phá resort và về phòng. Trước khi đến, hỏi đội ngũ về không gian, đồ uống và dịch vụ ăn hiện tại để kế hoạch phù hợp kỳ nghỉ.",
      "ru": "Сделайте спокойную паузу в лаунже между прогулкой и возвращением в номер. Перед посещением уточните у команды обстановку, напитки и питание, чтобы планы соответствовали доступным услугам.",
      "zh": "在探索度假村与返回客房之间，选择一段安静的休息室时光。到访前请向团队确认当前空间、饮品与餐饮服务，让计划符合住宿期间实际提供的安排。",
      "ko": "리조트 탐험과 객실로 돌아가는 사이 조용한 라운지에서 쉬어가세요. 방문 전 현재 공간, 음료와 다이닝 서비스를 팀에 문의해 숙박 기간에 가능한 서비스에 맞춰 계획하세요.",
      "ja": "散策とお部屋へ戻る合間に、静かなラウンジでひと休み。訪問前に場所や飲み物、食事のサービスをスタッフへ確認し、ご滞在中に利用できる内容に合わせてご予定ください。"
    }
  },
  {
    "id": "the-summit",
    "description": "Discover the resort’s dedicated setting for meetings, presentations and celebrations. Conference spaces, the Summit Auditorium and M Club offer different ways to gather, with the events team helping match the venue and arrangements to your occasion.",
    "translations": {
      "vi": "Khám phá khu dành cho hội họp, thuyết trình và lễ kỷ niệm. Không gian hội nghị, Summit Auditorium và M Club có nhiều cách tụ họp; đội ngũ sự kiện giúp chọn địa điểm và sắp xếp theo dịp.",
      "ru": "Откройте пространство для встреч, выступлений и праздников. Конференц-залы, Summit Auditorium и M Club предлагают разные форматы; команда мероприятий поможет подобрать площадку и организацию для вашего события.",
      "zh": "探索度假村专为会议、演讲及庆典准备的空间。会议场地、Summit Auditorium与M Club提供不同相聚方式，由活动团队协助选择适合场合的场地与安排。",
      "ko": "회의, 발표와 축하를 위한 리조트의 전용 공간을 만나보세요. 회의장, Summit Auditorium과 M Club이 다양한 모임 방식을 제공하며 이벤트 팀이 행사에 맞는 장소와 준비를 도와드립니다.",
      "ja": "会議、プレゼンテーション、お祝いのための専用エリアへ。会議室、Summit Auditorium、M Clubが多様な集い方をご用意し、イベントチームが目的に合う会場と手配をお手伝いします。"
    }
  },
  {
    "id": "summit-conference-centre",
    "description": "Bring a meeting or celebration to a hilltop setting shaped by Bill Bensley’s architecture. A range of halls and event spaces can host different formats, with the events team advising on layouts, technology and personalised arrangements.",
    "translations": {
      "vi": "Tổ chức hội họp hoặc lễ kỷ niệm trên đỉnh đồi với kiến trúc Bill Bensley. Các sảnh và khu sự kiện phù hợp nhiều hình thức; đội ngũ tư vấn bố trí, công nghệ và sắp xếp cá nhân hóa.",
      "ru": "Проведите встречу или праздник на вершине холма среди архитектуры Бенсли. Залы и площадки поддерживают разные форматы; команда поможет с рассадкой, технологиями и индивидуальными организационными решениями.",
      "zh": "在Bill Bensley建筑塑造的山顶空间举办会议或庆典。多种厅堂与活动场地适应不同形式，活动团队可提供布局、技术及个性化安排建议。",
      "ko": "Bill Bensley 건축으로 이루어진 언덕 위 공간에서 회의나 축하를 계획하세요. 다양한 홀과 행사장이 여러 형식을 수용하며, 이벤트 팀이 배치·기술·맞춤 준비를 안내합니다.",
      "ja": "Bill Bensleyの建築が彩る丘の上で、会議やお祝いを。さまざまなホールや会場が多様な形式に対応し、イベントチームがレイアウト、設備、個別の手配をご案内します。"
    }
  },
  {
    "id": "summit-cinema",
    "description": "Settle into comfortable leather cinema-style seating in the Summit Auditorium. A screen, projection system and stage support films, presentations and live talks; the resort team can advise on scheduled screenings or arrangements for a private event.",
    "translations": {
      "vi": "Ngồi thoải mái trên ghế da kiểu rạp tại Summit Auditorium. Màn hình, máy chiếu và sân khấu phục vụ phim, thuyết trình và diễn thuyết; đội ngũ tư vấn lịch chiếu hoặc tổ chức sự kiện riêng.",
      "ru": "Расположитесь в кожаном кресле кинотеатрального типа в Summit Auditorium. Экран, проектор и сцена подходят для фильмов и выступлений; сотрудники расскажут о сеансах или организации приватного события.",
      "zh": "在Summit Auditorium舒适的皮质影院座椅就坐。银幕、投影系统与舞台可支持电影、演示及现场演讲；度假村团队可提供放映日程或私人活动安排建议。",
      "ko": "Summit Auditorium의 편안한 가죽 영화관 좌석에 앉아보세요. 스크린·프로젝션·무대에서 영화, 발표와 강연을 진행할 수 있습니다. 상영 일정이나 개인 행사 준비는 팀에 문의하세요.",
      "ja": "Summit Auditoriumの快適な革張りのシネマシートへ。スクリーン、映写設備、ステージが映画やプレゼンテーション、講演を支えます。上映予定や個人イベントの手配はリゾートへご相談ください。"
    }
  },
  {
    "id": "m-club",
    "description": "Celebrate in an imaginative nightclub inspired by Charles the monkey, with a stage, bar and lounge corners. Connected M Privé adds dining and dancing space, making the venue suited to private parties, receptions and after-event gatherings.",
    "translations": {
      "vi": "Kỷ niệm tại nightclub lấy cảm hứng từ chú khỉ Charles với sân khấu, bar và góc lounge. M Privé liền kề thêm không gian ăn và khiêu vũ, phù hợp tiệc riêng, tiếp đón và gặp gỡ sau sự kiện.",
      "ru": "Празднуйте в необычном клубе, вдохновлённом обезьянкой Чарльзом, со сценой, баром и лаунж-зонами. Соседний M Privé добавляет пространство для еды и танцев, частных вечеринок и приёмов.",
      "zh": "在以Charles猴子为灵感的创意夜店庆祝，享有舞台、酒吧及休闲角落。相连的M Privé增添用餐和舞蹈空间，适合私人派对、招待会及活动后的聚会。",
      "ko": "원숭이 Charles에서 영감을 받은 클럽에서 무대·바·라운지 코너와 함께 축하하세요. 연결된 M Privé에 다이닝과 춤을 위한 공간이 더해져 개인 파티, 리셉션과 행사 후 모임에 적합합니다.",
      "ja": "猿のCharlesに着想を得たユニークなクラブでお祝いを。ステージ、バー、ラウンジに加え、隣のM Privéに食事とダンスの空間があり、プライベートパーティーやレセプションに適しています。"
    }
  },
  {
    "id": "kate-mccoy",
    "description": "Discover fine jewellery by Australian designer Kate McCoy at the Bensley Outsider Gallery. Her diamond collections bring a different artistic perspective to the resort, with selected pieces created exclusively for this setting; appointments can be arranged with the team.",
    "translations": {
      "vi": "Khám phá trang sức cao cấp của nhà thiết kế Úc Kate McCoy tại Bensley Outsider Gallery. Bộ sưu tập kim cương tạo góc nghệ thuật khác, có mẫu riêng cho resort; có thể hẹn xem với đội ngũ.",
      "ru": "Откройте украшения австралийского дизайнера Кейт Маккой в галерее Бенсли. Бриллиантовые коллекции добавляют иной художественный взгляд, включая изделия для курорта; команда поможет назначить встречу.",
      "zh": "在Bensley Outsider Gallery发现澳大利亚设计师Kate McCoy的高级珠宝。钻石系列呈现另一艺术视角，部分作品专为度假村创作；可与团队安排鉴赏预约。",
      "ko": "Bensley Outsider Gallery에서 호주 디자이너 Kate McCoy의 파인 주얼리를 만나보세요. 일부 리조트 전용 작품을 포함한 다이아몬드 컬렉션이 다른 예술적 시각을 더합니다. 팀을 통해 방문 예약이 가능합니다.",
      "ja": "Bensley Outsider Galleryで、オーストラリアのデザイナーKate McCoyのジュエリーを。リゾート専用の作品を含むダイヤモンドのコレクションが、別の芸術的視点を添えます。鑑賞の予約はスタッフへ。"
    },
    "intro": "Fine jewellery at the Bensley Outsider Gallery.",
    "intro_translations": {
      "vi": "Trang sức cao cấp tại Bensley Outsider Gallery.",
      "ru": "Ювелирное искусство в Bensley Outsider Gallery.",
      "zh": "Bensley Outsider Gallery的高级珠宝。",
      "ko": "Bensley Outsider Gallery의 파인 주얼리.",
      "ja": "Bensley Outsider Galleryのファインジュエリー。"
    }
  },
  {
    "id": "sammys",
    "description": "Browse ethical fashion and distinctive pieces in the Heritage Village. Sammy’s Boutique reflects the resort’s creative spirit, with designs using recycled materials and purchases supporting selected causes; the team can explain the story behind individual items.",
    "translations": {
      "vi": "Xem thời trang có trách nhiệm và sản phẩm khác biệt tại Heritage Village. Sammy’s Boutique phản ánh tinh thần sáng tạo, có thiết kế từ vật liệu tái chế và sản phẩm hỗ trợ các mục tiêu; nhân viên kể câu chuyện từng món.",
      "ru": "Познакомьтесь с этичной модой в Heritage Village. Sammy’s Boutique отражает творческий дух курорта, предлагая дизайны из переработанных материалов и покупки в поддержку отдельных инициатив; сотрудники расскажут истории вещей.",
      "zh": "在Heritage Village浏览有责任感的时尚与独特单品。Sammy’s Boutique体现度假村创意精神，包含再生材料设计及支持特定公益的商品；团队可介绍各件作品背后的故事。",
      "ko": "Heritage Village에서 윤리적 패션과 개성 있는 제품을 둘러보세요. 재활용 소재 디자인과 특정 공익 활동을 지원하는 상품으로 Sammy’s Boutique가 창작 정신을 보여줍니다. 개별 제품의 이야기는 팀에 문의하세요.",
      "ja": "Heritage Villageでエシカルなファッションや個性的な品々を。再生素材のデザインや特定の活動を支援する商品に、Sammy’s Boutiqueの創造の精神が表れます。それぞれの物語をスタッフにお尋ねください。"
    }
  }
]$copy$::jsonb;
 card jsonb;
 variant record;
BEGIN
 FOR card IN SELECT value FROM jsonb_array_elements(cards) LOOP
  UPDATE public.destinations SET detail_description=card->>'description' WHERE id=card->>'id';
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing destination: %',card->>'id'; END IF;
  IF card ? 'intro' THEN
   UPDATE public.destinations SET short_description=card->>'intro' WHERE id=card->>'id';
   UPDATE public.destination_translations SET
    description=card->'intro_translations'->>locale,
    source_description=card->>'intro'
   WHERE destination_id=card->>'id' AND card->'intro_translations' ? locale;
  END IF;
  FOR variant IN SELECT key,value FROM jsonb_each_text(card->'translations') LOOP
   UPDATE public.destination_translations SET detail_description=variant.value,
    source_detail_description=card->>'description',published=true
   WHERE destination_id=card->>'id' AND locale=variant.key;
   IF NOT FOUND THEN RAISE EXCEPTION 'Missing translation: % / %',card->>'id',variant.key; END IF;
  END LOOP;
  IF (SELECT count(*) FROM public.destination_translations WHERE destination_id=card->>'id'
    AND published AND source_detail_description=card->>'description' AND nullif(trim(detail_description),'') IS NOT NULL)<>5
  THEN RAISE EXCEPTION 'Incomplete expanded translations: %',card->>'id'; END IF;
 END LOOP;
END
$migration$;
COMMIT;
