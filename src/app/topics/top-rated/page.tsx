import Breadcrumbs from "@/components/Breadcrumbs";
import WorkCard from "@/components/WorkCard";
import ShareButtons from "@/components/ShareButtons";
import { getWorkRanking } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { resolveBaseUrl } from "@/lib/constants";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "ユーザー評価が高い作品ランキング",
  description: "ユーザーの星評価の平均が高い作品ランキング。",
  path: "/topics/top-rated",
});

export default async function TopRatedTopicPage() {
  const works = await getWorkRanking(20, "rating");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs
        items={[
          { name: "トップ", href: "/" },
          { name: "コラム・ランキング", href: "/topics" },
          { name: "ユーザー評価が高い作品ランキング", href: "/topics/top-rated" },
        ]}
      />
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-xl font-bold text-white">ユーザー評価が高い作品ランキング</h1>
        <ShareButtons url={`${resolveBaseUrl()}/topics/top-rated`} title="ユーザー評価が高い作品ランキング" />
      </div>
      <p className="mt-2 text-sm text-neutral-400">
        ユーザーの星評価(1〜5)の平均が高い順に並べています(評価が1件以上ある作品のみ)。
      </p>

      {works.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">まだ評価が付いた作品がありません。</p>
      ) : (
        <ol className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
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
