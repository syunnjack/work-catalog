import Breadcrumbs from "@/components/Breadcrumbs";
import WorkCard from "@/components/WorkCard";
import { getWorkRanking } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = buildMetadata({ title: "作品ランキング", description: "閲覧数に基づく作品ランキング。", path: "/ranking" });

export default async function RankingPage() {
  const works = await getWorkRanking(30);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ name: "トップ", href: "/" }, { name: "ランキング", href: "/ranking" }]} />
      <h1 className="mt-3 text-xl font-bold text-white">作品ランキング</h1>
      <p className="mt-1 text-xs text-neutral-500">閲覧数の多い順に並べています。女優個人のランキングは設けていません。</p>
      <ol className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {works.map((work, index) => (
          <li key={work.id} className="relative">
            <span className="absolute left-1 top-1 z-10 rounded-full bg-neutral-950/80 px-2 py-0.5 text-xs font-bold text-white">{index + 1}</span>
            <WorkCard work={work} />
          </li>
        ))}
      </ol>
    </div>
  );
}
