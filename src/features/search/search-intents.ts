/** Shared vocabulary; destination assignments are edited in destinations.search_keywords. */
export const SEARCH_INTENTS = {
  dining:
    "dining|restaurant|restaurants|resto|food|eat|eating|manger|cuisine|repas|nhà hàng|ăn uống|ресторан|рестораны|поесть|餐厅|餐飲|餐饮|吃饭|レストラン|食事|레스토랑|식사",
  japanese:
    "japanese|japan|japonais|japonaise|japonaises|japon|teppanyaki|日本料理|日本餐厅|日料|和食|日本食|일식|일본 요리|nhật bản|món nhật|японский|японская|японской",
  french:
    "french|français|française|francais|francaise|françaises|món pháp|ẩm thực pháp|французский|французская|法餐|法国菜|フレンチ|フランス料理|프렌치|프랑스 요리",
  vietnamese:
    "vietnamese|vietnamien|vietnamienne|vietnamiennes|món việt|ẩm thực việt|вьетнамский|вьетнамская|越南菜|ベトナム料理|베트남 요리",
  italian:
    "italian|italien|italienne|italiennes|pizza|pasta|pâtes|món ý|ẩm thực ý|итальянский|итальянская|пицца|意大利菜|披萨|イタリア料理|ピザ|이탈리아 요리|피자",
  seafood: "seafood|fruits de mer|hải sản|морепродукты|海鲜|海鮮|シーフード|해산물",
  breakfast: "breakfast|petit déjeuner|petit dejeuner|ăn sáng|bữa sáng|завтрак|早餐|朝食|조식",
  tea: "afternoon tea|tea time|high tea|goûter|gouter|thé|trà chiều|чаепитие|послеобеденный чай|下午茶|アフタヌーンティー|애프터눈 티",
  dinner:
    "dinner|dining evening|dîner|diner|dîner ce soir|ăn tối|bữa tối|ужин|поужинать|晚餐|晚饭|ディナー|夕食|저녁 식사",
  drinks:
    "drinks|drink|bar|bars|cocktail|cocktails|aperitif|apéro|apero|boire un verre|prendre un verre|uống gì đó|đồ uống|quầy bar|коктейль|коктейли|выпить|бар|喝一杯|鸡尾酒|酒吧|カクテル|一杯飲む|칵테일|술 한잔",
  wine: "wine|wines|vin|vins|sommelier|rượu vang|вино|вина|葡萄酒|红酒|ワイン|와인",
  relax:
    "relax|relaxing|relaxation|unwind|calm|quiet|peaceful|calme|repos|reposer|détente|détendre|se détendre|ressourcer|thư giãn|yên tĩnh|отдых|расслабиться|спокойствие|放松|安静|くつろぐ|リラックス|リラックスしたい|휴식|힐링|쉬고 싶어요",
  romantic:
    "romantic|romance|romantique|romantiques|en amoureux|en couple|date night|lãng mạn|hẹn hò|романтика|романтический|романтическая|романтического|浪漫|约会|ロマンチック|デート|로맨틱|데이트",
  family:
    "family|families|kids|children|child|with kids|famille|familial|enfants|enfant|avec les enfants|gia đình|trẻ em|семья|семейный|семьей|с детьми|дети|детей|亲子|家庭|孩子|家族|子供|子ども|가족|아이들과|어린이",
  rain: "rainy day|rainy|rain|indoors|indoor|bad weather|il pleut|pluie|mauvais temps|intérieur|intérieure|trời mưa|trong nhà|дождь|в дождь|дождливый день|下雨|雨天|室内|雨の日|실내|비 오는 날",
  spa: "spa|massage|massages|soin|soins|treatment|treatments|wellness|bien être|bien etre|chăm sóc sức khỏe|mát xa|массаж|спа|水疗|按摩|スパ|マッサージ|스파|마사지",
  beauty:
    "beauty|manicure|pedicure|nails|hair|coiffure|ongles|manucure|pédicure|làm đẹp|làm móng|маникюр|педикюр|美甲|美发|ネイル|ヘアケア|네일|헤어",
  swim: "swim|swimming|pool|pools|piscine|piscines|nager|baignade|bơi|hồ bơi|плавание|бассейн|поплавать|泳池|游泳|プール|泳ぐ|수영|수영장",
  beach: "beach|beaches|seaside|plage|plages|bord de mer|bãi biển|пляж|пляже|海滩|沙滩|ビーチ|해변",
  active:
    "active|sport|sports|exercise|workout|fitness|bouger|sportif|sportive|se dépenser|vận động|thể thao|спорт|тренировка|运动|健身|スポーツ|運動|운동|스포츠",
  yoga: "yoga|stretching|étirements|йога|йогу|瑜伽|ヨガ|요가",
  nature:
    "nature|wildlife|jungle|rainforest|monkey|monkeys|birds|forest|animaux|singes|forêt|thiên nhiên|voọc|rừng|природа|обезьяны|лес|自然|野生动物|猴子|自然散策|猿|자연|원숭이",
  art: "art|design|architecture|gallery|galerie|peinture|nghệ thuật|kiến trúc|искусство|архитектура|галерея|艺术|设计|美术|アート|建築|芸術|예술|건축|미술",
  cooking:
    "cooking|cook|cooking class|cours de cuisine|apprendre à cuisiner|cuisiner|nấu ăn|lớp nấu ăn|кулинария|кулинарный мастер класс|烹饪|烹饪课|料理教室|요리 수업",
  explore:
    "explore|excursion|excursions|sightseeing|visit|visiter|sortie|explorer|khám phá|tham quan|экскурсия|экскурсии|观光|探索|観光|散策|관광|탐험",
  transport:
    "transport|transfer|transfers|shuttle|navette|transfert|déplacement|đưa đón|xe đưa đón|трансфер|шаттл|接送|班车|送迎|셔틀|픽업",
  shopping:
    "shopping|shop|shops|boutique|boutiques|souvenir|souvenirs|mua sắm|шопинг|магазин|购物|纪念品|ショッピング|お土産|쇼핑|기념품",
  stay: "accommodation|stay|room|rooms|suite|suites|villa|villas|penthouse|hébergement|chambre|chambres|séjour|lưu trú|phòng nghỉ|номер|вилла|проживание|客房|别墅|住宿|客室|ヴィラ|宿泊|객실|빌라|숙박",
  celebration:
    "celebration|celebrate|party|parties|anniversary|birthday|fête|fêter|anniversaire|célébrer|tiệc|sinh nhật|праздник|день рождения|庆祝|生日|パーティー|誕生日|축하|생일",
  meeting:
    "meeting|meetings|conference|conference room|réunion|conférence|hội nghị|cuộc họp|конференция|встреча|会议|会議|회의",
  photo:
    "photo|photos|photography|picture|pictures|instagram spot|photographie|chụp ảnh|фото|фотография|拍照|摄影|写真|사진",
  activity:
    "activity|activities|things to do|activité|activités|que faire|hoạt động|занятия|развлечения|活动|アクティビティ|액티비티",
} as const;

export type SearchIntent = keyof typeof SEARCH_INTENTS;

/** Fillers only: unknown requirements and negation are deliberately never discarded. */
export const SEARCH_FILLERS = new Set(
  `a an the some i me my we our would like want need looking look find for to of at in on and with somewhere something please is it
   je j ai on nous mon ma mes des du de d le la les l un une au aux en et à a pour avec où ou qui quel quelle quels quelles est ce que qu voudrais veux envie cherche recherche faire aller se moi suis quand un peu
   tôi muốn tìm nơi một ở và cho cùng xin
   я хочу где найти для и на мне мы
   하고 싶어요`
    .split(/\s+/)
    .filter(Boolean),
);
