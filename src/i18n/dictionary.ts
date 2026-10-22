import uiDict from "./dictionary.ui.json";
import koDict from "./dictionary.ko.json";
import jaDict from "./dictionary.ja.json";

export const LANGUAGES = [
  { code: "en", label: "EN", name: "English" },
  { code: "vi", label: "VI", name: "Tiếng Việt" },
  { code: "ru", label: "RU", name: "Русский" },
  { code: "zh", label: "中文", name: "简体中文" },
  { code: "ko", label: "KO", name: "한국어" },
  { code: "ja", label: "JA", name: "日本語" },
] as const;

export type Lang = (typeof LANGUAGES)[number]["code"];

export type UIKey =
  | "not_found_title"
  | "not_found_body"
  | "error_page_title"
  | "error_page_body"
  | "go_home"
  | "in_motion"
  | "from_our_world"
  | "related_places"
  | "continue_journey"
  | "previous_discovery"
  | "practical_information"
  | "dining_collection"
  | "wellness_collection"
  | "spa_collection"
  | "links_collection"
  | "destination_updates"
  | "opening_hours"
  | "hours_opening"
  | "hours_breakfast"
  | "hours_lunch"
  | "hours_afternoon_tea"
  | "hours_dinner"
  | "hours_drinks"
  | "hours_food"
  | "hours_24"
  | "hours_daily"
  | "hours_last_order"
  | "hours_local"
  | "hero_welcome"
  | "hero_kicker"
  | "hero_title_1"
  | "hero_title_2"
  | "hero_sub"
  | "places"
  | "all_places"
  | "collections"
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
  | "contact_call"
  | "contact_unavailable"
  | "language"
  | "events"
  | "explore_more"
  | "instagram_spot"
  | "latest_post"
  | "latest_posts"
  | "videos"
  | "play_video"
  | "view_on_instagram"
  | "resort_levels"
  | "photo"
  | "close"
  | "open_browser"
  | "content_unavailable"
  | "retry"
  | "page_loading"
  | "pdf_error"
  | "pdf_page"
  | "pdf_zoom_in"
  | "pdf_zoom_out"
  | "hero_image_alt";

export const UI: Record<Lang, Record<UIKey, string>> = uiDict;

/** Level taglines (titles stay in English as resort signage). */
export const LEVEL_LINE: Record<Lang, Record<string, string>> = {
  en: {
    heaven: "Views to remember.",
    sky: "Open horizons.",
    earth: "A world to explore.",
    sea: "By the water.",
  },
  vi: {
    heaven: "Những khung cảnh khó quên.",
    sky: "Chân trời rộng mở.",
    earth: "Một thế giới để khám phá.",
    sea: "Bên làn nước.",
  },
  ru: {
    heaven: "Виды, которые запомнятся.",
    sky: "Открытые горизонты.",
    earth: "Мир для открытий.",
    sea: "У воды.",
  },
  zh: {
    heaven: "难忘的风景。",
    sky: "开阔的天际。",
    earth: "探索一方天地。",
    sea: "水畔时光。",
  },
  ko: koDict.LEVEL_LINE,
  ja: jaDict.LEVEL_LINE,
};

/** Editorial groups within each resort level. */
export const CLUSTER: Record<Lang, Record<string, string>> = {
  en: {
    DINING: "DINING",
    EXPERIENCES: "EXPERIENCES",
    STAY: "STAY",
    DISCOVER: "DISCOVER",
    GATHER: "GATHER",
    WELLNESS: "WELLNESS",
    DINE: "DINE",
    EAT: "EAT",
    MOVE: "MOVE",
    FAMILY: "FAMILY",
    BEACH: "BEACH",
    PLAY: "PLAY",
    OTHER: "MORE",
  },
  vi: {
    DINING: "ẨM THỰC",
    EXPERIENCES: "TRẢI NGHIỆM",
    STAY: "LƯU TRÚ",
    DISCOVER: "KHÁM PHÁ",
    GATHER: "GẶP GỠ",
    WELLNESS: "THƯ GIÃN",
    DINE: "ẨM THỰC",
    EAT: "ẨM THỰC",
    MOVE: "VẬN ĐỘNG",
    FAMILY: "GIA ĐÌNH",
    BEACH: "BÃI BIỂN",
    PLAY: "VUI CHƠI",
    OTHER: "KHÁC",
  },
  ru: {
    DINING: "РЕСТОРАНЫ",
    EXPERIENCES: "ВПЕЧАТЛЕНИЯ",
    STAY: "ПРОЖИВАНИЕ",
    DISCOVER: "ОТКРЫТЬ",
    GATHER: "ВСТРЕЧИ",
    WELLNESS: "РЕЛАКС",
    DINE: "РЕСТОРАНЫ",
    EAT: "ЕДА",
    MOVE: "ДВИЖЕНИЕ",
    FAMILY: "СЕМЬЯ",
    BEACH: "ПЛЯЖ",
    PLAY: "ОТДЫХ",
    OTHER: "ДРУГОЕ",
  },
  zh: {
    DINING: "餐饮",
    EXPERIENCES: "体验",
    STAY: "住宿",
    DISCOVER: "探索",
    GATHER: "欢聚",
    WELLNESS: "康养",
    DINE: "美食",
    EAT: "餐饮",
    MOVE: "运动",
    FAMILY: "亲子",
    BEACH: "海滩",
    PLAY: "玩乐",
    OTHER: "更多",
  },
  ko: koDict.CLUSTER,
  ja: jaDict.CLUSTER,
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
  ko: koDict.TYPE_LABEL,
  ja: jaDict.TYPE_LABEL,
};

/** Resort wayfinding names stay identical to the map in every language. */
const RESORT_LEVEL_NAMES = { heaven: "HEAVEN", sky: "SKY", earth: "EARTH", sea: "SEA" };
export const LEVEL_LABEL: Record<Lang, Record<string, string>> = {
  en: RESORT_LEVEL_NAMES,
  vi: RESORT_LEVEL_NAMES,
  ru: RESORT_LEVEL_NAMES,
  zh: RESORT_LEVEL_NAMES,
  ko: RESORT_LEVEL_NAMES,
  ja: RESORT_LEVEL_NAMES,
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
    DAILY_SCHEDULE: "DAILY SCHEDULE",
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
    DAILY_SCHEDULE: "LỊCH HOẠT ĐỘNG HẰNG NGÀY",
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
    DAILY_SCHEDULE: "РАСПИСАНИЕ НА ДЕНЬ",
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
    DAILY_SCHEDULE: "每日活动安排",
    HOURS: "开放时间",
    INFO: "信息",
    DETAILS: "详情",
    VISIT: "前往",
    BROCHURE: "手册",
  },
  ko: koDict.ACTION,
  ja: jaDict.ACTION,
};

/** Footer link labels. */
export const LINK_LABEL: Record<Lang, Record<string, string>> = {
  en: {
    "Discovery guide": "Discovery guide",
    "Festive programme": "Festive programme",
    "Festive brochure": "Festive brochure",
    "Sculpture guide": "Sculpture guide",
    "A History of Vietnam": "A History of Vietnam",
    "Gallery catalogue": "Gallery catalogue",
    "Download on the App Store": "Download on the App Store",
    "Get it on Google Play": "Get it on Google Play",
    "Nam Tram Dining": "Nam Tram Dining",
    "Floor plan": "Floor plan",
    Benefits: "Benefits",
    Website: "Website",
    Instagram: "Instagram",
    Dining: "Dining",
    Spa: "Spa",
    "IHG One Rewards": "IHG One Rewards",
    "Resort Map": "Resort Map",
    Contact: "Contact",
    "Hoi An shuttle schedule": "Hoi An shuttle schedule",
    "Gourmand Menu": "Gourmand Menu",
  },
  vi: {
    "Discovery guide": "Cẩm nang khám phá",
    "Festive programme": "Chương trình lễ hội",
    "Festive brochure": "Cẩm nang lễ hội",
    "Sculpture guide": "Cẩm nang điêu khắc",
    "A History of Vietnam": "Lịch sử Việt Nam",
    "Gallery catalogue": "Danh mục tác phẩm",
    "Download on the App Store": "Tải về trên App Store",
    "Get it on Google Play": "Tải về trên Google Play",
    "Nam Tram Dining": "Ẩm thực trên Nam Tram",
    "Floor plan": "Sơ đồ mặt bằng",
    Benefits: "Quyền lợi",
    Website: "Trang chính thức",
    Instagram: "Instagram",
    Dining: "Ẩm thực",
    Spa: "Spa",
    "IHG One Rewards": "IHG One Rewards",
    "Resort Map": "Bản đồ khu nghỉ",
    Contact: "Liên hệ",
    "Hoi An shuttle schedule": "Lịch xe đưa đón Hội An",
    "Gourmand Menu": "Thực đơn Gourmand",
  },
  ru: {
    "Discovery guide": "Путеводитель",
    "Festive programme": "Праздничная программа",
    "Festive brochure": "Праздничная брошюра",
    "Sculpture guide": "Путеводитель по скульптурам",
    "A History of Vietnam": "История Вьетнама",
    "Gallery catalogue": "Каталог галереи",
    "Download on the App Store": "Загрузить в App Store",
    "Get it on Google Play": "Скачать в Google Play",
    "Nam Tram Dining": "Ужин на Nam Tram",
    "Floor plan": "План номера",
    Benefits: "Привилегии",
    Website: "Сайт",
    Instagram: "Instagram",
    Dining: "Рестораны",
    Spa: "Спа",
    "IHG One Rewards": "IHG One Rewards",
    "Resort Map": "Карта курорта",
    Contact: "Контакты",
    "Hoi An shuttle schedule": "Расписание шаттла в Хойан",
    "Gourmand Menu": "Меню Gourmand",
  },
  zh: {
    "Discovery guide": "探索指南",
    "Festive programme": "节庆活动安排",
    "Festive brochure": "节庆手册",
    "Sculpture guide": "雕塑导览",
    "A History of Vietnam": "越南历史",
    "Gallery catalogue": "画廊作品目录",
    "Download on the App Store": "在 App Store 下载",
    "Get it on Google Play": "在 Google Play 下载",
    "Nam Tram Dining": "Nam Tram 缆车用餐体验",
    "Floor plan": "平面图",
    Benefits: "专享礼遇",
    Website: "官方网站",
    Instagram: "Instagram",
    Dining: "餐饮",
    Spa: "水疗",
    "IHG One Rewards": "IHG 优悦会",
    "Resort Map": "度假村地图",
    Contact: "联系我们",
    "Hoi An shuttle schedule": "会安接驳车时刻表",
    "Gourmand Menu": "Gourmand 菜单",
  },
  ko: koDict.LINK_LABEL,
  ja: jaDict.LINK_LABEL,
};
