import { NextRequest, NextResponse } from "next/server";
import { withPartnerAuth } from "@/lib/partner-api";

const MAX_PAGE_SIZE = 200;

// 法人向けカタログ一覧(第三の核)。品番・タイトル・メーカー/レーベル/シリーズ・ジャンル・
// 公式クレジット出演者名・発売日のみを返す。価格/URL/ユーザー個人データは含めない
// (docs/collector-data-services.md「提供データの範囲」)。
export async function GET(request: NextRequest) {
  return withPartnerAuth(request, "/api/v1/partner/works", { requiredScope: "catalog_read" }, async ({ supabase }) => {
    const page = Math.max(1, Number.parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number.parseInt(request.nextUrl.searchParams.get("pageSize") ?? "50", 10) || 50));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("works")
      .select(
        "product_code, title, release_date, makers(name), labels(name), series(name), work_genres(genres(name)), work_actress(credit_name)",
        { count: "exact" }
      )
      .order("product_code", { ascending: true })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: "作品カタログの取得に失敗しました。" }, { status: 502 });
    }

    type Row = {
      product_code: string;
      title: string;
      release_date: string | null;
      makers: { name: string } | null;
      labels: { name: string } | null;
      series: { name: string } | null;
      work_genres: Array<{ genres: { name: string } | null }>;
      work_actress: Array<{ credit_name: string }>;
    };

    const items = ((data ?? []) as unknown as Row[]).map((row) => ({
      productCode: row.product_code,
      title: row.title,
      releaseDate: row.release_date,
      maker: row.makers?.name ?? null,
      label: row.labels?.name ?? null,
      series: row.series?.name ?? null,
      genres: row.work_genres.map((g) => g.genres?.name).filter((n): n is string => Boolean(n)),
      // 公式クレジットのみ。出演者個人の特定・追跡目的での利用は契約上禁止する。
      officialCastCreditNames: row.work_actress.map((a) => a.credit_name),
    }));

    return NextResponse.json({
      page,
      pageSize,
      totalCount: count ?? 0,
      items,
    });
  });
}
