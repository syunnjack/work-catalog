import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getAuthenticatedUser, isAdminEmail } from "@/lib/auth";

// APIキーの即時失効。規約違反判明時等、審査を経ずに即座に止められるようにする
// (docs/collector-data-services.md「運用ルール」)。
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; keyId: string }> }) {
  const user = await getAuthenticatedUser(request);
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "権限がありません。" }, { status: 403 });
  }

  const { id: partnerId, keyId } = await params;

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "サーバー側の設定不備によりリクエストを処理できません。" }, { status: 500 });
  }

  const { error } = await supabase
    .from("data_partner_api_keys")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("partner_id", partnerId);

  if (error) {
    return NextResponse.json({ error: "APIキーの失効に失敗しました。" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
