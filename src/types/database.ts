// supabase/schema.sql と対応するTypeScript型定義。
// 出演者情報は公式クレジットのみを扱う設計のため、候補・未クレジット確認等のフィールドは存在しない
// （詳細は docs/architecture.md の「0. 前身プロジェクトからの変更点」を参照）。

export interface Maker {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Label {
  id: string;
  maker_id: string;
  slug: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Series {
  id: string;
  maker_id: string | null;
  label_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Genre {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Actress {
  id: string;
  slug: string;
  name: string;
  kana: string | null;
  profile: string | null;
  thumbnail_url: string | null;
  thumbnail_license: string | null;
  works_count: number;
  created_at: string;
  updated_at: string;
}

export type AliasType = "former_stage_name" | "alternate_stage_name" | "romanized" | "kana";
export type AliasSourceType = "official_agency" | "official_credit";

export interface Alias {
  id: string;
  actress_id: string;
  name: string;
  kana: string | null;
  alias_type: AliasType;
  source_type: AliasSourceType;
  source_url: string | null;
  valid_from: string | null;
  valid_to: string | null;
  note: string | null;
  created_at: string;
}

export interface Work {
  id: string;
  slug: string;
  title: string;
  product_code: string;
  maker_id: string | null;
  label_id: string | null;
  series_id: string | null;
  release_date: string | null;
  runtime_minutes: number | null;
  permitted_thumbnail_url: string | null;
  thumbnail_license: string | null;
  seo_description: string | null;
  favorite_count: number;
  view_count: number;
  rating_avg: number | null;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

// 作品の星評価(1〜5)。1ユーザー1作品につき1件。
export interface WorkRating {
  work_id: string;
  user_id: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

// 公式クレジットのみを保存する中間テーブル。
export interface WorkActress {
  work_id: string;
  actress_id: string;
  billing_order: number;
  credit_name: string;
  source_type: "official_metadata" | "maker_submission";
  created_at: string;
}

export interface WorkGenre {
  work_id: string;
  genre_id: string;
}

export type PlatformType =
  | "vod_store"
  | "subscription"
  | "maker_official"
  | "marketplace"
  | "affiliate_network"
  | "official_store";

export interface DistributionPlatform {
  id: string;
  slug: string;
  name: string;
  operator_name: string | null;
  platform_type: PlatformType;
  website_url: string | null;
  affiliate_signup_url: string | null;
  country_code: string;
  priority: number;
  is_adult: boolean;
  legal_review_status: "approved" | "pending" | "rejected";
  status: "active" | "paused" | "ended";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type IntentType = "ppv_primary" | "subscription_secondary" | "official_reference" | "price_compare";

export interface WorkDistributionLink {
  id: string;
  work_id: string;
  platform_id: string;
  affiliate_link_id: string | null;
  platform_product_code: string | null;
  platform_work_url: string | null;
  availability_status: "available" | "unavailable" | "coming_soon" | "unknown";
  offer_type: "purchase" | "rental" | "subscription" | "free_sample" | "unknown";
  intent_type: IntentType;
  cta_priority: number;
  region_note: string | null;
  price_note: string | null;
  checked_at: string | null;
  created_at: string;
  updated_at: string;
}

// 第二の収益核: 中古市場相場（docs/used-market-pricing.md）。
export type UsedMarketPlatformType = "c2c_marketplace" | "auction" | "secondhand_store" | "marketplace";

export interface UsedMarketPlatform {
  id: string;
  slug: string;
  name: string;
  platform_type: UsedMarketPlatformType;
  website_url: string | null;
  data_source_type: "official_api" | "affiliate_feed" | "manual_entry";
  status: "active" | "paused" | "ended";
  created_at: string;
  updated_at: string;
}

export type MarketPriceType =
  | "current_listing_min"
  | "current_listing_avg"
  | "completed_sale_avg"
  | "completed_sale_max"
  | "user_reported";

export interface WorkMarketPrice {
  id: string;
  work_id: string;
  platform_id: string;
  price_type: MarketPriceType;
  price_yen: number;
  sample_size: number | null;
  observed_at: string;
  source_url: string | null;
  affiliate_link_id: string | null;
  created_at: string;
}

// ユーザーからの中古相場報告。運営者がapprovedにするまではwork_market_pricesへ反映しない。
export interface WorkMarketPriceReport {
  id: string;
  work_id: string;
  platform_id: string;
  user_id: string | null;
  price_yen: number;
  note: string | null;
  source_url: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
}

export type RarityReason = "out_of_print" | "limited_first_press" | "label_discontinued" | "format_discontinued";

export interface WorkRarityNote {
  id: string;
  work_id: string;
  rarity_reason: RarityReason;
  note: string | null;
  source_url: string;
  created_at: string;
}

// メーカー/レーベルからの公式情報提出・修正依頼。第三者による特定ではなく、権利者本人からの
// 公式情報提供のみを受け付ける窓口（docs/architecture.md「メーカー公式提出チャネル」）。
export interface MakerSubmission {
  id: string;
  maker_id: string | null;
  work_id: string | null;
  submitter_organization: string;
  submitter_contact: string;
  submission_type:
    | "new_work"
    | "work_correction"
    | "cast_credit_addition"
    | "cast_credit_correction"
    | "distribution_link";
  payload: Record<string, unknown>;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
}

// ユーザーポイント(将来の会員特典の下地)。加算専用の台帳で、残高はSUM(points)で算出する。
export interface PointTransaction {
  id: number;
  user_id: string;
  points: number;
  reason:
    | "favorite_added"
    | "comment_posted"
    | "price_watch_registered"
    | "notification_registered"
    | "comment_liked"
    | "work_rated"
    | "market_price_reported";
  reference_id: string | null;
  created_at: string;
}

// 新作発売日通知の登録。メーカー/レーベル/シリーズのいずれか1つにのみ紐づく。
export interface NotificationSubscription {
  id: string;
  user_id: string;
  maker_id: string | null;
  label_id: string | null;
  series_id: string | null;
  created_at: string;
}

// 第三の核: 法人向けデータ/APIサービスの契約先マスタ(docs/collector-data-services.md)。
export interface DataPartner {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  plan: "starter" | "pro" | "enterprise";
  review_status: "pending" | "approved" | "rejected" | "suspended";
  contract_started_on: string | null;
  contract_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface DataPartnerApiKey {
  id: string;
  partner_id: string;
  key_hash: string;
  scopes: string[];
  status: "active" | "revoked";
  created_at: string;
  revoked_at: string | null;
}

// 画面表示用に関連エンティティを合成した型。
export interface WorkWithRelations extends Work {
  maker: Maker | null;
  label: Label | null;
  series: Series | null;
  genres: Genre[];
  actresses: Array<{ actress: Actress; credit_name: string; billing_order: number }>;
  distributionLinks: Array<WorkDistributionLink & { platform: DistributionPlatform }>;
  marketPrices: Array<WorkMarketPrice & { platform: UsedMarketPlatform }>;
  rarityNotes: WorkRarityNote[];
}

export interface ActressWithWorks extends Actress {
  aliases: Alias[];
  works: Array<{ work: Work; credit_name: string }>;
}
