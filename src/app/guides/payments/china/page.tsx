import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import PaymentRegionGuide from "@/components/PaymentRegionGuide";
import DisclosureNotice from "@/components/DisclosureNotice";
import { breadcrumbJsonLd } from "@/lib/seo";
import { resolveBaseUrl } from "@/lib/constants";

export const metadata = {
  title: "中国用户付款指南 | work-catalog",
  description: "关于在日本国内配信网站付款时的注意事项（银联卡、DMM点数等）。",
};

// 表示文言はdocs/seo-affiliate-aio-llmo.md「中国・台湾・韓国ユーザー向け決済説明」の
// 簡体字テキストをそのまま使用する(独自の追加翻訳・断定的な決済対応保証はしない)。
const COPY = {
  regionLabel: "中国大陆用户",
  bodyParagraph:
    "FANZA（DMM）通常不能直接使用银联（UnionPay）卡付款。中国用户可以先通过支持银联的支付服务为DMM点数充值，然后使用DMM点数购买或观看作品。付款方式可能会变更，请以DMM官方页面为准。",
  possibleLabel: "可能可以使用的方式",
  possibleMethods: ["国际信用卡（Visa / Mastercard 等）", "DMM点数付款（可通过支持银联的服务或钱包充值后使用）"],
  indirectLabel: "可能无法直接使用的方式",
  indirectMethods: ["银联（UnionPay）卡直接付款"],
  officialLinkLabel: "前往DMM官方网站确认",
  cautionNote: "付款方式、可用范围可能会变更，请务必在购买前以送客页面（DMM官方页面）的最新信息为准。",
};

export default function ChinaPaymentGuidePage() {
  const baseUrl = resolveBaseUrl();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "トップ", url: baseUrl },
          { name: "決済ガイド", url: `${baseUrl}/guides/payments` },
          { name: "中国", url: `${baseUrl}/guides/payments/china` },
        ])}
      />
      <Breadcrumbs
        items={[
          { name: "トップ", href: "/" },
          { name: "決済ガイド", href: "/guides/payments" },
          { name: "中国", href: "/guides/payments/china" },
        ]}
      />

      <h1 lang="zh-CN" className="mt-3 text-xl font-bold text-white">
        中国用户付款指南
      </h1>

      <div lang="zh-CN" className="mt-6">
        <PaymentRegionGuide copy={COPY} />
      </div>

      <DisclosureNotice />
    </div>
  );
}
