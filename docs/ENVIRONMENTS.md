# 環境分離ガイド（development / staging / production）

本書は、Jizai プロジェクトにおける開発・検証・本番環境の分離と設定運用の方針を示します。目的は、セキュリティと信頼性の向上、変更の安全な段階的展開、障害時の切り戻し容易化です。

## 環境の役割
- development: ローカル開発・統合前検証。安全のため実データや本物の秘密鍵は使用しない。
- staging: 本番相当の設定でリリース前の最終検証（パフォーマンス/セキュリティ/互換性）。
- production: エンドユーザ向け本番運用環境。

## 環境判定
- フロント（Vite）: `import.meta.env.MODE`（`development`/`production`）＋`VITE_APP_ENV`（`dev`/`stg`/`prod`）を使用可能。
- バックエンド（Node）: `NODE_ENV`（`development`/`production`）に加え、`APP_ENV`（`dev`/`stg`/`prod`）を任意で使用。既存コードは`NODE_ENV`で本番挙動を切替済み。

推奨: staging では `NODE_ENV=production` を用い、本番相当のヘッダ/CSP/レート制限を有効化しつつ、Allowlist やエンドポイントのみを切り替える。

## 主要環境変数の運用

### フロント（Vite）
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`: 各環境で固有値を設定。
- `VITE_API_BASE_URL`: dev=同一ホスト or `http://localhost:3000`、stg/prod=HTTPSの同一オリジン推奨。
- `VITE_SUPABASE_STORAGE_SIGNED`（任意）: Private運用時は`true`。
- `VITE_APP_ENV`: `dev`/`stg`/`prod` の明示（ログ等の切替に利用可能）。

### バックエンド（Node/Express）
- `NODE_ENV`: dev=`development`、stg/prod=`production`。
- `ORIGIN_ALLOWLIST` / `NEXT_PUBLIC_SITE_URL`: CORS 許可オリジン。stg/prod は `https://` 固定、localhost 禁止。
- `ADMIN_TOKEN`（>=32文字）/`ADMIN_IP_ALLOWLIST`（任意）: 管理系エンドポイント保護。
- Supabase: `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_KEY` / `SUPABASE_JWT_SECRET`。
- レート制限: `RATE_LIMIT_*` 群（stg/prod は本番相当）。
- Webhook: `WEBHOOK_RATE_LIMIT` / `WEBHOOK_REPLAY_TTL_MS`、（必要であれば）IP Allowlist。
- 任意: `APP_ENV`（`dev`/`stg`/`prod`）。ログ・計測のラベル付けに使用。

## ドメイン/オリジン設計例
- development:
  - フロント: `http://localhost:5173`
  - API: `http://localhost:3000`
  - CORS: `ORIGIN_ALLOWLIST=http://localhost:5173,http://localhost:3000`
- staging:
  - フロント: `https://stg.example.com`
  - API: `https://api-stg.example.com`（同一オリジンでも可）
  - CORS: `ORIGIN_ALLOWLIST=https://stg.example.com,https://api-stg.example.com`
- production:
  - フロント: `https://example.com`
  - API: `https://api.example.com`（または同一オリジン）
  - CORS: `ORIGIN_ALLOWLIST=https://example.com,https://api.example.com`

## 秘密・鍵の取り扱い
- Git へコミットしない（既存の `.gitignore` で `.env*` は除外済み）。
- デプロイ先（Vercel など）の環境変数管理で一元化。ローテ手順を `SECURITY.md` に追記。

## セキュリティ方針の環境別適用
- `NODE_ENV=production` で以下を有効（既存コードで対応済み）:
  - HSTS/セキュリティヘッダ強化（`security-headers.mjs`）。
  - 厳格 CORS（`cors-config.mjs`）。
  - Webhook 署名検証（Apple）。
  - RateLimit 標準ヘッダ・厳格値。
  - CSP（現状はReport-Only。将来的に強制へ）。

## デプロイ/CI の推奨フロー（例）
1. 開発: 各自ローカル（dev）で動作確認。PR 作成。
2. マージ後、自動で staging にデプロイ。E2E/負荷/セキュリティ検証を実施。
3. 承認後、production に昇格デプロイ。DBマイグレーションはステップ化（リハ→本番）。
4. ロールバック手順（直前タグへ戻す）を Runbook に明記。

## チェックリスト（環境分離）
- [x] 本ドキュメント整備（役割/変数/ヘッダ/CORS/CSP）
- [ ] staging 用の `.env` テンプレ例追加（任意）
- [ ] CI 上の `ORIGIN_ALLOWLIST` / `NEXT_PUBLIC_SITE_URL` の環境別登録
- [ ] Runbook にロールバック手順追記

