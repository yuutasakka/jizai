# CSP（Content Security Policy）運用ガイド

CSPはXSS対策の重要な柱です。本プロジェクトでは、既定でReport-Onlyを有効化し、違反が解消できた段階で強制モードへ切り替えます。

## 現状
- `backend/utils/security-headers.mjs`: CSPヘッダの生成。
- `backend/index-vault-integration.mjs`: `initializeCSPReporting({ reportOnly })` を適用。
- 既定値: `CSP_REPORT_ONLY` が未設定の場合は `true`（Report-Only）。

## 強制モードへの切替手順
1. レポート確認: `/v1/security/csp-stats` で違反がないことを確認。
2. 環境変数設定: `CSP_REPORT_ONLY=false` を設定（stg→prod の順）。
   - Vercel CLI 例: `vercel env add CSP_REPORT_ONLY` → 値に `false`
   - ダッシュボード: Project Settings → Environment Variables → `CSP_REPORT_ONLY=false`
3. 監視強化: 切替直後はエラー/レポートを重点監視。
4. 影響時のロールバック: `CSP_REPORT_ONLY=true` に戻す。

## 推奨ディレクティブ
- `default-src 'self'`
- 画像: `img-src 'self' data: https: blob:`
- スクリプト: 本番は `'self' 'nonce-<nonce>'`（inline不可）、開発は `'unsafe-inline'` 許容。
- スタイル: 必要に応じて `nonce` 付与、Google Fonts を限定許可。
- `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'` などの強化

## よくある対処
- 外部CDNの追加許可 / 置換
- インラインスクリプト排除 / `nonce` 付与
- 画像の data: / blob: の適正化

## チェックリスト（CSP）
- [x] ENV 切替で Report-Only/強制の両モード対応
- [ ] stg で `CSP_REPORT_ONLY=false` を試験適用
- [ ] prod で `CSP_REPORT_ONLY=false` を適用
