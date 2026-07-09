import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getAuthenticatedUser, isAdminEmail } from "@/lib/auth";
import { marketPriceReportReviewSchema } from "@/lib/schemas";

// 審査結果の登録。承認時のみ、報告内容をwork_market_prices(公式相場情報、price_type=user_reported)
// へ複製する。却下時はstatusの更新のみでwork_market_pricesには一切反映しない。
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser(request);
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "権限がありません。" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = marketPriceReportReviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "サーバー側の設定不備によりリクエストを処理できません。" }, { status: 500 });
  }

  if (parsed.data.status === "approved") {
    const { data: report, error: fetchError } = await supabase
      .from("work_market_price_reports")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchError || !report) {
      return NextResponse.json({ error: "報告が見つかりません。" }, { status: 404 });
    }

    const { error: insertError } = await supabase.from("work_market_prices").insert({
      work_id: report.work_id,
      platform_id: report.platform_id,
      price_type: "user_reported",
      price_yen: report.price_yen,
      source_url: report.source_url,
      observed_at: new Date().toISOString(),
    });
    if (insertError) {
      return NextResponse.json({ error: "相場情報への反映に失敗しました。" }, { status: 502 });
    }
  }

  const { error } = await supabase
    .from("work_market_price_reports")
    .update({
      status: parsed.data.status,
      review_note: parsed.data.reviewNote ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "審査結果の更新に失敗しました。" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
