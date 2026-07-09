import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import WorkCard from "@/components/WorkCard";
import { getWorkRankingByCategory } from "@/lib/data";
import { GENRE_CATEGORIES, GENRE_CATEGORY_LABELS, isGenreCategory } from "@/lib/genre-categories";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export async function generateStaticParams() {
  return GENRE_CATEGORIES.map((category) => ({ category }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  if (!isGenreCategory(category)) return { title: "ランキングが見つかりません" };
  const label = GENRE_CATEGORY_LABELS[category];
  return buildMetadata({
    title: `${label}ランキング`,
    description: `${label}系ジャンルの人気作品ランキング。`,
    path: `/ranking/${category}`,
  });
}

export default async function GenreCategoryRankingPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  if (!isGenreCategory(category)) notFound();

  const label = GENRE_CATEGORY_LABELS[category];
  const works = await getWorkRankingByCategory(category, 30);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ name: "トップ", href: "/" }, { name: "ランキング", href: "/ranking" }, { name: `${label}ランキング`, href: `/ranking/${category}` }]} />
      <h1 className="mt-3 text-xl font-bold text-white">{label}ランキング</h1>
      <p className="mt-1 text-xs text-neutral-500">
        {label}系ジャンルが付いた作品を閲覧数の多い順に並べています。ジャンルの分類は編集上のものであり、メーカー/レーベルの公式区分とは異なる場合があります。
      </p>

      {works.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">対象作品が見つかりませんでした。</p>
      ) : (
        <ol className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {works.map((work, index) => (
            <li key={work.id} className="relative">
              <span className="absolute left-1 top-1 z-10 rounded-full bg-neutral-950/80 px-2 py-0.5 text-xs font-bold text-white">{index + 1}</span>
              <WorkCard work={work} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
