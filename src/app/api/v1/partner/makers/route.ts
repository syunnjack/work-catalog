import { NextRequest, NextResponse } from "next/server";
import { withPartnerAuth } from "@/lib/partner-api";

export async function GET(request: NextRequest) {
  return withPartnerAuth(request, "/api/v1/partner/makers", { requiredScope: "catalog_read" }, async ({ supabase }) => {
    const { data, error } = await supabase.from("makers").select("slug, name, description").order("name");
    if (error) {
      return NextResponse.json({ error: "メーカー一覧の取得に失敗しました。" }, { status: 502 });
    }
    return NextResponse.json({ items: data ?? [] });
  });
}
