import Link from "next/link";
import Section from "@/components/Section";
import WorkCard from "@/components/WorkCard";
import JsonLd from "@/components/JsonLd";
import { getMakers, getPremiumWorkRanking, getWorkRanking, getWorks } from "@/lib/data";
import { resolveBaseUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants";

// venue系サイトと同様、随時増えるデータを毎回問い合わせるのは遅延要因になるため5分キャッシュする。
export const revalidate = 300;

export default async function Home() {
  const [newWorks, popularWorks, makers, premiumWorks] = await Promise.all([
    getWorks({ limit: 8 }),
    getWorkRanking(8),
    getMakers(),
    getPremiumWorkRanking(4),
  ]);

  const baseUrl = resolveBaseUrl();

  return (
    <div className="mx-auto max-w-6xl px-4">
      <JsonLd
        data={[
          {
            "@type": "WebSite",
            name: SITE_NAME,
            url: baseUrl,
            description: SITE_DESCRIPTION,
            potentialAction: {
              "@type": "SearchAction",
              target: `${baseUrl}/search?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          },
          {
            "@type": "Organization",
            name: SITE_NAME,
            url: baseUrl,
            description: SITE_DESCRIPTION,
          },
        ]}
      />
      <section className="py-10 text-center">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">品番・作品名・メーカー・レーベルから探す</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-neutral-400">
          公式クレジットの出演者情報、配信/販売先の比較、廃盤・希少タイトルの中古相場までまとめて確認できます。
        </p>
      </section>

      <Section title="新着作品" moreHref="/works">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {newWorks.map((work) => (
            <WorkCard key={work.id} work={work} />
          ))}
        </div>
      </Section>

      <Section title="人気作品" moreHref="/ranking">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {popularWorks.map((work) => (
            <WorkCard key={work.id} work={work} />
          ))}
        </div>
      </Section>

      {premiumWorks.length > 0 && (
        <Section title="中古相場が高い作品" moreHref="/used-market/ranking">
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {premiumWorks.map((entry) => (
              <li key={entry.work.id}>
                <Link
                  href={`/works/${entry.work.slug}`}
                  className="flex items-center justify-between rounded-lg border border-amber-800/50 bg-amber-950/20 px-4 py-3 hover:border-amber-600"
                >
                  <span className="truncate text-sm text-amber-100">{entry.work.title}</span>
                  <span className="shrink-0 text-sm font-bold text-amber-200">
                    ¥{entry.highestPriceYen.toLocaleString("ja-JP")}〜
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="メーカーから探す" moreHref="/makers">
        <div className="flex flex-wrap gap-2">
          {makers.map((maker) => (
            <Link
              key={maker.id}
              href={`/makers/${maker.slug}`}
              className="rounded-full border border-neutral-700 px-4 py-1.5 text-sm text-neutral-300 hover:border-neutral-400 hover:text-white"
            >
              {maker.name}
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}
