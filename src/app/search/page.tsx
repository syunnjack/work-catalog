import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import WorkCard from "@/components/WorkCard";
import { search } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({ title: "検索結果", description: "作品名・品番・メーカー・レーベル・シリーズ・女優名の横断検索。", path: "/search" });

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q ?? "";
  const result = query ? await search(query) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ name: "トップ", href: "/" }, { name: "検索", href: "/search" }]} />
      <h1 className="mt-3 text-xl font-bold text-white">検索結果: {query || "(未入力)"}</h1>

      {!result && <p className="mt-6 text-sm text-neutral-500">検索キーワードを入力してください。</p>}

      {result && (
        <div className="mt-6 space-y-8">
          {result.works.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-neutral-300">作品</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {result.works.map((work) => (
                  <WorkCard key={work.id} work={work} />
                ))}
              </div>
            </section>
          )}

          {result.actresses.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-neutral-300">女優</h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {result.actresses.map((a) => (
                  <li key={a.id}>
                    <Link href={`/actresses/${a.slug}`} className="rounded-full border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-neutral-400">
                      {a.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.makers.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-neutral-300">メーカー</h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {result.makers.map((m) => (
                  <li key={m.id}>
                    <Link href={`/makers/${m.slug}`} className="rounded-full border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-neutral-400">
                      {m.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.labels.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-neutral-300">レーベル</h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {result.labels.map((l) => (
                  <li key={l.id}>
                    <Link href={`/labels/${l.slug}`} className="rounded-full border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-neutral-400">
                      {l.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.series.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-neutral-300">シリーズ</h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {result.series.map((s) => (
                  <li key={s.id}>
                    <Link href={`/series/${s.slug}`} className="rounded-full border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-neutral-400">
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.works.length === 0 &&
            result.actresses.length === 0 &&
            result.makers.length === 0 &&
            result.labels.length === 0 &&
            result.series.length === 0 && <p className="text-sm text-neutral-500">「{query}」に一致する結果は見つかりませんでした。</p>}
        </div>
      )}
    </div>
  );
}
