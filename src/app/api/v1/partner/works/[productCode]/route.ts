import { NextRequest, NextResponse } from "next/server";
import { withPartnerAuth } from "@/lib/partner-api";

export async function GET(request: NextRequest, { params }: { params: Promise<{ productCode: string }> }) {
  const { productCode } = await params;

  return withPartnerAuth(request, "/api/v1/partner/works/{productCode}", { requiredScope: "catalog_read" }, async ({ supabase }) => {
    const { data: work, error } = await supabase
      .from("works")
      .select(
        "product_code, title, release_date, runtime_minutes, makers(name), labels(name), series(name), work_genres(genres(name)), work_actress(credit_name)"
      )
      .eq("product_code", productCode)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "作品情報の取得に失敗しました。" }, { status: 502 });
    }
    if (!work) {
      return NextResponse.json({ error: "作品が見つかりません。" }, { status: 404 });
    }

    type WorkRow = {
      product_code: string;
      title: string;
      release_date: string | null;
      runtime_minutes: number | null;
      makers: { name: string } | null;
      labels: { name: string } | null;
      series: { name: string } | null;
      work_genres: Array<{ genres: { name: string } | null }>;
      work_actress: Array<{ credit_name: string }>;
    };
    const row = work as unknown as WorkRow;

    return NextResponse.json({
      productCode: row.product_code,
      title: row.title,
      releaseDate: row.release_date,
      runtimeMinutes: row.runtime_minutes,
      maker: row.makers?.name ?? null,
      label: row.labels?.name ?? null,
      series: row.series?.name ?? null,
      genres: row.work_genres.map((g) => g.genres?.name).filter((n): n is string => Boolean(n)),
      officialCastCreditNames: row.work_actress.map((a) => a.credit_name),
    });
  });
}
