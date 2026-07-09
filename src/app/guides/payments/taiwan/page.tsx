import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import PaymentRegionGuide from "@/components/PaymentRegionGuide";
import DisclosureNotice from "@/components/DisclosureNotice";
import { breadcrumbJsonLd } from "@/lib/seo";
import { resolveBaseUrl } from "@/lib/constants";

export const metadata = {
  title: "台灣用戶付款指南 | work-catalog",
  description: "在日本國內配信網站付款時的注意事項（LINE Pay、悠遊卡、DMM點數等）。",
};

// 表示文言はdocs/seo-affiliate-aio-llmo.md「中国・台湾・韓国ユーザー向け決済説明」の
// 繁体字テキストをそのまま使用する(独自の追加翻訳・断定的な決済対応保証はしない)。
const COPY = {
  regionLabel: "台灣用戶",
  bodyParagraph:
    "台灣使用者平常常用LINE Pay、EasyWallet、悠遊卡等支付方式，但FANZA（DMM）不一定能直接使用這些台灣在地支付工具。建議先確認是否可使用國際信用卡，或先儲值DMM點數，再以DMM點數付款。",
  possibleLabel: "可能可以使用的方式",
  possibleMethods: ["國際信用卡（Visa / Mastercard 等）", "DMM點數付款（可先儲值後使用）"],
  indirectLabel: "可能無法直接使用的方式",
  indirectMethods: ["LINE Pay", "EasyWallet", "悠遊卡等台灣在地支付工具"],
  officialLinkLabel: "前往DMM官方網站確認",
  cautionNote: "付款方式、可用範圍可能會變更，請務必在購買前以送客頁面（DMM官方頁面）的最新資訊為準。",
};

export default function TaiwanPaymentGuidePage() {
  const baseUrl = resolveBaseUrl();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "トップ", url: baseUrl },
          { name: "決済ガイド", url: `${baseUrl}/guides/payments` },
          { name: "台湾", url: `${baseUrl}/guides/payments/taiwan` },
        ])}
      />
      <Breadcrumbs
        items={[
          { name: "トップ", href: "/" },
          { name: "決済ガイド", href: "/guides/payments" },
          { name: "台湾", href: "/guides/payments/taiwan" },
        ]}
      />

      <h1 lang="zh-TW" className="mt-3 text-xl font-bold text-white">
        台灣用戶付款指南
      </h1>

      <div lang="zh-TW" className="mt-6">
        <PaymentRegionGuide copy={COPY} />
      </div>

      <DisclosureNotice />
    </div>
  );
}
