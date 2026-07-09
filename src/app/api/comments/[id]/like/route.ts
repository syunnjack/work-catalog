import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/lib/auth";
import { awardPoints } from "@/lib/points";

// comments.like_countはトリガーを持たないため、いいねの追加/削除の都度、実カウントを
// 取り直して更新する(dmm-sync/duga-syncのactresses.works_count更新と同じパターン)。
async function refreshLikeCount(supabase: ReturnType<typeof getSupabaseServerClient>, commentId: string) {
  const { count } = await supabase.from("comment_likes").select("*", { count: "exact", head: true }).eq("comment_id", commentId);
  await supabase.from("comments").update({ like_count: count ?? 0 }).eq("id", commentId);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }
  const { id: commentId } = await params;

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "サーバー側の設定不備によりリクエストを処理できません。" }, { status: 500 });
  }

  const { error } = await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: userId });
  // 23505 = unique_violation(既にいいね済み)。この場合もポイントは付与しない。
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: "いいねに失敗しました。" }, { status: 502 });
  }
  await refreshLikeCount(supabase, commentId);
  if (!error) {
    await awardPoints(supabase, userId, "comment_liked", commentId);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }
  const { id: commentId } = await params;

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "サーバー側の設定不備によりリクエストを処理できません。" }, { status: 500 });
  }

  const { error } = await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", userId);
  if (error) {
    return NextResponse.json({ error: "いいねの解除に失敗しました。" }, { status: 502 });
  }
  await refreshLikeCount(supabase, commentId);
  return NextResponse.json({ ok: true });
}
