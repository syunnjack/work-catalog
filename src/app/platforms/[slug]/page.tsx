import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import WorkCard from "@/components/WorkCard";
import { getPlatformBySlug, getWorksByPlatform } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const platform = await getPlatformBySlug(slug);
  if (!platform) return { title: "配信サイトが見つかりません" };
  return buildMetadata({ title: platform.name, description: platform.notes ?? `${platform.name}で配信/販売中の作品一覧。`, path: `/platforms/${platform.slug}` });
}

export default async function PlatformDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const platform = await getPlatformBySlug(slug);
  if (!platform) notFound();

  const works = await getWorksByPlatform(platform.id, 24);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ name: "トップ", href: "/" }, { name: "配信サイト一覧", href: "/platforms" }, { name: platform.name, href: `/platforms/${platform.slug}` }]} />
      <h1 className="mt-3 text-xl font-bold text-white">{platform.name}</h1>
      {platform.operator_name && <p className="mt-1 text-sm text-neutral-400">運営: {platform.operator_name}</p>}
      {platform.notes && <p className="mt-2 text-sm text-neutral-400">{platform.notes}</p>}
      {platform.website_url && (
        <a href={platform.website_url} target="_blank" rel="noopener noreferrer nofollow sponsored" className="mt-2 inline-block text-sm text-neutral-300 underline hover:text-white">
          公式サイトを見る →
        </a>
      )}

      <h2 className="mt-8 text-base font-bold text-neutral-100">掲載作品</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {works.map((work) => (
          <WorkCard key={work.id} work={work} />
        ))}
      </div>
    </div>
  );
}
