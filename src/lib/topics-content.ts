// バズ施策用のコラム/ランキングコンテンツの元データ。
// 出演者(実在の個人)には一切触れず、既存の公式データ(メーカー名・ジャンル名等)だけを扱う方針。
// 「変な名前選手権」は人力で選定したコメント付きリスト。makerNameはDBのmakers.nameと完全一致させる。
export interface CuratedMakerEntry {
  makerName: string;
  comment: string;
}

export const CURATED_MAKER_NAMES: CuratedMakerEntry[] = [
  { makerName: "パコパコ団とゆかいな仲間たち/妄想族", comment: "冒険活劇のタイトルのような長さと勢い。「ゆかいな仲間たち」の部分だけ見ると児童文学のようでもある。" },
  { makerName: "ゆず故障マシマシ/妄想族", comment: "「ゆず」「故障」「マシマシ」、単語同士の組み合わせの意味を思わず検索したくなる。" },
  { makerName: "ゲッツ！！ボンボン/妄想族", comment: "感嘆符2つ分の勢いがそのまま社名になっている。" },
  { makerName: "下半身タイガース/妄想族", comment: "球団名かと二度見してしまうネーミング。" },
  { makerName: "犬/妄想族", comment: "1文字だけの潔さ。読み方を確認したくなる。" },
  { makerName: "モッコ/妄想族", comment: "似た響きの「モグラ」も同じグループ内に実在する。" },
  { makerName: "変態紳士倶楽部", comment: "「紳士」と「変態」という、矛盾しているようで矛盾していない肩書き。" },
  { makerName: "るさんちまん/妄想族", comment: "ニーチェの哲学用語「ルサンチマン」がまさかここに登場するとは。" },
  { makerName: "さぼてんVR", comment: "植物の名前を冠したVRブランド。由来が気になる。" },
];

export interface TopicDefinition {
  slug: string;
  title: string;
  description: string;
}

export const TOPICS: TopicDefinition[] = [
  {
    slug: "maker-names",
    title: "聞いたら二度見するメーカー名選手権",
    description: "作品カタログに実在する、思わず二度見してしまうメーカー名を集めました。",
  },
  {
    slug: "prolific-makers",
    title: "作品数が多いメーカーランキング",
    description: "カタログに登録されている作品数が多い順のメーカーランキング。",
  },
];
