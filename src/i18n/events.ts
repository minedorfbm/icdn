import type { DestinationEvent } from "@/data/events";
import type { Lang } from "./dictionary";

export const EVENT_TRANSLATIONS: Record<Exclude<Lang, "en">, Record<string, DestinationEvent>> = {
  vi: {
    "Sunday Champagne Brunch": {
      title: "Brunch Chủ nhật cùng Champagne",
      schedule: ["CHỦ NHẬT HẰNG TUẦN", "12:30 – 15:30"],
      description:
        "Thưởng thức tiệc buffet được các đầu bếp tài năng chuẩn bị tinh tế và sử dụng các tiện ích giải trí suốt cả ngày. Giá từ 2.599.000 VND mỗi người, tùy theo gói đồ uống không giới hạn bạn chọn.",
    },
    "Heavenly Afternoon Tea": {
      title: "Trà chiều Heavenly",
      schedule: ["14:30 – 16:30 (THỨ HAI – THỨ BẢY)", "15:30 – 17:00 (CHỦ NHẬT)"],
      description:
        "Thưởng thức trà hảo hạng cùng các món ăn nhẹ hấp dẫn. Nâng tầm trải nghiệm với cocktail hoặc champagne không giới hạn. Để tận hưởng trọn vẹn, hãy đặt bàn Non-La và nâng cấp lên Royal Afternoon Tea, được thiết kế để đánh thức mọi giác quan.",
    },
    "Souvenirs de France Wine Tasting": {
      title: "Thưởng thức rượu vang Souvenirs de France",
      schedule: ["THỨ HAI, THỨ TƯ VÀ THỨ SÁU", "16:00 – 17:00"],
      description:
        "Khám phá những câu chuyện đằng sau các niên vụ vang nổi tiếng tại La Maison 1888. Nước Pháp có biết bao câu chuyện về rượu vang, và các chuyên gia của chúng tôi sẵn lòng kể lại — đồng thời mời bạn nếm thử! Vui lòng đặt chỗ trước 17:00 ngày hôm trước.",
    },
    "Beach BBQ Buffet & Bonfire": {
      title: "Buffet BBQ và lửa trại bên bãi biển",
      schedule: ["THỨ BẢY HẰNG TUẦN", "18:00 – 21:30"],
      description:
        "Cùng chúng tôi đến bãi biển dự tiệc buffet nướng và lửa trại hằng tuần. Các món thịt và hải sản nướng là tâm điểm, đi kèm nhiều món ăn phụ và món tráng miệng hấp dẫn!",
    },
  },
  ru: {
    "Sunday Champagne Brunch": {
      title: "Воскресный бранч с шампанским",
      schedule: ["КАЖДОЕ ВОСКРЕСЕНЬЕ", "12:30 – 15:30"],
      description:
        "Насладитесь изысканным шведским столом от наших талантливых поваров и пользуйтесь инфраструктурой для отдыха весь день. Стоимость — от 2 599 000 VND на человека в зависимости от выбранного пакета безлимитных напитков.",
    },
    "Heavenly Afternoon Tea": {
      title: "Послеобеденный чай Heavenly",
      schedule: ["14:30 – 16:30 (ПОНЕДЕЛЬНИК – СУББОТА)", "15:30 – 17:00 (ВОСКРЕСЕНЬЕ)"],
      description:
        "Насладитесь отборными чаями и аппетитными закусками. Дополните впечатления безлимитными коктейлями или шампанским. Для особенного удовольствия забронируйте один из столиков Non-La и выберите Royal Afternoon Tea — чаепитие, созданное для наслаждения всеми чувствами.",
    },
    "Souvenirs de France Wine Tasting": {
      title: "Дегустация вин Souvenirs de France",
      schedule: ["ПОНЕДЕЛЬНИК, СРЕДА И ПЯТНИЦА", "16:00 – 17:00"],
      description:
        "Откройте истории знаменитых винтажей в La Maison 1888. Франция хранит множество винных историй, которыми наши сомелье с удовольствием поделятся — и предложат попробовать их на вкус! Бронирование необходимо до 17:00 накануне.",
    },
    "Beach BBQ Buffet & Bonfire": {
      title: "Барбекю-буфет и костёр на пляже",
      schedule: ["КАЖДУЮ СУББОТУ", "18:00 – 21:30"],
      description:
        "Присоединяйтесь к нашему еженедельному барбекю-буфету и вечеру у костра на пляже. Мясо и морепродукты на гриле — главные блюда вечера, дополненные аппетитными гарнирами и десертами!",
    },
  },
  zh: {
    "Sunday Champagne Brunch": {
      title: "周日香槟早午餐",
      schedule: ["每周日", "12:30 – 15:30"],
      description:
        "享用由才华横溢的厨师精心准备的自助餐，并全天使用休闲设施。每位价格从 2,599,000 越南盾起，具体取决于您选择的畅饮套餐。",
    },
    "Heavenly Afternoon Tea": {
      title: "Heavenly 下午茶",
      schedule: ["14:30 – 16:30（周一至周六）", "15:30 – 17:00（周日）"],
      description:
        "品尝优质茶饮与精致小点，搭配畅饮鸡尾酒或香槟，让体验更上一层楼。想要尽享奢华，可预订 Non-La 餐桌并升级至 Royal Afternoon Tea，唤醒每一种感官。",
    },
    "Souvenirs de France Wine Tasting": {
      title: "Souvenirs de France 葡萄酒品鉴",
      schedule: ["周一、周三及周五", "16:00 – 17:00"],
      description:
        "在 La Maison 1888 探索著名年份佳酿背后的故事。法国拥有无数葡萄酒故事，我们的侍酒师乐于与您分享，并邀请您亲自品尝！请于前一天 17:00 前预订。",
    },
    "Beach BBQ Buffet & Bonfire": {
      title: "海滩烧烤自助餐与篝火晚会",
      schedule: ["每周六", "18:00 – 21:30"],
      description:
        "欢迎来到海滩，参加每周举行的烧烤自助餐与篝火晚会。烤肉与海鲜是当晚的主角，另有丰富诱人的配菜和甜点！",
    },
  },
};
