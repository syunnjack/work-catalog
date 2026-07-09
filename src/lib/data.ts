// データアクセス層。Supabaseへの接続を優先し、環境変数未設定またはクエリ失敗時は
// lib/mock-data.tsのサンプルデータにフォールバックする（ローカル確認をすぐ始められるようにするため）。
// 本番運用時は、Supabaseにsupabase/schema.sqlを適用し、.env.localを設定すれば自動的に実データへ切り替わる。
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase";
import * as mock from "@/lib/mock-data";
import type {
  Actress,
  ActressWithWorks,
  DistributionPlatform,
  Genre,
  Label,
  Maker,
  Series,
  UsedMarketPlatform,
  Work,
  WorkWithRelations,
} from "@/types/database";

async function withFallback<T>(
  run: (supabase: SupabaseClient) => Promise<T>,
  fallback: () => T
): Promise<T> {
  let supabase: SupabaseClient;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return fallback();
  }
  try {
    return await run(supabase);
  } catch (error) {
    console.error("[data] supabaseクエリに失敗しました。モックデータにフォールバックします。", error);
    return fallback();
  }
}

// ---- Makers ----

export async function getMakers(): Promise<Maker[]> {
  return withFallback(
    async (supabase) => {
      const { data, error } = await supabase.from("makers").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as Maker[];
    },
    () => mock.mockMakers
  );
}

export interface MakerWorkCount {
  maker: Maker;
  workCount: number;
}

// topics(コラム/ランキング)向け。makersテーブルにwork countを持たないため、works側から集計する。
export async function getMakerWorkCounts(limit = 20): Promise<MakerWorkCount[]> {
  return withFallback(
    async (supabase) => {
      const [{ data: makers }, { data: works }] = await Promise.all([
        supabase.from("makers").select("*"),
        supabase.from("works").select("maker_id"),
      ]);
      const counts = new Map<string, number>();
      for (const work of (works ?? []) as Array<{ maker_id: string | null }>) {
        if (!work.maker_id) continue;
        counts.set(work.maker_id, (counts.get(work.maker_id) ?? 0) + 1);
      }
      return ((makers ?? []) as Maker[])
        .map((maker) => ({ maker, workCount: counts.get(maker.id) ?? 0 }))
        .sort((a, b) => b.workCount - a.workCount)
        .slice(0, limit);
    },
    () => {
      const counts = new Map<string, number>();
      for (const work of mock.mockWorks) {
        if (!work.maker_id) continue;
        counts.set(work.maker_id, (counts.get(work.maker_id) ?? 0) + 1);
      }
      return mock.mockMakers
        .map((maker) => ({ maker, workCount: counts.get(maker.id) ?? 0 }))
        .sort((a, b) => b.workCount - a.workCount)
        .slice(0, limit);
    }
  );
}

// topics(コラム)の「変な名前選手権」向け。名前で複数件まとめて引く。
export async function getMakersByNames(names: string[]): Promise<Maker[]> {
  return withFallback(
    async (supabase) => {
      const { data, error } = await supabase.from("makers").select("*").in("name", names);
      if (error) throw error;
      return (data ?? []) as Maker[];
    },
    () => mock.mockMakers.filter((m) => names.includes(m.name))
  );
}

export async function getMakerBySlug(slug: string): Promise<Maker | null> {
  return withFallback(
    async (supabase) => {
      const { data, error } = await supabase.from("makers").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return (data as Maker) ?? null;
    },
    () => mock.mockMakers.find((m) => m.slug === slug) ?? null
  );
}

// ---- Labels ----

export async function getLabels(): Promise<Label[]> {
  return withFallback(
    async (supabase) => {
      const { data, error } = await supabase.from("labels").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as Label[];
    },
    () => mock.mockLabels
  );
}

export async function getLabelBySlug(slug: string): Promise<Label | null> {
  return withFallback(
    async (supabase) => {
      const { data, error } = await supabase.from("labels").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return (data as Label) ?? null;
    },
    () => mock.mockLabels.find((l) => l.slug === slug) ?? null
  );
}

export async function getLabelsByMaker(makerId: string): Promise<Label[]> {
  return withFallback(
    async (supabase) => {
      const { data, error } = await supabase.from("labels").select("*").eq("maker_id", makerId).order("name");
      if (error) throw error;
      return (data ?? []) as Label[];
    },
    () => mock.mockLabels.filter((l) => l.maker_id === makerId)
  );
}

// ---- Series ----

export async function getSeriesList(): Promise<Series[]> {
  return withFallback(
    async (supabase) => {
      const { data, error } = await supabase.from("series").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as Series[];
    },
    () => mock.mockSeries
  );
}

export async function getSeriesBySlug(slug: string): Promise<Series | null> {
  return withFallback(
    async (supabase) => {
      const { data, error } = await supabase.from("series").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return (data as Series) ?? null;
    },
    () => mock.mockSeries.find((s) => s.slug === slug) ?? null
  );
}

// ---- Genres ----

export async function getGenres(): Promise<Genre[]> {
  return withFallback(
    async (supabase) => {
      const { data, error } = await supabase.from("genres").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as Genre[];
    },
    () => mock.mockGenres
  );
}

export async function getGenreBySlug(slug: string): Promise<Genre | null> {
  return withFallback(
    async (supabase) => {
      const { data, error } = await supabase.from("genres").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return (data as Genre) ?? null;
    },
    () => mock.mockGenres.find((g) => g.slug === slug) ?? null
  );
}

// ---- Platforms ----

export async function getPlatforms(): Promise<DistributionPlatform[]> {
  return withFallback(
    async (supabase) => {
      const { data, error } = await supabase
        .from("distribution_platforms")
        .select("*")
        .eq("status", "active")
        .order("priority");
      if (error) throw error;
      return (data ?? []) as DistributionPlatform[];
    },
    () => mock.mockDistributionPlatforms
  );
}

export async function getWorksByPlatform(platformId: string, limit = 24): Promise<Work[]> {
  return withFallback(
    async (supabase) => {
      const { data, error } = await supabase
        .from("work_distribution_links")
        .select("work_id, works(*)")
        .eq("platform_id", platformId)
        .limit(limit);
      if (error) throw error;
      type Row = { works: Work | null };
      return ((data ?? []) as unknown as Row[]).map((row) => row.works).filter((w): w is Work => Boolean(w));
    },
    () => {
      const workIds = new Set(mock.mockWorkDistributionLinks.filter((l) => l.platform_id === platformId).map((l) => l.work_id));
      return mock.mockWorks.filter((w) => workIds.has(w.id)).slice(0, limit);
    }
  );
}

export async function getPlatformBySlug(slug: string): Promise<DistributionPlatform | null> {
  return withFallback(
    async (supabase) => {
      const { data, error } = await supabase
        .from("distribution_platforms")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data as DistributionPlatform) ?? null;
    },
    () => mock.mockDistributionPlatforms.find((p) => p.slug === slug) ?? null
  );
}

// ---- Works ----

export async function getWorks(options: { limit?: number } = {}): Promise<Work[]> {
  const limit = options.limit ?? 50;
  return withFallback(
    async (supabase) => {
      const { data, error } = await supabase
        .from("works")
        .select("*")
        .order("release_date", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as Work[];
    },
    () => [...mock.mockWorks].sort((a, b) => (b.release_date ?? "").localeCompare(a.release_date ?? "")).slice(0, limit)
  );
}

// 出演者が公式クレジットされている作品のみを返す。未クレジット作品はcreditedがfalseの
// 空配列になるが、作品自体は取得できる（作品カタログはクレジット有無に関わらず存在する）。
export async function getWorkBySlug(slug: string): Promise<WorkWithRelations | null> {
  return withFallback(
    async (supabase) => {
      const { data: work, error } = await supabase.from("works").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      if (!work) return null;
      return buildWorkWithRelationsFromSupabase(supabase, work as Work);
    },
    () => buildMockWorkWithRelations(mock.mockWorks.find((w) => w.slug === slug))
  );
}

async function buildWorkWithRelationsFromSupabase(
  supabase: SupabaseClient,
  work: Work
): Promise<WorkWithRelations> {
  const [makerRes, labelRes, seriesRes, genresRes, castRes, linksRes, pricesRes, rarityRes] = await Promise.all([
    work.maker_id ? supabase.from("makers").select("*").eq("id", work.maker_id).maybeSingle() : Promise.resolve({ data: null }),
    work.label_id ? supabase.from("labels").select("*").eq("id", work.label_id).maybeSingle() : Promise.resolve({ data: null }),
    work.series_id ? supabase.from("series").select("*").eq("id", work.series_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("work_genres").select("genre_id, genres(*)").eq("work_id", work.id),
    supabase.from("work_actress").select("actress_id, credit_name, billing_order, actresses(*)").eq("work_id", work.id).order("billing_order"),
    supabase
      .from("work_distribution_links")
      .select("*, distribution_platforms(*)")
      .eq("work_id", work.id)
      .order("cta_priority"),
    supabase
      .from("work_market_prices")
      .select("*, used_market_platforms(*)")
      .eq("work_id", work.id)
      .order("observed_at", { ascending: false }),
    supabase.from("work_rarity_notes").select("*").eq("work_id", work.id),
  ]);

  type GenreJoinRow = { genres: Genre | null };
  type CastJoinRow = { actress_id: string; credit_name: string; billing_order: number; actresses: Actress | null };
  type LinkJoinRow = Record<string, unknown> & { distribution_platforms: DistributionPlatform | null };
  type PriceJoinRow = Record<string, unknown> & { used_market_platforms: UsedMarketPlatform | null };

  const genres = ((genresRes.data ?? []) as unknown as GenreJoinRow[]).map((row) => row.genres).filter((g): g is Genre => Boolean(g));

  const actresses = ((castRes.data ?? []) as unknown as CastJoinRow[])
    .filter((row) => row.actresses)
    .map((row) => ({ actress: row.actresses as Actress, credit_name: row.credit_name, billing_order: row.billing_order }));

  const distributionLinks = ((linksRes.data ?? []) as LinkJoinRow[])
    .filter((row) => row.distribution_platforms)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((row) => ({ ...(row as any), platform: row.distribution_platforms }));

  const marketPrices = ((pricesRes.data ?? []) as PriceJoinRow[])
    .filter((row) => row.used_market_platforms)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((row) => ({ ...(row as any), platform: row.used_market_platforms }));

  return {
    ...work,
    maker: (makerRes.data as Maker) ?? null,
    label: (labelRes.data as Label) ?? null,
    series: (seriesRes.data as Series) ?? null,
    genres,
    actresses,
    distributionLinks,
    marketPrices,
    rarityNotes: rarityRes.data ?? [],
  };
}

function buildMockWorkWithRelations(work: Work | undefined): WorkWithRelations | null {
  if (!work) return null;

  const genres = mock.mockWorkGenres
    .filter((wg) => wg.work_id === work.id)
    .map((wg) => mock.mockGenres.find((g) => g.id === wg.genre_id))
    .filter((g): g is Genre => Boolean(g));

  const actresses = mock.mockWorkActress
    .filter((wa) => wa.work_id === work.id)
    .map((wa) => {
      const actress = mock.mockActresses.find((a) => a.id === wa.actress_id);
      return actress ? { actress, credit_name: wa.credit_name, billing_order: wa.billing_order } : null;
    })
    .filter((v): v is { actress: Actress; credit_name: string; billing_order: number } => Boolean(v));

  const distributionLinks = mock.mockWorkDistributionLinks
    .filter((link) => link.work_id === work.id)
    .map((link) => {
      const platform = mock.mockDistributionPlatforms.find((p) => p.id === link.platform_id);
      return platform ? { ...link, platform } : null;
    })
    .filter((v): v is NonNullable<typeof v> => Boolean(v));

  const marketPrices = mock.mockWorkMarketPrices
    .filter((price) => price.work_id === work.id)
    .map((price) => {
      const platform = mock.mockUsedMarketPlatforms.find((p) => p.id === price.platform_id);
      return platform ? { ...price, platform } : null;
    })
    .filter((v): v is NonNullable<typeof v> => Boolean(v));

  const rarityNotes = mock.mockWorkRarityNotes.filter((note) => note.work_id === work.id);

  return {
    ...work,
    maker: mock.mockMakers.find((m) => m.id === work.maker_id) ?? null,
    label: mock.mockLabels.find((l) => l.id === work.label_id) ?? null,
    series: mock.mockSeries.find((s) => s.id === work.series_id) ?? null,
    genres,
    actresses,
    distributionLinks,
    marketPrices,
    rarityNotes,
  };
}

export async function getWorksByMaker(makerId: string, limit = 24): Promise<Work[]> {
  return withFallback(
    async (supabase) => {
      const { data, error } = await supabase
        .from("works")
        .select("*")
        .eq("maker_id", makerId)
        .order("release_date", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as Work[];
    },
    () => mock.mockWorks.filter((w) => w.maker_id === makerId).slice(0, limit)
  );
}

export async function getWorksByLabel(labelId: string, limit = 24): Promise<Work[]> {
  return withFallback(
    async (supabase) => {
      const { data, error } = await supabase
        .from("works")
        .select("*")
        .eq("label_id", labelId)
        .order("release_date", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as Work[];
    },
    () => mock.mockWorks.filter((w) => w.label_id === labelId).slice(0, limit)
  );
}

export async function getWorksBySeries(seriesId: string, limit = 24): Promise<Work[]> {
  return withFallback(
    async (supabase) => {
      const { data, error } = await supabase
        .from("works")
        .select("*")
        .eq("series_id", seriesId)
        .order("release_date", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as Work[];
    },
    () => mock.mockWorks.filter((w) => w.series_id === seriesId).slice(0, limit)
  );
}

export async function getWorksByGenre(genreId: string, limit = 24): Promise<Work[]> {
  return withFallback(
    async (supabase) => {
      const { data, error } = await supabase
        .from("work_genres")
        .select("work_id, works(*)")
        .eq("genre_id", genreId)
        .limit(limit);
      if (error) throw error;
      type Row = { works: Work | null };
      return ((data ?? []) as unknown as Row[]).map((row) => row.works).filter((w): w is Work => Boolean(w));
    },
    () => {
      const workIds = new Set(mock.mockWorkGenres.filter((wg) => wg.genre_id === genreId).map((wg) => wg.work_id));
      return mock.mockWorks.filter((w) => workIds.has(w.id)).slice(0, limit);
    }
  );
}

// 公式クレジットのある作品のみを返す（未クレジット出演者の補完は行わない設計のため）。
export async function getWorksByActress(actressId: string, limit = 24): Promise<Work[]> {
  return withFallback(
    async (supabase) => {
      const { data, error } = await supabase
        .from("work_actress")
        .select("work_id, works(*)")
        .eq("actress_id", actressId)
        .limit(limit);
      if (error) throw error;
      type Row = { works: Work | null };
      return ((data ?? []) as unknown as Row[]).map((row) => row.works).filter((w): w is Work => Boolean(w));
    },
    () => {
      const workIds = new Set(mock.mockWorkActress.filter((wa) => wa.actress_id === actressId).map((wa) => wa.work_id));
      return mock.mockWorks.filter((w) => workIds.has(w.id)).slice(0, limit);
    }
  );
}

// ---- Actresses ----

// 公式クレジットのある作品を1件以上持つ女優のみを対象とする（未クレジット補完によるページ増殖はしない）。
export async function getActresses(): Promise<Actress[]> {
  return withFallback(
    async (supabase) => {
      const { data, error } = await supabase.from("actresses").select("*").gt("works_count", 0).order("name");
      if (error) throw error;
      return (data ?? []) as Actress[];
    },
    () => mock.mockActresses
  );
}

export async function getActressBySlug(slug: string): Promise<ActressWithWorks | null> {
  return withFallback(
    async (supabase) => {
      const { data: actress, error } = await supabase.from("actresses").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      if (!actress) return null;

      const [aliasesRes, worksRes] = await Promise.all([
        supabase.from("aliases").select("*").eq("actress_id", actress.id),
        supabase.from("work_actress").select("credit_name, works(*)").eq("actress_id", actress.id),
      ]);

      type WorkRow = { credit_name: string; works: Work | null };
      const works = ((worksRes.data ?? []) as unknown as WorkRow[])
        .filter((row) => row.works)
        .map((row) => ({ work: row.works as Work, credit_name: row.credit_name }));

      return { ...(actress as Actress), aliases: aliasesRes.data ?? [], works };
    },
    () => {
      const actress = mock.mockActresses.find((a) => a.slug === slug);
      if (!actress) return null;
      const aliases = mock.mockAliases.filter((al) => al.actress_id === actress.id);
      const works = mock.mockWorkActress
        .filter((wa) => wa.actress_id === actress.id)
        .map((wa) => {
          const work = mock.mockWorks.find((w) => w.id === wa.work_id);
          return work ? { work, credit_name: wa.credit_name } : null;
        })
        .filter((v): v is { work: Work; credit_name: string } => Boolean(v));
      return { ...actress, aliases, works };
    }
  );
}

// ---- ランキング(作品・メーカー・レーベル単位。女優個人の人気ランキングは設けない) ----

export type WorkRankingMetric = "views" | "clicks" | "ctr";

// /go/[id]がwork_distribution_link_id基準で記録したクリックログをwork単位に集計する。
// 実際のクリック数はまだ少量の想定のため、DB側の集計関数は用意せずアプリ側で集計する。
async function getWorkClickCounts(supabase: SupabaseClient): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("affiliate_click_logs")
    .select("work_distribution_links(work_id)")
    .not("work_distribution_link_id", "is", null);
  if (error) throw error;

  type Row = { work_distribution_links: { work_id: string } | null };
  const counts = new Map<string, number>();
  for (const row of (data ?? []) as unknown as Row[]) {
    const workId = row.work_distribution_links?.work_id;
    if (!workId) continue;
    counts.set(workId, (counts.get(workId) ?? 0) + 1);
  }
  return counts;
}

export async function getWorkRanking(limit = 20, metric: WorkRankingMetric = "views"): Promise<Work[]> {
  return withFallback(
    async (supabase) => {
      if (metric === "views") {
        const { data, error } = await supabase.from("works").select("*").order("view_count", { ascending: false }).limit(limit);
        if (error) throw error;
        return (data ?? []) as Work[];
      }

      const clickCounts = await getWorkClickCounts(supabase);

      if (metric === "clicks") {
        const topIds = [...clickCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
        if (topIds.length === 0) return [];
        const { data, error } = await supabase.from("works").select("*").in("id", topIds);
        if (error) throw error;
        const byId = new Map(((data ?? []) as Work[]).map((w) => [w.id, w]));
        return topIds.map((id) => byId.get(id)).filter((w): w is Work => Boolean(w));
      }

      // ctr: 閲覧数0件はゼロ除算になるため対象から外す。
      const candidateIds = [...clickCounts.keys()];
      if (candidateIds.length === 0) return [];
      const { data, error } = await supabase.from("works").select("*").in("id", candidateIds);
      if (error) throw error;
      return ((data ?? []) as Work[])
        .filter((w) => w.view_count > 0)
        .map((w) => ({ work: w, ctr: (clickCounts.get(w.id) ?? 0) / w.view_count }))
        .sort((a, b) => b.ctr - a.ctr)
        .slice(0, limit)
        .map((s) => s.work);
    },
    () => [...mock.mockWorks].sort((a, b) => b.view_count - a.view_count).slice(0, limit)
  );
}

// ---- 第二の収益核: 中古市場ランキング(プレミア価格順、作品単位) ----

export interface PremiumWorkRankingEntry {
  work: Work;
  highestPriceYen: number;
  platformName: string;
}

export async function getPremiumWorkRanking(limit = 20): Promise<PremiumWorkRankingEntry[]> {
  return withFallback(
    async (supabase) => {
      const { data, error } = await supabase
        .from("work_market_prices")
        .select("work_id, price_yen, works(*), used_market_platforms(name)")
        .order("price_yen", { ascending: false })
        .limit(limit * 3);
      if (error) throw error;
      type Row = { work_id: string; price_yen: number; works: Work | null; used_market_platforms: { name: string } | null };
      const seen = new Set<string>();
      const entries: PremiumWorkRankingEntry[] = [];
      for (const row of (data ?? []) as unknown as Row[]) {
        if (!row.works || seen.has(row.work_id)) continue;
        seen.add(row.work_id);
        entries.push({ work: row.works, highestPriceYen: row.price_yen, platformName: row.used_market_platforms?.name ?? "" });
        if (entries.length >= limit) break;
      }
      return entries;
    },
    () => {
      const byWork = new Map<string, PremiumWorkRankingEntry>();
      for (const price of mock.mockWorkMarketPrices) {
        const existing = byWork.get(price.work_id);
        if (existing && existing.highestPriceYen >= price.price_yen) continue;
        const work = mock.mockWorks.find((w) => w.id === price.work_id);
        const platform = mock.mockUsedMarketPlatforms.find((p) => p.id === price.platform_id);
        if (!work) continue;
        byWork.set(price.work_id, { work, highestPriceYen: price.price_yen, platformName: platform?.name ?? "" });
      }
      return [...byWork.values()].sort((a, b) => b.highestPriceYen - a.highestPriceYen).slice(0, limit);
    }
  );
}

// 女優ページの「中古相場が高い出演作品」用。女優個人への新規スコアではなく、
// 既存の公式クレジット作品一覧を中古相場で並べ替えるためだけに使う。
export async function getHighestMarketPriceByWorkIds(workIds: string[]): Promise<Map<string, number>> {
  if (workIds.length === 0) return new Map();
  return withFallback(
    async (supabase) => {
      const { data, error } = await supabase
        .from("work_market_prices")
        .select("work_id, price_yen")
        .in("work_id", workIds);
      if (error) throw error;
      const map = new Map<string, number>();
      for (const row of (data ?? []) as Array<{ work_id: string; price_yen: number }>) {
        const current = map.get(row.work_id);
        if (!current || row.price_yen > current) map.set(row.work_id, row.price_yen);
      }
      return map;
    },
    () => {
      const map = new Map<string, number>();
      for (const price of mock.mockWorkMarketPrices) {
        if (!workIds.includes(price.work_id)) continue;
        const current = map.get(price.work_id);
        if (!current || price.price_yen > current) map.set(price.work_id, price.price_yen);
      }
      return map;
    }
  );
}

// ---- 横断検索(作品名・品番・メーカー・レーベル・シリーズ・タグ・女優名) ----

export interface SearchResult {
  works: Work[];
  actresses: Actress[];
  makers: Maker[];
  labels: Label[];
  series: Series[];
}

export async function search(query: string): Promise<SearchResult> {
  const q = query.trim();
  if (!q) return { works: [], actresses: [], makers: [], labels: [], series: [] };

  return withFallback(
    async (supabase) => {
      const like = `%${q}%`;
      const [worksRes, actressesRes, makersRes, labelsRes, seriesRes] = await Promise.all([
        supabase.from("works").select("*").or(`title.ilike.${like},product_code.ilike.${like}`).limit(20),
        supabase.from("actresses").select("*").ilike("name", like).gt("works_count", 0).limit(20),
        supabase.from("makers").select("*").ilike("name", like).limit(20),
        supabase.from("labels").select("*").ilike("name", like).limit(20),
        supabase.from("series").select("*").ilike("name", like).limit(20),
      ]);
      return {
        works: (worksRes.data ?? []) as Work[],
        actresses: (actressesRes.data ?? []) as Actress[],
        makers: (makersRes.data ?? []) as Maker[],
        labels: (labelsRes.data ?? []) as Label[],
        series: (seriesRes.data ?? []) as Series[],
      };
    },
    () => {
      const lower = q.toLowerCase();
      return {
        works: mock.mockWorks.filter((w) => w.title.toLowerCase().includes(lower) || w.product_code.toLowerCase().includes(lower)),
        actresses: mock.mockActresses.filter((a) => a.name.toLowerCase().includes(lower)),
        makers: mock.mockMakers.filter((m) => m.name.toLowerCase().includes(lower)),
        labels: mock.mockLabels.filter((l) => l.name.toLowerCase().includes(lower)),
        series: mock.mockSeries.filter((s) => s.name.toLowerCase().includes(lower)),
      };
    }
  );
}
