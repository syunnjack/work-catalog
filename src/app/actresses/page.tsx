import ActressCard from "@/components/ActressCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getActresses } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "女優一覧",
  description: "公式クレジットのある作品を持つ女優の一覧。",
  path: "/actresses",
});

export default async function ActressesPage() {
  const actresses = await getActresses();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ name: "トップ", href: "/" }, { name: "女優一覧", href: "/actresses" }]} />
      <h1 className="mt-3 text-xl font-bold text-white">女優一覧</h1>
      <p className="mt-2 text-xs text-neutral-500">公式クレジットのある作品を持つ女優のみを掲載しています。</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {actresses.map((actress) => (
          <ActressCard key={actress.id} actress={actress} />
        ))}
      </div>
    </div>
  );
}
