import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { makerSubmissionSchema } from "@/lib/schemas";

// メーカー/レーベルからの公式情報提出・修正依頼窓口。第三者による出演者の推測・特定ではなく、
// 権利者本人からの公式情報提供のみを受け付ける（docs/architecture.md「メーカー公式提出チャネル」）。
// status=pendingで保存され、担当者が提出元を確認できた場合のみ管理画面からapprovedにする。
export async function POST(request: NextRequest) {
  const parsed = makerSubmissionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "リクエストが不正です。", issues: parsed.error.issues }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "サーバー側の設定不備によりリクエストを処理できません。" }, { status: 500 });
  }

  const { error } = await supabase.from("maker_submissions").insert({
    maker_id: parsed.data.makerId ?? null,
    work_id: parsed.data.workId ?? null,
    submitter_organization: parsed.data.submitterOrganization,
    submitter_contact: parsed.data.submitterContact,
    submission_type: parsed.data.submissionType,
    payload: parsed.data.payload,
    status: "pending",
  });

  if (error) {
    return NextResponse.json({ error: "提出に失敗しました。" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, note: "提出内容は担当者が確認後に反映されます。" });
}
