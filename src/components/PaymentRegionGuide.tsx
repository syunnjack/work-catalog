// 海外ユーザー向け決済ガイド(docs/monetization-site-design.md「海外ユーザー向け設計」)。
// 表示文言はdocs/seo-affiliate-aio-llmo.md「中国・台湾・韓国ユーザー向け決済説明」で
// 事前に確認済みの文面をそのまま使う(独自の追加翻訳・断定的な決済対応保証はしない)。
export interface PaymentRegionGuideCopy {
  regionLabel: string;
  bodyParagraph: string;
  possibleLabel: string;
  possibleMethods: string[];
  indirectLabel: string;
  indirectMethods: string[];
  officialLinkLabel: string;
  cautionNote: string;
}

export default function PaymentRegionGuide({ copy }: { copy: PaymentRegionGuideCopy }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <p className="text-xs font-medium text-neutral-500">{copy.regionLabel}</p>
      <p className="mt-2 text-sm leading-relaxed text-neutral-100">{copy.bodyParagraph}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-bold text-emerald-300">{copy.possibleLabel}</h3>
          <ul className="mt-1 space-y-1 text-sm text-neutral-200">
            {copy.possibleMethods.map((method) => (
              <li key={method}>・{method}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-bold text-amber-300">{copy.indirectLabel}</h3>
          <ul className="mt-1 space-y-1 text-sm text-neutral-200">
            {copy.indirectMethods.map((method) => (
              <li key={method}>・{method}</li>
            ))}
          </ul>
        </div>
      </div>

      <a
        href="https://www.dmm.co.jp/digital/videoa/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block text-sm font-medium text-neutral-100 underline hover:text-white"
      >
        {copy.officialLinkLabel} →
      </a>

      <p className="mt-3 text-xs text-neutral-500">{copy.cautionNote}</p>
    </div>
  );
}
