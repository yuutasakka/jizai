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
- `GET /v1/balance` - 残高確認 ✅
- `POST /v1/purchase` - 課金処理 ✅
- `POST /v1/report` - 通報機能 ✅

### POST /v1/edit

画像編集を実行します。成功時のみ1クレジット消費。

**リクエスト**: multipart/form-data
- `image` (ファイル): JPG/PNG/WebP/BMP/TIFF (≤10MB)
- `prompt` (文字列): 編集指示
- **Headers**: `x-device-id` (必須)

**レスポンス**: image/png (バイナリ)
- **Headers**: `X-Credits-Remaining` - 残りクレジット数

**エラーコード**:
- `400` - リクエストエラー、NGワード検出
- `402` - クレジット不足
- `502` - 外部API接続エラー  
- `500` - サーバーエラー

### GET /v1/balance

残高確認。新規ユーザーは自動的に10クレジット付与。

**パラメータ**: 
- `deviceId` (クエリ): デバイス識別子

**レスポンス**:
```json
{
  "credits": 10,
  "deviceId": "device-123",
  "lastAccessAt": "2025-08-21T06:00:00.000Z"
}
```

### POST /v1/purchase

課金処理。重複トランザクションを自動検出。

**リクエスト**:
```json
{
  "deviceId": "device-123",
  "productId": "com.example.jizai.coins20",
  "transactionId": "txn-unique-id"
}
```

**製品一覧**:
- `com.example.jizai.coins20`: 20クレジット (¥320)
- `com.example.jizai.coins100`: 100クレジット (¥1,200)
- `com.example.jizai.coins300`: 300クレジット (¥2,800)

**レスポンス**:
```json
{
  "success": true,
  "credits": 30,
  "added": 20,
  "deviceId": "device-123",
  "productId": "com.example.jizai.coins20",
  "transactionId": "txn-unique-id"
}
```

### POST /v1/report

通報機能。UGC 1.2対策。

**リクエスト**:
```json
{
  "deviceId": "device-123",
  "jobId": "edit-job-123",
  "reasonId": "copyright",
  "note": "詳細説明（任意）"
}
```

**理由ID**:
- `copyright`: 著作権侵害
- `privacy`: プライバシー侵害
- `sexual`: 性的コンテンツ
- `violence`: 暴力的コンテンツ
- `other`: その他

**レスポンス**:
```json
{
  "success": true,
  "reportId": "report_1692615600000_abc123def",
  "message": "Report submitted successfully"
}
```

## curl テスト例

```bash
# 残高確認
curl -s "http://localhost:3000/v1/balance?deviceId=test-123"

# 課金テスト
curl -s -X POST http://localhost:3000/v1/purchase \
  -H 'Content-Type: application/json' \
  -d '{"deviceId":"test-123","productId":"com.example.jizai.coins20","transactionId":"txn-demo"}'

# 画像編集（クレジット消費）
curl -s -X POST http://localhost:3000/v1/edit \
  -H 'x-device-id: test-123' \
  -F "image=@/path/to/your.jpg" \
  -F "prompt=Change 'OPEN' to 'CLOSED'" \
  -o result.png

# 通報テスト
curl -s -X POST http://localhost:3000/v1/report \
  -H 'Content-Type: application/json' \
  -d '{"deviceId":"test-123","reasonId":"other","note":"テスト通報"}'
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