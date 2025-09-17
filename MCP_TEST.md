# Supabase MCP 接続テストガイド

## 🚀 MCP接続の設定と確認手順

### 1. Supabaseプロジェクトの準備

実際のSupabaseプロジェクトを作成し、以下の情報を取得してください：

```bash
# .env.localファイルを実際の値で更新
VITE_SUPABASE_URL=https://your-actual-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

### 2. Claude Desktop MCP設定

#### 設定ファイルパス
```bash
# Mac/Linux
~/.config/claude/claude_desktop_config.json

# Windows
%APPDATA%\Claude\claude_desktop_config.json
```

#### 設定内容
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-supabase",
        "--supabaseUrl",
        "YOUR_ACTUAL_SUPABASE_URL",
        "--supabaseKey",
        "YOUR_ACTUAL_ANON_KEY"
      ]
    }
  }
}
```

### 3. 接続テスト手順

#### ステップ1: MCPサーバー確認
```
MCPサーバーの一覧を表示してください
```

期待される結果：
```
利用可能なMCPサーバー:
- supabase: Supabase database operations
```

#### ステップ2: 基本接続テスト
```
Supabaseに接続して、データベースの情報を取得してください
```

#### ステップ3: テーブル一覧の確認
```
Supabaseのpublicスキーマにあるテーブル一覧を表示してください
```

#### ステップ4: Storageバケット確認
```
Supabase Storageのバケット一覧を表示してください
```

### 4. 基本操作テスト

#### データ挿入テスト（RLS設定後）
```
以下のSQLを実行してテストデータを挿入してください：

INSERT INTO public.user_profiles (id, display_name, bio)
VALUES (auth.uid(), 'テストユーザー', 'MCP接続テスト用のプロファイル');
```

#### データ取得テスト
```
public.user_profilesテーブルからデータを取得してください
```

#### Storage操作テスト
```
imagesバケットの内容を一覧表示してください
```

### 5. トラブルシューティング

#### 接続エラーの場合
1. **認証情報の確認**
   ```bash
   # Supabase URLとキーが正しいか確認
   curl -H "apikey: YOUR_ANON_KEY" \
        -H "Authorization: Bearer YOUR_ANON_KEY" \
        "YOUR_SUPABASE_URL/rest/v1/"
   ```

2. **Node.js環境の確認**
   ```bash
   node --version  # v18+推奨
   npx --version
   ```

3. **MCP設定ファイルの確認**
   ```bash
   cat ~/.config/claude/claude_desktop_config.json
   ```

#### RLSエラーの場合
RLSポリシーが厳しすぎる場合、以下のSQLで緩和：
```sql
-- 認証済みユーザーの基本アクセス許可
CREATE POLICY "Allow authenticated access"
ON public.your_table FOR ALL
USING (auth.role() = 'authenticated');
```

### 6. 成功時の動作例

#### 正常な接続時の応答例
```
✅ Supabase MCP接続成功

データベース情報:
- ホスト: your-project.supabase.co
- 認証状態: 接続済み
- 利用可能な機能: テーブル操作, Storage操作, リアルタイム機能

利用可能なテーブル:
- auth.users (システムテーブル)
- public.user_profiles (作成済み)
- public.images (作成済み)
- public.generation_history (作成済み)

利用可能なStorageバケット:
- images (公開バケット)
```

### 7. 次のステップ

MCP接続が確認できたら、以下の機能を試してください：

1. **画像アップロード連携**
   ```
   画像をアップロードして、メタデータをimagesテーブルに保存してください
   ```

2. **リアルタイム監視**
   ```
   user_profilesテーブルの変更をリアルタイムで監視してください
   ```

3. **データ分析**
   ```
   使用統計データを分析して、レポートを生成してください
   ```

### 8. セキュリティ確認事項

- ✅ RLSポリシーが適切に設定されている
- ✅ anon keyのみを使用（service_role keyは使用しない）
- ✅ 認証されたユーザーのみがデータにアクセス可能
- ✅ 個人データの適切な分離

---

**注意**: MCP接続により、Claude CodeからSupabaseデータベースへの直接アクセスが可能になります。必ず適切なRLSポリシーを設定してからテストを実行してください。