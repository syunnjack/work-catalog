import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import ShareButtons from "@/components/ShareButtons";
import { getLabelWorkCounts } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { resolveBaseUrl } from "@/lib/constants";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "作品数が多いレーベルランキング",
  description: "カタログに登録されている作品数が多い順のレーベルランキング。",
  path: "/topics/prolific-labels",
});

export default async function ProlificLabelsTopicPage() {
  const ranking = await getLabelWorkCounts(20);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs
        items={[
          { name: "トップ", href: "/" },
          { name: "コラム・ランキング", href: "/topics" },
          { name: "作品数が多いレーベルランキング", href: "/topics/prolific-labels" },
        ]}
      />
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-xl font-bold text-white">作品数が多いレーベルランキング</h1>
        <ShareButtons url={`${resolveBaseUrl()}/topics/prolific-labels`} title="作品数が多いレーベルランキング" />
      </div>
      <p className="mt-2 text-sm text-neutral-400">カタログに登録されている作品数が多い順に並べています。</p>

      <ol className="mt-6 divide-y divide-neutral-800 rounded-lg border border-neutral-800 bg-neutral-900">
        {ranking.map((entry, index) => (
          <li key={entry.label.id}>
            <Link
              href={`/labels/${entry.label.slug}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-neutral-800/60"
            >
              <span className="w-6 shrink-0 text-right text-sm font-bold text-neutral-500">{index + 1}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-neutral-100">{entry.label.name}</span>
              <span className="shrink-0 text-sm font-bold text-neutral-300">{entry.workCount}作品</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
