import TagCloud from "@/components/TagCloud";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getGenres } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = buildMetadata({ title: "ジャンル一覧", description: "作品ジャンル・タグ一覧。", path: "/genres" });

export default async function GenresPage() {
  const genres = await getGenres();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ name: "トップ", href: "/" }, { name: "ジャンル一覧", href: "/genres" }]} />
      <h1 className="mt-3 text-xl font-bold text-white">ジャンル一覧</h1>
      <div className="mt-6">
        <TagCloud tags={genres.map((g) => ({ href: `/genres/${g.slug}`, label: g.name }))} />
      </div>
    </div>
  );
}
