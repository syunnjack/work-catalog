import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getPremiumWorkRanking } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "中古市場 価格ガイド",
  description: "廃盤・希少タイトルの中古相場情報。適正価格の把握にお使いください。",
  path: "/used-market",
});

export default async function UsedMarketPage() {
  const premiumWorks = await getPremiumWorkRanking(20);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ name: "トップ", href: "/" }, { name: "中古相場", href: "/used-market" }]} />
      <h1 className="mt-3 text-xl font-bold text-white">中古市場 価格ガイド</h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-400">
        廃盤・希少タイトルの中古相場を、複数プラットフォームの参考価格でご案内します。相場を知って適正価格で売買判断するための情報提供であり、転売を推奨するものではありません。価格は変動するため、最終確認は各プラットフォームでお願いします。
      </p>

      <h2 className="mt-8 text-base font-bold text-amber-200">プレミア価格ランキング</h2>
      <ol className="mt-3 divide-y divide-neutral-800 rounded-lg border border-neutral-800 bg-neutral-900">
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
