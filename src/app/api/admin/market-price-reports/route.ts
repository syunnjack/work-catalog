import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getAuthenticatedUser, isAdminEmail } from "@/lib/auth";

// /admin向け中古相場報告の一覧取得。work_market_price_reportsはRLSでservice_role以外
// 全アクセス拒否のため、必ずこのAPI経由(サーバー側でis_adminを確認した上でservice roleを使う)で読む。
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "権限がありません。" }, { status: 403 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "サーバー側の設定不備によりリクエストを処理できません。" }, { status: 500 });
  }

  const status = request.nextUrl.searchParams.get("status");
  let query = supabase
    .from("work_market_price_reports")
    .select("*, works(title, product_code), used_market_platforms(name)")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "報告の取得に失敗しました。" }, { status: 502 });
  }
  return NextResponse.json({ reports: data ?? [] });
}
