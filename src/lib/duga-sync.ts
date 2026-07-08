// DUGAアフィリエイトが配布するCSV商品フィードから作品データを取得しSupabaseへ保存する共通ロジック。
// scripts/sync-duga.ts（手動CLI実行）が使う。DUGAはDMM(FANZA)のようなJSON APIを提供していないため、
// ダウンロード済みのCSVファイルをローカルパスで指定して読み込む方式を取る。スクレイピングは行わず、
// DUGAが配布するCSV内の情報のみを「公式クレジット」として保存する
// （docs/architecture.md「出演者情報の扱い方針」の原則をカタログ取得にも適用）。
import { readFileSync } from "node:fs";
import iconv from "iconv-lite";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DUGA_PLATFORM_SLUG = "duga-apex";
const CONCURRENCY = 4;

const EXPECTED_HEADER = [
  "商品ID",
  "タイトル",
  "紹介文",
  "レーベル名",
  "メーカー名",
  "カテゴリ",
  "価格",
  "レーベル種別",
  "出演者",
  "公開開始日",
  "商品URL",
];

export interface DugaRow {
  productId: string;
  title: string;
  description: string;
  labelName: string;
  makerName: string;
  category: string;
  price: string;
  labelType: string;
  actresses: string;
  releaseDate: string;
  productUrl: string;
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`環境変数 ${name} が設定されていません。`);
  return value;
}

// RFC4180準拠の簡易CSVパーサー。DUGAのCSVは紹介文フィールドに改行やカンマ、
// レーベル種別によっては二重引用符を含み得るため、単純なsplit(",")では壊れる。
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\r") {
      i++;
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

export function readDugaCsvFile(filePath: string, encoding: "sjis" | "utf8"): DugaRow[] {
  const buffer = readFileSync(filePath);
  const text = encoding === "sjis" ? iconv.decode(buffer, "Shift_JIS") : buffer.toString("utf8");
  const rows = parseCsv(text);
  if (rows.length === 0) return [];

  const header = rows[0];
  const headerMismatch = EXPECTED_HEADER.some((expected, idx) => header[idx]?.trim() !== expected);
  if (headerMismatch) {
    throw new Error(
      `CSVヘッダーが想定形式と一致しません。期待: ${EXPECTED_HEADER.join(",")} / 実際: ${header.join(",")}`
    );
  }

  return rows
    .slice(1)
    .filter((cols) => cols.length >= EXPECTED_HEADER.length && cols[0]?.trim())
    .map((cols) => ({
      productId: cols[0].trim(),
      title: cols[1].trim(),
      description: cols[2].trim(),
      labelName: cols[3].trim(),
      makerName: cols[4].trim(),
      category: cols[5].trim(),
      price: cols[6].trim(),
      labelType: cols[7].trim(),
      actresses: cols[8].trim(),
      releaseDate: cols[9].trim(),
      productUrl: cols[10].trim(),
    }));
}

// "2012年12月03日" -> "2012-12-03"
function parseJapaneseDate(value: string): string | null {
  const m = value.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
  if (!m) return null;
  const [, y, mo, d] = m;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

// DUGAのCSVはメーカー/レーベル/ジャンル/出演者に安定したID を持たないため、名前をそのまま
// スラグ化する。DMM側(dmm-sync.ts)のASCII限定フォールバックをそのまま流用すると、日本語名が
// すべて"unknown"に丸められ衝突するため、Unicodeの文字/数字をそのまま活かした専用実装にする。
function dugaSlug(prefix: string, name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return `duga-${prefix}-${base || "unknown"}`;
}

function mapOfferType(labelType: string): "purchase" | "rental" | "subscription" | "free_sample" | "unknown" {
  if (labelType.includes("PPV")) return "purchase";
  return "unknown";
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function upsertAndGetId(
  supabase: SupabaseClient,
  table: string,
  onConflict: string,
  payload: Record<string, unknown>
): Promise<string> {
  const { data, error } = await supabase.from(table).upsert(payload, { onConflict }).select("id").single();
  if (error) throw error;
  return (data as { id: string }).id;
}

async function getPlatformIdBySlug(supabase: SupabaseClient, slug: string): Promise<string> {
  const { data, error } = await supabase.from("distribution_platforms").select("id").eq("slug", slug).single();
  if (error || !data) throw new Error(`distribution_platforms(slug=${slug})が見つかりません。schema.sqlのseedを確認してください。`);
  return (data as { id: string }).id;
}

interface ProcessResult {
  productId: string;
  status: "upserted" | "skipped" | "error";
  detail?: string;
}

async function processRow(row: DugaRow, supabase: SupabaseClient, dugaPlatformId: string): Promise<ProcessResult> {
  if (!row.productId || !row.title) {
    return { productId: row.productId || "(不明)", status: "skipped", detail: "商品IDまたはタイトルが空です。" };
  }

  try {
    const makerId = row.makerName
      ? await upsertAndGetId(supabase, "makers", "slug", {
          slug: dugaSlug("maker", row.makerName),
          name: row.makerName,
        })
      : null;

    const labelId =
      row.labelName && makerId
        ? await upsertAndGetId(supabase, "labels", "slug", {
            slug: dugaSlug("label", row.labelName),
            maker_id: makerId,
            name: row.labelName,
          })
        : null;

    const workId = await upsertAndGetId(supabase, "works", "product_code", {
      slug: row.productId,
      title: row.title,
      product_code: row.productId,
      maker_id: makerId,
      label_id: labelId,
      release_date: parseJapaneseDate(row.releaseDate),
      seo_description: row.description || null,
      updated_at: new Date().toISOString(),
    });

    if (row.category) {
      const genreId = await upsertAndGetId(supabase, "genres", "slug", {
        slug: dugaSlug("genre", row.category),
        name: row.category,
      });
      await supabase.from("work_genres").upsert({ work_id: workId, genre_id: genreId }, { onConflict: "work_id,genre_id" });
    }

    // 出演者。DUGAのCSVが返す公式クレジットのみを保存する（第三者による補完は行わない）。
    const actressNames = row.actresses
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    for (let i = 0; i < actressNames.length; i++) {
      const name = actressNames[i];
      const actressId = await upsertAndGetId(supabase, "actresses", "slug", {
        slug: dugaSlug("actress", name),
        name,
        updated_at: new Date().toISOString(),
      });
      await supabase.from("work_actress").upsert(
        {
          work_id: workId,
          actress_id: actressId,
          billing_order: i,
          credit_name: name,
          source_type: "official_metadata",
        },
        { onConflict: "work_id,actress_id" }
      );
      // works_countはトリガーを持たないため、この場で実カウントを取り直して更新する。
      const { count } = await supabase
        .from("work_actress")
        .select("*", { count: "exact", head: true })
        .eq("actress_id", actressId);
      await supabase.from("actresses").update({ works_count: count ?? 0 }).eq("id", actressId);
    }

    if (row.productUrl) {
      await supabase.from("work_distribution_links").upsert(
        {
          work_id: workId,
          platform_id: dugaPlatformId,
          platform_product_code: row.productId,
          platform_work_url: row.productUrl,
          availability_status: "available",
          offer_type: mapOfferType(row.labelType),
          intent_type: "ppv_primary",
          cta_priority: 10,
          price_note: row.price ? `参考価格 ${row.price}円` : null,
          checked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "work_id,platform_id,platform_product_code" }
      );
    }

    return { productId: row.productId, status: "upserted" };
  } catch (error) {
    return {
      productId: row.productId,
      status: "error",
      detail: error instanceof Error ? error.message : JSON.stringify(error, Object.getOwnPropertyNames(error as object)),
    };
  }
}

export interface DugaSyncSummary {
  parsed: number;
  upserted: number;
  skipped: number;
  errored: number;
  details: ProcessResult[];
}

export async function runDugaSync(options: {
  filePath: string;
  encoding: "sjis" | "utf8";
  dryRun?: boolean;
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
}): Promise<DugaSyncSummary> {
  const rows = readDugaCsvFile(options.filePath, options.encoding);

  if (options.dryRun) {
    return {
      parsed: rows.length,
      upserted: 0,
      skipped: rows.length,
      errored: 0,
      details: rows.map((row) => ({ productId: row.productId, status: "skipped", detail: "dry-run" })),
    };
  }

  if (!options.supabaseUrl || !options.supabaseServiceRoleKey) {
    throw new Error("Supabase接続情報(NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)が指定されていません。");
  }

  const supabase = createClient(options.supabaseUrl, options.supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
  const dugaPlatformId = await getPlatformIdBySlug(supabase, DUGA_PLATFORM_SLUG);
  const results = await mapWithConcurrency(rows, CONCURRENCY, (row) => processRow(row, supabase, dugaPlatformId));

  return {
    parsed: rows.length,
    upserted: results.filter((r) => r.status === "upserted").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    errored: results.filter((r) => r.status === "error").length,
    details: results,
  };
}
