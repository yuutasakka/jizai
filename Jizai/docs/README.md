# Jizai API Documentation

このディレクトリには、JizaiバックエンドAPIの仕様書とテストツールが含まれています。

## 📋 ファイル一覧

### `openapi.yaml`
**OpenAPI 3.0 仕様書** - JizaiバックエンドAPIの完全な仕様定義

- 📍 **エンドポイント**: 5つの主要エンドポイント
  - `GET /v1/health` - ヘルスチェック
  - `POST /v1/edit` - 画像編集（クレジット消費）
  - `GET /v1/balance` - 残高確認
  - `POST /v1/purchase` - 課金処理
  - `POST /v1/report` - 通報機能
  
- 📝 **詳細情報**: 
  - リクエスト・レスポンススキーマ
  - エラーレスポンス定義
  - 認証方式（x-device-id ヘッダー）
  - バリデーションルール

### `jizai-api.postman_collection.json`
**Postmanコレクション** - APIテスト用の包括的なコレクション

- 🧪 **テストケース**: 15+のリクエスト例
- 📊 **テストフロー**: 完全なワークフローテスト
- 🔧 **環境変数**: 動的な値生成
- 📖 **ドキュメント**: 各エンドポイントの詳細説明

## 🚀 使用方法

### OpenAPI仕様書の活用

1. **API開発**: 仕様に基づいたクライアント実装
2. **ドキュメント生成**: Swagger UIでの閲覧
3. **コード生成**: OpenAPI Generatorでクライアント生成
4. **バリデーション**: リクエスト・レスポンス検証

```bash
# Swagger UIでの表示（例）
npx swagger-ui-serve openapi.yaml
```

### Postmanでのテスト

1. **インポート**: Postmanにコレクションをインポート
2. **環境設定**: 
   - `baseUrl`: `http://localhost:3000`（開発時）
   - `deviceId`: テスト用デバイスID
3. **テスト実行**: フローに沿ったテスト実行

#### 推奨テストフロー

```
1. Health Check → サーバー稼働確認
2. Get Balance → 初回10クレジット確認  
3. Purchase Credits → 課金テスト
4. Edit Image → 画像編集（1クレジット消費）
5. Get Balance → 残高減少確認
6. Submit Report → 通報機能テスト
```

## 📊 エンドポイント概要

| エンドポイント | メソッド | 機能 | クレジット消費 |
|---------------|---------|------|----------------|
| `/v1/health` | GET | ヘルスチェック | なし |
| `/v1/balance` | GET | 残高確認 | なし |
| `/v1/purchase` | POST | 課金処理 | なし（加算） |
| `/v1/edit` | POST | 画像編集 | 1クレジット |
| `/v1/report` | POST | 通報機能 | なし |

## 🔐 認証

**デバイスベース認証**を使用：
- ヘッダー: `x-device-id: [デバイス識別子]`
- 新規デバイスは自動的に10クレジット付与
- セッション管理はデバイスIDベース

## 💰 課金システム

**3つの課金パック**：
- `com.example.jizai.coins20`: 20クレジット（¥320）
- `com.example.jizai.coins100`: 100クレジット（¥1,200）
- `com.example.jizai.coins300`: 300クレジット（¥2,800）

## 🛡️ エラーハンドリング

**標準エラーレスポンス**：
```json
{
  "error": "Error Type",
  "message": "Error description", 
  "code": "ERROR_CODE"
}
```

**主要エラーコード**：
- `400`: `MISSING_DEVICE_ID`, `SAFETY_BLOCKED`
- `402`: `INSUFFICIENT_CREDITS`
- `409`: `DUPLICATE_TRANSACTION` 
- `500`: `INTERNAL_ERROR`
- `502`: `API_UNAVAILABLE`

## 🔧 開発・テスト

### 必要な設定

1. **環境変数** (`.env`):
```env
DASHSCOPE_API_KEY=sk-xxxx    # Qwen API キー
PORT=3000                    # サーバーポート
```

2. **サーバー起動**:
```bash
cd backend
npm run dev
```

3. **Postmanテスト**:
- コレクションインポート
- 環境変数設定
- フローテスト実行

### バリデーション

OpenAPI仕様の妥当性確認：
```bash
# OpenAPI Validator（例）
npx swagger-parser validate openapi.yaml
```

## 📝 更新履歴

- **v1.0.0** (2025-08-21): 初回リリース
  - 全エンドポイント仕様定義
  - Postmanコレクション作成
  - 包括的テストシナリオ