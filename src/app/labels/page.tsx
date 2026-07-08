import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getLabels, getMakers } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = buildMetadata({ title: "レーベル一覧", description: "作品を展開しているレーベル一覧。", path: "/labels" });

export default async function LabelsPage() {
  const [labels, makers] = await Promise.all([getLabels(), getMakers()]);
  const makerNameById = new Map(makers.map((m) => [m.id, m.name]));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ name: "トップ", href: "/" }, { name: "レーベル一覧", href: "/labels" }]} />
      <h1 className="mt-3 text-xl font-bold text-white">レーベル一覧</h1>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {labels.map((label) => (
          <Link key={label.id} href={`/labels/${label.slug}`} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-600">
            <p className="font-medium text-neutral-100">{label.name}</p>
            <p className="mt-1 text-xs text-neutral-500">{makerNameById.get(label.maker_id) ?? "不明"}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
