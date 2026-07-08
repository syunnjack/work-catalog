export const SITE_NAME = "work-catalog";

export const SITE_DESCRIPTION =
  "品番・作品名・メーカー・レーベル・シリーズから探せる作品カタログ。公式クレジットの出演者情報と、廃盤・希少タイトルの中古相場をあわせて確認できます。";

export function resolveBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
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
] as const;

export const AGE_GATE_NOTICE =
  "このサイトは成人向けコンテンツの情報を含みます。18歳未満の方の閲覧はご遠慮ください。";

export const AFFILIATE_DISCLOSURE_TEXT = "このページのリンクには広告（アフィリエイトリンク）が含まれます。";
