import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import WorkCard from "@/components/WorkCard";
import JsonLd from "@/components/JsonLd";
import { getActressBySlug, getHighestMarketPriceByWorkIds } from "@/lib/data";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { resolveBaseUrl } from "@/lib/constants";

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

const ALIAS_TYPE_LABEL: Record<string, string> = {
  former_stage_name: "旧芸名",
  alternate_stage_name: "別名",
  romanized: "ローマ字",
  kana: "読み",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const actress = await getActressBySlug(slug);
  if (!actress) return { title: "女優が見つかりません" };
  return buildMetadata({
    title: actress.name,
    description: `${actress.name}さんの公式クレジット出演作品一覧。`,
    path: `/actresses/${actress.slug}`,
  });
}

export default async function ActressDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const actress = await getActressBySlug(slug);
  if (!actress) notFound();

  const baseUrl = resolveBaseUrl();
  const pageUrl = `${baseUrl}/actresses/${actress.slug}`;
  const priceByWorkId = await getHighestMarketPriceByWorkIds(actress.works.map((w) => w.work.id));
  const worksSortedByMarketPrice = [...actress.works]
    .filter((w) => priceByWorkId.has(w.work.id))
    .sort((a, b) => (priceByWorkId.get(b.work.id) ?? 0) - (priceByWorkId.get(a.work.id) ?? 0));

  const officialAliases = actress.aliases.filter((a) => a.source_type === "official_agency" || a.source_type === "official_credit");

  const jsonLd = [
    {
      "@type": "Person",
      name: actress.name,
      url: pageUrl,
    },
    breadcrumbJsonLd([
      { name: "トップ", url: baseUrl },
      { name: "女優一覧", url: `${baseUrl}/actresses` },
      { name: actress.name, url: pageUrl },
    ]),
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[{ name: "トップ", href: "/" }, { name: "女優一覧", href: "/actresses" }, { name: actress.name, href: `/actresses/${actress.slug}` }]} />

      <h1 className="mt-3 text-xl font-bold text-white">{actress.name}</h1>
      <p className="mt-1 text-sm text-neutral-400">
        {actress.name}さんは公式クレジットで{actress.works.length}作品に登録されています。
      </p>
      {actress.profile && <p className="mt-3 text-sm text-neutral-400">{actress.profile}</p>}

      {officialAliases.length > 0 && (
        <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <h2 className="text-sm font-bold text-neutral-100">公式発表済みの別名</h2>
          <table className="mt-2 w-full text-left text-xs text-neutral-400">
            <tbody>
              {officialAliases.map((alias) => (
                <tr key={alias.id} className="border-t border-neutral-800">
                  <td className="py-1.5 pr-3 text-neutral-500">{ALIAS_TYPE_LABEL[alias.alias_type] ?? alias.alias_type}</td>
                  <td className="py-1.5 text-neutral-200">{alias.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {worksSortedByMarketPrice.length > 0 && (
        <section className="mt-8">
          <h2 className="text-base font-bold text-amber-200">中古相場が高い出演作品</h2>
          <ul className="mt-2 space-y-2">
            {worksSortedByMarketPrice.map(({ work }) => (
              <li key={work.id}>
                <a href={`/works/${work.slug}`} className="flex items-center justify-between rounded-lg border border-amber-800/50 bg-amber-950/20 px-4 py-2 hover:border-amber-600">
                  <span className="truncate text-sm text-amber-100">{work.title}</span>
                  <span className="shrink-0 text-sm font-bold text-amber-200">
                    ¥{(priceByWorkId.get(work.id) ?? 0).toLocaleString("ja-JP")}〜
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2 className="mt-8 text-base font-bold text-neutral-100">公式クレジット出演作品</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actress.works.map(({ work }) => (
          <WorkCard key={work.id} work={work} />
        ))}
      </div>
    </div>
  );
}
