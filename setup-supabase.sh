#!/bin/bash

# JIZAI Supabase Setup Script
# Project: ezdwgjlmemcamopxaxsz

echo "🚀 JIZAI Supabase セットアップスクリプト"
echo "プロジェクト: ezdwgjlmemcamopxaxsz"
echo "Dashboard: https://supabase.com/dashboard/project/ezdwgjlmemcamopxaxsz"
echo ""

# 1. anon keyの入力を求める
echo "📋 Step 1: Supabase API Key の設定"
echo "Supabase Dashboard → Settings → API から anon public key をコピーしてください"
echo ""
read -p "anon public key を入力してください: " ANON_KEY

if [ -z "$ANON_KEY" ]; then
    echo "❌ anon key が入力されていません。スクリプトを終了します。"
    exit 1
fi

# 2. .env.localファイルを更新
echo ""
echo "📝 Step 2: .env.local ファイルを更新中..."

cat > .env.local << EOF
# Supabase Configuration (JIZAI Project)
# Project ID: ezdwgjlmemcamopxaxsz
# Dashboard: https://supabase.com/dashboard/project/ezdwgjlmemcamopxaxsz

VITE_SUPABASE_URL=https://ezdwgjlmemcamopxaxsz.supabase.co
VITE_SUPABASE_ANON_KEY=$ANON_KEY

# Development Note:
# - Full Supabase authentication and storage features are now enabled
# - Make sure to set up Storage bucket and RLS policies in Supabase Dashboard
EOF

echo "✅ .env.local ファイルが更新されました"

# 3. MCP設定ファイルのパスを確認
echo ""
echo "🔌 Step 3: Claude Code MCP設定"

# OS判定
if [[ "$OSTYPE" == "darwin"* ]]; then
    MCP_PATH="$HOME/.config/claude/claude_desktop_config.json"
    echo "Mac環境を検出しました"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    MCP_PATH="$HOME/.config/claude/claude_desktop_config.json"
    echo "Linux環境を検出しました"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    MCP_PATH="$APPDATA/Claude/claude_desktop_config.json"
    echo "Windows環境を検出しました"
else
    echo "❓ 不明な環境です。手動でMCP設定を行ってください"
    MCP_PATH=""
fi

if [ -n "$MCP_PATH" ]; then
    # ディレクトリが存在しない場合は作成
    mkdir -p "$(dirname "$MCP_PATH")"
    
    # MCP設定ファイルを作成
    cat > "$MCP_PATH" << EOF
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
        "$ANON_KEY"
      ]
    }
  }
}
EOF
    
    echo "✅ MCP設定ファイルが作成されました: $MCP_PATH"
    echo "⚠️  Claude Code を再起動してMCP設定を反映してください"
else
    echo "❌ MCP設定ファイルの自動作成に失敗しました"
    echo "手動で claude_desktop_config.json.example を参考に設定してください"
fi

# 4. 次のステップを表示
echo ""
echo "🎯 次に行うべき設定:"
echo ""
echo "1. Supabase Storage設定:"
echo "   - Storage → Buckets → New bucket"
echo "   - Bucket name: 'images'"
echo "   - Public bucket を有効化"
echo ""
echo "2. RLS (Row Level Security) 設定:"
echo "   - SQL Editor で supabase/rls-policies.sql を実行"
echo ""
echo "3. 認証プロバイダー設定:"
echo "   - Authentication → Providers → Google/Apple を有効化"
echo "   - リダイレクトURL: https://ezdwgjlmemcamopxaxsz.supabase.co/auth/v1/callback"
echo ""
echo "4. Claude Code での動作確認:"
echo "   - Claude Code を再起動"
echo "   - 'MCPサーバーの一覧を表示してください' でテスト"
echo ""
echo "詳細な手順は SUPABASE_SETUP.md を参照してください"
echo ""
echo "🎉 基本セットアップが完了しました！"