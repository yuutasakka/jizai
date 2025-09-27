# 本番デプロイ前セキュリティチェックリスト

## 🔒 セキュリティ対応状況

### ✅ 完了済み
- [x] Vite脆弱性の修正（npm audit fix実行済み）
- [x] 環境変数の.gitignore設定確認済み
- [x] 機密情報ログ出力の制限（開発環境のみ）
- [x] Supabase RLS設定
- [x] JWT認証システム
- [x] HTTPS/Mixed Content対策

## 📋 本番前チェックリスト

### 1. 環境変数とシークレット
- [ ] 本番環境の `.env` ファイルを確認
- [ ] `SUPABASE_JWT_SECRET` が設定されている
- [ ] `VITE_SUPABASE_ANON_KEY` が本番用の値になっている
- [ ] API キーが開発環境の値でないことを確認

### 2. PostgreSQL/Supabaseアップグレード
- [ ] バージョン確認（Dashboard → Database → Settings → Upgrades）
- [ ] バックアップ作成
- [ ] アップグレードガイド確認
- [ ] 拡張機能（pgcrypto）の互換性確認
- [ ] メンテナンス時間の計画

### 3. セキュリティヘッダー（推奨）
- [ ] CSP (Content Security Policy) の実装検討
- [ ] X-Frame-Options の設定検討
- [ ] X-Content-Type-Options の設定検討

### 4. RLS/データベースセキュリティ
- [ ] `supabase/storage_examples_policy.sql` 実行済み
- [ ] `supabase/user_credits_hardening.sql` 実行済み
- [ ] `supabase/hardening_functions_search_path.sql` 実行済み
- [ ] Supabase Linter実行して警告解消確認

## 🚀 PostgreSQLアップグレード手順

### 事前準備
1. **バージョン確認**
   ```sql
   SELECT version();
   ```

2. **バックアップ作成**
   - Supabase Dashboard → Database → Backups
   - 手動スナップショット作成

3. **拡張機能確認**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pgcrypto';
   ```

### アップグレード実行
1. Dashboard → Database → Upgrades
2. メンテナンス時間を選択
3. アップグレード実行

### 事後検証
1. **バージョン確認**
   ```sql
   SELECT version();
   ```

2. **主要API疎通確認**
   - `/v1/health`
   - `/v1/memories`
   - `/v1/balance`

3. **重要SQL疎通確認**
   ```sql
   -- ビューアクセス確認
   SELECT * FROM user_prompt_popularity LIMIT 1;

   -- テーブルアクセス確認
   SELECT * FROM user_credits LIMIT 1;
   SELECT * FROM inspiration_examples LIMIT 1;
   ```

4. **Linter再実行**
   - Supabase Dashboard → Database → Linter
   - 警告が解消されていることを確認

## ⚠️ 緊急時対応

### ロールバック手順
1. Dashboard → Database → Backups
2. 直前のスナップショットを選択
3. Restore実行

### 監視ポイント
- エラーレート
- レスポンス時間
- DB接続数
- アップグレード後24時間は継続監視

## 📝 追加推奨事項

### セキュリティヘッダー実装例
```javascript
// vite.config.ts に追加
export default defineConfig({
  server: {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  }
})
```

### CSP実装例
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
```

## 🔍 定期セキュリティ監査

### 月次チェック
- [ ] npm audit実行
- [ ] 依存関係の更新確認
- [ ] Supabase Linter実行
- [ ] アクセスログ確認

### 四半期チェック
- [ ] セキュリティヘッダー設定見直し
- [ ] RLSポリシー見直し
- [ ] 機密情報の漏洩確認
- [ ] バックアップ/復旧テスト

---

**最終更新**: 2025-09-27
**レビュー担当**: 開発チーム
**次回見直し**: 2025-12-27