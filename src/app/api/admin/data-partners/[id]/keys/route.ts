import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getAuthenticatedUser, isAdminEmail } from "@/lib/auth";
import { dataPartnerApiKeyIssueSchema } from "@/lib/schemas";
import { hashApiKey } from "@/lib/partner-api";

// APIキー発行。平文キーはこのレスポンスでのみ一度返し、DBにはハッシュのみ保存する
// (docs/collector-data-services.md「data_partner_api_keys」)。
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser(request);
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "権限がありません。" }, { status: 403 });
  }

  const { id: partnerId } = await params;
  const parsed = dataPartnerApiKeyIssueSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "サーバー側の設定不備によりリクエストを処理できません。" }, { status: 500 });
  }

  const { data: partner } = await supabase.from("data_partners").select("review_status").eq("id", partnerId).maybeSingle();
  if (!partner) {
    return NextResponse.json({ error: "契約先が見つかりません。" }, { status: 404 });
  }
  if (partner.review_status !== "approved") {
    return NextResponse.json({ error: "審査状況がapprovedの契約先にのみAPIキーを発行できます。" }, { status: 400 });
  }

  const plainKey = `dp_live_${randomBytes(32).toString("hex")}`;

  const { error } = await supabase.from("data_partner_api_keys").insert({
    partner_id: partnerId,
    key_hash: hashApiKey(plainKey),
    scopes: parsed.data.scopes,
    status: "active",
  });

  if (error) {
    return NextResponse.json({ error: "APIキーの発行に失敗しました。" }, { status: 502 });
  }
  return NextResponse.json({ apiKey: plainKey, note: "このキーは今だけ表示されます。安全な方法で契約先に共有し、控えを残さないでください。" });
}
