import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import WorkCard from "@/components/WorkCard";
import NotifyButton from "@/components/NotifyButton";
import { getLabelBySlug, getMakers, getSeriesList, getWorksByLabel } from "@/lib/data";
import { breadcrumbJsonLd, buildMetadata, organizationJsonLd } from "@/lib/seo";
import { resolveBaseUrl } from "@/lib/constants";

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const label = await getLabelBySlug(slug);
  if (!label) return { title: "レーベルが見つかりません" };
  return buildMetadata({ title: label.name, description: label.description ?? `${label.name}の作品一覧。`, path: `/labels/${label.slug}` });
}

export default async function LabelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const label = await getLabelBySlug(slug);
  if (!label) notFound();

  const [makers, allSeries, works] = await Promise.all([getMakers(), getSeriesList(), getWorksByLabel(label.id, 24)]);
  const maker = makers.find((m) => m.id === label.maker_id);
  const seriesUnderLabel = allSeries.filter((s) => s.label_id === label.id);
  const baseUrl = resolveBaseUrl();
  const pageUrl = `${baseUrl}/labels/${label.slug}`;
  const answerBlock = `${label.name}の人気作品、新着作品、関連シリーズを確認できます。`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <JsonLd
        data={[
          organizationJsonLd({ name: label.name, url: pageUrl, description: label.description ?? undefined }),
          breadcrumbJsonLd([
            { name: "トップ", url: baseUrl },
            { name: "レーベル一覧", url: `${baseUrl}/labels` },
            { name: label.name, url: pageUrl },
          ]),
        ]}
      />
      <Breadcrumbs
        items={[
          { name: "トップ", href: "/" },
          { name: "レーベル一覧", href: "/labels" },
          { name: label.name, href: `/labels/${label.slug}` },
        ]}
      />
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-xl font-bold text-white">{label.name}</h1>
        <NotifyButton labelId={label.id} />
      </div>
      <p className="mt-1 text-sm text-neutral-400">{answerBlock}</p>
      {maker && (
        <p className="mt-1 text-sm text-neutral-400">
          メーカー: <Link href={`/makers/${maker.slug}`} className="text-neutral-100 hover:underline">{maker.name}</Link>
        </p>
      )}
      {label.description && <p className="mt-2 text-sm text-neutral-400">{label.description}</p>}

      {seriesUnderLabel.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {seriesUnderLabel.map((series) => (
            <Link key={series.id} href={`/series/${series.slug}`} className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-300 hover:border-neutral-400">
              {series.name}
            </Link>
          ))}
        </div>
      )}

      <h2 className="mt-8 text-base font-bold text-neutral-100">作品一覧</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {works.map((work) => (
          <WorkCard key={work.id} work={work} />
        ))}
      </div>
    </div>
  );
}
