import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import WorkCard from "@/components/WorkCard";
import NotifyButton from "@/components/NotifyButton";
import { getLabels, getMakers, getSeriesBySlug, getWorksBySeries } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);
  if (!series) return { title: "シリーズが見つかりません" };
  return buildMetadata({ title: series.name, description: series.description ?? `${series.name}の作品一覧。`, path: `/series/${series.slug}` });
}

export default async function SeriesDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);
  if (!series) notFound();

  const [labels, makers, works] = await Promise.all([getLabels(), getMakers(), getWorksBySeries(series.id, 24)]);
  const label = labels.find((l) => l.id === series.label_id);
  const maker = makers.find((m) => m.id === series.maker_id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs
        items={[
          { name: "トップ", href: "/" },
          { name: "シリーズ一覧", href: "/series" },
          { name: series.name, href: `/series/${series.slug}` },
        ]}
      />
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-xl font-bold text-white">{series.name}</h1>
        <NotifyButton seriesId={series.id} />
      </div>
      <p className="mt-1 text-sm text-neutral-400">
        {maker && <Link href={`/makers/${maker.slug}`} className="text-neutral-100 hover:underline">{maker.name}</Link>}
        {maker && label && " / "}
        {label && <Link href={`/labels/${label.slug}`} className="text-neutral-100 hover:underline">{label.name}</Link>}
      </p>
      {series.description && <p className="mt-2 text-sm text-neutral-400">{series.description}</p>}

      <h2 className="mt-8 text-base font-bold text-neutral-100">作品一覧</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {works.map((work) => (
          <WorkCard key={work.id} work={work} />
        ))}
      </div>
    </div>
  );
}
