import type { DistributionPlatform, WorkDistributionLink } from "@/types/database";

const INTENT_LABEL: Record<WorkDistributionLink["intent_type"], string> = {
  ppv_primary: "単品PPV/購入",
  subscription_secondary: "見放題/サブスク",
  official_reference: "公式情報",
  price_compare: "価格比較",
};

const AVAILABILITY_LABEL: Record<WorkDistributionLink["availability_status"], string> = {
  available: "配信/販売中",
  unavailable: "配信/販売終了",
  coming_soon: "近日配信",
  unknown: "要確認",
};

// 新品配信/販売の比較表（第一の核）。単品PPVを主導線、見放題/サブスクを副導線として並び替える
// （docs/seo-affiliate-aio-llmo.md「単品PPV主導線とサブスク副導線」）。
export default function OfferCompareTable({
  links,
}: {
  links: Array<WorkDistributionLink & { platform: DistributionPlatform }>;
}) {
  if (links.length === 0) return null;

  const sorted = [...links].sort((a, b) => a.cta_priority - b.cta_priority);

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <h3 className="text-base font-bold text-neutral-100">配信/販売先で確認</h3>
      <p className="mt-1 text-xs text-neutral-500">
        価格・在庫・配信可否は変動します。最終確認は送客先でお願いします。
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {sorted.map((link) => (
          <li
            key={link.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium text-neutral-100">{link.platform.name}</p>
              <p className="text-xs text-neutral-500">
                {INTENT_LABEL[link.intent_type]} ・ {AVAILABILITY_LABEL[link.availability_status]}
                {link.price_note ? ` ・ ${link.price_note}` : ""}
              </p>
            </div>
            {link.platform_work_url && (
              <a
                href={`/go/${link.id}`}
                rel="noopener noreferrer nofollow sponsored"
                className="shrink-0 rounded-full bg-neutral-100 px-4 py-1.5 text-xs font-semibold text-neutral-900 hover:bg-white"
              >
                確認する
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
