create extension if not exists pg_trgm;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.makers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.labels (
  id uuid primary key default gen_random_uuid(),
  maker_id uuid not null references public.makers(id) on delete cascade,
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.series (
  id uuid primary key default gen_random_uuid(),
  maker_id uuid references public.makers(id) on delete set null,
  label_id uuid references public.labels(id) on delete set null,
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.genres (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- 公式クレジットのある女優のみを対象とする。第三者による身元特定・候補確認の仕組みは持たない。
create table public.actresses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  kana text,
  profile text,
  thumbnail_url text,
  thumbnail_license text,
  works_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 本人/所属事務所が公式に発表した名称のみを保存する。source_typeを必須にし、
-- 出典不明・第三者推測による別名の登録を構造上できないようにする。
create table public.aliases (
  id uuid primary key default gen_random_uuid(),
  actress_id uuid not null references public.actresses(id) on delete cascade,
  name text not null,
  kana text,
  alias_type text not null default 'alternate_stage_name' check (alias_type in ('former_stage_name', 'alternate_stage_name', 'romanized', 'kana')),
  source_type text not null check (source_type in ('official_agency', 'official_credit')),
  source_url text,
  valid_from date,
  valid_to date,
  note text,
  created_at timestamptz not null default now(),
  unique (actress_id, name)
);

create table public.works (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  product_code text not null unique,
  maker_id uuid references public.makers(id) on delete set null,
  label_id uuid references public.labels(id) on delete set null,
  series_id uuid references public.series(id) on delete set null,
  release_date date,
  runtime_minutes integer,
  permitted_thumbnail_url text,
  thumbnail_license text,
  seo_description text,
  favorite_count integer not null default 0,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 作品と女優の中間テーブル。公式クレジットのみを保存する。
-- 未クレジット出演者の補完（候補確認・AI顔画像検索・OCR等）は行わない。
create table public.work_actress (
  work_id uuid not null references public.works(id) on delete cascade,
  actress_id uuid not null references public.actresses(id) on delete cascade,
  billing_order integer not null default 0,
  credit_name text not null,
  source_type text not null default 'official_metadata' check (source_type in ('official_metadata', 'maker_submission')),
  created_at timestamptz not null default now(),
  primary key (work_id, actress_id)
);

create table public.work_genres (
  work_id uuid not null references public.works(id) on delete cascade,
  genre_id uuid not null references public.genres(id) on delete cascade,
  primary key (work_id, genre_id)
);

create table public.favorites (
  user_id uuid not null references public.users(id) on delete cascade,
  work_id uuid not null references public.works(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, work_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  anonymous_name text,
  body text not null check (char_length(body) between 1 and 1000),
  like_count integer not null default 0,
  report_count integer not null default 0,
  status text not null default 'visible' check (status in ('visible', 'hidden', 'review')),
  created_at timestamptz not null default now()
);

-- 作品単位の閲覧ログのみ。出演者個人に紐づけた閲覧ログは取得しない。
create table public.view_logs (
  id bigint generated always as identity primary key,
  work_id uuid references public.works(id) on delete cascade,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table public.search_logs (
  id bigint generated always as identity primary key,
  user_id uuid references public.users(id) on delete set null,
  query text not null,
  search_type text not null default 'all',
  result_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.affiliate_programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  network_name text,
  disclosure_text text not null default 'このリンクには広告が含まれます。',
  payment_note text,
  supported_regions text[] not null default array[]::text[],
  status text not null default 'active' check (status in ('active', 'paused', 'ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.distribution_platforms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  operator_name text,
  platform_type text not null default 'vod_store' check (platform_type in ('vod_store', 'subscription', 'maker_official', 'marketplace', 'affiliate_network', 'official_store')),
  website_url text,
  affiliate_signup_url text,
  country_code text not null default 'JP',
  priority integer not null default 100,
  is_adult boolean not null default true,
  legal_review_status text not null default 'pending' check (legal_review_status in ('approved', 'pending', 'rejected')),
  status text not null default 'active' check (status in ('active', 'paused', 'ended')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  payment_type text not null default 'other' check (payment_type in ('credit_card', 'stored_value', 'wallet', 'carrier', 'bank', 'convenience_store', 'points', 'other')),
  region_code text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.platform_payment_methods (
  platform_id uuid not null references public.distribution_platforms(id) on delete cascade,
  payment_method_id uuid not null references public.payment_methods(id) on delete cascade,
  region_code text not null default 'JP',
  support_status text not null default 'unknown' check (support_status in ('supported', 'unsupported', 'indirect', 'unknown')),
  payment_note text,
  source_url text,
  updated_at timestamptz not null default now(),
  primary key (platform_id, payment_method_id, region_code)
);

create table public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.affiliate_programs(id) on delete cascade,
  platform_id uuid references public.distribution_platforms(id) on delete set null,
  work_id uuid references public.works(id) on delete cascade,
  actress_id uuid references public.actresses(id) on delete cascade,
  maker_id uuid references public.makers(id) on delete cascade,
  label_id uuid references public.labels(id) on delete cascade,
  series_id uuid references public.series(id) on delete cascade,
  placement text not null default 'work_primary_cta',
  destination_url text not null,
  anchor_text text not null,
  is_primary boolean not null default false,
  status text not null default 'active' check (status in ('active', 'paused', 'ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.work_distribution_links (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  platform_id uuid not null references public.distribution_platforms(id) on delete cascade,
  affiliate_link_id uuid references public.affiliate_links(id) on delete set null,
  platform_product_code text,
  platform_work_url text,
  availability_status text not null default 'unknown' check (availability_status in ('available', 'unavailable', 'coming_soon', 'unknown')),
  offer_type text not null default 'unknown' check (offer_type in ('purchase', 'rental', 'subscription', 'free_sample', 'unknown')),
  intent_type text not null default 'ppv_primary' check (intent_type in ('ppv_primary', 'subscription_secondary', 'official_reference', 'price_compare')),
  cta_priority integer not null default 100,
  region_note text,
  price_note text,
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (work_id, platform_id, platform_product_code)
);

-- affiliate_link_idはASP提携リンク経由の場合のみ設定する。sync-dmm/sync-duga等の
-- カタログ取り込みはaffiliate_linksを作らないため、大半のクリックはwork_distribution_link_id
-- 経由でしか追跡できない。ランキングのクリック数/CTR算出はwork_distribution_link_id基準で行う。
create table public.affiliate_click_logs (
  id bigint generated always as identity primary key,
  affiliate_link_id uuid references public.affiliate_links(id) on delete cascade,
  work_distribution_link_id uuid references public.work_distribution_links(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  referer_path text,
  ip_hash text,
  user_agent text,
  clicked_at timestamptz not null default now(),
  constraint affiliate_click_logs_has_target check (affiliate_link_id is not null or work_distribution_link_id is not null)
);

create index affiliate_click_logs_work_distribution_link_idx on public.affiliate_click_logs (work_distribution_link_id);

create table public.affiliate_conversions (
  id bigint generated always as identity primary key,
  affiliate_link_id uuid references public.affiliate_links(id) on delete set null,
  external_conversion_id text,
  amount numeric(12, 2),
  currency text not null default 'JPY',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  converted_at timestamptz not null default now()
);

-- 第二の収益核: 中古市場の相場情報。詳細方針は docs/used-market-pricing.md 参照。
-- 相場・ランキングは常に work 単位で持たせ、女優個人への新規スコアは設けない。
create table public.used_market_platforms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  platform_type text not null default 'c2c_marketplace' check (platform_type in ('c2c_marketplace', 'auction', 'secondhand_store', 'marketplace')),
  website_url text,
  affiliate_program_id uuid references public.affiliate_programs(id) on delete set null,
  -- スクレイピングは選択肢に含めない。規約違反での取得を構造上できないようにする。
  data_source_type text not null default 'affiliate_feed' check (data_source_type in ('official_api', 'affiliate_feed', 'manual_entry')),
  status text not null default 'active' check (status in ('active', 'paused', 'ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.work_market_prices (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  platform_id uuid not null references public.used_market_platforms(id) on delete cascade,
  price_type text not null check (price_type in ('current_listing_min', 'current_listing_avg', 'completed_sale_avg', 'completed_sale_max')),
  price_yen numeric(10, 0) not null,
  sample_size integer,
  observed_at timestamptz not null default now(),
  source_url text,
  affiliate_link_id uuid references public.affiliate_links(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 客観的事実のみを保存する（煽り文言・主観評価は保存しない）。source_urlを必須にする。
create table public.work_rarity_notes (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  rarity_reason text not null check (rarity_reason in ('out_of_print', 'limited_first_press', 'label_discontinued', 'format_discontinued')),
  note text,
  source_url text not null,
  created_at timestamptz not null default now()
);

create table public.price_watch_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  work_id uuid not null references public.works(id) on delete cascade,
  notify_below_price_yen numeric(10, 0),
  created_at timestamptz not null default now(),
  unique (user_id, work_id)
);

-- ユーザーポイント(将来の会員特典の下地)。加算専用の台帳(ledger)として持ち、残高は
-- SUM(points)で都度算出する(整合性の取りにくい可変残高カラムは持たない)。
-- 現時点でポイントの交換先・使い道は未定。将来の有料会員特典(広告非表示等)の判断材料として、
-- どの行動がどれだけエンゲージメントを生むかを見るためだけに記録する。
create table public.point_transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  points integer not null,
  reason text not null check (reason in ('favorite_added', 'comment_posted', 'price_watch_registered', 'notification_registered')),
  reference_id uuid,
  created_at timestamptz not null default now()
);

-- 新作発売日通知(第一の核の再訪問導線)。メーカー/レーベル/シリーズのいずれか1つに対する
-- 「新作が出たら通知してほしい」という登録のみを扱う(price_watch_subscriptionsと同じパターン)。
create table public.notification_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  maker_id uuid references public.makers(id) on delete cascade,
  label_id uuid references public.labels(id) on delete cascade,
  series_id uuid references public.series(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint notification_subscriptions_single_target check (
    (case when maker_id is not null then 1 else 0 end)
    + (case when label_id is not null then 1 else 0 end)
    + (case when series_id is not null then 1 else 0 end) = 1
  )
);

create unique index notification_subscriptions_user_maker_idx on public.notification_subscriptions (user_id, maker_id) where maker_id is not null;
create unique index notification_subscriptions_user_label_idx on public.notification_subscriptions (user_id, label_id) where label_id is not null;
create unique index notification_subscriptions_user_series_idx on public.notification_subscriptions (user_id, series_id) where series_id is not null;

-- メーカー/レーベルからの公式な情報提出・修正依頼。第三者による特定ではなく、
-- 権利者本人からの公式情報提供のみを受け付ける窓口。承認されるまで一切公開しない。
create table public.maker_submissions (
  id uuid primary key default gen_random_uuid(),
  maker_id uuid references public.makers(id) on delete set null,
  work_id uuid references public.works(id) on delete set null,
  submitter_organization text not null,
  submitter_contact text not null,
  submission_type text not null check (submission_type in ('new_work', 'work_correction', 'cast_credit_addition', 'cast_credit_correction', 'distribution_link')),
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now()
);

-- 第三の収益核: 審査済み法人向けのデータ/API提供。詳細方針は docs/collector-data-services.md 参照。
-- 個人（非法人）への提供、ユーザー個人データ・未承認情報の提供は行わない。
create table public.data_partners (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  contact_email text not null,
  plan text not null default 'starter' check (plan in ('starter', 'pro', 'enterprise')),
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected', 'suspended')),
  contract_started_on date,
  contract_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.data_partner_api_keys (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.data_partners(id) on delete cascade,
  -- 平文キーは保存しない。発行時に一度だけ表示し、以降はハッシュのみ照合に使う。
  key_hash text not null unique,
  scopes text[] not null default array[]::text[],
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table public.data_partner_api_usage_logs (
  id bigint generated always as identity primary key,
  partner_id uuid not null references public.data_partners(id) on delete cascade,
  api_key_id uuid references public.data_partner_api_keys(id) on delete set null,
  endpoint text not null,
  response_status integer,
  called_at timestamptz not null default now()
);

create index works_title_trgm on public.works using gin (title gin_trgm_ops);
create index works_product_code_trgm on public.works using gin (product_code gin_trgm_ops);
create index actresses_name_trgm on public.actresses using gin (name gin_trgm_ops);
create index aliases_name_trgm on public.aliases using gin (name gin_trgm_ops);
create index makers_name_trgm on public.makers using gin (name gin_trgm_ops);
create index labels_name_trgm on public.labels using gin (name gin_trgm_ops);
create index labels_maker_id_idx on public.labels (maker_id);
create index series_name_trgm on public.series using gin (name gin_trgm_ops);
create index series_label_id_idx on public.series (label_id);
create index genres_name_trgm on public.genres using gin (name gin_trgm_ops);
create index works_label_id_idx on public.works (label_id);
create index works_release_date_idx on public.works (release_date desc);
create index works_view_count_idx on public.works (view_count desc);
create index distribution_platforms_name_trgm on public.distribution_platforms using gin (name gin_trgm_ops);
create index distribution_platforms_priority_idx on public.distribution_platforms (priority, status);
create index platform_payment_methods_region_idx on public.platform_payment_methods (region_code, support_status);
create index affiliate_links_work_id_idx on public.affiliate_links (work_id, status);
create index affiliate_links_platform_id_idx on public.affiliate_links (platform_id, status);
create index affiliate_links_actress_id_idx on public.affiliate_links (actress_id, status);
create index affiliate_links_label_id_idx on public.affiliate_links (label_id, status);
create index work_distribution_links_work_id_idx on public.work_distribution_links (work_id, availability_status);
create index work_distribution_links_platform_id_idx on public.work_distribution_links (platform_id, availability_status);
create index affiliate_click_logs_link_id_idx on public.affiliate_click_logs (affiliate_link_id, clicked_at desc);
create index affiliate_conversions_link_id_idx on public.affiliate_conversions (affiliate_link_id, converted_at desc);
create index maker_submissions_status_idx on public.maker_submissions (status, created_at desc);
create index used_market_platforms_priority_idx on public.used_market_platforms (status);
create index work_market_prices_work_id_idx on public.work_market_prices (work_id, observed_at desc);
create index work_market_prices_platform_id_idx on public.work_market_prices (platform_id, observed_at desc);
create index work_rarity_notes_work_id_idx on public.work_rarity_notes (work_id);
create index price_watch_subscriptions_work_id_idx on public.price_watch_subscriptions (work_id);
create index data_partners_review_status_idx on public.data_partners (review_status);
create index data_partner_api_keys_partner_id_idx on public.data_partner_api_keys (partner_id, status);
create index data_partner_api_usage_logs_partner_id_idx on public.data_partner_api_usage_logs (partner_id, called_at desc);

alter table public.users enable row level security;
alter table public.favorites enable row level security;
alter table public.comments enable row level security;
alter table public.maker_submissions enable row level security;
alter table public.price_watch_subscriptions enable row level security;
alter table public.notification_subscriptions enable row level security;
alter table public.point_transactions enable row level security;
alter table public.data_partners enable row level security;
alter table public.data_partner_api_keys enable row level security;
alter table public.data_partner_api_usage_logs enable row level security;

create policy "public read comments" on public.comments for select using (status = 'visible');
create policy "insert own or anonymous comments" on public.comments for insert with check (true);
create policy "read own favorites" on public.favorites for select using (auth.uid() = user_id);
create policy "insert own favorites" on public.favorites for insert with check (auth.uid() = user_id);
create policy "delete own favorites" on public.favorites for delete using (auth.uid() = user_id);
create policy "read own price watches" on public.price_watch_subscriptions for select using (auth.uid() = user_id);
create policy "insert own price watches" on public.price_watch_subscriptions for insert with check (auth.uid() = user_id);
create policy "delete own price watches" on public.price_watch_subscriptions for delete using (auth.uid() = user_id);
create policy "read own notification subscriptions" on public.notification_subscriptions for select using (auth.uid() = user_id);
create policy "insert own notification subscriptions" on public.notification_subscriptions for insert with check (auth.uid() = user_id);
create policy "delete own notification subscriptions" on public.notification_subscriptions for delete using (auth.uid() = user_id);
-- point_transactionsへの書き込みはservice role(サーバー側のawardPoints経由)のみを想定し、
-- クライアント向けのinsert/deleteポリシーはあえて設けない(自己申告での不正加算を防ぐ)。
create policy "read own point transactions" on public.point_transactions for select using (auth.uid() = user_id);
-- maker_submissions、data_partners、data_partner_api_keys、data_partner_api_usage_logsは
-- いずれもadmin(service role)経由のみで読み書きする想定のため、クライアント向けのポリシーは
-- あえて設けない（担当者確認済みの審査フローを経てのみ、サーバー側から操作する）。

insert into public.distribution_platforms
  (slug, name, operator_name, platform_type, website_url, country_code, priority, legal_review_status, notes)
values
  ('fanza-dmm', 'FANZA / DMM', 'DMM', 'vod_store', 'https://www.dmm.co.jp/digital/videoa/', 'JP', 10, 'pending', '国内最大級。DMMポイント、クレジットカード等の決済説明が重要。'),
  ('sod', 'SOD / SOD Prime / SOD Store', 'SOD', 'maker_official', 'https://ec.sod.co.jp/', 'JP', 20, 'pending', 'SOD系作品の公式導線。'),
  ('mgstage', 'MGS動画', 'MGS', 'vod_store', 'https://www.mgstage.com/', 'JP', 30, 'pending', 'MGS動画掲載作品の品番検索導線を重視。'),
  ('duga-apex', 'DUGA / APEX', 'APEX', 'vod_store', 'https://duga.jp/', 'JP', 40, 'pending', 'DUGA掲載作品とAPEX系提携を管理。'),
  ('h-next', 'H-NEXT', 'H-NEXT', 'subscription', null, 'JP', 50, 'pending', '見放題/定額導線の候補。提携条件を確認。'),
  ('dlsite', 'DLsite', 'DLsite', 'marketplace', 'https://www.dlsite.com/', 'JP', 60, 'pending', '同人/商業ダウンロード販売。作品ジャンルを分けて管理。'),
  ('sokmil', 'Sokmil', 'Sokmil', 'vod_store', 'https://www.sokmil.com/', 'JP', 70, 'pending', '動画配信補完候補。'),
  ('fc2-contents-market', 'FC2コンテンツマーケット', 'FC2', 'marketplace', 'https://contents.fc2.com/', 'JP', 80, 'pending', '投稿/マーケットプレイス系。権利確認と掲載品質審査を厳格化。')
on conflict (slug) do nothing;

insert into public.payment_methods
  (slug, name, payment_type, region_code, notes)
values
  ('credit-card', 'クレジットカード', 'credit_card', null, 'Visa/Mastercard/JCB等。各プラットフォームで対応ブランドを確認。'),
  ('dmm-points', 'DMMポイント', 'points', 'JP', 'FANZA/DMM系のポイント払い。海外ユーザー向け説明が重要。'),
  ('unionpay', '銀聯 / UnionPay', 'credit_card', 'CN', '直接決済できない場合は対応ウォレットやポイントチャージ経由を案内。'),
  ('line-pay-tw', 'LINE Pay Taiwan', 'wallet', 'TW', '台湾ユーザーに馴染みがあるが、日本の配信サイトで直接使えるとは限らない。'),
  ('easywallet', 'EasyWallet', 'wallet', 'TW', '台湾のEasyCard系電子ウォレット。'),
  ('easycard', '悠遊卡 / EasyCard', 'stored_value', 'TW', '台湾の交通・生活決済。オンライン成人向け配信サイトとは別導線で説明。'),
  ('samsung-wallet-kr', 'Samsung Wallet / Samsung Pay', 'wallet', 'KR', '韓国の主要キャッシュレス導線。日本配信サイトでは直接対応を要確認。'),
  ('naver-pay', 'Naver Pay', 'wallet', 'KR', '韓国の主要オンライン決済。日本配信サイトでは直接対応を要確認。'),
  ('kakao-pay', 'Kakao Pay', 'wallet', 'KR', '韓国の主要ウォレット。日本配信サイトでは直接対応を要確認。'),
  ('tmoney', 'Tmoney', 'stored_value', 'KR', '韓国の交通・生活決済。オンライン成人向け配信サイトとは別導線で説明。')
on conflict (slug) do nothing;

insert into public.used_market_platforms
  (slug, name, platform_type, website_url, data_source_type, status)
values
  ('mercari', 'メルカリ', 'c2c_marketplace', 'https://jp.mercari.com/', 'affiliate_feed', 'active'),
  ('yahoo-auction', 'ヤフオク!', 'auction', 'https://auctions.yahoo.co.jp/', 'affiliate_feed', 'active'),
  ('surugaya', '駿河屋', 'secondhand_store', 'https://www.suruga-ya.jp/', 'affiliate_feed', 'active'),
  ('netoff', 'ネットオフ', 'secondhand_store', 'https://www.netoff.co.jp/', 'affiliate_feed', 'active')
on conflict (slug) do nothing;
