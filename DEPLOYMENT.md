# JIZAI アプリケーション デプロイメントガイド

本ガイドでは、JIZAIアプリケーションのフロントエンド（Vite）をVercelに、バックエンド（Express）を任意のプラットフォームにデプロイする手順を説明します。

## 📋 事前準備

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセス
2. 「Start your project」→「New project」をクリック
3. プロジェクト情報を入力：
   - **Name**: `jizai-app`
   - **Region**: `Northeast Asia (Tokyo)`
   - **Database Password**: 強力なパスワードを生成
4. プロジェクト作成後、以下の情報を取得：
   - **Project URL**: Settings → API → Project URL
   - **Anon Key**: Settings → API → anon public
   - **Service Key**: Settings → API → service_role

### 2. Supabase認証設定

#### リダイレクトURL設定
Authentication → URL Configuration → Redirect URLs に追加：
```
http://localhost:5173/auth/callback
https://your-domain.vercel.app/auth/callback
```

#### プロバイダー設定
- **Google**: Authentication → Providers → Google を有効化
- **Apple**: Authentication → Providers → Apple を有効化

### 3. Supabase Storage設定

#### Storage Bucket作成:
1. Storage → Buckets → 「New bucket」をクリック
2. Bucket name: `images`
3. 「Public bucket」を有効化
4. 「Create bucket」をクリック

#### RLS (Row Level Security) 設定:
Storage → Policies → 新しいポリシーを作成：

```sql
-- ユーザーが自分のファイルのみアップロード可能
CREATE POLICY "Users can upload their own images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ユーザーが自分のファイルのみ削除可能
CREATE POLICY "Users can delete their own images" ON storage.objects
FOR DELETE USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- すべてのユーザーが画像を表示可能（公開バケット）
CREATE POLICY "Anyone can view images" ON storage.objects
FOR SELECT USING (bucket_id = 'images');
```

#### フォルダ構造:
```
images/
├── originals/     # オリジナル画像
├── generated/     # AI生成画像
├── thumbnails/    # サムネイル
├── profiles/      # プロフィール画像
├── gallery/       # ギャラリー画像
└── examples/      # サンプル画像
```

## 🚀 フロントエンド デプロイ（Vercel）

### 1. Vercelプロジェクト作成

```bash
# Vercel CLIインストール（未インストールの場合）
npm i -g vercel

# プロジェクトディレクトリでVercelを初期化
cd /path/to/jizai
vercel

# プロジェクト設定
# Framework Preset: Vite
# Root Directory: ./
# Build Command: npm run build
# Output Directory: dist
```

### 2. 環境変数設定

#### 方法1: Vercel CLI使用
```bash
vercel env add VITE_SUPABASE_URL
# 値: https://your-project.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY
# 値: your_actual_anon_key_here

vercel env add VITE_API_BASE_URL
# 値: https://your-backend-domain.com
```

#### 方法2: Vercel Dashboard使用
1. Vercel Dashboard → プロジェクト → Settings → Environment Variables
2. 以下の変数を追加：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_BASE_URL`（バックエンドが別ドメインの場合）

### 3. デプロイ実行

```bash
vercel --prod
```

## 🖥️ バックエンド デプロイ

### 1. 環境変数の準備

#### 必須の秘密鍵生成
```bash
# JWT Secret (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# API Encryption Key (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Admin Token (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. プラットフォーム別設定

#### Vercel Functions（サーバーレス）
```bash
# backendディレクトリに移動
cd backend

# Vercelプロジェクト作成
vercel

# 環境変数設定
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_KEY
vercel env add SUPABASE_JWT_SECRET
vercel env add ADMIN_TOKEN
vercel env add ORIGIN_ALLOWLIST
vercel env add TRUST_PROXY
vercel env add WEBHOOK_RATE_LIMIT
vercel env add ADMIN_WEBHOOK_RATE_LIMIT
vercel env add ADMIN_ANALYTICS_RATE_LIMIT
vercel env add WEBHOOK_REPLAY_TTL_MS
vercel env add WEBHOOK_IP_ALLOWLIST
vercel env add ADMIN_IP_ALLOWLIST
vercel env add MAX_IMAGE_SIDE
vercel env add MAX_IMAGE_PIXELS
vercel env add GEMINI_API_KEY
```

#### Railway/Render/Heroku（コンテナ）
1. プラットフォームでプロジェクト作成
2. 環境変数セクションで以下を設定：
   - すべての `backend/.env.production.example` の変数
   - 特に `SUPABASE_SERVICE_KEY` は機密として設定

### 3. CORS設定更新

フロントエンドドメインが確定したら、バックエンドの環境変数を更新：
```env
ORIGIN_ALLOWLIST=https://jizai-app.vercel.app,https://your-custom-domain.com
NEXT_PUBLIC_SITE_URL=https://jizai-app.vercel.app
```

## 🔒 セキュリティ チェックリスト

### フロントエンド
- [ ] `VITE_SUPABASE_URL` が正しく設定されている
- [ ] `VITE_SUPABASE_ANON_KEY` が正しく設定されている
- [ ] **重要**: `VITE_` 以外の秘密情報がフロントエンドに含まれていない

### バックエンド
- [ ] `SUPABASE_SERVICE_KEY` が安全に保管されている
- [ ] `ADMIN_TOKEN` が32文字以上の強力なトークン
- [ ] `ORIGIN_ALLOWLIST` が実際のフロントエンドドメインのみに制限
- [ ] すべてのAPI秘密鍵が環境変数として設定されている
- [ ] HTTPSが有効になっている

### Supabase
- [ ] Row Level Security (RLS) が適切に設定されている
- [ ] リダイレクトURLが本番ドメインに更新されている
- [ ] 認証プロバイダー（Google/Apple）が正しく設定されている

## 🔧 トラブルシューティング

### よくある問題

#### 1. CORS エラー
```
Access to fetch at 'https://backend.com/api' from origin 'https://frontend.vercel.app' has been blocked by CORS policy
```
**解決方法**: バックエンドの `ORIGIN_ALLOWLIST` にフロントエンドドメインを追加

#### 2. Supabase 認証エラー
```
Invalid redirect URL
```
**解決方法**: Supabase Dashboard → Authentication → URL Configuration でリダイレクトURLを追加

#### 3. 環境変数が読み込まれない
**フロントエンド**: `VITE_` プレフィックスが付いているか確認
**バックエンド**: デプロイ後に環境変数が正しく設定されているか確認

### デバッグ用ログ

#### フロントエンド（開発時）
```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
```

#### バックエンド
```javascript
console.log('Environment:', process.env.NODE_ENV);
console.log('CORS Origins:', process.env.ORIGIN_ALLOWLIST);
```

## 📊 デプロイ後の確認事項

### 1. 機能テスト
- [ ] アプリケーションが正常に読み込まれる
- [ ] Google認証が動作する
- [ ] Apple認証が動作する
- [ ] API エンドポイントが応答する

### 2. パフォーマンステスト
- [ ] ページ読み込み時間 < 3秒
- [ ] API レスポンス時間 < 500ms
- [ ] Lighthouse スコア > 90

### 3. セキュリティテスト
- [ ] HTTPS が有効
- [ ] 環境変数に機密情報が漏洩していない
- [ ] CORS設定が適切

## 📞 サポート

デプロイに関して問題が発生した場合：

1. 環境変数が正しく設定されているか確認
2. ログを確認してエラーメッセージを特定
3. 本ガイドのトラブルシューティングセクションを参照
4. 必要に応じて開発チームに連絡

---

**重要**: 本番環境では必ず強力なパスワードと秘密鍵を使用し、定期的にローテーションを行ってください。
