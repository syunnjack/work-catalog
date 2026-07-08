import Link from "next/link";
import type { Actress } from "@/types/database";

// 公式クレジット済み出演作品数のみ表示する（人気スコア等の個人ランキング指標は持たない）。
export default function ActressCard({ actress }: { actress: Actress }) {
  return (
    <Link
      href={`/actresses/${actress.slug}`}
      className="block rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-center transition hover:border-neutral-600"
    >
      <div className="mx-auto aspect-square w-full max-w-[96px] rounded-full bg-neutral-800" aria-hidden />
      <p className="mt-2 truncate text-sm font-medium text-neutral-100">{actress.name}</p>
      <p className="mt-0.5 text-xs text-neutral-500">公式クレジット {actress.works_count}作品</p>
    </Link>
  );
}
