import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import WorkCard from "@/components/WorkCard";
import { getPublicFavoritesByToken } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "公開お気に入りリスト",
  description: "ユーザーが公開設定にしたお気に入り作品一覧です。",
};

export default async function PublicFavoritesListPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const works = await getPublicFavoritesByToken(token);
  if (works === null) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ name: "トップ", href: "/" }, { name: "公開お気に入りリスト", href: `/list/${token}` }]} />
      <h1 className="mt-3 text-xl font-bold text-white">公開お気に入りリスト</h1>
      <p className="mt-1 text-xs text-neutral-500">あるユーザーが公開設定にしたお気に入り作品一覧です。</p>

      {works.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">まだお気に入り作品がありません。</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {works.map((work) => (
            <WorkCard key={work.id} work={work} />
          ))}
        </div>
      )}
    </div>
  );
}
