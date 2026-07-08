/**
 * DUGAアフィリエイトが配布するCSV商品フィードを読み込みSupabaseへ保存するCLI。
 * 実処理は src/lib/duga-sync.ts を使う。DUGAはDMM(FANZA)のようなJSON APIを提供していないため、
 * ダウンロード済みのCSVファイルをローカルパスで指定する運用とする（自動Cron化はしない）。
 *
 * 使い方:
 *   npx tsx scripts/sync-duga.ts <CSVファイルパス> [--encoding=sjis|utf8(既定sjis)] [--dry-run]
 *   例) npx tsx scripts/sync-duga.ts ./duga-items.csv --dry-run
 *
 * 必要な環境変数（.env.local から読み込む。--dry-run 時は不要）:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { requireEnv, runDugaSync } from "../src/lib/duga-sync";

try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local が無い場合はシェル側で環境変数がexport済みという想定でそのまま進める。
}

async function main() {
  const args = process.argv.slice(2);
  const filePath = args.find((arg) => !arg.startsWith("--"));
  const dryRun = args.includes("--dry-run");
  const encodingArg = args.find((arg) => arg.startsWith("--encoding="));
  const encoding = encodingArg?.split("=")[1] === "utf8" ? "utf8" : "sjis";

  if (!filePath) {
    console.error("使い方: npx tsx scripts/sync-duga.ts <CSVファイルパス> [--encoding=sjis|utf8] [--dry-run]");
    process.exitCode = 1;
    return;
  }

  console.log(`[sync-duga] ${filePath} (encoding=${encoding}) を読み込みます${dryRun ? "（dry-run）" : ""}`);

  const summary = await runDugaSync({
    filePath,
    encoding,
    dryRun,
    supabaseUrl: dryRun ? undefined : requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseServiceRoleKey: dryRun ? undefined : requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  });

  console.log(`[sync-duga] ${summary.parsed}行を読み込みました`);
  console.log(`[sync-duga] 完了: 保存 ${summary.upserted}件 / スキップ ${summary.skipped}件 / 失敗 ${summary.errored}件`);
  for (const r of summary.details) {
    if (r.status !== "upserted") console.warn(`  - ${r.productId}: ${r.status} ${r.detail ?? ""}`);
  }
}

main().catch((error) => {
  console.error("[sync-duga] 致命的なエラーが発生しました", error);
  process.exitCode = 1;
});
