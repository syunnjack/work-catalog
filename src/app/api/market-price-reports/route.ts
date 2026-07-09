import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/lib/auth";
import { marketPriceReportSchema } from "@/lib/schemas";
import { awardPoints } from "@/lib/points";

// ユーザーからの中古相場報告の投稿窓口。maker_submissionsと同様、status=pendingで保存され、
// 運営者が/adminで確認してapprovedにするまではwork_market_prices(公式相場情報)には反映しない。
export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const parsed = marketPriceReportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "サーバー側の設定不備によりリクエストを処理できません。" }, { status: 500 });
  }

  const { error } = await supabase.from("work_market_price_reports").insert({
    work_id: parsed.data.workId,
    platform_id: parsed.data.platformId,
    user_id: userId,
    price_yen: parsed.data.priceYen,
    note: parsed.data.note ?? null,
    source_url: parsed.data.sourceUrl ?? null,
    status: "pending",
  });

  if (error) {
    return NextResponse.json({ error: "報告の送信に失敗しました。" }, { status: 502 });
  }
  await awardPoints(supabase, userId, "market_price_reported", parsed.data.workId);
  return NextResponse.json({ ok: true, note: "報告内容は運営者が確認後に反映されます。" });
}
