# Jizai Backend

Node.js Express サーバー - Gemini API を用いた画像編集

## セットアップ

1. 依存関係をインストール:
```bash
npm install
```

2. 環境変数を設定:
```bash
# .env ファイルを作成し、SUPABASE関連・ADMIN_TOKEN・GEMINI_API_KEY などを設定してください
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

## プレリリース Preflight チェック

本番リリース前に、環境変数の設定や脆弱性の既知論点を自動点検できます。

```bash
cd backend
npm run preflight
# 終了コード: 0=OK, 1=警告あり, 2=要修正あり
```

本番環境で実行すると、`ORIGIN_ALLOWLIST` や Webhook/管理系のハードニング（レート制限やIP許可）の未設定も警告します。

## セキュリティ強化（新規）

以下の保護を追加済みです。必要に応じて環境変数で調整できます。

- Webhook 防御:
  - レート制限: `WEBHOOK_RATE_LIMIT`（デフォルト 30/分）
  - リプレイ防止（UUIDキャッシュ）: `WEBHOOK_REPLAY_TTL_MS`（デフォルト 300000 ms）
  - IP 許可リスト: `WEBHOOK_IP_ALLOWLIST`（例: `1.2.3.4,5.6.7.8`）
  - CORS を `credentials:false` に固定（ブラウザクレデンシャル送信を抑止）
- 管理系 API 防御:
  - レート制限: `ADMIN_WEBHOOK_RATE_LIMIT`（デフォルト 30/分）、`ADMIN_ANALYTICS_RATE_LIMIT`（デフォルト 20/分）
  - IP 許可リスト: `ADMIN_IP_ALLOWLIST`
  - 管理トークン: `ADMIN_TOKEN`（本番は必須かつ十分な長さ）
- 画像アップロード上限（Sharpで検証）:
  - 最大一辺: `MAX_IMAGE_SIDE`（デフォルト 12000）
  - 最大ピクセル数: `MAX_IMAGE_PIXELS`（デフォルト 100000000）
- 逆プロキシ環境:
  - `TRUST_PROXY`（デフォルトで有効）。プロキシ配下で `req.ip`/`req.secure` を正しく扱うため `app.set('trust proxy', 1)` を有効化。

推奨: 本番環境では `ADMIN_TOKEN` を強固な値に設定し、`WEBHOOK_IP_ALLOWLIST`/`ADMIN_IP_ALLOWLIST` で到達元を制限してください。

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

### Webhooks

- `POST /v1/webhooks/appstore`
  - 本番環境では署名検証＋レート制限＋リプレイ防止＋（任意）IP許可で保護
  - CORS は `credentials:false` 固定

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
| `GEMINI_API_KEY` | Gemini 画像編集 API キー | ✅ |
| `PORT` | サーバーポート (default: 3000) | ❌ |
| `RATE_LIMIT_RPS` | 全体レート制限 | ❌ |
| `ORIGIN_ALLOWLIST` | CORS許可オリジン | ❌ |
| `WEBHOOK_RATE_LIMIT` | Webhook レート制限/分 | ❌ |
| `WEBHOOK_REPLAY_TTL_MS` | Webhook リプレイTTL(ms) | ❌ |
| `WEBHOOK_IP_ALLOWLIST` | Webhook IP許可（カンマ区切り） | ❌ |
| `ADMIN_WEBHOOK_RATE_LIMIT` | 管理用 Webhook レート制限 | ❌ |
| `ADMIN_ANALYTICS_RATE_LIMIT` | 管理用 Analytics レート制限 | ❌ |
| `ADMIN_IP_ALLOWLIST` | 管理API IP許可（カンマ区切り） | ❌ |
| `ADMIN_TOKEN` | 管理API用トークン（本番必須） | ✅(本番) |
| `MAX_IMAGE_SIDE` | 画像の最大一辺 | ❌ |
| `MAX_IMAGE_PIXELS` | 画像の最大ピクセル数 | ❌ |
| `TRUST_PROXY` | 逆プロキシ信頼（`false`で無効） | ❌ |

 > Supabase 連携に必要な `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_KEY`/`SUPABASE_JWT_SECRET` などは `backend/.env.production.example` を参照してください。

## 変更履歴（抜粋）

- 2025-09: セキュリティ強化（Webhook レート制限/IP許可/リプレイ防止、画像上限の環境変数化、trust proxy 追加）。未使用の `backend/index.mjs`、`backend/package-vault-integration.json`、`backend/test-rls-security.mjs` を削除。
