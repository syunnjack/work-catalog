import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getMakers } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = buildMetadata({ title: "メーカー一覧", description: "作品を発売しているメーカー一覧。", path: "/makers" });

export default async function MakersPage() {
  const makers = await getMakers();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ name: "トップ", href: "/" }, { name: "メーカー一覧", href: "/makers" }]} />
      <h1 className="mt-3 text-xl font-bold text-white">メーカー一覧</h1>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {makers.map((maker) => (
          <Link key={maker.id} href={`/makers/${maker.slug}`} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-600">
            <p className="font-medium text-neutral-100">{maker.name}</p>
            {maker.description && <p className="mt-1 text-xs text-neutral-500">{maker.description}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
