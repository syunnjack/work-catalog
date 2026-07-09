import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import PaymentRegionGuide from "@/components/PaymentRegionGuide";
import DisclosureNotice from "@/components/DisclosureNotice";
import { breadcrumbJsonLd } from "@/lib/seo";
import { resolveBaseUrl } from "@/lib/constants";

export const metadata = {
  title: "한국 이용자를 위한 결제 가이드 | work-catalog",
  description: "일본 국내 배포 사이트에서 결제할 때 주의할 점(간편결제, DMM 포인트 등)을 안내합니다.",
};

// 表示文言はdocs/seo-affiliate-aio-llmo.md「中国・台湾・韓国ユーザー向け決済説明」の
// 韓国語テキストをそのまま使用する(独自の追加翻訳・断定的な決済対応保証はしない)。
const COPY = {
  regionLabel: "한국 이용자",
  bodyParagraph:
    "한국은 신용카드와 Samsung Wallet/Samsung Pay, Naver Pay, Kakao Pay, Tmoney 같은 캐시리스 결제가 널리 사용됩니다. 다만 FANZA（DMM）에서는 한국 내 간편결제가 직접 지원되지 않을 수 있으므로, 사용 가능한 해외 결제 카드 또는 DMM 포인트 결제를 먼저 확인하세요.",
  possibleLabel: "사용 가능할 수 있는 방법",
  possibleMethods: ["해외 결제가 가능한 신용카드", "DMM 포인트 결제(충전 후 사용)"],
  indirectLabel: "직접 사용하기 어려울 수 있는 방법",
  indirectMethods: ["Samsung Wallet / Samsung Pay", "Naver Pay", "Kakao Pay", "Tmoney 등 한국 간편결제"],
  officialLinkLabel: "DMM 공식 사이트에서 확인하기",
  cautionNote: "결제 방법과 이용 가능 범위는 변경될 수 있으니, 구매 전 반드시 이동한 페이지(DMM 공식 페이지)의 최신 정보를 확인하세요.",
};

export default function KoreaPaymentGuidePage() {
  const baseUrl = resolveBaseUrl();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "トップ", url: baseUrl },
          { name: "決済ガイド", url: `${baseUrl}/guides/payments` },
          { name: "韓国", url: `${baseUrl}/guides/payments/korea` },
        ])}
      />
      <Breadcrumbs
        items={[
          { name: "トップ", href: "/" },
          { name: "決済ガイド", href: "/guides/payments" },
          { name: "韓国", href: "/guides/payments/korea" },
        ]}
      />

      <h1 lang="ko" className="mt-3 text-xl font-bold text-white">
        한국 이용자를 위한 결제 가이드
      </h1>

      <div lang="ko" className="mt-6">
        <PaymentRegionGuide copy={COPY} />
      </div>

      <DisclosureNotice />
    </div>
  );
}
