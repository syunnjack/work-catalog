import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getAuthenticatedUser, isAdminEmail } from "@/lib/auth";
import { makerSubmissionReviewSchema } from "@/lib/schemas";

// 審査結果(承認/却下)の登録。ここではmaker_submissions.statusの更新のみを行う。
// works/work_actress/aliasesへの反映は運営者が確認済みの提出内容を見ながら別途手動で行う。
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser(request);
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "権限がありません。" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = makerSubmissionReviewSchema.safeParse(await request.json().catch(() => null));
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
    .from("maker_submissions")
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
