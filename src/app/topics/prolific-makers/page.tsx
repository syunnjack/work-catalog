import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import ShareButtons from "@/components/ShareButtons";
import { getMakerWorkCounts } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { resolveBaseUrl } from "@/lib/constants";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "作品数が多いメーカーランキング",
  description: "カタログに登録されている作品数が多い順のメーカーランキング。",
  path: "/topics/prolific-makers",
});

export default async function ProlificMakersTopicPage() {
  const ranking = await getMakerWorkCounts(20);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs
        items={[
          { name: "トップ", href: "/" },
          { name: "コラム・ランキング", href: "/topics" },
          { name: "作品数が多いメーカーランキング", href: "/topics/prolific-makers" },
        ]}
      />
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-xl font-bold text-white">作品数が多いメーカーランキング</h1>
        <ShareButtons url={`${resolveBaseUrl()}/topics/prolific-makers`} title="作品数が多いメーカーランキング" />
      </div>
      <p className="mt-2 text-sm text-neutral-400">カタログに登録されている作品数が多い順に並べています。</p>

      <ol className="mt-6 divide-y divide-neutral-800 rounded-lg border border-neutral-800 bg-neutral-900">
        {ranking.map((entry, index) => (
          <li key={entry.maker.id}>
            <Link
              href={`/makers/${entry.maker.slug}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-neutral-800/60"
            >
              <span className="w-6 shrink-0 text-right text-sm font-bold text-neutral-500">{index + 1}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-neutral-100">{entry.maker.name}</span>
              <span className="shrink-0 text-sm font-bold text-neutral-300">{entry.workCount}作品</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
