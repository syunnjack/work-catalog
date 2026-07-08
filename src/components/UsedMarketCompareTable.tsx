import type { UsedMarketPlatform, WorkMarketPrice, WorkRarityNote } from "@/types/database";

const PRICE_TYPE_LABEL: Record<WorkMarketPrice["price_type"], string> = {
  current_listing_min: "現在の出品最安値",
  current_listing_avg: "現在の出品平均",
  completed_sale_avg: "直近の成約平均",
  completed_sale_max: "直近の成約最高値",
};

const RARITY_LABEL: Record<WorkRarityNote["rarity_reason"], string> = {
  out_of_print: "廃盤",
  limited_first_press: "初回限定版",
  label_discontinued: "レーベル販売終了",
  format_discontinued: "フォーマット販売終了",
};

// 第二の収益核（中古相場）の比較表示。
// トーンは「安く買って高く転売」ではなく「相場を知って適正価格で判断する」に統一する
// （docs/used-market-pricing.md「設計原則」）。
export default function UsedMarketCompareTable({
  prices,
  rarityNotes,
}: {
  prices: Array<WorkMarketPrice & { platform: UsedMarketPlatform }>;
  rarityNotes: WorkRarityNote[];
}) {
  if (prices.length === 0) return null;

  const sorted = [...prices].sort((a, b) => b.price_yen - a.price_yen);
  const latestObserved = sorted.reduce(
    (latest, p) => (p.observed_at > latest ? p.observed_at : latest),
    sorted[0].observed_at
  );

  return (
    <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-4">
      <h3 className="text-base font-bold text-amber-200">中古相場(参考価格)</h3>
      <p className="mt-1 text-xs text-amber-200/80">
        以下は各プラットフォームの取得時点の参考価格です。相場は変動するため、購入・売却の際は必ず送客先で最新価格をご確認ください。
      </p>

      {rarityNotes.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {rarityNotes.map((note) => (
            <li
              key={note.id}
              className="rounded-full border border-amber-700 px-2 py-0.5 text-[11px] font-medium text-amber-200"
            >
              {RARITY_LABEL[note.rarity_reason]}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-amber-800/50 text-xs text-amber-200/70">
              <th className="py-1.5 pr-3 font-medium">プラットフォーム</th>
              <th className="py-1.5 pr-3 font-medium">価格帯の種類</th>
              <th className="py-1.5 pr-3 font-medium">参考価格</th>
              <th className="py-1.5 font-medium" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((price) => (
              <tr key={price.id} className="border-b border-amber-900/40 last:border-0">
                <td className="py-2 pr-3 text-amber-100">{price.platform.name}</td>
                <td className="py-2 pr-3 text-amber-200/80">{PRICE_TYPE_LABEL[price.price_type]}</td>
                <td className="py-2 pr-3 font-bold text-amber-100">¥{price.price_yen.toLocaleString("ja-JP")}</td>
                <td className="py-2 text-right">
                  {price.source_url && (
                    <a
                      href={price.source_url}
                      target="_blank"
                      rel="noopener noreferrer nofollow sponsored"
                      className="text-xs font-medium text-amber-300 underline hover:text-amber-100"
                    >
                      出品を見る →
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-[11px] text-amber-200/60">取得時点: {new Date(latestObserved).toLocaleDateString("ja-JP")}</p>
    </div>
  );
}
