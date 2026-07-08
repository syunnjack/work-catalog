/**
 * DMM(FANZA)アフィリエイトAPIから作品データを取得しSupabaseへ保存するCLI。
 * 実処理は src/lib/dmm-sync.ts を共有する（Vercel Cron経由の自動実行 src/app/api/cron/sync-dmm/route.ts
 * と同じロジック）。
 *
 * 使い方:
 *   npx tsx scripts/sync-dmm.ts <キーワード|"-"> [取得件数(既定20, 100件ごとに自動ページング)]
 *   例) npx tsx scripts/sync-dmm.ts "サンプルレーベル" 30
 *   キーワードを "-" にすると絞り込み無し（新着順）で幅広く取得する。
 *   例) npx tsx scripts/sync-dmm.ts - 300
 *
 * 必要な環境変数（.env.local から読み込む）:
 *   DMM_API_ID, DMM_AFFILIATE_ID, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { requireEnv, runDmmSync } from "../src/lib/dmm-sync";

try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local が無い場合はシェル側で環境変数がexport済みという想定でそのまま進める。
}

async function main() {
  const [keywordArg, hitsArg] = process.argv.slice(2);
  if (!keywordArg) {
    console.error('使い方: npx tsx scripts/sync-dmm.ts "<キーワード>|-" [取得件数(既定20)]');
    process.exitCode = 1;
    return;
  }
  const keyword = keywordArg === "-" ? null : keywordArg;
  const hits = hitsArg ? Number.parseInt(hitsArg, 10) : 20;

  console.log(`[sync-dmm] キーワード="${keyword ?? "(絞り込みなし・新着順)"}" で最大${hits}件を取得します`);

  const summary = await runDmmSync({
    apiId: requireEnv("DMM_API_ID"),
    affiliateId: requireEnv("DMM_AFFILIATE_ID"),
    supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    keyword,
    totalWanted: hits,
  });

  console.log(`[sync-dmm] ${summary.fetched}件の候補を取得しました`);
  console.log(`[sync-dmm] 完了: 保存 ${summary.upserted}件 / スキップ ${summary.skipped}件 / 失敗 ${summary.errored}件`);
  for (const r of summary.details) {
    if (r.status !== "upserted") console.warn(`  - ${r.contentId}: ${r.status} ${r.detail ?? ""}`);
  }
}

main().catch((error) => {
  console.error("[sync-dmm] 致命的なエラーが発生しました", error);
  process.exitCode = 1;
});
