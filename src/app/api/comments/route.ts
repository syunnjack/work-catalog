import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/lib/auth";
import { commentSchema } from "@/lib/schemas";
import { awardPoints } from "@/lib/points";

export async function GET(request: NextRequest) {
  const workId = request.nextUrl.searchParams.get("workId");
  if (!workId) {
    return NextResponse.json({ error: "workIdを指定してください。" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return NextResponse.json({ comments: [] }, { headers: { "Cache-Control": "s-maxage=60" } });
  }

  const { data, error } = await supabase
    .from("comments")
    .select("id, anonymous_name, body, like_count, created_at")
    .eq("work_id", workId)
    .eq("status", "visible")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "コメントの取得に失敗しました。" }, { status: 502 });
  }
  return NextResponse.json({ comments: data ?? [] }, { headers: { "Cache-Control": "s-maxage=60" } });
}

export async function POST(request: NextRequest) {
  const parsed = commentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  // 匿名投稿を許容するため未ログインでも投稿できるが、ログイン済みならuser_idを紐づける。
  const userId = await getAuthenticatedUserId(request);

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "サーバー側の設定不備によりリクエストを処理できません。" }, { status: 500 });
  }

  const { error } = await supabase.from("comments").insert({
    work_id: parsed.data.workId,
    user_id: userId,
    anonymous_name: userId ? null : (parsed.data.anonymousName ?? "名無しさん"),
    body: parsed.data.body,
  });

  if (error) {
    return NextResponse.json({ error: "コメントの投稿に失敗しました。" }, { status: 502 });
  }
  if (userId) {
    await awardPoints(supabase, userId, "comment_posted", parsed.data.workId);
  }
  return NextResponse.json({ ok: true });
}
