import type { Lang } from "@/i18n/dictionary";
import { instagramLink } from "@/lib/external-url";

export interface NativeInstagramPost {
  account: string;
  date: string;
  images: string[];
  captions: Record<Lang, string>;
}

// Only complete, publisher-attributed photo carousels recovered from the approved posts.
const posts: Record<string, NativeInstagramPost> = {
  DGwwT3cCPE5: {
    account: "intercontinentaldanang",
    date: "2025-03-04",
    images: [
      "/instagram-posts/DGwwT3cCPE5-1.webp",
      "/instagram-posts/DGwwT3cCPE5-2.webp",
      "/instagram-posts/DGwwT3cCPE5-3.webp",
    ],
    captions: {
      en: "March 2025 at B Lounge: Lady Trieu Gin cocktails, a mixology competition and guest bartender Kata Simon.",
      vi: "Tháng 3/2025 tại B Lounge: cocktail Lady Trieu Gin, cuộc thi pha chế và bartender khách mời Kata Simon.",
      ru: "Март 2025 года в B Lounge: коктейли с Lady Trieu Gin, конкурс миксологов и приглашённый бармен Ката Симон.",
      zh: "2025年3月，B Lounge举办Lady Trieu金酒鸡尾酒活动、调酒比赛，并邀请客座调酒师Kata Simon。",
      ko: "2025년 3월 B Lounge에서 열린 Lady Trieu Gin 칵테일 행사, 믹솔로지 경연과 게스트 바텐더 Kata Simon의 특별한 만남.",
      ja: "2025年3月のB Lounge。Lady Trieu Ginのカクテル、ミクソロジーコンテスト、ゲストバーテンダーKata Simonを迎えたイベント。",
    },
  },
  DL9jFzytrOp: {
    account: "lamaison1888",
    date: "2025-07-11",
    images: ["/instagram-posts/DL9jFzytrOp-1.webp", "/instagram-posts/DL9jFzytrOp-2.webp"],
    captions: {
      en: "Begin or wind down your evening at Buffalo Bar, with a drink and an atmosphere worth lingering over.",
      vi: "Bắt đầu hoặc khép lại buổi tối tại Buffalo Bar, thưởng thức đồ uống trong không gian khiến bạn muốn nán lại.",
      ru: "Начните или завершите вечер в Buffalo Bar — за напитком в атмосфере, в которой хочется задержаться.",
      zh: "在Buffalo Bar开启或结束夜晚，品一杯饮品，享受令人流连的氛围。",
      ko: "Buffalo Bar에서 한 잔과 함께 저녁을 시작하거나 마무리하며 오래 머물고 싶은 분위기를 즐겨보세요.",
      ja: "Buffalo Barで夜の始まりや締めくくりを。ドリンクとともに、ゆっくり過ごしたくなる雰囲気をお楽しみください。",
    },
  },
  DMPkp9hM_nP: {
    account: "lamaison1888",
    date: "2025-07-18",
    images: ["/instagram-posts/DMPkp9hM_nP-1.webp", "/instagram-posts/DMPkp9hM_nP-2.webp"],
    captions: {
      en: "Meet Toan Nguyen, awarded the Michelin Guide Sommelier Award in 2024, whose thoughtful pairings enrich the La Maison 1888 experience.",
      vi: "Gặp gỡ Toan Nguyen, người nhận giải Sommelier Award của Michelin Guide năm 2024, với những kết hợp rượu và món ăn tinh tế tại La Maison 1888.",
      ru: "Знакомьтесь: Тоан Нгуен, обладатель награды Michelin Guide Sommelier Award 2024 года. Его продуманные сочетания вин и блюд дополняют впечатления от La Maison 1888.",
      zh: "认识Toan Nguyen：2024年米其林指南侍酒师奖得主，以精心设计的餐酒搭配丰富La Maison 1888的用餐体验。",
      ko: "2024년 미쉐린 가이드 소믈리에 어워드를 수상한 Toan Nguyen을 만나보세요. 세심한 와인 페어링으로 La Maison 1888의 미식 경험을 더합니다.",
      ja: "2024年ミシュランガイドのソムリエアワードを受賞したToan Nguyen。心を込めたペアリングがLa Maison 1888での食体験を豊かにします。",
    },
  },
};

export function nativeInstagramPost(url: string): NativeInstagramPost | undefined {
  const safe = instagramLink(url);
  if (!safe) return undefined;
  const match = /^\/(?:p|reel)\/([A-Za-z0-9_-]+)\/?$/.exec(new URL(safe).pathname);
  return match ? posts[match[1] ?? ""] : undefined;
}
