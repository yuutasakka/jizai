# 設定管理ガイド（12factor 準拠）

本書は、Jizai の設定を環境変数中心で一元管理し、再現性・安全性・可観測性を高めるための指針です。

## 原則
- 単一の設定ソース: 各環境の設定は「デプロイ先の環境変数」に集約し、リポジトリ内の `.env*` はローカル開発のみに限定。
- 12factor: 設定はコードから分離。ビルド成果物に埋め込む値（Viteの`VITE_*`）もCIで注入。
- 最小特権: サービスキー等の強力な権限はサーバのみ。フロントにはAnonキーのみ。
- 明示性: 変数名は役割が明瞭で、デフォルトのない重要値は起動時に検証する。

## 変数一覧（抜粋）

### フロント（Vite）
- `VITE_API_BASE_URL`: API ベースURL。未設定時は同一オリジン/localhostにフォールバック。
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`: Supabase 接続。
- `VITE_SUPABASE_STORAGE_SIGNED`（`true`/`false`）: 画像を署名URLで配信。
- `VITE_APP_ENV`（`dev`/`stg`/`prod`）: 任意の論理環境名。

### バックエンド（Node/Express）
- `NODE_ENV`（`development`/`production`）: 本番挙動切替。
- `APP_ENV`（`dev`/`stg`/`prod`）: 任意の論理環境名（ログ/メトリクスのラベルに活用）。
- `ORIGIN_ALLOWLIST` / `NEXT_PUBLIC_SITE_URL`: CORS 許可。
- `ADMIN_TOKEN`（>=32）/`ADMIN_IP_ALLOWLIST`: 管理系の保護。
- Supabase: `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_KEY` / `SUPABASE_JWT_SECRET`。
- レート制限: `RATE_LIMIT_RPS`, `EDIT_RATE_LIMIT`, `PURCHASE_RATE_LIMIT`, `DOWNLOAD_RATE_LIMIT`, `UPSCALE_RATE_LIMIT` など。
- Webhook: `WEBHOOK_RATE_LIMIT`, `WEBHOOK_REPLAY_TTL_MS`。

## バリデーション
- バックエンドは起動時に必須変数を検証（`backend/config/supabase.mjs` は必須変数不足でフェイルファスト）。
- CI では `required-envs.txt`（任意で追加）に基づきチェックすることを推奨。

## 値の注入ポイント
- ローカル: `.env.local` / `.env`（Git 無視）。
- CI/CD: プラットフォームのシークレット/環境変数機構で注入（Vercel等）。
- ビルド: フロントは `VITE_*` のみバンドルに埋め込み。バックエンドはランタイムで読み込む。

## 運用ルール
- 本番系の秘密はダンプしない（ログ/アラート/事故調でもマスク）。
- ローテーションは四半期または人の異動時に実施。手順は `SECURITY.md` に追記。
- 変更は PR で周知し、`CHANGELOG.md` に記載。

## チェックリスト（設定管理）
- [x] 本ドキュメント整備（原則/一覧/注入/運用）
- [ ] CI の必須環境変数チェック（required-envs の導入）
- [ ] 本番系シークレットのローテ手順を SECURITY.md に追記
