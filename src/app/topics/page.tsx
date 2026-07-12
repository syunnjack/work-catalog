import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import ShareButtons from "@/components/ShareButtons";
import { TOPICS } from "@/lib/topics-content";
import { buildMetadata } from "@/lib/seo";
import { resolveBaseUrl } from "@/lib/constants";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "コラム・ランキング",
  description: "作品カタログのデータから見つけた、ちょっと面白い雑学・ランキング記事。",
  path: "/topics",
});

export default function TopicsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ name: "トップ", href: "/" }, { name: "コラム・ランキング", href: "/topics" }]} />
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-xl font-bold text-white">コラム・ランキング</h1>
        <ShareButtons url={`${resolveBaseUrl()}/topics`} title="コラム・ランキング" />
      </div>
      <p className="mt-2 text-sm text-neutral-400">作品カタログのデータから見つけた、ちょっと面白い雑学・ランキングです。</p>

      <div className="mt-6 flex flex-col gap-3">
        {TOPICS.map((topic) => (
          <Link
            key={topic.slug}
            href={`/topics/${topic.slug}`}
            className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-600"
          >
            <p className="font-medium text-neutral-100">{topic.title}</p>
            <p className="mt-1 text-xs text-neutral-500">{topic.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
