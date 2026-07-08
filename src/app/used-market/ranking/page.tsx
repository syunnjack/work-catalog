import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getPremiumWorkRanking } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "プレミア価格ランキング",
  description: "中古相場が高い作品のランキング。",
  path: "/used-market/ranking",
});

export default async function UsedMarketRankingPage() {
  const premiumWorks = await getPremiumWorkRanking(50);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ name: "トップ", href: "/" }, { name: "中古相場", href: "/used-market" }, { name: "プレミア価格ランキング", href: "/used-market/ranking" }]} />
      <h1 className="mt-3 text-xl font-bold text-white">プレミア価格ランキング</h1>
      <p className="mt-2 text-sm text-neutral-400">
        中古相場の参考価格が高い順に並べています。相場は変動するため、最終確認は各プラットフォームでお願いします。
      </p>

      <ol className="mt-6 divide-y divide-neutral-800 rounded-lg border border-neutral-800 bg-neutral-900">
        {premiumWorks.map((entry, index) => (
          <li key={entry.work.id}>
            <Link href={`/works/${entry.work.slug}`} className="flex items-center gap-4 px-4 py-3 hover:bg-neutral-800/60">
              <span className="w-6 shrink-0 text-right text-sm font-bold text-neutral-500">{index + 1}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-neutral-100">{entry.work.title}</span>
              <span className="shrink-0 text-xs text-neutral-500">{entry.platformName}</span>
              <span className="shrink-0 text-sm font-bold text-amber-200">¥{entry.highestPriceYen.toLocaleString("ja-JP")}</span>
            </Link>
          </li>
        ))}
      </ol>
      {premiumWorks.length === 0 && <p className="mt-4 text-sm text-neutral-500">まだ相場データが登録されていません。</p>}
    </div>
  );
}
