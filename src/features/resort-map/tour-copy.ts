import type { Lang } from "@/i18n/dictionary";
export type TourText = readonly [string, string, string, string, string, string];
const languageIndex = { en: 0, vi: 1, ru: 2, zh: 3, ko: 4, ja: 5 } as const;
export const tourText = (lang: Lang, text: TourText): string => text[languageIndex[lang]];
export const BENSLEY_TOUR_SOURCE =
  "https://www.danang.intercontinental.com/bensley-digital-design-tour/";

const copy = {
  intro: [
    "Discover the stories in Bill Bensley’s design, one place at a time. Begin at Reception and explore at your own pace.",
    "Khám phá những câu chuyện trong thiết kế của Bill Bensley, qua từng địa điểm. Bắt đầu tại Sảnh Lễ tân và khám phá theo nhịp riêng.",
    "Откройте истории дизайна Билла Бенсли, место за местом. Начните у стойки регистрации и двигайтесь в своём темпе.",
    "逐站探索 Bill Bensley 设计背后的故事。从接待大厅出发，按自己的节奏游览。",
    "장소마다 담긴 빌 벤슬리의 디자인 이야기를 만나보세요. 리셉션에서 출발해 나만의 속도로 둘러보세요.",
    "ビル・ベンスリーのデザインに秘められた物語を、一か所ずつ。レセプションから自分のペースで巡りましょう。",
  ],
  selfGuided: [
    "Self-guided discovery",
    "Tự do khám phá",
    "Самостоятельная прогулка",
    "自助探索",
    "자유롭게 둘러보기",
    "セルフガイドツアー",
  ],
  start: [
    "Start at Reception",
    "Bắt đầu tại Sảnh Lễ tân",
    "Начать у стойки регистрации",
    "从接待大厅出发",
    "리셉션에서 시작",
    "レセプションから始める",
  ],
  startFallback: [
    "Start the tour",
    "Bắt đầu hành trình",
    "Начать прогулку",
    "开始游览",
    "투어 시작",
    "ツアーを始める",
  ],
  resume: [
    "Resume the tour",
    "Tiếp tục hành trình",
    "Продолжить прогулку",
    "继续游览",
    "투어 이어보기",
    "ツアーを再開",
  ],
  stops: [
    "All stops",
    "Tất cả điểm dừng",
    "Все остановки",
    "所有站点",
    "전체 방문 장소",
    "すべてのスポット",
  ],
  look: [
    "What to look for",
    "Chi tiết đáng chú ý",
    "На что обратить внимание",
    "值得留意的细节",
    "눈여겨볼 것",
    "注目するポイント",
  ],
  mark: [
    "Mark as discovered",
    "Đánh dấu đã khám phá",
    "Отметить как посещённое",
    "标记为已探索",
    "둘러본 장소로 표시",
    "訪問済みにする",
  ],
  marked: ["Discovered", "Đã khám phá", "Посещено", "已探索", "둘러봄", "訪問済み"],
  count: [
    "{done} / {total} places discovered",
    "Đã khám phá {done} / {total} địa điểm",
    "Посещено {done} из {total} мест",
    "已探索 {done} / {total} 个地点",
    "{total}곳 중 {done}곳 둘러봄",
    "{total}か所中{done}か所を訪問",
  ],
  saved: [
    "Progress is saved on this device when browser storage is available.",
    "Tiến độ được lưu trên thiết bị này khi trình duyệt cho phép lưu trữ.",
    "Прогресс сохраняется на этом устройстве, если браузер разрешает хранение данных.",
    "浏览器允许存储时，进度会保存在此设备上。",
    "브라우저 저장이 허용되면 이 기기에 진행 상황이 저장됩니다.",
    "ブラウザーで保存が許可されている場合、この端末に進捗を保存します。",
  ],
  overview: [
    "Tour overview",
    "Tổng quan hành trình",
    "Обзор прогулки",
    "游览概览",
    "투어 전체 보기",
    "ツアー全体を見る",
  ],
  walk: ["Walk", "Đi bộ", "Пешком", "步行", "도보", "徒歩"],
  tram: ["Nam Tram", "Nam Tram", "Nam Tram", "Nam Tram", "Nam Tram", "Nam Tram"],
  source: [
    "Official design tour",
    "Hành trình thiết kế chính thức",
    "Официальный дизайн-тур",
    "官方设计导览",
    "공식 디자인 투어",
    "公式デザインツアー",
  ],
  finish: [
    "You’ve reached the lagoon, the final stop. Return towards Nam Tram when you’re ready.",
    "Bạn đã đến đầm nước, điểm dừng cuối. Khi sẵn sàng, hãy quay về phía Nam Tram.",
    "Вы у лагуны — последней остановки. Когда будете готовы, возвращайтесь в сторону Nam Tram.",
    "您已抵达最后一站——泻湖。准备好后，请往 Nam Tram 方向返回。",
    "마지막 장소인 라군에 도착했습니다. 준비가 되면 Nam Tram 방향으로 돌아가세요.",
    "最後のスポット、ラグーンに到着です。見学後はNam Tramの方向へお戻りください。",
  ],
  maisonAccess: [
    "Historic building · Earth. For current dining arrangements and access, see the venue information.",
    "Tòa nhà lịch sử · Earth. Xem thông tin địa điểm để biết nơi phục vụ và điều kiện ra vào hiện tại.",
    "Историческое здание · Earth. Актуальное место ужина и условия доступа указаны в информации о заведении.",
    "历史建筑 · Earth。当前用餐安排及开放情况请查看场所信息。",
    "역사적 건물 · Earth. 현재 식사 장소와 출입 안내는 장소 정보를 확인하세요.",
    "歴史ある建物・Earth。現在の食事会場と入場については施設情報をご確認ください。",
  ],
  details: [
    "Venue information",
    "Thông tin địa điểm",
    "Информация о месте",
    "场所信息",
    "장소 정보",
    "施設情報",
  ],
} satisfies Record<string, TourText>;
export type TourCopyKey = keyof typeof copy;
export const tourCopy = (lang: Lang, key: TourCopyKey): string => tourText(lang, copy[key]);
