<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# プロジェクト方針(重要・変更禁止)

このサイトは成人向け作品カタログ・アフィリエイトサイトだが、以下は**設計上の絶対制約**であり、実装・提案いずれにおいても変更しないこと。

- 出演者情報は**メーカー/レーベルの公式クレジットのみ**を扱う。未クレジット出演者の推測・特定・補完は一切実装しない。
- AI顔画像検索、OCRによる出演者特定、ユーザー投稿による「候補」出演者の仕組みは実装しない。
- 別名・旧芸名は、本人/所属事務所が**公式に発表したもの**のみを保存する(`aliases.source_type`は`official_agency`または`official_credit`のみ)。
- 検索・発見体験の起点は作品名・品番・メーカー・レーベル・シリーズ・ジャンルであり、人物起点の「この子誰？」導線は設けない。
- チア/グラビアアイドル等、アダルト業界と無関係な実在人物を人気ランキング・横断追跡する機能は実装しない。

詳細は `docs/architecture.md` の「0. 前身プロジェクトからの変更点」を参照。
