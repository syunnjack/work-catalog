import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import WorkCard from "@/components/WorkCard";
import { getGenreBySlug, getWorksByGenre } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const genre = await getGenreBySlug(slug);
  if (!genre) return { title: "ジャンルが見つかりません" };
  return buildMetadata({ title: genre.name, description: genre.description ?? `${genre.name}の作品一覧。`, path: `/genres/${genre.slug}` });
}

export default async function GenreDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const genre = await getGenreBySlug(slug);
  if (!genre) notFound();

  const works = await getWorksByGenre(genre.id, 40);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ name: "トップ", href: "/" }, { name: "ジャンル一覧", href: "/genres" }, { name: genre.name, href: `/genres/${genre.slug}` }]} />
      <h1 className="mt-3 text-xl font-bold text-white">{genre.name}</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {works.map((work) => (
          <WorkCard key={work.id} work={work} />
        ))}
      </div>
    </div>
  );
}
