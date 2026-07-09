import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import WorkCard from "@/components/WorkCard";
import { getWorkRanking, type WorkRankingMetric } from "@/lib/data";
import { GENRE_CATEGORIES, GENRE_CATEGORY_LABELS } from "@/lib/genre-categories";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = buildMetadata({ title: "作品ランキング", description: "閲覧数・クリック数・CTRに基づく作品ランキング。", path: "/ranking" });

const METRIC_TABS: Array<{ value: WorkRankingMetric; label: string; description: string }> = [
  { value: "views", label: "閲覧数順", description: "閲覧数の多い順に並べています。" },
  { value: "clicks", label: "クリック数順", description: "配信/販売先へのクリック数が多い順に並べています。" },
  { value: "ctr", label: "CTR順", description: "閲覧数に対するクリック率が高い順に並べています。" },
];

export default async function RankingPage({ searchParams }: { searchParams: Promise<{ metric?: string }> }) {
  const { metric: metricParam } = await searchParams;
  const metric: WorkRankingMetric = METRIC_TABS.some((t) => t.value === metricParam) ? (metricParam as WorkRankingMetric) : "views";
  const works = await getWorkRanking(30, metric);
  const activeTab = METRIC_TABS.find((t) => t.value === metric)!;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ name: "トップ", href: "/" }, { name: "ランキング", href: "/ranking" }]} />
      <h1 className="mt-3 text-xl font-bold text-white">作品ランキング</h1>
      <p className="mt-1 text-xs text-neutral-500">{activeTab.description}女優個人のランキングは設けていません。</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {METRIC_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === "views" ? "/ranking" : `/ranking?metric=${tab.value}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              tab.value === metric
                ? "border-white bg-white text-neutral-900"
                : "border-neutral-700 text-neutral-300 hover:border-neutral-400"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-bold text-neutral-300">ジャンル別ランキング</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {GENRE_CATEGORIES.map((category) => (
            <Link
              key={category}
              href={`/ranking/${category}`}
              className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-300 hover:border-neutral-400"
            >
              {GENRE_CATEGORY_LABELS[category]}ランキング
            </Link>
          ))}
        </div>
      </div>

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
