// genresテーブル自体は変更せず、既存のタグ名をコード側でカテゴリに束ねるだけの分類。
// DMM/DUGAなど取り込み元によって表記ゆれがあるため、完全一致ではなく部分一致で判定する。
// キーワードの選定は編集上の分類であり、DMM/DUGA側の公式カテゴリ区分ではない。
export type GenreCategory = "situation" | "fetish" | "cosplay";

export const GENRE_CATEGORIES: GenreCategory[] = ["situation", "fetish", "cosplay"];

export const GENRE_CATEGORY_LABELS: Record<GenreCategory, string> = {
  situation: "シチュエーション",
  fetish: "フェチ",
  cosplay: "コスプレ",
};

const CATEGORY_KEYWORDS: Record<GenreCategory, string[]> = {
  cosplay: [
    "コスプレ", "セーラー服", "学生服", "制服", "女子校生", "女子大生", "体操着", "競泳",
    "スクール水着", "チャイナドレス", "看護婦", "ナース", "メイド", "和服", "浴衣",
    "スチュワーデス", "ビジネススーツ", "キャバ嬢", "風俗嬢", "女教師", "女医", "女捜査官", "秘書",
  ],
  fetish: [
    "フェチ", "パンスト", "パンチラ", "胸チラ", "局部アップ", "美乳", "巨乳", "巨尻", "貧乳",
    "微乳", "超乳", "スレンダー", "ぽっちゃり", "ミニ系", "小柄", "長身", "汗だく", "白目",
    "足コキ", "手コキ", "浣腸", "放尿", "潮吹き", "ローション", "オイル", "縛り", "緊縛",
    "拘束", "異物挿入",
  ],
  situation: [
    "不倫", "寝取", "NTR", "近親相姦", "人妻", "主婦", "熟女", "若妻", "幼妻", "義母",
    "お母さん", "姉・妹", "娘・養女", "ママ友", "女上司", "面接", "家庭教師", "ナンパ",
    "逆ナン", "即ハメ", "カーセックス", "野外", "露出", "温泉", "旅行", "ホテル", "お風呂",
    "監禁", "妄想族", "部活",
  ],
};

export function categorizeGenreName(name: string): GenreCategory | null {
  for (const category of GENRE_CATEGORIES) {
    if (CATEGORY_KEYWORDS[category].some((keyword) => name.includes(keyword))) return category;
  }
  return null;
}

export function isGenreCategory(value: string): value is GenreCategory {
  return (GENRE_CATEGORIES as string[]).includes(value);
}
