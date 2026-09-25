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
  | "page_loading"
  | "hero_image_alt";

export const UI: Record<Lang, Record<UIKey, string>> = uiDict;

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

/** Level names used in the detail sheet. */
export const LEVEL_LABEL: Record<Lang, Record<string, string>> = {
  en: { heaven: "HEAVEN", sky: "SKY", earth: "EARTH", sea: "SEA" },
  vi: { heaven: "THIÊN ĐƯỜNG", sky: "TRỜI", earth: "ĐẤT", sea: "BIỂN" },
  ru: { heaven: "НЕБЕСА", sky: "НЕБО", earth: "ЗЕМЛЯ", sea: "МОРЕ" },
  zh: { heaven: "天境", sky: "天空", earth: "大地", sea: "海洋" },
  ko: koDict.LEVEL_LABEL,
  ja: jaDict.LEVEL_LABEL,
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
  ko: koDict.ACTION,
  ja: jaDict.ACTION,
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
  ko: koDict.LINK_LABEL,
  ja: jaDict.LINK_LABEL,
};
