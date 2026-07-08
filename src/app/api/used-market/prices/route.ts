import { NextRequest, NextResponse } from "next/server";
import { getWorkBySlug } from "@/lib/data";

// workId(slug)の中古相場・希少性メモを返す。第二の収益核（docs/used-market-pricing.md）。
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("workSlug");
  if (!slug) {
    return NextResponse.json({ error: "workSlugを指定してください。" }, { status: 400 });
  }

  const work = await getWorkBySlug(slug);
  if (!work) {
    return NextResponse.json({ error: "作品が見つかりません。" }, { status: 404 });
  }

  return NextResponse.json(
    { prices: work.marketPrices, rarityNotes: work.rarityNotes },
    { headers: { "Cache-Control": "s-maxage=900, stale-while-revalidate=300" } }
  );
}
