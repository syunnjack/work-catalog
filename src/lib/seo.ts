import type { Metadata } from "next";
import { resolveBaseUrl, SITE_NAME } from "@/lib/constants";
import type { WorkWithRelations } from "@/types/database";

export function buildMetadata(params: { title: string; description: string; path: string }): Metadata {
  const baseUrl = resolveBaseUrl();
  const url = `${baseUrl}${params.path}`;
  const title = `${params.title}｜${SITE_NAME}`;
  return {
    title,
    description: params.description,
    alternates: { canonical: url },
    openGraph: { title, description: params.description, url, locale: "ja_JP", type: "website" },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqJsonLd(items: Array<{ question: string; answer: string }>) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

// 公式クレジットがある場合のみPersonを含める。未クレジット作品ではcastが空配列になる。
export function workJsonLd(work: WorkWithRelations, pageUrl: string) {
  return {
    "@type": "Movie",
    name: work.title,
    productID: work.product_code,
    url: pageUrl,
    dateCreated: work.release_date ?? undefined,
    duration: work.runtime_minutes ? `PT${work.runtime_minutes}M` : undefined,
    productionCompany: work.maker ? { "@type": "Organization", name: work.maker.name } : undefined,
    actor: work.actresses.map((c) => ({ "@type": "Person", name: c.credit_name })),
    offers: work.distributionLinks
      .filter((link) => link.availability_status === "available")
      .map((link) => ({
        "@type": "Offer",
        url: link.platform_work_url ?? undefined,
        priceCurrency: "JPY",
        availability: "https://schema.org/InStock",
        seller: { "@type": "Organization", name: link.platform.name },
      })),
  };
}

export function buildWorkAnswerBlock(work: WorkWithRelations): string {
  const maker = work.maker?.name ?? "不明";
  const label = work.label?.name ?? "不明";
  const series = work.series?.name;
  const castNames = work.actresses.map((c) => c.credit_name).join("、");

  let text = `${work.product_code} の作品情報です。メーカーは ${maker}、レーベルは ${label} です。`;
  if (series) text += `シリーズは ${series} です。`;
  text += castNames ? `公式クレジットの出演者は ${castNames} です。` : "公式クレジットの出演者情報はありません。";
  return text;
}
