export const LANGUAGES = [
  { code: "en", label: "EN", name: "English" },
  { code: "vi", label: "VI", name: "Tiếng Việt" },
  { code: "ru", label: "RU", name: "Русский" },
  { code: "zh", label: "中文", name: "简体中文" },
] as const;

export type Lang = (typeof LANGUAGES)[number]["code"];

export type UIKey =
  | "hero_kicker"
  | "hero_title_1"
  | "hero_title_2"
  | "hero_sub"
  | "places"
  | "swipe_hint"
  | "tap_hint"
  | "footer_title"
  | "footer_credit"
  | "back"
  | "back_journey"
  | "level"
  | "category"
  | "area"
  | "instagram"
  | "concierge"
  | "language"
  | "events"
  | "explore_more"
  | "instagram_spot"
  | "latest_post"
  | "view_on_instagram";

export const UI: Record<Lang, Record<UIKey, string>> = {
  en: {
    hero_kicker: "SUN PENINSULA · DA NANG",
    hero_title_1: "Begin",
    hero_title_2: "the Descent",
    hero_sub: "FROM HEAVEN TO SEA",
    places: "PLACES",
    swipe_hint: "SWIPE →",
    tap_hint: "TAP TO OPEN",
    footer_title: "All of InterContinental Danang",
    footer_credit: "DIGITAL EXPERIENCE BY ART DIGITAL JOURNEY",
    back: "BACK",
    back_journey: "BACK TO THE JOURNEY",
    level: "LEVEL",
    category: "CATEGORY",
    area: "AREA",
    instagram: "INSTAGRAM",
    concierge: "Call concierge",
    language: "Language",
    events: "SIGNATURE EVENTS",
    explore_more: "EXPLORE MORE",
    instagram_spot: "INSTAGRAM SPOT",
    latest_post: "LATEST POST",
    view_on_instagram: "VIEW ON INSTAGRAM",
  },
  vi: {
    hero_kicker: "BÁN ĐẢO SƠN TRÀ · ĐÀ NẴNG",
    hero_title_1: "Bắt đầu",
    hero_title_2: "hành trình xuống biển",
    hero_sub: "TỪ THIÊN ĐƯỜNG ĐẾN BIỂN CẢ",
    places: "ĐIỂM ĐẾN",
    swipe_hint: "VUỐT →",
    tap_hint: "CHẠM ĐỂ MỞ",
    footer_title: "Toàn cảnh InterContinental Danang",
    footer_credit: "TRẢI NGHIỆM SỐ BỞI ART DIGITAL JOURNEY",
    back: "QUAY LẠI",
    back_journey: "TRỞ VỀ HÀNH TRÌNH",
    level: "TẦNG",
    category: "HẠNG MỤC",
    area: "KHU VỰC",
    instagram: "INSTAGRAM",
    concierge: "Gọi bộ phận hỗ trợ khách",
    language: "Ngôn ngữ",
    events: "SỰ KIỆN ĐẶC SẮC",
    explore_more: "KHÁM PHÁ THÊM",
    instagram_spot: "ĐIỂM CHỤP HÌNH",
    latest_post: "BÀI ĐĂNG MỚI NHẤT",
    view_on_instagram: "XEM TRÊN INSTAGRAM",
  },
  ru: {
    hero_kicker: "ПОЛУОСТРОВ ШОНЧА · ДАНАНГ",
    hero_title_1: "Начните",
    hero_title_2: "спуск",
    hero_sub: "С НЕБЕС К МОРЮ",
    places: "МЕСТ",
    swipe_hint: "СВАЙП →",
    tap_hint: "НАЖМИТЕ, ЧТОБЫ ОТКРЫТЬ",
    footer_title: "Весь InterContinental Danang",
    footer_credit: "ЦИФРОВОЙ ОПЫТ ОТ ART DIGITAL JOURNEY",
    back: "НАЗАД",
    back_journey: "ВЕРНУТЬСЯ К ПУТЕШЕСТВИЮ",
    level: "УРОВЕНЬ",
    category: "КАТЕГОРИЯ",
    area: "ЗОНА",
    instagram: "INSTAGRAM",
    concierge: "Позвонить консьержу",
    language: "Язык",
    events: "ФИРМЕННЫЕ СОБЫТИЯ",
    explore_more: "УЗНАТЬ БОЛЬШЕ",
    instagram_spot: "ФОТОЗОНА",
    latest_post: "ПОСЛЕДНЯЯ ПУБЛИКАЦИЯ",
    view_on_instagram: "СМОТРЕТЬ В INSTAGRAM",
  },
  zh: {
    hero_kicker: "山茶半岛 · 岘港",
    hero_title_1: "开启",
    hero_title_2: "向海之旅",
    hero_sub: "自天境至海洋",
    places: "个场所",
    swipe_hint: "滑动 →",
    tap_hint: "轻触查看",
    footer_title: "岘港洲际度假酒店全览",
    footer_credit: "数字体验由 ART DIGITAL JOURNEY 呈现",
    back: "返回",
    back_journey: "返回旅程",
    level: "层级",
    category: "类别",
    area: "区域",
    instagram: "INSTAGRAM",
    concierge: "联系礼宾服务",
    language: "语言",
    events: "特色活动",
    explore_more: "了解更多",
    instagram_spot: "打卡点",
    latest_post: "最新帖子",
    view_on_instagram: "在 INSTAGRAM 查看",
  },
};

/** Level taglines (titles stay in English as resort signage). */
export const LEVEL_LINE: Record<Lang, Record<string, string>> = {
  en: {
    heaven: "Above the bay.",
    sky: "Where the horizon opens.",
    earth: "Where the resort comes alive.",
    sea: "Where everything slows down.",
  },
  vi: {
    heaven: "Phía trên vịnh biển.",
    sky: "Nơi chân trời mở ra.",
    earth: "Nơi khu nghỉ dưỡng bừng sống.",
    sea: "Nơi mọi thứ chậm lại.",
  },
  ru: {
    heaven: "Над заливом.",
    sky: "Где открывается горизонт.",
    earth: "Где курорт оживает.",
    sea: "Где всё замедляется.",
  },
  zh: {
    heaven: "海湾之上。",
    sky: "视野豁然开阔之处。",
    earth: "度假村的生活中心。",
    sea: "一切慢下来的地方。",
  },
};

/** Cluster tabs on the Earth level. */
export const CLUSTER: Record<Lang, Record<string, string>> = {
  en: { EAT: "EAT", MOVE: "MOVE", PLAY: "PLAY" },
  vi: { EAT: "ẨM THỰC", MOVE: "VẬN ĐỘNG", PLAY: "VUI CHƠI" },
  ru: { EAT: "ЕДА", MOVE: "ДВИЖЕНИЕ", PLAY: "ОТДЫХ" },
  zh: { EAT: "餐饮", MOVE: "运动", PLAY: "玩乐" },
};

/** Content categories. */
export const TYPE_LABEL: Record<Lang, Record<string, string>> = {
  en: {
    restaurant: "RESTAURANT",
    bar: "BAR",
    spa: "SPA",
    experience: "EXPERIENCE",
    pool: "POOL",
    fitness: "FITNESS",
    kids: "KIDS",
    retail: "RETAIL",
    gallery: "GALLERY",
    accommodation: "ACCOMMODATION",
    service: "SERVICE",
    beach: "BEACH",
    recreation: "RECREATION",
  },
  vi: {
    restaurant: "NHÀ HÀNG",
    bar: "QUẦY BAR",
    spa: "SPA",
    experience: "TRẢI NGHIỆM",
    pool: "HỒ BƠI",
    fitness: "THỂ HÌNH",
    kids: "TRẺ EM",
    retail: "MUA SẮM",
    gallery: "TRIỂN LÃM",
    accommodation: "LƯU TRÚ",
    service: "DỊCH VỤ",
    beach: "BÃI BIỂN",
    recreation: "GIẢI TRÍ",
  },
  ru: {
    restaurant: "РЕСТОРАН",
    bar: "БАР",
    spa: "СПА",
    experience: "ВПЕЧАТЛЕНИЕ",
    pool: "БАССЕЙН",
    fitness: "ФИТНЕС",
    kids: "ДЕТЯМ",
    retail: "БУТИК",
    gallery: "ГАЛЕРЕЯ",
    accommodation: "ПРОЖИВАНИЕ",
    service: "СЕРВИС",
    beach: "ПЛЯЖ",
    recreation: "АКТИВНОСТИ",
  },
  zh: {
    restaurant: "餐厅",
    bar: "酒吧",
    spa: "水疗",
    experience: "体验",
    pool: "泳池",
    fitness: "健身",
    kids: "亲子",
    retail: "精品店",
    gallery: "艺廊",
    accommodation: "住宿",
    service: "服务",
    beach: "海滩",
    recreation: "休闲",
  },
};

/** Level names used in the detail sheet. */
export const LEVEL_LABEL: Record<Lang, Record<string, string>> = {
  en: { heaven: "HEAVEN", sky: "SKY", earth: "EARTH", sea: "SEA" },
  vi: { heaven: "THIÊN ĐƯỜNG", sky: "TRỜI", earth: "ĐẤT", sea: "BIỂN" },
  ru: { heaven: "НЕБЕСА", sky: "НЕБО", earth: "ЗЕМЛЯ", sea: "МОРЕ" },
  zh: { heaven: "天境", sky: "天空", earth: "大地", sea: "海洋" },
};

/** Call-to-action labels. */
export const ACTION: Record<Lang, Record<string, string>> = {
  en: {
    DISCOVER: "DISCOVER",
    MENU: "MENU",
    PRICE_LIST: "PRICE LIST",
    VEGETARIAN_MENU: "VEGETARIAN MENU",
    VEGAN_MENU: "VEGAN MENU",
    BREAKFAST_MENU: "BREAKFAST MENU",
    LUNCH_MENU: "LUNCH MENU",
    DINNER_MENU: "DINNER MENU",
    BOOK: "BOOK",
    TREATMENTS: "TREATMENTS",
    ACTIVITIES: "ACTIVITIES",
    HOURS: "HOURS",
    INFO: "INFO",
    DETAILS: "DETAILS",
    VISIT: "VISIT",
    BROCHURE: "BROCHURE",
  },
  vi: {
    DISCOVER: "KHÁM PHÁ",
    MENU: "THỰC ĐƠN",
    PRICE_LIST: "BẢNG GIÁ",
    VEGETARIAN_MENU: "THỰC ĐƠN CHAY",
    VEGAN_MENU: "THỰC ĐƠN THUẦN CHAY",
    BREAKFAST_MENU: "THỰC ĐƠN SÁNG",
    LUNCH_MENU: "THỰC ĐƠN TRƯA",
    DINNER_MENU: "THỰC ĐƠN TỐI",
    BOOK: "ĐẶT CHỖ",
    TREATMENTS: "LIỆU TRÌNH",
    ACTIVITIES: "HOẠT ĐỘNG",
    HOURS: "GIỜ MỞ CỬA",
    INFO: "THÔNG TIN",
    DETAILS: "CHI TIẾT",
    VISIT: "GHÉ THĂM",
    BROCHURE: "TÀI LIỆU",
  },
  ru: {
    DISCOVER: "ПОДРОБНЕЕ",
    MENU: "МЕНЮ",
    PRICE_LIST: "ПРАЙС-ЛИСТ",
    VEGETARIAN_MENU: "ВЕГЕТАРИАНСКОЕ МЕНЮ",
    VEGAN_MENU: "ВЕГАНСКОЕ МЕНЮ",
    BREAKFAST_MENU: "ЗАВТРАК",
    LUNCH_MENU: "ОБЕДЕННОЕ МЕНЮ",
    DINNER_MENU: "УЖИН",
    BOOK: "ЗАБРОНИРОВАТЬ",
    TREATMENTS: "ПРОЦЕДУРЫ",
    ACTIVITIES: "АКТИВНОСТИ",
    HOURS: "ЧАСЫ РАБОТЫ",
    INFO: "ИНФОРМАЦИЯ",
    DETAILS: "ДЕТАЛИ",
    VISIT: "ПОСЕТИТЬ",
    BROCHURE: "БРОШЮРА",
  },
  zh: {
    DISCOVER: "了解详情",
    MENU: "菜单",
    PRICE_LIST: "价目表",
    VEGETARIAN_MENU: "素食菜单",
    VEGAN_MENU: "纯素菜单",
    BREAKFAST_MENU: "早餐菜单",
    LUNCH_MENU: "午餐菜单",
    DINNER_MENU: "晚餐菜单",
    BOOK: "预订",
    TREATMENTS: "疗程",
    ACTIVITIES: "活动",
    HOURS: "开放时间",
    INFO: "信息",
    DETAILS: "详情",
    VISIT: "前往",
    BROCHURE: "手册",
  },
};

/** Footer link labels. */
export const LINK_LABEL: Record<Lang, Record<string, string>> = {
  en: {
    Website: "Website",
    Instagram: "Instagram",
    Dining: "Dining",
    Spa: "Spa",
    "IHG One Rewards": "IHG One Rewards",
    "Resort Map": "Resort Map",
    Contact: "Contact",
  },
  vi: {
    Website: "Trang chính thức",
    Instagram: "Instagram",
    Dining: "Ẩm thực",
    Spa: "Spa",
    "IHG One Rewards": "IHG One Rewards",
    "Resort Map": "Bản đồ khu nghỉ",
    Contact: "Liên hệ",
  },
  ru: {
    Website: "Сайт",
    Instagram: "Instagram",
    Dining: "Рестораны",
    Spa: "Спа",
    "IHG One Rewards": "IHG One Rewards",
    "Resort Map": "Карта курорта",
    Contact: "Контакты",
  },
  zh: {
    Website: "官方网站",
    Instagram: "Instagram",
    Dining: "餐饮",
    Spa: "水疗",
    "IHG One Rewards": "IHG 优悦会",
    "Resort Map": "度假村地图",
    Contact: "联系我们",
  },
};
