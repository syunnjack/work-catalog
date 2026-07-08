# 中古市場 価格ガイド設計(第二の収益核)

## 目的

作品カタログ(第一の核)を土台に、廃盤・希少タイトルの中古相場情報を提供する。レジェンド女優の代表作など、プレミア価格が付いている作品の「今の相場」「プラットフォーム間の価格差」を可視化し、売買判断に使える情報を届ける。

## 設計原則(境界)

- 相場・ランキングの対象は常に**作品(`works`)**であり、女優個人に紐づく人気スコア・ランキングは新設しない。女優は作品の公式クレジット属性としてのみ関与する。
- 価格データは各プラットフォームの公式API、アフィリエイトフィード、または許諾された価格連携を通じて取得する。利用規約に反するスクレイピングは行わない。
- トーンは「掘り出し物を安く買って高く転売しよう」ではなく、「相場を知って適正価格で売買判断する」という消費者保護寄りのトーンにする。
- 中古品(古物)そのものの売買・仲介はサイトが行わない。あくまで相場の情報提供とアフィリエイト送客に留める。自社が将来的に買取・販売を行う場合は古物営業法上の届出が別途必要になる点を運用ルールに明記する。
- 価格は変動するため、「参考価格」「取得時点の相場」であることを明記し、最終確認は送客先で行うよう案内する。

## ページ一覧

- `/used-market`: 中古市場価格ガイドのトップ。プレミア価格ランキング、値上がり中の作品、廃盤/希少タイトル特集。
- `/used-market/ranking`: プレミア価格が付いている作品のランキング(現在価格順、直近の値上がり率順)。
- `/works/[slug]` に「中古相場」セクションを追加(新規ページではなく既存の作品詳細ページを拡張):
  - 現在の相場(プラットフォーム別の参考価格帯)
  - 価格推移(データが蓄積し次第グラフ化)
  - 出品/検索リンク(アフィリエイト経由)
  - 希少性メモ(廃盤、初回限定特典有無など客観的事実のみ。誇張表現は避ける)
- `/actresses/[slug]` に「中古相場が高い出演作品」セクションを追加(既存の公式クレジット作品一覧の並び替えとして提供し、女優個人への新規スコアは持たせない)。

## Answer Block(AIO向け)

作品ページの中古相場セクション:

```txt
{品番} の中古相場は、取得時点で {価格帯} です（{プラットフォーム名} 調べ、{取得日}時点）。廃盤/希少タイトルのため相場は変動します。最新価格は各プラットフォームでご確認ください。
```

## データベース設計

### `used_market_platforms`

中古取引プラットフォームのマスタ(メルカリ、ヤフオク!、駿河屋、Amazonマーケットプレイス、ネットオフなど)。

- `id`
- `slug`
- `name`
- `platform_type`: `c2c_marketplace` / `auction` / `secondhand_store` / `marketplace`
- `website_url`
- `affiliate_program_id` (`affiliate_programs`参照。提携がある場合)
- `data_source_type`: `official_api` / `affiliate_feed` / `manual_entry`（スクレイピングは選択肢に含めない）
- `status`: `active` / `paused` / `ended`
- `created_at`, `updated_at`

### `work_market_prices`

作品ごとの中古相場データ。1作品・1プラットフォームにつき複数時点のスナップショットを蓄積する。

- `id`
- `work_id`（`works`参照）
- `platform_id`（`used_market_platforms`参照）
- `price_type`: `current_listing_min` / `current_listing_avg` / `completed_sale_avg` / `completed_sale_max`
- `price_yen`
- `sample_size`（算出に使った出品/成約件数の目安）
- `observed_at`（データ取得日時）
- `source_url`
- `affiliate_link_id`（`affiliate_links`参照。あれば）
- `created_at`

### `work_rarity_notes`

作品の希少性に関する客観的事実のみを保存する（煽り文言・主観評価は保存しない）。

- `id`
- `work_id`
- `rarity_reason`: `out_of_print` / `limited_first_press` / `label_discontinued` / `format_discontinued`
- `note`
- `source_url`（メーカー発表・プラットフォーム記載など出典を必須にする）
- `created_at`

### `price_watch_subscriptions`

価格変動通知(再訪問導線)。既存の`notification_subscriptions`パターンと統合してよい。

- `id`
- `user_id`
- `work_id`
- `notify_below_price_yen`（この価格を下回ったら通知、任意）
- `created_at`

## API

| Method | Path | 用途 | キャッシュ |
| --- | --- | --- | --- |
| GET | `/api/used-market/prices?workId=` | 作品の中古相場取得 | 15分 |
| GET | `/api/used-market/ranking` | プレミア価格ランキング | 15分 |
| POST | `/api/price-watch` | 価格変動通知の登録 | no-store |

## 収益導線

- 中古相場セクション末尾に「{プラットフォーム名}で出品を見る」のアフィリエイトCTAを設置する。
- プラットフォームを複数比較できる`OfficialInfoNotice`/`OfferCompareTable`と同系統のコンポーネント(`UsedMarketCompareTable`)を新設し、価格・件数・取得日時・CTAを横並びで表示する。
- 新品配信/購入導線(第一の核)と中古相場導線(第二の核)は同じ作品ページ内で併記し、ユーザーの「新品で見る/買う」「中古相場を確認する」双方の意図に応える。

## JSON-LD

- 作品ページの中古相場セクションには`Offer`(`priceCurrency: JPY`, `availability`は出典プラットフォームの状況に応じる)を追加する。相場情報は変動するため`priceValidUntil`は取得日から短期間に設定する。

## 実装優先順位

1. `used_market_platforms`、`work_market_prices`のテーブルとシード投入(メルカリ、ヤフオク!、駿河屋など主要どころ)。
2. 作品ページへの中古相場セクション追加。
3. `/used-market`トップとプレミア価格ランキング。
4. `work_rarity_notes`による希少性メモ表示。
5. `price_watch_subscriptions`による価格変動通知。
6. 女優ページへの「中古相場が高い出演作品」セクション追加。

## 運用ルール

- 価格データの出典・取得日時を必ず表示する。
- 出典プラットフォームの利用規約・API利用規約を遵守する(無許可スクレイピング禁止)。
- 「レジェンド女優」等の表現は、実際に相場が客観的に高いデータに基づく場合のみ使用し、根拠のない煽り文言にしない。
- 自社による古物の買取・販売は行わない(将来行う場合は古物営業法上の届出を別途検討する)。
