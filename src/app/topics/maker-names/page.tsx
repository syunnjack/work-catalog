import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { CURATED_MAKER_NAMES } from "@/lib/topics-content";
import { getMakersByNames } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "聞いたら二度見するメーカー名選手権",
  description: "作品カタログに実在する、思わず二度見してしまうメーカー名を集めました。",
  path: "/topics/maker-names",
});

export default async function MakerNamesTopicPage() {
  const makers = await getMakersByNames(CURATED_MAKER_NAMES.map((e) => e.makerName));
  const makerByName = new Map(makers.map((m) => [m.name, m]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs
        items={[
          { name: "トップ", href: "/" },
          { name: "コラム・ランキング", href: "/topics" },
          { name: "メーカー名選手権", href: "/topics/maker-names" },
        ]}
      />
      <h1 className="mt-3 text-xl font-bold text-white">聞いたら二度見するメーカー名選手権</h1>
      <p className="mt-2 text-sm text-neutral-400">
        作品カタログを整理していて、思わず二度見してしまったメーカー名を集めました。すべて実在する公式のメーカー名です。
      </p>

      <ol className="mt-6 flex flex-col gap-4">
        {CURATED_MAKER_NAMES.map((entry, index) => {
          const maker = makerByName.get(entry.makerName);
          return (
            <li key={entry.makerName} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex items-start gap-3">
                <span className="text-lg font-bold text-neutral-600">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  {maker ? (
                    <Link href={`/makers/${maker.slug}`} className="font-bold text-neutral-100 hover:underline">
                      {entry.makerName}
                    </Link>
                  ) : (
                    <span className="font-bold text-neutral-100">{entry.makerName}</span>
                  )}
                  <p className="mt-1 text-sm text-neutral-400">{entry.comment}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
