# JIZAIアプリ用 Supabase統合設定手順

プロジェクトID: `ezdwgjlmemcamopxaxsz`
プロジェクトURL: https://supabase.com/dashboard/project/ezdwgjlmemcamopxaxsz

## 🔑 認証情報の取得

### 1. API設定の確認

1. [Supabase Dashboard](https://supabase.com/dashboard/project/ezdwgjlmemcamopxaxsz) にアクセス
2. **Settings** → **API** をクリック
3. 以下の情報をコピー：

```
Project URL: https://ezdwgjlmemcamopxaxsz.supabase.co
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (実際のキー)
service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (実際のキー)
```

## 📝 環境変数の設定

### 1. フロントエンド用環境変数

`.env.local` ファイルを以下の内容で更新：

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://ezdwgjlmemcamopxaxsz.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here

# API Configuration (optional)
VITE_API_BASE_URL=https://your-backend-domain.com
```

### 2. バックエンド用環境変数

`backend/.env.production` ファイルを作成：

```env
# Supabase Configuration
SUPABASE_URL=https://ezdwgjlmemcamopxaxsz.supabase.co
SUPABASE_ANON_KEY=your_actual_anon_key_here
SUPABASE_SERVICE_KEY=your_actual_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here

# 他の設定は backend/.env.production.example を参照
```

## 🗄️ Storage設定

### 1. imagesバケットの作成

1. **Storage** → **Buckets** → **New bucket**
2. Bucket name: `images`
3. **Public bucket** を有効化
4. **Create bucket** をクリック

### 2. フォルダ構造の作成

Storageで以下のフォルダを作成：
```
images/
├── originals/     # オリジナル画像
├── generated/     # AI生成画像  
├── thumbnails/    # サムネイル
├── profiles/      # プロフィール画像
├── gallery/       # ギャラリー画像
└── examples/      # サンプル画像
```

## 🔐 RLS（Row Level Security）設定

### 1. SQLエディタでRLSポリシー実行

1. **SQL Editor** にアクセス
2. `supabase/rls-policies.sql` の内容をコピー&実行
3. エラーがないことを確認

### 2. 必要なテーブルの作成

以下のテーブルが作成されます：
- `public.user_profiles` - ユーザープロファイル
- `public.images` - 画像メタデータ
- `public.generation_history` - AI生成履歴
- `public.usage_stats` - 使用統計

## 🔌 Claude Code MCP設定

### 1. MCP設定ファイルの作成

```bash
# Mac/Linux
~/.config/claude/claude_desktop_config.json

# Windows  
%APPDATA%\Claude\claude_desktop_config.json
```

### 2. 設定内容

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-supabase",
        "--supabaseUrl",
        "https://ezdwgjlmemcamopxaxsz.supabase.co",
        "--supabaseKey",
        "your_actual_anon_key_here"
      ]
    }
  }
}
```

### 3. Claude Code の再起動

設定反映のため Claude Code を再起動

## 🧪 動作テスト

### 1. MCP接続確認

Claude Code で以下を実行：
```
MCPサーバーの一覧を表示してください
```

### 2. データベース接続テスト

```
Supabaseに接続して、テーブル一覧を表示してください
```

### 3. Storage接続テスト

```
imagesバケットの内容を確認してください
```

## 🚀 認証設定

### 1. Google認証設定

1. **Authentication** → **Providers** → **Google**
2. **Enable Google provider** を有効化
3. Google Cloud Console で OAuth設定
4. リダイレクトURL を追加：
   ```
   https://ezdwgjlmemcamopxaxsz.supabase.co/auth/v1/callback
   ```

### 2. Apple認証設定

1. **Authentication** → **Providers** → **Apple**
2. **Enable Apple provider** を有効化
3. Apple Developer Console で設定

### 3. リダイレクトURL設定

**Authentication** → **URL Configuration** で追加：
```
http://localhost:5173/auth/callback
https://your-domain.vercel.app/auth/callback
```

## ✅ 設定完了確認

### 1. 環境変数確認
- [ ] `.env.local` が正しく設定されている
- [ ] `backend/.env.production` が設定されている

### 2. Supabase設定確認
- [ ] `images` バケットが作成されている
- [ ] RLSポリシーが設定されている
- [ ] 認証プロバイダーが有効化されている

### 3. MCP接続確認
- [ ] Claude Code でMCP接続が成功している
- [ ] データベース操作が可能

### 4. アプリケーション確認
- [ ] ローカル開発でSupabase認証が動作
- [ ] 画像アップロードが正常に動作
- [ ] 画像表示が正常に動作

## 🔄 次のステップ

1. **認証情報を実際の値で更新**
2. **RLSポリシーの実行**
3. **MCP設定の完了**
4. **アプリケーションでの動作確認**
5. **Vercelへのデプロイ設定**

---

**重要**: 認証情報（特にservice_role key）は機密情報です。適切に管理し、本番環境では環境変数として設定してください。