# Jizai Backend

Node.js Express サーバー - Qwen-Image-Edit API との連携

## セットアップ

1. 依存関係をインストール:
```bash
npm install
```

2. 環境変数を設定:
```bash
# .env ファイルが作成済みです。DASHSCOPE_API_KEY を設定してください
vim .env
# または
nano .env
```

3. 開発サーバーを起動:
```bash
npm run dev
```

## ヘルスチェック

サーバーが起動したら、以下のコマンドでヘルスチェックを実行:

```bash
curl http://localhost:3000/v1/health
```

期待される出力:
```json
{"ok": true}
```

## 起動手順

1. バックエンドディレクトリに移動:
```bash
cd backend
```

2. 依存関係をインストール:
```bash
npm install
```

3. 開発サーバーを起動:
```bash
npm run dev
```

4. ヘルスチェックで動作確認:
```bash
curl http://localhost:3000/v1/health
```

## API エンドポイント

- `GET /v1/health` - ヘルスチェック ✅
- `POST /v1/edit` - 画像編集 ✅
- `GET /v1/balance` - 残高確認 (予定)
- `POST /v1/purchase` - 課金処理 (予定)
- `POST /v1/report` - 通報機能 (予定)

### POST /v1/edit

画像編集を実行します。

**リクエスト**: multipart/form-data
- `image` (ファイル): JPG/PNG/WebP/BMP/TIFF (≤10MB)
- `prompt` (文字列): 編集指示

**レスポンス**: image/png (バイナリ)

**エラーコード**:
- `400` - リクエストエラー、NGワード検出
- `502` - 外部API接続エラー  
- `500` - サーバーエラー

**curl例**:
```bash
# 画像編集
curl -s -X POST http://localhost:3000/v1/edit \
  -F "image=@/path/to/your.jpg" \
  -F "prompt=Change 'OPEN' to 'CLOSED' and keep the original font and spacing" \
  -o result.png

# NGワードテスト（400エラーになるはず）
curl -X POST http://localhost:3000/v1/edit \
  -F "image=@/path/to/your.jpg" \
  -F "prompt=hate speech example"
```

## 環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `DASHSCOPE_API_KEY` | Qwen API キー | ✅ |
| `PORT` | サーバーポート (default: 3000) | ❌ |
| `RATE_LIMIT_RPS` | レート制限 (default: 2) | ❌ |
| `ORIGIN_ALLOWLIST` | CORS許可オリジン | ❌ |
| `S3_BUCKET` | 画像保存バケット | ❌ |
| `S3_REGION` | S3リージョン | ❌ |
| `S3_ACCESS_KEY_ID` | S3アクセスキー | ❌ |
| `S3_SECRET_ACCESS_KEY` | S3シークレットキー | ❌ |