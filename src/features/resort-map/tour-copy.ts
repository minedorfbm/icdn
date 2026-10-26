import type { Lang } from "@/i18n/dictionary";
const languageIndex = { en: 0, vi: 1, ru: 2, zh: 3, ko: 4, ja: 5 } as const;
export const BENSLEY_TOUR_SOURCE =
  "https://www.danang.intercontinental.com/bensley-digital-design-tour/";
const copy = {
  backToMap: ["Back to map", "Về bản đồ", "К карте", "返回地图", "지도로 돌아가기", "マップに戻る"],
  source: [
    "Official design tour",
    "Hành trình thiết kế chính thức",
    "Официальный дизайн-тур",
    "官方设计导览",
    "공식 디자인 투어",
    "公式デザインツアー",
  ],
} satisfies Record<string, readonly [string, string, string, string, string, string]>;
export const tourCopy = (lang: Lang, key: keyof typeof copy): string =>
  copy[key][languageIndex[lang]];
