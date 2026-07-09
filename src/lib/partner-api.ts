// 法人向けデータ/APIサービス(第三の収益核、docs/collector-data-services.md)共通ロジック。
// 提供先は審査済みの法人のみ。ユーザーの個人データ(閲覧ログ・検索ログ・お気に入り・
// コメント投稿者情報)、maker_submissionsの未承認情報は一切扱わない。
import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

type SupabaseClient = ReturnType<typeof getSupabaseServerClient>;

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

// プランごとの1日あたり上限。暫定値であり、実際の契約数・負荷を見て調整する前提
// (docs「実装優先順位」5. 決済代行との連携、契約管理の自動化、より前段の仮の値)。
const DAILY_RATE_LIMITS: Record<string, number> = {
  starter: 200,
  pro: 5000,
  enterprise: 50000,
};

interface PartnerRow {
  id: string;
  plan: string;
  review_status: string;
}

async function logUsage(supabase: SupabaseClient, partnerId: string, apiKeyId: string, endpoint: string, status: number) {
  await supabase.from("data_partner_api_usage_logs").insert({
    partner_id: partnerId,
    api_key_id: apiKeyId,
    endpoint,
    response_status: status,
  });
}

export async function withPartnerAuth(
  request: NextRequest,
  endpoint: string,
  options: { requiredScope?: string; requiredPlans?: string[] },
  handler: (ctx: { supabase: SupabaseClient; partnerId: string }) => Promise<NextResponse>
): Promise<NextResponse> {
  let supabase: SupabaseClient;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "サーバー側の設定不備によりリクエストを処理できません。" }, { status: 500 });
  }

  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "X-API-Keyヘッダーが必要です。" }, { status: 401 });
  }

  const { data: keyRow } = await supabase
    .from("data_partner_api_keys")
    .select("id, status, scopes, data_partners(id, plan, review_status)")
    .eq("key_hash", hashApiKey(apiKey))
    .maybeSingle();

  const partner = (keyRow?.data_partners as unknown as PartnerRow | null) ?? null;

  if (!keyRow || keyRow.status !== "active" || !partner || partner.review_status !== "approved") {
    return NextResponse.json({ error: "無効なAPIキーです。" }, { status: 401 });
  }

  const scopes = (keyRow.scopes as string[] | null) ?? [];
  if (options.requiredScope && !scopes.includes(options.requiredScope)) {
    await logUsage(supabase, partner.id, keyRow.id, endpoint, 403);
    return NextResponse.json({ error: `このAPIキーには${options.requiredScope}スコープがありません。` }, { status: 403 });
  }
  if (options.requiredPlans && !options.requiredPlans.includes(partner.plan)) {
    await logUsage(supabase, partner.id, keyRow.id, endpoint, 403);
    return NextResponse.json({ error: "このプランでは利用できないエンドポイントです。" }, { status: 403 });
  }

  const limit = DAILY_RATE_LIMITS[partner.plan] ?? DAILY_RATE_LIMITS.starter;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("data_partner_api_usage_logs")
    .select("*", { count: "exact", head: true })
    .eq("api_key_id", keyRow.id)
    .gte("called_at", since);
  if ((count ?? 0) >= limit) {
    await logUsage(supabase, partner.id, keyRow.id, endpoint, 429);
    return NextResponse.json({ error: "レート制限を超えました。しばらくしてから再度お試しください。" }, { status: 429 });
  }

  const response = await handler({ supabase, partnerId: partner.id });
  await logUsage(supabase, partner.id, keyRow.id, endpoint, response.status);
  return response;
}
