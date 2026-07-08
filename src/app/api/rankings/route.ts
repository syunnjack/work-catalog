import { NextRequest, NextResponse } from "next/server";
import { getWorkRanking } from "@/lib/data";

// 作品・メーカー・レーベル単位のランキングのみを扱う。女優個人の人気ランキングは設けない
// （docs/architecture.md「4. API一覧」参照）。makers/labels/series単位の集計は今後追加予定。
export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") ?? "works";

  if (type !== "works") {
    return NextResponse.json(
      { error: `type=${type} は未実装です。現在は type=works のみ対応しています。` },
      { status: 400 }
    );
  }

  const works = await getWorkRanking(30);
  return NextResponse.json({ type: "works", items: works }, { headers: { "Cache-Control": "s-maxage=300" } });
}
