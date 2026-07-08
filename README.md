# work-catalog

作品名・品番・メーカー・レーベル・シリーズを起点にした、成人向け作品カタログ・アフィリエイトサイト。

前身企画(`seo-db-initial-project`)にあった出演者の身元特定機能(未クレジット出演者の候補確認・AI顔画像検索・チア/グラビア横断の人物ランキング)は設計上のリスクを理由にすべて廃止し、公式クレジット情報のみを扱うカタログとして再設計した。詳細は [`docs/architecture.md`](./docs/architecture.md) の「0. 前身プロジェクトからの変更点」を参照。

## ドキュメント

- [`docs/architecture.md`](./docs/architecture.md): ディレクトリ構成、DB設計、API一覧、ページ一覧
- [`docs/seo-affiliate-aio-llmo.md`](./docs/seo-affiliate-aio-llmo.md): SEO/AIO/LLMO/アフィリエイト導線設計
- [`docs/platform-coverage.md`](./docs/platform-coverage.md): 国内大手配信・販売プラットフォーム網羅設計
- [`docs/monetization-site-design.md`](./docs/monetization-site-design.md): 収益導線設計(第一の核: 新品配信・販売)
- [`docs/used-market-pricing.md`](./docs/used-market-pricing.md): 中古市場 価格ガイド設計(第二の核: 中古相場)
- [`docs/collector-data-services.md`](./docs/collector-data-services.md): B2Bデータ/API提供設計(第三の核: 法人向けデータ提供)

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Supabase

`supabase/schema.sql` をSupabaseのSQL Editorで実行してテーブルを作成する。`.env.example` をコピーして `.env.local` を作成し、Supabaseの接続情報を設定する。
