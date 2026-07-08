/**
 * DMM(FANZA)アフィリエイトAPI(公式API)から作品データを取得し、Supabaseへ保存するスタンドアロンスクリプト。
 * スクレイピングは一切行わない（docs/architecture.md「出演者情報の扱い方針」の原則をカタログ取得にも適用）。
 * 出演者はDMM側が公式に返す iteminfo.actress のみを「公式クレジット」として保存する。
 * それ以外の出典（推測・画像照合・ユーザー投稿）による出演者補完は行わない。
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
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local が無い場合はシェル側で環境変数がexport済みという想定でそのまま進める。
}

const DMM_ITEM_LIST_URL = "https://api.dmm.com/affiliate/v3/ItemList";
const MAX_HITS_PER_REQUEST = 100;
const CONCURRENCY = 4;

interface DmmTag {
  id?: string;
  name?: string;
}

interface DmmItem {
  content_id?: string;
  title?: string;
  URL?: string;
  affiliateURL?: string;
  imageURL?: { large?: string; list?: string; small?: string };
  date?: string;
  volume?: string;
  prices?: { price?: string };
  iteminfo?: {
    genre?: DmmTag[];
    series?: DmmTag[];
    maker?: DmmTag[];
    label?: DmmTag[];
    actress?: DmmTag[];
  };
}

interface DmmItemListResponse {
  result?: {
    status?: number;
    result_count?: number;
    items?: DmmItem[];
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`環境変数 ${name} が設定されていません。`);
  return value;
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

async function fetchDmmItemsPage(
  apiId: string,
  affiliateId: string,
  keyword: string | null,
  hits: number,
  offset: number
): Promise<DmmItem[]> {
  const url = new URL(DMM_ITEM_LIST_URL);
  url.searchParams.set("api_id", apiId);
  url.searchParams.set("affiliate_id", affiliateId);
  url.searchParams.set("site", "FANZA");
  url.searchParams.set("service", "digital");
  url.searchParams.set("floor", "videoa");
  url.searchParams.set("hits", String(Math.min(hits, MAX_HITS_PER_REQUEST)));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("sort", "date");
  if (keyword) url.searchParams.set("keyword", keyword);
  url.searchParams.set("output", "json");

  const response = await fetch(url.toString());
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`DMM ItemList API 失敗 (status=${response.status}): ${body}`);
  }
  const json = (await response.json()) as DmmItemListResponse;
  return json.result?.items ?? [];
}

// 1リクエストあたり最大100件のため、目標件数に届くまでoffsetをずらして取得する。
// DMM APIへの過度な連続アクセスを避けるため、ページ間に短い間隔を空ける。
async function fetchDmmItems(apiId: string, affiliateId: string, keyword: string | null, totalWanted: number): Promise<DmmItem[]> {
  const items: DmmItem[] = [];
  let offset = 1; // DMM ItemList APIのoffsetは1始まり。
  while (items.length < totalWanted) {
    const pageSize = Math.min(MAX_HITS_PER_REQUEST, totalWanted - items.length);
    const page = await fetchDmmItemsPage(apiId, affiliateId, keyword, pageSize, offset);
    if (page.length === 0) break; // これ以上結果が無い。
    items.push(...page);
    offset += page.length;
    if (page.length < pageSize) break; // 最終ページ。
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return items;
}

// DMM側の数値IDをそのままslugにする（日本語名のスラグ化による衝突・表記ゆれを避けるため）。
function dmmSlug(prefix: string, id: string | undefined, fallbackName: string | undefined): string {
  if (id) return `dmm-${prefix}-${id}`;
  return `dmm-${prefix}-${(fallbackName ?? "unknown").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`;
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
  contentId: string;
  status: "upserted" | "skipped" | "error";
  detail?: string;
}

async function processItem(item: DmmItem, supabase: SupabaseClient, fanzaPlatformId: string): Promise<ProcessResult> {
  const contentId = item.content_id;
  if (!contentId || !item.title) {
    return { contentId: contentId ?? "(不明)", status: "skipped", detail: "content_idまたはtitleが空です。" };
  }

  try {
    const makerTag = item.iteminfo?.maker?.[0];
    const labelTag = item.iteminfo?.label?.[0];
    const seriesTag = item.iteminfo?.series?.[0];

    const makerId = makerTag
      ? await upsertAndGetId(supabase, "makers", "slug", {
          slug: dmmSlug("maker", makerTag.id, makerTag.name),
          name: makerTag.name ?? "不明メーカー",
        })
      : null;

    const labelId =
      labelTag && makerId
        ? await upsertAndGetId(supabase, "labels", "slug", {
            slug: dmmSlug("label", labelTag.id, labelTag.name),
            maker_id: makerId,
            name: labelTag.name ?? "不明レーベル",
          })
        : null;

    const seriesId = seriesTag
      ? await upsertAndGetId(supabase, "series", "slug", {
          slug: dmmSlug("series", seriesTag.id, seriesTag.name),
          maker_id: makerId,
          label_id: labelId,
          name: seriesTag.name ?? "不明シリーズ",
        })
      : null;

    // 発売日は "2020-01-01 00:00:00" 形式で返る。日付部分だけ使う。
    const releaseDate = item.date?.split(" ")[0] ?? null;
    const runtimeMinutes = item.volume ? Number.parseInt(item.volume, 10) || null : null;

    const workId = await upsertAndGetId(supabase, "works", "product_code", {
      slug: contentId,
      title: item.title,
      product_code: contentId,
      maker_id: makerId,
      label_id: labelId,
      series_id: seriesId,
      release_date: releaseDate,
      runtime_minutes: runtimeMinutes,
      permitted_thumbnail_url: item.imageURL?.large ?? item.imageURL?.list ?? null,
      thumbnail_license: "DMMアフィリエイトAPI提供画像（アフィリエイト用途での使用許諾範囲内）",
      updated_at: new Date().toISOString(),
    });

    // ジャンル(タグ)の紐付け。
    for (const genreTag of item.iteminfo?.genre ?? []) {
      const genreId = await upsertAndGetId(supabase, "genres", "slug", {
        slug: dmmSlug("genre", genreTag.id, genreTag.name),
        name: genreTag.name ?? "不明ジャンル",
      });
      await supabase.from("work_genres").upsert({ work_id: workId, genre_id: genreId }, { onConflict: "work_id,genre_id" });
    }

    // 出演者。DMM側が返す公式クレジットのみを保存する（第三者による補完は行わない）。
    const actressTags = item.iteminfo?.actress ?? [];
    for (let i = 0; i < actressTags.length; i++) {
      const actressTag = actressTags[i];
      if (!actressTag.name) continue;
      const actressId = await upsertAndGetId(supabase, "actresses", "slug", {
        slug: dmmSlug("actress", actressTag.id, actressTag.name),
        name: actressTag.name,
        updated_at: new Date().toISOString(),
      });
      await supabase.from("work_actress").upsert(
        {
          work_id: workId,
          actress_id: actressId,
          billing_order: i,
          credit_name: actressTag.name,
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

    // 配信/販売リンク（FANZA）。affiliateURLがあればそちらをリンク先にする(DMM側の計測に乗る)。
    const linkUrl = item.affiliateURL ?? item.URL;
    if (linkUrl) {
      await supabase.from("work_distribution_links").upsert(
        {
          work_id: workId,
          platform_id: fanzaPlatformId,
          platform_product_code: contentId,
          platform_work_url: linkUrl,
          availability_status: "available",
          offer_type: "purchase",
          intent_type: "ppv_primary",
          cta_priority: 10,
          // DMMのprice文字列は既に"2180~"のように末尾へ「~」を含む場合があるため、
          // 素朴に連結すると「2180~円〜」のような二重表記になる。末尾の~を落としてから整形する。
          price_note: item.prices?.price ? `参考価格 ${item.prices.price.replace(/~$/, "")}円〜` : null,
          checked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "work_id,platform_id,platform_product_code" }
      );
    }

    return { contentId, status: "upserted" };
  } catch (error) {
    return {
      contentId,
      status: "error",
      detail: error instanceof Error ? error.message : JSON.stringify(error, Object.getOwnPropertyNames(error as object)),
    };
  }
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

  const apiId = requireEnv("DMM_API_ID");
  const affiliateId = requireEnv("DMM_AFFILIATE_ID");
  const supabase = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });

  console.log(`[sync-dmm] キーワード="${keyword ?? "(絞り込みなし・新着順)"}" で最大${hits}件を取得します`);
  const items = await fetchDmmItems(apiId, affiliateId, keyword, hits);
  console.log(`[sync-dmm] ${items.length}件の候補を取得しました`);

  const fanzaPlatformId = await getPlatformIdBySlug(supabase, "fanza-dmm");

  const results = await mapWithConcurrency(items, CONCURRENCY, (item) => processItem(item, supabase, fanzaPlatformId));

  const upserted = results.filter((r) => r.status === "upserted").length;
  const skipped = results.filter((r) => r.status === "skipped");
  const errored = results.filter((r) => r.status === "error");

  console.log(`[sync-dmm] 完了: 保存 ${upserted}件 / スキップ ${skipped.length}件 / 失敗 ${errored.length}件`);
  for (const r of [...skipped, ...errored]) {
    console.warn(`  - ${r.contentId}: ${r.status} ${r.detail ?? ""}`);
  }
}

main().catch((error) => {
  console.error("[sync-dmm] 致命的なエラーが発生しました", error);
  process.exitCode = 1;
});
