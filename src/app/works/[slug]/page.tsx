import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import OfferCompareTable from "@/components/OfferCompareTable";
import UsedMarketCompareTable from "@/components/UsedMarketCompareTable";
import OfficialInfoNotice from "@/components/OfficialInfoNotice";
import DisclosureNotice from "@/components/DisclosureNotice";
import { getWorkBySlug } from "@/lib/data";
import { breadcrumbJsonLd, buildWorkAnswerBlock, faqJsonLd, workJsonLd } from "@/lib/seo";
import { resolveBaseUrl } from "@/lib/constants";

export const revalidate = 300;

// generateStaticParamsが無いと動的セグメントへのアクセスが「リクエスト時API」扱いとなり、
// revalidateを設定していてもルート全体が完全動的レンダリングになってしまう
// （Next.js 16のPrevious Modelの仕様。詳細はnode_modules/next/dist/docs/参照）。
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const work = await getWorkBySlug(slug);
  if (!work) return { title: "作品が見つかりません" };

  const title = `${work.title}（${work.product_code}）`;
  const description = work.seo_description ?? buildWorkAnswerBlock(work);
  const baseUrl = resolveBaseUrl();
  const url = `${baseUrl}/works/${work.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, locale: "ja_JP", type: "website" },
  };
}

export default async function WorkDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const work = await getWorkBySlug(slug);
  if (!work) notFound();

  const baseUrl = resolveBaseUrl();
  const pageUrl = `${baseUrl}/works/${work.slug}`;
  const answerBlock = buildWorkAnswerBlock(work);

  const faqItems = [
    { question: "この作品のメーカー・レーベルはどこですか？", answer: `メーカーは${work.maker?.name ?? "不明"}、レーベルは${work.label?.name ?? "不明"}です。` },
    { question: "品番から検索できますか？", answer: `はい。品番「${work.product_code}」で検索できます。` },
    {
      question: "公式クレジットの出演者は誰ですか？",
      answer: work.actresses.length > 0 ? `${work.actresses.map((c) => c.credit_name).join("、")}です。` : "公式クレジットの出演者情報はありません。",
    },
  ];

  const jsonLd = [
    workJsonLd(work, pageUrl),
    breadcrumbJsonLd([
      { name: "トップ", url: baseUrl },
      { name: "作品一覧", url: `${baseUrl}/works` },
      { name: work.title, url: pageUrl },
    ]),
    faqJsonLd(faqItems),
  ];

  const availableOfficialLink = work.distributionLinks.find((l) => l.platform_work_url)?.platform_work_url;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <JsonLd data={jsonLd} />
      <Breadcrumbs
        items={[
          { name: "トップ", href: "/" },
          { name: "作品一覧", href: "/works" },
          { name: work.title, href: `/works/${work.slug}` },
        ]}
      />

      <h1 className="mt-3 text-xl font-bold text-white">{work.title}</h1>
      <p className="mt-1 text-sm text-neutral-400">{answerBlock}</p>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-neutral-500">品番</dt>
          <dd className="text-neutral-100">{work.product_code}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">メーカー</dt>
          <dd>{work.maker ? <Link href={`/makers/${work.maker.slug}`} className="text-neutral-100 hover:underline">{work.maker.name}</Link> : "不明"}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">レーベル</dt>
          <dd>{work.label ? <Link href={`/labels/${work.label.slug}`} className="text-neutral-100 hover:underline">{work.label.name}</Link> : "不明"}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">シリーズ</dt>
          <dd>{work.series ? <Link href={`/series/${work.series.slug}`} className="text-neutral-100 hover:underline">{work.series.name}</Link> : "-"}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">発売日</dt>
          <dd className="text-neutral-100">{work.release_date ?? "不明"}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">収録時間</dt>
          <dd className="text-neutral-100">{work.runtime_minutes ? `${work.runtime_minutes}分` : "不明"}</dd>
        </div>
      </dl>

      {work.genres.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {work.genres.map((genre) => (
            <Link key={genre.id} href={`/genres/${genre.slug}`} className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-300 hover:border-neutral-400">
              {genre.name}
            </Link>
          ))}
        </div>
      )}

      <section className="mt-6">
        <h2 className="text-base font-bold text-neutral-100">出演者(公式クレジット)</h2>
        {work.actresses.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {work.actresses.map((cast) => (
              <li key={cast.actress.id}>
                <Link
                  href={`/actresses/${cast.actress.slug}`}
                  className="rounded-full border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-neutral-400"
                >
                  {cast.credit_name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-2">
            <OfficialInfoNotice externalUrl={availableOfficialLink ?? undefined} />
          </div>
        )}
      </section>

      <section className="mt-6">
        <OfferCompareTable links={work.distributionLinks} />
      </section>

      {work.marketPrices.length > 0 && (
        <section className="mt-6">
          <UsedMarketCompareTable prices={work.marketPrices} rarityNotes={work.rarityNotes} />
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-base font-bold text-neutral-100">よくある質問</h2>
        <dl className="mt-3 space-y-3">
          {faqItems.map((item) => (
            <div key={item.question}>
              <dt className="text-sm font-medium text-neutral-100">{item.question}</dt>
              <dd className="mt-1 text-sm text-neutral-400">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <DisclosureNotice />
    </div>
  );
}
