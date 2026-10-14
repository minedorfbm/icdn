-- The original vi/ru/zh rows were entered manually and were absent from Git's
-- bootstrap sequence. Seed only missing rows using the tracked reviewed copy;
-- existing translations are preserved, and stale source text stays unpublished.
BEGIN;
INSERT INTO public.destination_translations
  (destination_id, locale, description, source_description, published)
SELECT s.id, s.locale, s.description, s.source, s.source = d.short_description
FROM jsonb_to_recordset($seed$
[
  {
    "id": "enchanted-holiday",
    "locale": "vi",
    "description": "Giáng sinh 2026 — kỳ nghỉ lễ hội với bữa sáng mỗi ngày, Trà chiều, thức uống chúc mừng và hành trình khám phá thiên nhiên cùng Charles.",
    "source": "Christmas 2026 — a festive stay with daily breakfast, Afternoon Tea, celebratory drinks and Charles's nature discovery trail."
  },
  {
    "id": "club-lounge",
    "locale": "vi",
    "description": "Phòng chờ riêng tư phía trên vịnh biển.",
    "source": "Private lounge above the bay."
  },
  {
    "id": "ihg-one-rewards",
    "locale": "vi",
    "description": "Chương trình khách hàng thân thiết của IHG Hotels & Resorts — tích điểm và tận hưởng trên toàn thế giới.",
    "source": "The loyalty programme of IHG Hotels & Resorts — earn and enjoy worldwide."
  },
  {
    "id": "bensley-package",
    "locale": "vi",
    "description": "Hai đêm tại Heavenly Penthouse, tour thiết kế riêng, thưởng lãm nghệ thuật cùng Champagne tại Bensley Outsider Gallery và Trà chiều Heavenly.",
    "source": "Two nights in the Heavenly Penthouse, a private Design Tour, Champagne art viewing at the Bensley Outsider Gallery and Heavenly Afternoon Tea."
  },
  {
    "id": "weddings",
    "locale": "vi",
    "description": "Nói lời hẹn ước phía trên vịnh biển — lễ cưới bên bãi biển, tiệc riêng theo yêu cầu và những khoảnh khắc tuần trăng mật do chuyên gia của chúng tôi thực hiện.",
    "source": "Say 'I do' above the bay — beachfront ceremonies, bespoke receptions and honeymoon moments crafted by our wedding specialists."
  },
  {
    "id": "reception",
    "locale": "vi",
    "description": "Sảnh Đón Tiếp, bộ phận Concierge và Văn phòng Điều hành — chào đón khách tại điểm cao nhất của khu nghỉ dưỡng.",
    "source": "Reception Lobby, Concierge and Executive Office — arrival at the highest point of the resort."
  },
  {
    "id": "penthouses",
    "locale": "vi",
    "description": "Những suite toàn cảnh trên đỉnh cao.",
    "source": "Panoramic suites at the summit."
  },
  {
    "id": "the-summit",
    "locale": "vi",
    "description": "Trung tâm Hội nghị The Summit, Phòng khán giả–Chiếu phim và M Club — nơi hội họp, trình chiếu và tổ chức tiệc mừng.",
    "source": "The Summit Conference Centre, the Auditorium-Cinema and M Club — gatherings, screenings and celebrations."
  },
  {
    "id": "rooms",
    "locale": "vi",
    "description": "Thiết kế Bensley, từng tầng một.",
    "source": "Bensley design, level by level."
  },
  {
    "id": "sports-centre",
    "locale": "vi",
    "description": "Sân tennis, sân pickleball, sân bóng đá và các hoạt động vui chơi trên đỉnh núi.",
    "source": "Tennis and pickleball courts, football pitch and mountaintop play."
  },
  {
    "id": "apec-garden",
    "locale": "vi",
    "description": "Điêu khắc dọc theo sườn núi.",
    "source": "Sculpture along the ridge."
  },
  {
    "id": "nam-tram",
    "locale": "vi",
    "description": "Tuyến cáp kéo nối bốn thế giới.",
    "source": "The funicular between the four worlds."
  },
  {
    "id": "information",
    "locale": "vi",
    "description": "Bộ phận hỗ trợ và chăm sóc khách.",
    "source": "Concierge and guest assistance."
  },
  {
    "id": "citron",
    "locale": "vi",
    "description": "Ẩm thực Việt trong những khoang tổ chim treo lơ lửng.",
    "source": "Vietnamese cuisine in hanging nest pods."
  },
  {
    "id": "la-maison-1888",
    "locale": "vi",
    "description": "Ẩm thực Pháp được MICHELIN ghi nhận.",
    "source": "MICHELIN-recognised French dining."
  },
  {
    "id": "buffalo-bar",
    "locale": "vi",
    "description": "Cocktail bên dưới Làng Di Sản.",
    "source": "Cocktails beneath the Heritage Village."
  },
  {
    "id": "wine-cellar",
    "locale": "vi",
    "description": "Những chai vang quý trong căn phòng ẩn giấu.",
    "source": "Rare vintages in a hidden room."
  },
  {
    "id": "tingara",
    "locale": "vi",
    "description": "Thức uống hoàng hôn phía trên đường chân trời.",
    "source": "Sunset drinks above the horizon."
  },
  {
    "id": "heritage-village",
    "locale": "vi",
    "description": "Thủ công và kiến trúc Việt Nam.",
    "source": "Vietnamese craft and architecture."
  },
  {
    "id": "bensley-gallery",
    "locale": "vi",
    "description": "Những bức tranh táo bạo, rực rỡ của Bill Bensley — kiến trúc sư đằng sau khu nghỉ dưỡng — cùng bộ sưu tập trang sức kim cương Kate McCoy. Mở cửa T4–CN.",
    "source": "Bold, colourful paintings by Bill Bensley, the architect behind the resort — with Kate McCoy's high-end diamond jewelry. Open Wed–Sun."
  },
  {
    "id": "kate-mccoy",
    "locale": "vi",
    "description": "Thời trang nghỉ dưỡng đương đại.",
    "source": "Contemporary resort wear."
  },
  {
    "id": "sammys",
    "locale": "vi",
    "description": "Những món tuyển chọn và quà lưu niệm.",
    "source": "Curated pieces and keepsakes."
  },
  {
    "id": "terra-mare",
    "locale": "vi",
    "description": "Đất và biển, suốt cả ngày.",
    "source": "Land and sea, all day long."
  },
  {
    "id": "b-lounge",
    "locale": "vi",
    "description": "Trà chiều giữa tán cây.",
    "source": "Afternoon tea in the trees."
  },
  {
    "id": "long-bar",
    "locale": "vi",
    "description": "Đường nét dài phía trên rừng xanh.",
    "source": "The long line above the jungle."
  },
  {
    "id": "soar-gym",
    "locale": "vi",
    "description": "Rèn luyện giữa vòm lá.",
    "source": "Train inside the canopy."
  },
  {
    "id": "yoga-pavilion",
    "locale": "vi",
    "description": "Hơi thở giữa ngàn lá.",
    "source": "Breath among the leaves."
  },
  {
    "id": "long-pool",
    "locale": "vi",
    "description": "Làn nước xanh, chiều dài bất tận.",
    "source": "Green water, endless length."
  },
  {
    "id": "planet-trekkers",
    "locale": "vi",
    "description": "Thế giới dành cho những nhà thám hiểm nhỏ.",
    "source": "A world for younger explorers."
  },
  {
    "id": "family-pool",
    "locale": "vi",
    "description": "Nông, rợp bóng mát, bên nhau.",
    "source": "Shallow, shaded, together."
  },
  {
    "id": "kids-pool",
    "locale": "vi",
    "description": "Làn nước nhỏ cho những vị khách nhỏ.",
    "source": "Small water for small guests."
  },
  {
    "id": "garden-jacuzzi",
    "locale": "vi",
    "description": "Nước ấm giữa cây lá.",
    "source": "Warm water in the vegetation."
  },
  {
    "id": "nail-hair",
    "locale": "vi",
    "description": "Chăm sóc tĩnh lặng giữa những lần bơi.",
    "source": "Quiet care between swims."
  },
  {
    "id": "nursery",
    "locale": "vi",
    "description": "Chăm sóc các vị khách nhỏ tuổi nhất.",
    "source": "Care for the youngest guests."
  },
  {
    "id": "organic-garden",
    "locale": "vi",
    "description": "Nơi gian bếp bắt đầu.",
    "source": "Where the kitchens begin."
  },
  {
    "id": "dia-tang",
    "locale": "vi",
    "description": "Một khoảng lặng bên sườn đồi.",
    "source": "A pause in the hillside."
  },
  {
    "id": "mi-sol-spa",
    "locale": "vi",
    "description": "Âm thanh. Tĩnh lặng. Tái sinh.",
    "source": "Sound. Stillness. Renewal."
  },
  {
    "id": "marine-centre",
    "locale": "vi",
    "description": "Thể thao dưới nước và các hoạt động có hướng dẫn dọc bờ biển.",
    "source": "Water sports and guided activities along the shoreline."
  },
  {
    "id": "coconut-beach",
    "locale": "vi",
    "description": "Bên rìa bán đảo Sơn Trà.",
    "source": "At the edge of Son Tra."
  },
  {
    "id": "family-beach",
    "locale": "vi",
    "description": "Cát mịn, nước lặng.",
    "source": "Soft sand, calm water."
  },
  {
    "id": "club-beach",
    "locale": "vi",
    "description": "Bờ biển riêng dành cho khách Club.",
    "source": "Private shoreline for Club guests."
  },
  {
    "id": "spa-lagoon-villas",
    "locale": "vi",
    "description": "Ngủ bên làn nước tĩnh.",
    "source": "Sleep beside still water."
  },
  {
    "id": "sea-experiences",
    "locale": "vi",
    "description": "Thuyền buồm bình minh và những lần lặn tĩnh lặng.",
    "source": "Sunrise sailing and quiet dives."
  },
  {
    "id": "moulin-rouge",
    "locale": "vi",
    "description": "Hát hết mình cùng gia đình và bạn bè trong một câu lạc bộ riêng đầy vui nhộn.",
    "source": "Sing the night away with family and friends in a playful private club."
  },
  {
    "id": "relaxation-pavilion",
    "locale": "vi",
    "description": "Một góc ngắm cảnh yên tĩnh phía trên vịnh — nơi cao nhất của khu nghỉ dưỡng để ngồi thư giãn và hít thở.",
    "source": "A quiet lookout above the bay — the resort's highest place to simply sit and breathe."
  },
  {
    "id": "instagram-spots",
    "locale": "vi",
    "description": "Chín địa điểm được chụp ảnh nhiều nhất tại khu nghỉ dưỡng, từ Sảnh Đón Tiếp đến Bãi biển Coconut.",
    "source": "The nine most photographed places of the resort, from the Reception Hall to Coconut Beach."
  },
  {
    "id": "wall-of-lanterns",
    "locale": "vi",
    "description": "Bức tường đèn lồng Hội An rực sáng trên lối xuống các hồ bơi — một trong những điểm chụp ảnh đặc trưng của khu nghỉ dưỡng.",
    "source": "A glowing wall of Hoi An lanterns on the way down to the pools — one of the resort's signature photo spots."
  },
  {
    "id": "hoi-an-digital-tour",
    "locale": "vi",
    "description": "Khám phá phố cổ Hội An qua hành trình số có hướng dẫn, giữa những con phố lịch sử và di sản sống.",
    "source": "A guided digital tour through Hoi An’s Old Town, its historic streets and living heritage."
  },
  {
    "id": "nature-discovery-guide",
    "locale": "vi",
    "description": "Tìm hiểu động vật hoang dã và thực vật bản địa Sơn Trà qua cẩm nang khám phá thiên nhiên của khu nghỉ dưỡng.",
    "source": "Meet the wildlife and native plants of Son Tra in the resort’s nature discovery guide."
  },
  {
    "id": "daycation",
    "locale": "vi",
    "description": "Tận hưởng một ngày tại khu nghỉ dưỡng với bãi biển, hồ bơi và lựa chọn trải nghiệm ẩm thực hoặc chăm sóc sức khỏe.",
    "source": "Spend a day at the resort with beach and pool access and a choice of dining or wellness experiences."
  },
  {
    "id": "things-to-do",
    "locale": "vi",
    "description": "Khám phá các hoạt động giải trí tại khu nghỉ dưỡng và xem lịch hoạt động hằng ngày mới nhất.",
    "source": "Explore the resort’s recreation and discover the current daily activity schedule."
  },
  {
    "id": "destination-experiences",
    "locale": "vi",
    "description": "Khám phá Hội An, Đà Nẵng và các di sản văn hóa miền Trung qua gợi ý của đội ngũ concierge khu nghỉ dưỡng.",
    "source": "Explore Hoi An, Da Nang and Central Vietnam’s cultural landmarks with ideas from the resort concierge."
  },
  {
    "id": "nature-experiences",
    "locale": "vi",
    "description": "Khám phá rừng Sơn Trà, động vật hoang dã và những trải nghiệm thiên nhiên có hướng dẫn quanh khu nghỉ dưỡng.",
    "source": "Discover Son Tra’s forest, wildlife and guided nature experiences around the resort."
  },
  {
    "id": "summit-conference-centre",
    "locale": "vi",
    "description": "Không gian trên đỉnh đồi dành cho các cuộc họp và lễ kỷ niệm, với những đại sảnh sang trọng và khu vực tổ chức sự kiện linh hoạt.",
    "source": "A hilltop setting for meetings and celebrations, with elegant halls and versatile event spaces."
  },
  {
    "id": "summit-cinema",
    "locale": "vi",
    "description": "Khán phòng ghế da tại The Summit dành cho phim ảnh, thuyết trình và các buổi chiếu riêng tư.",
    "source": "A leather-seated auditorium for films, presentations and private screenings at The Summit."
  },
  {
    "id": "m-club",
    "locale": "vi",
    "description": "Không gian giải trí đêm đầy màu sắc cho các buổi tiệc riêng, với sân khấu, quầy bar và khu tổ chức sự kiện M Privé liền kề.",
    "source": "A playful nightclub for private celebrations, with a stage, bar and adjoining M Privé event space."
  },
  {
    "id": "enchanted-holiday",
    "locale": "ru",
    "description": "Рождество 2026 — праздничное проживание с ежедневным завтраком, послеобеденным чаем, торжественными напитками и природной тропой Чарльза.",
    "source": "Christmas 2026 — a festive stay with daily breakfast, Afternoon Tea, celebratory drinks and Charles's nature discovery trail."
  },
  {
    "id": "club-lounge",
    "locale": "ru",
    "description": "Приватный лаундж над заливом.",
    "source": "Private lounge above the bay."
  },
  {
    "id": "ihg-one-rewards",
    "locale": "ru",
    "description": "Программа лояльности IHG Hotels & Resorts — накапливайте баллы и пользуйтесь ими по всему миру.",
    "source": "The loyalty programme of IHG Hotels & Resorts — earn and enjoy worldwide."
  },
  {
    "id": "bensley-package",
    "locale": "ru",
    "description": "Две ночи в Heavenly Penthouse, частный дизайн-тур, просмотр искусства с шампанским в Bensley Outsider Gallery и Heavenly Afternoon Tea.",
    "source": "Two nights in the Heavenly Penthouse, a private Design Tour, Champagne art viewing at the Bensley Outsider Gallery and Heavenly Afternoon Tea."
  },
  {
    "id": "weddings",
    "locale": "ru",
    "description": "Скажите «да» над заливом — церемонии на пляже, приёмы по индивидуальному сценарию и медовый месяц под опекой наших свадебных специалистов.",
    "source": "Say 'I do' above the bay — beachfront ceremonies, bespoke receptions and honeymoon moments crafted by our wedding specialists."
  },
  {
    "id": "reception",
    "locale": "ru",
    "description": "Вестибюль, служба консьержей и офис администрации — встреча гостей в самой высокой точке курорта.",
    "source": "Reception Lobby, Concierge and Executive Office — arrival at the highest point of the resort."
  },
  {
    "id": "penthouses",
    "locale": "ru",
    "description": "Панорамные сьюты на вершине.",
    "source": "Panoramic suites at the summit."
  },
  {
    "id": "the-summit",
    "locale": "ru",
    "description": "Конференц-центр The Summit, зал-кинотеатр и M Club — для встреч, кинопоказов и торжеств.",
    "source": "The Summit Conference Centre, the Auditorium-Cinema and M Club — gatherings, screenings and celebrations."
  },
  {
    "id": "rooms",
    "locale": "ru",
    "description": "Дизайн Бенсли, уровень за уровнем.",
    "source": "Bensley design, level by level."
  },
  {
    "id": "sports-centre",
    "locale": "ru",
    "description": "Теннисные корты, площадки для пиклбола, футбольное поле и активный отдых на вершине горы.",
    "source": "Tennis and pickleball courts, football pitch and mountaintop play."
  },
  {
    "id": "apec-garden",
    "locale": "ru",
    "description": "Скульптуры вдоль хребта.",
    "source": "Sculpture along the ridge."
  },
  {
    "id": "nam-tram",
    "locale": "ru",
    "description": "Фуникулёр между четырьмя мирами.",
    "source": "The funicular between the four worlds."
  },
  {
    "id": "information",
    "locale": "ru",
    "description": "Консьерж и помощь гостям.",
    "source": "Concierge and guest assistance."
  },
  {
    "id": "citron",
    "locale": "ru",
    "description": "Вьетнамская кухня в подвесных «гнёздах».",
    "source": "Vietnamese cuisine in hanging nest pods."
  },
  {
    "id": "la-maison-1888",
    "locale": "ru",
    "description": "Французская кухня, отмеченная MICHELIN.",
    "source": "MICHELIN-recognised French dining."
  },
  {
    "id": "buffalo-bar",
    "locale": "ru",
    "description": "Коктейли под Деревней наследия.",
    "source": "Cocktails beneath the Heritage Village."
  },
  {
    "id": "wine-cellar",
    "locale": "ru",
    "description": "Редкие винтажи в потайной комнате.",
    "source": "Rare vintages in a hidden room."
  },
  {
    "id": "tingara",
    "locale": "ru",
    "description": "Закатные напитки над горизонтом.",
    "source": "Sunset drinks above the horizon."
  },
  {
    "id": "heritage-village",
    "locale": "ru",
    "description": "Вьетнамские ремёсла и архитектура.",
    "source": "Vietnamese craft and architecture."
  },
  {
    "id": "bensley-gallery",
    "locale": "ru",
    "description": "Смелые, яркие картины Билла Бенсли — архитектора курорта — и ювелирная коллекция Kate McCoy. Открыто ср–вс.",
    "source": "Bold, colourful paintings by Bill Bensley, the architect behind the resort — with Kate McCoy's high-end diamond jewelry. Open Wed–Sun."
  },
  {
    "id": "kate-mccoy",
    "locale": "ru",
    "description": "Современная курортная мода.",
    "source": "Contemporary resort wear."
  },
  {
    "id": "sammys",
    "locale": "ru",
    "description": "Избранные вещи и сувениры.",
    "source": "Curated pieces and keepsakes."
  },
  {
    "id": "terra-mare",
    "locale": "ru",
    "description": "Земля и море, весь день.",
    "source": "Land and sea, all day long."
  },
  {
    "id": "b-lounge",
    "locale": "ru",
    "description": "Послеобеденный чай среди деревьев.",
    "source": "Afternoon tea in the trees."
  },
  {
    "id": "long-bar",
    "locale": "ru",
    "description": "Длинная линия над джунглями.",
    "source": "The long line above the jungle."
  },
  {
    "id": "soar-gym",
    "locale": "ru",
    "description": "Тренировки под пологом леса.",
    "source": "Train inside the canopy."
  },
  {
    "id": "yoga-pavilion",
    "locale": "ru",
    "description": "Дыхание среди листвы.",
    "source": "Breath among the leaves."
  },
  {
    "id": "long-pool",
    "locale": "ru",
    "description": "Зелёная вода, бесконечная длина.",
    "source": "Green water, endless length."
  },
  {
    "id": "planet-trekkers",
    "locale": "ru",
    "description": "Мир для юных исследователей.",
    "source": "A world for younger explorers."
  },
  {
    "id": "family-pool",
    "locale": "ru",
    "description": "Мелко, в тени, вместе.",
    "source": "Shallow, shaded, together."
  },
  {
    "id": "kids-pool",
    "locale": "ru",
    "description": "Маленькая вода для маленьких гостей.",
    "source": "Small water for small guests."
  },
  {
    "id": "garden-jacuzzi",
    "locale": "ru",
    "description": "Тёплая вода в зелени.",
    "source": "Warm water in the vegetation."
  },
  {
    "id": "nail-hair",
    "locale": "ru",
    "description": "Тихий уход между купаниями.",
    "source": "Quiet care between swims."
  },
  {
    "id": "nursery",
    "locale": "ru",
    "description": "Забота о самых маленьких гостях.",
    "source": "Care for the youngest guests."
  },
  {
    "id": "organic-garden",
    "locale": "ru",
    "description": "Там, где начинается кухня.",
    "source": "Where the kitchens begin."
  },
  {
    "id": "dia-tang",
    "locale": "ru",
    "description": "Пауза на склоне холма.",
    "source": "A pause in the hillside."
  },
  {
    "id": "mi-sol-spa",
    "locale": "ru",
    "description": "Звук. Тишина. Обновление.",
    "source": "Sound. Stillness. Renewal."
  },
  {
    "id": "marine-centre",
    "locale": "ru",
    "description": "Водные виды спорта и занятия с инструктором вдоль побережья.",
    "source": "Water sports and guided activities along the shoreline."
  },
  {
    "id": "coconut-beach",
    "locale": "ru",
    "description": "На краю Шонча.",
    "source": "At the edge of Son Tra."
  },
  {
    "id": "family-beach",
    "locale": "ru",
    "description": "Мягкий песок, спокойная вода.",
    "source": "Soft sand, calm water."
  },
  {
    "id": "club-beach",
    "locale": "ru",
    "description": "Приватный берег для гостей Club.",
    "source": "Private shoreline for Club guests."
  },
  {
    "id": "spa-lagoon-villas",
    "locale": "ru",
    "description": "Сон у неподвижной воды.",
    "source": "Sleep beside still water."
  },
  {
    "id": "sea-experiences",
    "locale": "ru",
    "description": "Парусный рассвет и тихие погружения.",
    "source": "Sunrise sailing and quiet dives."
  },
  {
    "id": "moulin-rouge",
    "locale": "ru",
    "description": "Пойте весь вечер с семьёй и друзьями в уютном частном клубе с весёлой атмосферой.",
    "source": "Sing the night away with family and friends in a playful private club."
  },
  {
    "id": "relaxation-pavilion",
    "locale": "ru",
    "description": "Тихая смотровая площадка над заливом — самая высокая точка курорта, где можно просто посидеть и спокойно подышать.",
    "source": "A quiet lookout above the bay — the resort's highest place to simply sit and breathe."
  },
  {
    "id": "instagram-spots",
    "locale": "ru",
    "description": "Девять самых фотографируемых мест курорта — от вестибюля до пляжа Coconut.",
    "source": "The nine most photographed places of the resort, from the Reception Hall to Coconut Beach."
  },
  {
    "id": "wall-of-lanterns",
    "locale": "ru",
    "description": "Сияющая стена фонарей Хойана по пути к бассейнам — одно из самых узнаваемых мест курорта для фотографий.",
    "source": "A glowing wall of Hoi An lanterns on the way down to the pools — one of the resort's signature photo spots."
  },
  {
    "id": "hoi-an-digital-tour",
    "locale": "ru",
    "description": "Откройте для себя старый город Хойана во время цифровой экскурсии по историческим улицам и живому наследию.",
    "source": "A guided digital tour through Hoi An’s Old Town, its historic streets and living heritage."
  },
  {
    "id": "nature-discovery-guide",
    "locale": "ru",
    "description": "Познакомьтесь с дикой природой и местными растениями полуострова Шонча в путеводителе курорта по природе.",
    "source": "Meet the wildlife and native plants of Son Tra in the resort’s nature discovery guide."
  },
  {
    "id": "daycation",
    "locale": "ru",
    "description": "Проведите день на курорте: пляж, бассейны и выбор гастрономических или оздоровительных впечатлений.",
    "source": "Spend a day at the resort with beach and pool access and a choice of dining or wellness experiences."
  },
  {
    "id": "things-to-do",
    "locale": "ru",
    "description": "Откройте для себя развлечения курорта и узнайте актуальное расписание мероприятий на день.",
    "source": "Explore the resort’s recreation and discover the current daily activity schedule."
  },
  {
    "id": "destination-experiences",
    "locale": "ru",
    "description": "Откройте для себя Хойан, Дананг и культурные достопримечательности Центрального Вьетнама с советами консьержа курорта.",
    "source": "Explore Hoi An, Da Nang and Central Vietnam’s cultural landmarks with ideas from the resort concierge."
  },
  {
    "id": "nature-experiences",
    "locale": "ru",
    "description": "Откройте для себя лес Шонча, его дикую природу и прогулки с гидом вокруг курорта.",
    "source": "Discover Son Tra’s forest, wildlife and guided nature experiences around the resort."
  },
  {
    "id": "summit-conference-centre",
    "locale": "ru",
    "description": "Пространство на вершине холма для встреч и торжеств с элегантными залами и площадками для разных мероприятий.",
    "source": "A hilltop setting for meetings and celebrations, with elegant halls and versatile event spaces."
  },
  {
    "id": "summit-cinema",
    "locale": "ru",
    "description": "Зал с кожаными креслами в The Summit для фильмов, презентаций и частных кинопоказов.",
    "source": "A leather-seated auditorium for films, presentations and private screenings at The Summit."
  },
  {
    "id": "m-club",
    "locale": "ru",
    "description": "Яркий ночной клуб для частных торжеств со сценой, баром и прилегающим пространством M Privé.",
    "source": "A playful nightclub for private celebrations, with a stage, bar and adjoining M Privé event space."
  },
  {
    "id": "enchanted-holiday",
    "locale": "zh",
    "description": "2026 圣诞 — 节庆住宿，含每日早餐、下午茶、庆祝饮品，以及 Charles 的自然探索之旅。",
    "source": "Christmas 2026 — a festive stay with daily breakfast, Afternoon Tea, celebratory drinks and Charles's nature discovery trail."
  },
  {
    "id": "club-lounge",
    "locale": "zh",
    "description": "海湾之上的私享行政酒廊。",
    "source": "Private lounge above the bay."
  },
  {
    "id": "ihg-one-rewards",
    "locale": "zh",
    "description": "洲际酒店集团的忠诚计划 — 全球累积与礼遇。",
    "source": "The loyalty programme of IHG Hotels & Resorts — earn and enjoy worldwide."
  },
  {
    "id": "bensley-package",
    "locale": "zh",
    "description": "两晚 Heavenly Penthouse 住宿、私人设计导览、Bensley Outsider Gallery 香槟艺术鉴赏及 Heavenly 下午茶。",
    "source": "Two nights in the Heavenly Penthouse, a private Design Tour, Champagne art viewing at the Bensley Outsider Gallery and Heavenly Afternoon Tea."
  },
  {
    "id": "weddings",
    "locale": "zh",
    "description": "在海湾之上许下誓言 — 海滨仪式、定制宴会，以及婚礼专家打造的蜜月时光。",
    "source": "Say 'I do' above the bay — beachfront ceremonies, bespoke receptions and honeymoon moments crafted by our wedding specialists."
  },
  {
    "id": "reception",
    "locale": "zh",
    "description": "接待大厅、礼宾部及行政办公室——在度假村的最高处迎接宾客。",
    "source": "Reception Lobby, Concierge and Executive Office — arrival at the highest point of the resort."
  },
  {
    "id": "penthouses",
    "locale": "zh",
    "description": "峰顶的全景套房。",
    "source": "Panoramic suites at the summit."
  },
  {
    "id": "the-summit",
    "locale": "zh",
    "description": "The Summit 会议中心、礼堂兼电影院及 M Club——举办聚会、放映与庆典的场所。",
    "source": "The Summit Conference Centre, the Auditorium-Cinema and M Club — gatherings, screenings and celebrations."
  },
  {
    "id": "rooms",
    "locale": "zh",
    "description": "Bensley 设计，层层展开。",
    "source": "Bensley design, level by level."
  },
  {
    "id": "sports-centre",
    "locale": "zh",
    "description": "山顶网球场、匹克球场、足球场及休闲运动。",
    "source": "Tennis and pickleball courts, football pitch and mountaintop play."
  },
  {
    "id": "apec-garden",
    "locale": "zh",
    "description": "山脊之上的雕塑之径。",
    "source": "Sculpture along the ridge."
  },
  {
    "id": "nam-tram",
    "locale": "zh",
    "description": "连接四个世界的缆车。",
    "source": "The funicular between the four worlds."
  },
  {
    "id": "information",
    "locale": "zh",
    "description": "礼宾与宾客服务。",
    "source": "Concierge and guest assistance."
  },
  {
    "id": "citron",
    "locale": "zh",
    "description": "悬挂鸟巢包厢中的越南料理。",
    "source": "Vietnamese cuisine in hanging nest pods."
  },
  {
    "id": "la-maison-1888",
    "locale": "zh",
    "description": "米其林认可的法式餐饮。",
    "source": "MICHELIN-recognised French dining."
  },
  {
    "id": "buffalo-bar",
    "locale": "zh",
    "description": "遗产村下方的鸡尾酒。",
    "source": "Cocktails beneath the Heritage Village."
  },
  {
    "id": "wine-cellar",
    "locale": "zh",
    "description": "隐秘酒室中的珍稀年份。",
    "source": "Rare vintages in a hidden room."
  },
  {
    "id": "tingara",
    "locale": "zh",
    "description": "地平线之上的日落饮品。",
    "source": "Sunset drinks above the horizon."
  },
  {
    "id": "heritage-village",
    "locale": "zh",
    "description": "越南工艺与建筑。",
    "source": "Vietnamese craft and architecture."
  },
  {
    "id": "bensley-gallery",
    "locale": "zh",
    "description": "度假建筑师 Bill Bensley 大胆缤纷的画作，以及 Kate McCoy 高端钻石珠宝系列。周三至周日开放。",
    "source": "Bold, colourful paintings by Bill Bensley, the architect behind the resort — with Kate McCoy's high-end diamond jewelry. Open Wed–Sun."
  },
  {
    "id": "kate-mccoy",
    "locale": "zh",
    "description": "当代度假时装。",
    "source": "Contemporary resort wear."
  },
  {
    "id": "sammys",
    "locale": "zh",
    "description": "精选单品与纪念之物。",
    "source": "Curated pieces and keepsakes."
  },
  {
    "id": "terra-mare",
    "locale": "zh",
    "description": "陆与海，全日供应。",
    "source": "Land and sea, all day long."
  },
  {
    "id": "b-lounge",
    "locale": "zh",
    "description": "树影间的下午茶。",
    "source": "Afternoon tea in the trees."
  },
  {
    "id": "long-bar",
    "locale": "zh",
    "description": "丛林之上的悠长线条。",
    "source": "The long line above the jungle."
  },
  {
    "id": "soar-gym",
    "locale": "zh",
    "description": "在树冠之中训练。",
    "source": "Train inside the canopy."
  },
  {
    "id": "yoga-pavilion",
    "locale": "zh",
    "description": "绿叶之间的呼吸。",
    "source": "Breath among the leaves."
  },
  {
    "id": "long-pool",
    "locale": "zh",
    "description": "碧绿池水，绵延不尽。",
    "source": "Green water, endless length."
  },
  {
    "id": "planet-trekkers",
    "locale": "zh",
    "description": "属于小小探险家的世界。",
    "source": "A world for younger explorers."
  },
  {
    "id": "family-pool",
    "locale": "zh",
    "description": "浅水、树荫、共享时光。",
    "source": "Shallow, shaded, together."
  },
  {
    "id": "kids-pool",
    "locale": "zh",
    "description": "为小客人准备的小池。",
    "source": "Small water for small guests."
  },
  {
    "id": "garden-jacuzzi",
    "locale": "zh",
    "description": "绿意之中的温水按摩池。",
    "source": "Warm water in the vegetation."
  },
  {
    "id": "nail-hair",
    "locale": "zh",
    "description": "泳憩之间的静谧护理。",
    "source": "Quiet care between swims."
  },
  {
    "id": "nursery",
    "locale": "zh",
    "description": "照护最年幼的宾客。",
    "source": "Care for the youngest guests."
  },
  {
    "id": "organic-garden",
    "locale": "zh",
    "description": "厨房开始的地方。",
    "source": "Where the kitchens begin."
  },
  {
    "id": "dia-tang",
    "locale": "zh",
    "description": "山坡上的片刻停顿。",
    "source": "A pause in the hillside."
  },
  {
    "id": "mi-sol-spa",
    "locale": "zh",
    "description": "声音。静谧。焕新。",
    "source": "Sound. Stillness. Renewal."
  },
  {
    "id": "marine-centre",
    "locale": "zh",
    "description": "沿海岸开展的水上运动及有向导带领的活动。",
    "source": "Water sports and guided activities along the shoreline."
  },
  {
    "id": "coconut-beach",
    "locale": "zh",
    "description": "山茶半岛的边缘。",
    "source": "At the edge of Son Tra."
  },
  {
    "id": "family-beach",
    "locale": "zh",
    "description": "细软沙滩，平静海水。",
    "source": "Soft sand, calm water."
  },
  {
    "id": "club-beach",
    "locale": "zh",
    "description": "Club 宾客专属海岸。",
    "source": "Private shoreline for Club guests."
  },
  {
    "id": "spa-lagoon-villas",
    "locale": "zh",
    "description": "在静水之畔入眠。",
    "source": "Sleep beside still water."
  },
  {
    "id": "sea-experiences",
    "locale": "zh",
    "description": "日出扬帆与静谧潜水。",
    "source": "Sunrise sailing and quiet dives."
  },
  {
    "id": "moulin-rouge",
    "locale": "zh",
    "description": "在充满欢乐的私人俱乐部，与家人朋友尽情欢唱一整晚。",
    "source": "Sing the night away with family and friends in a playful private club."
  },
  {
    "id": "relaxation-pavilion",
    "locale": "zh",
    "description": "海湾上方宁静的观景处——在度假村的最高处静坐、放松呼吸。",
    "source": "A quiet lookout above the bay — the resort's highest place to simply sit and breathe."
  },
  {
    "id": "instagram-spots",
    "locale": "zh",
    "description": "度假村最受欢迎的九处摄影地点，从接待大厅到 Coconut 海滩。",
    "source": "The nine most photographed places of the resort, from the Reception Hall to Coconut Beach."
  },
  {
    "id": "wall-of-lanterns",
    "locale": "zh",
    "description": "通往泳池的路上，一面璀璨的会安灯笼墙——度假村标志性的摄影地点之一。",
    "source": "A glowing wall of Hoi An lanterns on the way down to the pools — one of the resort's signature photo spots."
  },
  {
    "id": "hoi-an-digital-tour",
    "locale": "zh",
    "description": "通过导览式数字之旅，探索会安古城的历史街巷与鲜活文化遗产。",
    "source": "A guided digital tour through Hoi An’s Old Town, its historic streets and living heritage."
  },
  {
    "id": "nature-discovery-guide",
    "locale": "zh",
    "description": "通过度假村的自然探索指南，认识山茶半岛的野生动物与本地植物。",
    "source": "Meet the wildlife and native plants of Son Tra in the resort’s nature discovery guide."
  },
  {
    "id": "daycation",
    "locale": "zh",
    "description": "在度假村度过美好一天，畅享海滩、泳池，并选择餐饮或康养体验。",
    "source": "Spend a day at the resort with beach and pool access and a choice of dining or wellness experiences."
  },
  {
    "id": "things-to-do",
    "locale": "zh",
    "description": "探索度假村的休闲活动，并查看最新每日活动安排。",
    "source": "Explore the resort’s recreation and discover the current daily activity schedule."
  },
  {
    "id": "destination-experiences",
    "locale": "zh",
    "description": "跟随度假村礼宾团队的推荐，探索会安、岘港及越南中部的文化名胜。",
    "source": "Explore Hoi An, Da Nang and Central Vietnam’s cultural landmarks with ideas from the resort concierge."
  },
  {
    "id": "nature-experiences",
    "locale": "zh",
    "description": "探索山茶半岛的森林、野生动物，以及度假村周边的导览自然体验。",
    "source": "Discover Son Tra’s forest, wildlife and guided nature experiences around the resort."
  },
  {
    "id": "summit-conference-centre",
    "locale": "zh",
    "description": "坐落于山顶的会议与庆典场所，设有典雅大厅及灵活多样的活动空间。",
    "source": "A hilltop setting for meetings and celebrations, with elegant halls and versatile event spaces."
  },
  {
    "id": "summit-cinema",
    "locale": "zh",
    "description": "The Summit 的皮革座椅礼堂，适合电影放映、演讲和私人观影。",
    "source": "A leather-seated auditorium for films, presentations and private screenings at The Summit."
  },
  {
    "id": "m-club",
    "locale": "zh",
    "description": "充满趣味的夜间俱乐部，设有舞台、酒吧及相邻的 M Privé 活动空间，适合私人庆典。",
    "source": "A playful nightclub for private celebrations, with a stage, bar and adjoining M Privé event space."
  }
]
$seed$::jsonb) AS s(id text, locale text, description text, source text)
JOIN public.destinations d ON d.id = s.id
ON CONFLICT (destination_id, locale) DO NOTHING;
COMMIT;
