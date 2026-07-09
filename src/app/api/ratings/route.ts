import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/lib/auth";
import { workRatingSchema } from "@/lib/schemas";
import { awardPoints } from "@/lib/points";

// works.rating_avg/rating_countはトリガーを持たないため、評価の登録/更新の都度
// アプリ側で再集計して更新する(他の集計カラムと同じパターン)。
async function refreshWorkRatingSummary(supabase: ReturnType<typeof getSupabaseServerClient>, workId: string) {
  const { data } = await supabase.from("work_ratings").select("rating").eq("work_id", workId);
  const ratings = (data ?? []).map((r) => r.rating as number);
  const count = ratings.length;
  const avg = count > 0 ? ratings.reduce((sum, r) => sum + r, 0) / count : null;
  await supabase
    .from("works")
    .update({ rating_avg: avg !== null ? Math.round(avg * 100) / 100 : null, rating_count: count })
    .eq("id", workId);
}

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const parsed = workRatingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "サーバー側の設定不備によりリクエストを処理できません。" }, { status: 500 });
  }

  const { data: existing } = await supabase
    .from("work_ratings")
    .select("work_id")
    .eq("work_id", parsed.data.workId)
    .eq("user_id", userId)
    .maybeSingle();

  const { error } = await supabase.from("work_ratings").upsert(
    {
      work_id: parsed.data.workId,
      user_id: userId,
      rating: parsed.data.rating,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "work_id,user_id" }
  );

  if (error) {
    return NextResponse.json({ error: "評価の登録に失敗しました。" }, { status: 502 });
  }
  await refreshWorkRatingSummary(supabase, parsed.data.workId);
  // 初回評価のときだけポイントを付与する(評価の変更では付与しない)。
  if (!existing) {
    await awardPoints(supabase, userId, "work_rated", parsed.data.workId);
  }
  return NextResponse.json({ ok: true });
}
