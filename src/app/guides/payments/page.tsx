import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";
import { resolveBaseUrl } from "@/lib/constants";

export const metadata = {
  title: "海外ユーザー向け決済ガイド",
  description: "中国・台湾・韓国から配信サイトを利用する方向けに、決済方法の注意点をまとめています。",
};

const REGIONS = [
  { href: "/guides/payments/china", label: "中国（简体中文）" },
  { href: "/guides/payments/taiwan", label: "台湾（繁體中文）" },
  { href: "/guides/payments/korea", label: "韓国（한국어）" },
];

export default function PaymentsGuideIndexPage() {
  const baseUrl = resolveBaseUrl();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "トップ", url: baseUrl },
          { name: "海外ユーザー向け決済ガイド", url: `${baseUrl}/guides/payments` },
        ])}
      />
      <Breadcrumbs items={[{ name: "トップ", href: "/" }, { name: "決済ガイド", href: "/guides/payments" }]} />

      <h1 className="mt-3 text-xl font-bold text-white">海外ユーザー向け決済ガイド</h1>
      <p className="mt-2 text-sm text-neutral-400">
        現地で普段使う決済サービスが、国内配信サイトで直接使えるとは限りません。地域別に注意点をまとめています。
      </p>

      <ul className="mt-6 space-y-3">
        {REGIONS.map((region) => (
          <li key={region.href}>
            <Link
              href={region.href}
              className="block rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-100 hover:border-neutral-600"
            >
              {region.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
