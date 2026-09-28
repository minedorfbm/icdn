import type { Lang } from "@/i18n/dictionary";
const languageIndex: Record<Lang, number> = { en: 0, vi: 1, ru: 2, zh: 3, ko: 4, ja: 5 };
const copy = {
  search: ["Search", "Tìm kiếm", "Поиск", "搜索", "검색", "検索"],
  title: [
    "Find your next discovery",
    "Tìm trải nghiệm tiếp theo",
    "Найдите новое открытие",
    "发现下一段精彩",
    "새로운 발견을 찾아보세요",
    "次の発見を探す",
  ],
  placeholder: [
    "A place, an activity…",
    "Địa điểm, hoạt động…",
    "Место, занятие…",
    "地点、活动…",
    "장소, 액티비티…",
    "場所、アクティビティ…",
  ],
  clear: [
    "Clear search",
    "Xóa tìm kiếm",
    "Очистить поиск",
    "清除搜索",
    "검색어 지우기",
    "検索をクリア",
  ],
  results: ["Results", "Kết quả", "Результаты", "搜索结果", "검색 결과", "検索結果"],
  empty: [
    "No places found",
    "Không tìm thấy địa điểm",
    "Места не найдены",
    "未找到地点",
    "검색 결과가 없습니다",
    "該当する場所がありません",
  ],
  hint: [
    "Try another name or browse all collections.",
    "Thử tên khác hoặc xem tất cả bộ sưu tập.",
    "Попробуйте другое название или откройте все подборки.",
    "请尝试其他名称或浏览所有分类。",
    "다른 이름으로 검색하거나 모든 카테고리를 둘러보세요.",
    "別の名前で検索するか、すべてのカテゴリーをご覧ください。",
  ],
  dining: [
    "Restaurants & bars",
    "Nhà hàng & quầy bar",
    "Рестораны и бары",
    "餐厅与酒吧",
    "레스토랑 & 바",
    "レストラン＆バー",
  ],
  wellness: [
    "Spa, movement & relaxation",
    "Spa, vận động & thư giãn",
    "Спа, движение и отдых",
    "水疗、运动与放松",
    "스파, 운동 & 휴식",
    "スパ・運動・リラクゼーション",
  ],
  experiences: [
    "Art, nature & activities",
    "Nghệ thuật, thiên nhiên & hoạt động",
    "Искусство, природа и развлечения",
    "艺术、自然与活动",
    "예술, 자연 & 액티비티",
    "アート・自然・アクティビティ",
  ],
} satisfies Record<string, readonly [string, string, string, string, string, string]>;
export const searchCopy = (lang: Lang, key: keyof typeof copy): string =>
  copy[key][languageIndex[lang]]!;
