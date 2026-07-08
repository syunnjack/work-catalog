import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getSeriesList } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = buildMetadata({ title: "シリーズ一覧", description: "作品シリーズ一覧。", path: "/series" });

export default async function SeriesListPage() {
  const seriesList = await getSeriesList();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ name: "トップ", href: "/" }, { name: "シリーズ一覧", href: "/series" }]} />
      <h1 className="mt-3 text-xl font-bold text-white">シリーズ一覧</h1>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {seriesList.map((series) => (
          <Link key={series.id} href={`/series/${series.slug}`} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-600">
            <p className="font-medium text-neutral-100">{series.name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
