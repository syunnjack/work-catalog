import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getAuthenticatedUser, isAdminEmail } from "@/lib/auth";
import { dataPartnerSchema } from "@/lib/schemas";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser(request);
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "権限がありません。" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = dataPartnerSchema.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "サーバー側の設定不備によりリクエストを処理できません。" }, { status: 500 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.companyName) update.company_name = parsed.data.companyName;
  if (parsed.data.contactName) update.contact_name = parsed.data.contactName;
  if (parsed.data.contactEmail) update.contact_email = parsed.data.contactEmail;
  if (parsed.data.plan) update.plan = parsed.data.plan;
  if (parsed.data.reviewStatus) update.review_status = parsed.data.reviewStatus;
  if (parsed.data.contractNote !== undefined) update.contract_note = parsed.data.contractNote;

  const { error } = await supabase.from("data_partners").update(update).eq("id", id);
  if (error) {
    return NextResponse.json({ error: "契約先の更新に失敗しました。" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
