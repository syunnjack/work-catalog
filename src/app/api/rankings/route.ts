import { NextRequest, NextResponse } from "next/server";
import { getWorkRanking, type WorkRankingMetric } from "@/lib/data";

const METRICS: WorkRankingMetric[] = ["views", "clicks", "ctr", "rating"];

// 作品・メーカー・レーベル単位のランキングのみを扱う。女優個人の人気ランキングは設けない
// （docs/architecture.md「4. API一覧」参照）。makers/labels/series単位の集計は今後追加予定。
export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") ?? "works";
  const metric = (request.nextUrl.searchParams.get("metric") ?? "views") as WorkRankingMetric;

  if (type !== "works") {
    return NextResponse.json(
      { error: `type=${type} は未実装です。現在は type=works のみ対応しています。` },
      { status: 400 }
    );
  }
  if (!METRICS.includes(metric)) {
    return NextResponse.json({ error: `metric=${metric} は未対応です。views/clicks/ctrのいずれかを指定してください。` }, { status: 400 });
  }

  const works = await getWorkRanking(30, metric);
  return NextResponse.json({ type: "works", metric, items: works }, { headers: { "Cache-Control": "s-maxage=300" } });
}
