import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/lib/auth";
import { favoriteSchema } from "@/lib/schemas";
import { awardPoints } from "@/lib/points";

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const parsed = favoriteSchema.safeParse(await request.json().catch(() => null));
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
    .from("favorites")
    .upsert({ user_id: userId, work_id: parsed.data.workId }, { onConflict: "user_id,work_id" });

  if (error) {
    return NextResponse.json({ error: "お気に入りの登録に失敗しました。" }, { status: 502 });
  }
  await awardPoints(supabase, userId, "favorite_added", parsed.data.workId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const parsed = favoriteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "サーバー側の設定不備によりリクエストを処理できません。" }, { status: 500 });
  }

  const { error } = await supabase.from("favorites").delete().eq("user_id", userId).eq("work_id", parsed.data.workId);
  if (error) {
    return NextResponse.json({ error: "お気に入りの削除に失敗しました。" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
