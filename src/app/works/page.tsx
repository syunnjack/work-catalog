import WorkCard from "@/components/WorkCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getWorks } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "作品一覧",
  description: "品番・作品名から探せる作品カタログ一覧。",
  path: "/works",
});

export default async function WorksPage() {
  const works = await getWorks({ limit: 60 });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ name: "トップ", href: "/" }, { name: "作品一覧", href: "/works" }]} />
      <h1 className="mt-3 text-xl font-bold text-white">作品一覧</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {works.map((work) => (
          <WorkCard key={work.id} work={work} />
        ))}
      </div>
      {works.length === 0 && <p className="mt-6 text-sm text-neutral-500">まだ作品が登録されていません。</p>}
    </div>
  );
}
