import { NextRequest, NextResponse } from "next/server";
import { withPartnerAuth } from "@/lib/partner-api";

export async function GET(request: NextRequest) {
  return withPartnerAuth(request, "/api/v1/partner/genres", { requiredScope: "catalog_read" }, async ({ supabase }) => {
    const { data, error } = await supabase.from("genres").select("slug, name, description").order("name");
    if (error) {
      return NextResponse.json({ error: "ジャンル一覧の取得に失敗しました。" }, { status: 502 });
    }
    return NextResponse.json({ items: data ?? [] });
  });
}
