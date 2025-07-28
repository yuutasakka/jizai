# Supabase セットアップガイド

このガイドでは、CSRF保護システム用のSupabaseデータベースをセットアップする手順を説明します。

## 📋 前提条件

- Supabaseアカウント（https://supabase.com）
- プロジェクトURL: https://ufwbmwwggyawaperqrtc.supabase.co
- Node.js 18以上
- Git

## 🚀 セットアップ手順

### 1. Supabaseプロジェクトの準備

1. **Supabaseダッシュボードにアクセス**
   ```
   https://supabase.com/dashboard/project/ufwbmwwggyawaperqrtc
   ```

2. **APIキーを取得**
   - Settings > API から以下のキーを取得:
     - `anon public` キー
     - `service_role` キー（秘密鍵）

### 2. 環境変数の設定

1. **tasukaru_demo/.env ファイルを作成**
   ```bash
   cp tasukaru_demo/.env.example tasukaru_demo/.env
   ```

2. **実際の値を設定**
   ```env
   VITE_SUPABASE_URL=https://ufwbmwwggyawaperqrtc.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...（実際のキー）
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...（実際のキー）
   ```

### 3. データベーススキーマの適用

#### Option A: SQL Editorを使用（推奨）

1. **Supabaseダッシュボード**でSQL Editorにアクセス
2. **新しいクエリを作成**
3. **`supabase-schema.sql`の内容をコピー&ペースト**
4. **実行ボタンをクリック**

#### Option B: CLIを使用

```bash
# Supabase CLIのインストール
npm install -g supabase

# プロジェクトディレクトリで初期化
cd /Users/yutasakka/claude-project
supabase init

# データベースに接続してスキーマを適用
supabase db push
```

### 4. 初期データの確認

スキーマ適用後、以下のテーブルが作成されることを確認:

✅ **csrf_tokens** - CSRFトークン管理
✅ **phone_verification_sessions** - 電話番号認証
✅ **admin_users** - 管理者ユーザー
✅ **admin_login_sessions** - 管理者セッション
✅ **security_logs** - セキュリティログ
✅ **rate_limits** - レート制限
✅ **diagnosis_results** - 診断結果

### 5. RLS（Row Level Security）の確認

各テーブルでRLSが有効になっていることを確認:

```sql
-- RLS状態の確認
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

### 6. 初期管理者アカウントのテスト

デフォルト管理者アカウントでログインをテスト:

```
ユーザー名: admin
パスワード: admin123
```

## 🔧 開発環境での動作確認

### 1. 共通ライブラリのビルド

```bash
cd shared-lib
npm install
npm run build
```

### 2. tasukaru_demoの起動

```bash
cd tasukaru_demo
npm install
npm run dev
```

### 3. CSRF保護のテスト

1. **ブラウザでアプリにアクセス**: http://localhost:5173
2. **開発者ツール**でNetworkタブを開く
3. **電話番号認証**を試行
4. **X-CSRF-Token**ヘッダーが送信されることを確認

### 4. セキュリティログの確認

Supabaseダッシュボードで以下のクエリを実行:

```sql
SELECT 
  event_type,
  event_category,
  severity,
  ip_address,
  created_at,
  event_details
FROM security_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

## 📊 管理画面での監視設定

### セキュリティダッシュボード

```sql
-- 過去24時間のセキュリティイベント
SELECT * FROM security_dashboard 
WHERE hour >= NOW() - INTERVAL '24 hours';
```

### アクティブセッション監視

```sql
-- アクティブな管理者セッション
SELECT * FROM active_sessions_monitor;
```

### レート制限監視

```sql
-- 現在のレート制限状況
SELECT * FROM rate_limit_monitor 
WHERE status IN ('BLOCKED', 'ACTIVE');
```

## 🚨 トラブルシューティング

### よくある問題

1. **RLSポリシーエラー**
   ```sql
   -- RLSを一時的に無効化（開発時のみ）
   ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
   ```

2. **APIキー認証エラー**
   - `.env`ファイルの形式を確認
   - キーに余分なスペースがないか確認

3. **CORS エラー**
   - Supabaseダッシュボードでドメインを追加
   - Authentication > Settings > Site URL

4. **マイグレーションエラー**
   ```sql
   -- エラーの詳細を確認
   SELECT * FROM _realtime.messages 
   ORDER BY inserted_at DESC 
   LIMIT 5;
   ```

### デバッグクエリ

```sql
-- テーブル存在確認
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- 制約確認
SELECT constraint_name, table_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_schema = 'public';

-- インデックス確認
SELECT indexname, tablename FROM pg_indexes 
WHERE schemaname = 'public';
```

## 🔐 本番環境デプロイ時の注意事項

### セキュリティ設定

1. **環境変数の暗号化**
   - Vercel/Netlifyでの環境変数設定
   - シークレットキーの安全な管理

2. **ドメイン制限**
   - Supabaseでの許可ドメイン設定
   - CORS設定の厳格化

3. **データベース設定**
   ```sql
   -- 本番環境用の設定
   ALTER DATABASE postgres SET log_min_duration_statement = 1000;
   ALTER DATABASE postgres SET log_statement = 'mod';
   ```

### モニタリング設定

1. **セキュリティアラート**
   ```sql
   -- 重要なセキュリティイベントの通知設定
   CREATE OR REPLACE FUNCTION notify_security_alert()
   RETURNS TRIGGER AS $$
   BEGIN
     IF NEW.severity IN ('error', 'critical') THEN
       PERFORM pg_notify('security_alert', 
         json_build_object(
           'event_type', NEW.event_type,
           'severity', NEW.severity,
           'details', NEW.event_details
         )::text
       );
     END IF;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER security_alert_trigger
     AFTER INSERT ON security_logs
     FOR EACH ROW
     EXECUTE FUNCTION notify_security_alert();
   ```

2. **パフォーマンス監視**
   - レスポンス時間の監視
   - データベース接続数の監視
   - エラー率の監視

## 📞 サポート

問題が発生した場合:

1. **ログの確認**
   - ブラウザの開発者ツール
   - Supabaseのログ
   - サーバーログ

2. **Github Issues**
   - プロジェクトのIssuesページで報告

3. **緊急時の連絡先**
   - システム管理者への連絡

---

このセットアップガイドに従って、CSRF保護システムが正常に動作することを確認してください。