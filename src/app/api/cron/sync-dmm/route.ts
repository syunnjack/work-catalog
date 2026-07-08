import { NextRequest, NextResponse } from "next/server";
import { runDmmSync } from "@/lib/dmm-sync";

// Vercel Cron専用エンドポイント。CRON_SECRETをVercelの環境変数に設定していると、
// Vercelがスケジュール実行時に自動で `Authorization: Bearer <CRON_SECRET>` を付与するため、
// それを検証することで第三者からの不正呼び出しを防ぐ。
// https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
export const maxDuration = 60;

const ITEMS_PER_RUN = 100;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const summary = await runDmmSync({
      apiId: process.env.DMM_API_ID ?? "",
      affiliateId: process.env.DMM_AFFILIATE_ID ?? "",
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
      keyword: null, // 絞り込み無し・新着順で最新作を取り込む。
      totalWanted: ITEMS_PER_RUN,
    });

    return NextResponse.json({
      ok: true,
      fetched: summary.fetched,
      upserted: summary.upserted,
      skipped: summary.skipped,
      errored: summary.errored,
    });
  } catch (error) {
    console.error("[cron/sync-dmm] failed", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
