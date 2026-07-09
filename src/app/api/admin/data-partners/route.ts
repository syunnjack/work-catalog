import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getAuthenticatedUser, isAdminEmail } from "@/lib/auth";
import { dataPartnerSchema } from "@/lib/schemas";

// 法人向けデータ/APIサービス(第三の核)の契約先一覧・新規登録。
// 用途審査(本人確認・利用目的ヒアリング)はシステム外で行い、その結果をreviewStatusとして記録する。
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "権限がありません。" }, { status: 403 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "サーバー側の設定不備によりリクエストを処理できません。" }, { status: 500 });
  }

  const { data: partners, error } = await supabase.from("data_partners").select("*").order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: "契約先の取得に失敗しました。" }, { status: 502 });
  }

  const { data: keys } = await supabase
    .from("data_partner_api_keys")
    .select("id, partner_id, scopes, status, created_at, revoked_at");

  return NextResponse.json({ partners: partners ?? [], keys: keys ?? [] });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "権限がありません。" }, { status: 403 });
  }

  const parsed = dataPartnerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "サーバー側の設定不備によりリクエストを処理できません。" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("data_partners")
    .insert({
      company_name: parsed.data.companyName,
      contact_name: parsed.data.contactName,
      contact_email: parsed.data.contactEmail,
      plan: parsed.data.plan,
      review_status: parsed.data.reviewStatus,
      contract_note: parsed.data.contractNote ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "契約先の登録に失敗しました。" }, { status: 502 });
  }
  return NextResponse.json({ partner: data });
}
