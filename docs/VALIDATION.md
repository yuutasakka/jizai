# 入力バリデーション方針（BE-1）

外部ライブラリを増やさず、軽量なバリデーションミドルウェアを導入しました。

## 実装
- ミドルウェア: `backend/middleware/validate.mjs`
- 使い方:
  ```js
  import { validateBody } from '../middleware/validate.mjs';
  const schema = {
    deviceId: { type: 'string', min: 1, max: 200 },
    exportType: { type: 'enum', values: ['photo_book','calendar','poster','cards'] },
    memoryIds: { type: 'array', minItems: 1, maxItems: 100, items: { type: 'string', min: 1, max: 200 } },
    settings: { type: 'object', optional: true }
  };
  router.post('/create', validateBody(schema), handler);
  ```

## 適用箇所（初期）
- `/v1/print-export/create`（必須項目/配列長/型）
- `/v1/subscription/validate`（receiptData必須/型）
- `/v1/subscription/start-trial`（productId必須/型）

今後、主要POST/PUTエンドポイントに段階適用していきます。

## エラー形式
- 400 Bad Request / `code: VALIDATION_FAILED`
- `details` に最初のエラー内容を配列で返却（将来的に多件返却へ拡張可能）

