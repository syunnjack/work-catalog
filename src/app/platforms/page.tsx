import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getPlatforms } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "配信サイト一覧",
  description: "FANZA、SOD、MGS動画、DUGA/APEXなど国内大手配信・販売サイトの一覧。",
  path: "/platforms",
});

export default async function PlatformsPage() {
  const platforms = await getPlatforms();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ name: "トップ", href: "/" }, { name: "配信サイト一覧", href: "/platforms" }]} />
      <h1 className="mt-3 text-xl font-bold text-white">配信サイト一覧</h1>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {platforms.map((platform) => (
          <Link key={platform.id} href={`/platforms/${platform.slug}`} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-600">
            <p className="font-medium text-neutral-100">{platform.name}</p>
            {platform.notes && <p className="mt-1 text-xs text-neutral-500">{platform.notes}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
