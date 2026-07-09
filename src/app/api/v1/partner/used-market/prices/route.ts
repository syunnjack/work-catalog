import { NextRequest, NextResponse } from "next/server";
import { withPartnerAuth } from "@/lib/partner-api";

// 中古相場の集計値(第二の核のデータ)。docs/collector-data-services.md「API設計」より
// Pro以上のプランのみ利用可能とする。
export async function GET(request: NextRequest) {
  return withPartnerAuth(
    request,
    "/api/v1/partner/used-market/prices",
    { requiredScope: "used_market_read", requiredPlans: ["pro", "enterprise"] },
    async ({ supabase }) => {
      const productCode = request.nextUrl.searchParams.get("productCode");
      if (!productCode) {
        return NextResponse.json({ error: "productCodeを指定してください。" }, { status: 400 });
      }

      const { data: work } = await supabase.from("works").select("id").eq("product_code", productCode).maybeSingle();
      if (!work) {
        return NextResponse.json({ error: "作品が見つかりません。" }, { status: 404 });
      }

      const { data, error } = await supabase
        .from("work_market_prices")
        .select("price_type, price_yen, sample_size, observed_at, used_market_platforms(name)")
        .eq("work_id", work.id)
        .order("observed_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: "中古相場情報の取得に失敗しました。" }, { status: 502 });
      }

      type Row = {
        price_type: string;
        price_yen: number;
        sample_size: number | null;
        observed_at: string;
        used_market_platforms: { name: string } | null;
      };
      const prices = ((data ?? []) as unknown as Row[]).map((row) => ({
        platform: row.used_market_platforms?.name ?? null,
        priceType: row.price_type,
        priceYen: row.price_yen,
        sampleSize: row.sample_size,
        observedAt: row.observed_at,
      }));

      return NextResponse.json({ productCode, prices });
    }
  );
}
