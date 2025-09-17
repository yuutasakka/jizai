# Claude Code用 Supabase MCP サーバー設定ガイド

Claude CodeでSupabaseのMCP（Model Context Protocol）サーバーを使用するための実践的で安全な設定ガイドです。

## 📋 前提条件

- ✅ Node.js がインストール済み（推奨: v18+）
- ✅ Supabase プロジェクトを作成済み（URL と API キーが取得可能）
- ✅ Claude Code がインストール済み

## 🚀 設定手順

### 1. Supabase認証情報の取得

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. 該当プロジェクト → **Settings** → **API** にアクセス
3. 以下の情報を控える：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: 公開用APIキー（RLSで制御）

### 2. MCP設定ファイルの作成

#### 設定ファイルのパス
| OS | パス |
|----|----|
| **Mac/Linux** | `~/.config/claude/claude_desktop_config.json` |
| **Windows** | `%APPDATA%\Claude\claude_desktop_config.json` |

#### ディレクトリの作成（存在しない場合）
```bash
# Mac/Linux
mkdir -p ~/.config/claude

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path "$env:APPDATA\Claude"
```

### 3. 設定ファイルの編集

#### 基本設定（推奨）
`claude_desktop_config.json` に以下を記述：

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-supabase",
        "--supabaseUrl",
        "YOUR_SUPABASE_PROJECT_URL",
        "--supabaseKey",
        "YOUR_SUPABASE_ANON_KEY"
      ]
    }
  }
}
```

#### 環境変数を使用した設定（より安全）
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-supabase",
        "--supabaseUrl",
        "$SUPABASE_URL",
        "--supabaseKey",
        "$SUPABASE_ANON_KEY"
      ],
      "env": {
        "SUPABASE_URL": "https://xxxxx.supabase.co",
        "SUPABASE_ANON_KEY": "your_anon_key_here"
      }
    }
  }
}
```

#### 固定インストール設定（安定版）
```bash
# 事前にグローバルインストール
npm install -g @modelcontextprotocol/server-supabase
```

```json
{
  "mcpServers": {
    "supabase": {
      "command": "server-supabase",
      "args": [
        "--supabaseUrl",
        "YOUR_SUPABASE_PROJECT_URL",
        "--supabaseKey",
        "YOUR_SUPABASE_ANON_KEY"
      ]
    }
  }
}
```

### 4. 実際の値での設定例

プロジェクト用設定ファイル（`claude_desktop_config.json.example`）をコピー：

```bash
# プロジェクトルートから設定ファイルをコピー
cp claude_desktop_config.json.example ~/.config/claude/claude_desktop_config.json

# YOUR_... を実際の値に置き換えて編集
nano ~/.config/claude/claude_desktop_config.json
```

### 5. Claude Code の再起動

設定を反映するためにClaude Codeを完全に終了し、再起動してください。

## 🔧 使用方法

### MCP接続の確認
Claude Code内で以下のコマンドでMCPサーバーの状態を確認：

```
MCPサーバー一覧を表示して
```

### 基本的な操作例

#### テーブル一覧の取得
```
Supabaseのテーブル一覧を表示してください
```

#### データの読み取り
```
usersテーブルからデータを取得してください
```

#### SQL クエリの実行
```
以下のSQLを実行してください：
SELECT * FROM images WHERE created_at > '2024-01-01'
```

#### スキーマ情報の確認
```
imagesテーブルのスキーマ情報を教えてください
```

## 🔒 セキュリティ設定

### RLS（Row Level Security）の設定

Supabase Dashboard → Authentication → RLS を有効化：

```sql
-- ユーザーが自分のデータのみアクセス可能
CREATE POLICY "Users can only access their own data"
ON public.user_data FOR ALL
USING (auth.uid() = user_id);

-- 画像は認証ユーザーのみ表示可能
CREATE POLICY "Authenticated users can view images"
ON public.images FOR SELECT
USING (auth.role() = 'authenticated');
```

### セキュリティのベストプラクティス

#### ✅ 推奨事項
- **anon key** を使用（公開可能、RLSで制御）
- **RLS ポリシー** を適切に設定
- **環境変数** での認証情報管理
- **定期的なキーローテーション**

#### ❌ 避けるべき事項
- **service_role key** の使用（管理用のみ、強力な権限）
- **設定ファイルの共有**（認証情報が含まれる）
- **RLS の無効化**（セキュリティリスク）

## 🛠️ トラブルシューティング

### 接続できない場合

#### 1. 認証情報の確認
```bash
# 設定ファイルの内容を確認
cat ~/.config/claude/claude_desktop_config.json

# Supabase接続テスト
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     "YOUR_SUPABASE_URL/rest/v1/"
```

#### 2. Node.js バージョンの確認
```bash
node --version  # v18+ 推奨
npm --version
```

#### 3. ネットワーク・プロキシの確認
```bash
# npx の動作確認
npx --version

# パッケージダウンロードテスト
npm view @modelcontextprotocol/server-supabase
```

### よくあるエラーと解決方法

#### エラー: "RLS policy violation"
```sql
-- RLSポリシーが厳しすぎる場合の緩和例
CREATE POLICY "Allow read access for authenticated users"
ON public.your_table FOR SELECT
USING (auth.role() = 'authenticated');
```

#### エラー: "Command not found"
```bash
# グローバルインストールで解決
npm install -g @modelcontextprotocol/server-supabase

# 設定ファイルのcommandを変更
"command": "server-supabase"
```

#### エラー: "Network timeout"
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "--timeout=30000",
        "@modelcontextprotocol/server-supabase",
        "--supabaseUrl", "YOUR_URL",
        "--supabaseKey", "YOUR_KEY"
      ]
    }
  }
}
```

## 🏗️ 応用設定

### 複数環境の管理

```json
{
  "mcpServers": {
    "supabase_dev": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-supabase",
        "--supabaseUrl", "https://dev-project.supabase.co",
        "--supabaseKey", "dev_anon_key"
      ]
    },
    "supabase_prod": {
      "command": "npx", 
      "args": [
        "-y",
        "@modelcontextprotocol/server-supabase",
        "--supabaseUrl", "https://prod-project.supabase.co",
        "--supabaseKey", "prod_anon_key"
      ]
    }
  }
}
```

### バージョン固定

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-supabase@1.0.0",
        "--supabaseUrl", "YOUR_URL",
        "--supabaseKey", "YOUR_KEY"
      ]
    }
  }
}
```

## 📊 使用可能な機能

### データベース操作
- ✅ テーブル一覧取得
- ✅ スキーマ情報表示
- ✅ データの読み取り（SELECT）
- ✅ データの挿入（INSERT）*
- ✅ データの更新（UPDATE）*
- ✅ データの削除（DELETE）*

### Storage操作
- ✅ バケット一覧取得
- ✅ ファイル一覧表示
- ✅ ファイルのアップロード*
- ✅ ファイルの削除*

### リアルタイム機能
- ✅ サブスクリプション設定
- ✅ リアルタイム変更監視

*RLSポリシーの設定により制限される場合があります

## 🔍 動作確認

### 基本接続テスト
```
Supabase MCPサーバーに接続されているか確認してください
```

### データアクセステスト
```
public.imagesテーブルの最初の5件を表示してください
```

### Storage テスト
```
imagesバケットの内容を一覧表示してください
```

## 📞 サポート

問題が解決しない場合：

1. **設定ファイルの確認**：認証情報が正しいか
2. **RLSポリシーの確認**：アクセス権限が適切か
3. **ネットワーク確認**：プロキシ・ファイアウォール設定
4. **Claude Code ログ**：エラーメッセージの詳細確認

---

**重要**: 本設定により、Claude CodeからSupabaseデータベースへの直接アクセスが可能になります。適切なRLSポリシーを設定し、セキュリティを確保してください。