import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/lib/auth";
import { notificationSubscriptionSchema } from "@/lib/schemas";
import { awardPoints } from "@/lib/points";

// 新作発売日通知(第一の核)の登録。メーカー/レーベル/シリーズページの再訪問導線として使う。
export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const parsed = notificationSubscriptionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "サーバー側の設定不備によりリクエストを処理できません。" }, { status: 500 });
  }

  // maker_id/label_id/series_idはいずれか1つだけがnot nullのため、部分ユニークインデックスになる。
  // PostgRESTのupsert(on_conflict)は部分インデックスの述語を指定できないため、
  // 「既にあれば何もしない」を確認insert + 一意制約違反の握りつぶしで実現する。
  let existing = supabase.from("notification_subscriptions").select("id").eq("user_id", userId);
  if (parsed.data.makerId) existing = existing.eq("maker_id", parsed.data.makerId);
  else if (parsed.data.labelId) existing = existing.eq("label_id", parsed.data.labelId);
  else if (parsed.data.seriesId) existing = existing.eq("series_id", parsed.data.seriesId);

  const { data: existingRow } = await existing.maybeSingle();
  if (existingRow) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase.from("notification_subscriptions").insert({
    user_id: userId,
    maker_id: parsed.data.makerId ?? null,
    label_id: parsed.data.labelId ?? null,
    series_id: parsed.data.seriesId ?? null,
  });

  // 23505 = unique_violation。並行リクエストで既に登録済みだった場合は成功扱いにする(ポイントは付与しない)。
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: "通知の登録に失敗しました。" }, { status: 502 });
  }
  if (!error) {
    await awardPoints(supabase, userId, "notification_registered", parsed.data.makerId ?? parsed.data.labelId ?? parsed.data.seriesId);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const parsed = notificationSubscriptionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "サーバー側の設定不備によりリクエストを処理できません。" }, { status: 500 });
  }

  let query = supabase.from("notification_subscriptions").delete().eq("user_id", userId);
  if (parsed.data.makerId) query = query.eq("maker_id", parsed.data.makerId);
  else if (parsed.data.labelId) query = query.eq("label_id", parsed.data.labelId);
  else if (parsed.data.seriesId) query = query.eq("series_id", parsed.data.seriesId);

  const { error } = await query;
  if (error) {
    return NextResponse.json({ error: "通知の解除に失敗しました。" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
