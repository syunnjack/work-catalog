export const SITE_NAME = "AV名鑑";

export const SITE_DESCRIPTION =
  "品番・作品名・メーカー・レーベル・シリーズから探せる作品カタログ。公式クレジットの出演者情報と、廃盤・希少タイトルの中古相場をあわせて確認できます。";

const FALLBACK_BASE_URL = "http://localhost:3000";

// NEXT_PUBLIC_SITE_URLが未設定・不完全（例: "https://"のみ）だとnew URL()が例外を投げ、
// ビルド全体が失敗する（layout.tsxのmetadataBase生成で顕在化した）。
// 不正な値のときは静かにフォールバックし、ビルドを壊さないようにする。
export function resolveBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) return FALLBACK_BASE_URL;
  try {
    new URL(url);
    return url;
  } catch {
    return FALLBACK_BASE_URL;
  }
}

export const NAV_LINKS = [
  { href: "/works", label: "作品" },
  { href: "/actresses", label: "女優" },
  { href: "/makers", label: "メーカー" },
  { href: "/labels", label: "レーベル" },
  { href: "/series", label: "シリーズ" },
  { href: "/genres", label: "ジャンル" },
  { href: "/platforms", label: "配信サイト" },
  { href: "/used-market", label: "中古相場" },
  { href: "/ranking", label: "ランキング" },
  { href: "/topics", label: "コラム" },
] as const;

export const AGE_GATE_NOTICE =
  "このサイトは成人向けコンテンツの情報を含みます。18歳未満の方の閲覧はご遠慮ください。";

export const AFFILIATE_DISCLOSURE_TEXT = "このページのリンクには広告（アフィリエイトリンク）が含まれます。";
