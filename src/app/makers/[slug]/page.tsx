import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import WorkCard from "@/components/WorkCard";
import NotifyButton from "@/components/NotifyButton";
import { getLabelsByMaker, getMakerBySlug, getWorksByMaker } from "@/lib/data";
import { breadcrumbJsonLd, buildMetadata, organizationJsonLd } from "@/lib/seo";
import { resolveBaseUrl } from "@/lib/constants";

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const maker = await getMakerBySlug(slug);
  if (!maker) return { title: "メーカーが見つかりません" };
  return buildMetadata({ title: maker.name, description: maker.description ?? `${maker.name}の作品一覧。`, path: `/makers/${maker.slug}` });
}

export default async function MakerDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const maker = await getMakerBySlug(slug);
  if (!maker) notFound();

  const [labels, works] = await Promise.all([getLabelsByMaker(maker.id), getWorksByMaker(maker.id, 24)]);
  const baseUrl = resolveBaseUrl();
  const pageUrl = `${baseUrl}/makers/${maker.slug}`;
  const answerBlock = `${maker.name}の人気作品、新着作品、関連レーベルを確認できます。`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <JsonLd
        data={[
          organizationJsonLd({ name: maker.name, url: pageUrl, description: maker.description ?? undefined }),
          breadcrumbJsonLd([
            { name: "トップ", url: baseUrl },
            { name: "メーカー一覧", url: `${baseUrl}/makers` },
            { name: maker.name, url: pageUrl },
          ]),
        ]}
      />
      <Breadcrumbs items={[{ name: "トップ", href: "/" }, { name: "メーカー一覧", href: "/makers" }, { name: maker.name, href: `/makers/${maker.slug}` }]} />
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-xl font-bold text-white">{maker.name}</h1>
        <NotifyButton makerId={maker.id} />
      </div>
      <p className="mt-1 text-sm text-neutral-400">{answerBlock}</p>
      {maker.description && <p className="mt-2 text-sm text-neutral-400">{maker.description}</p>}

      {labels.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {labels.map((label) => (
            <Link key={label.id} href={`/labels/${label.slug}`} className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-300 hover:border-neutral-400">
              {label.name}
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
