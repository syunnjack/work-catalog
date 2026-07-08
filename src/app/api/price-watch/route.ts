import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/lib/auth";
import { priceWatchSchema } from "@/lib/schemas";

// 中古相場(第二の核)の価格変動通知登録。再訪問導線として使う。
export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const parsed = priceWatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "サーバー側の設定不備によりリクエストを処理できません。" }, { status: 500 });
  }

  const { error } = await supabase.from("price_watch_subscriptions").upsert(
    {
      user_id: userId,
      work_id: parsed.data.workId,
      notify_below_price_yen: parsed.data.notifyBelowPriceYen ?? null,
    },
    { onConflict: "user_id,work_id" }
  );

  if (error) {
    return NextResponse.json({ error: "価格通知の登録に失敗しました。" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const parsed = priceWatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "サーバー側の設定不備によりリクエストを処理できません。" }, { status: 500 });
  }

  const { error } = await supabase
    .from("price_watch_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("work_id", parsed.data.workId);

  if (error) {
    return NextResponse.json({ error: "価格通知の解除に失敗しました。" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
