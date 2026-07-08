import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import WorkCard from "@/components/WorkCard";
import { getLabelBySlug, getMakers, getSeriesList, getWorksByLabel } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs
        items={[
          { name: "トップ", href: "/" },
          { name: "レーベル一覧", href: "/labels" },
          { name: label.name, href: `/labels/${label.slug}` },
        ]}
      />
      <h1 className="mt-3 text-xl font-bold text-white">{label.name}</h1>
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
