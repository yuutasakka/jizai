# オブザーバビリティ運用ガイド

本書は、リクエスト相関ID・構造化ログ・メトリクス/トレースの方針です。

## リクエストID（相関ID）
- 実装: `backend/middleware/request-id.mjs`
  - `X-Request-ID` を受理（安全な形式のみ）し、未指定なら生成。
  - `req.id`/`res.locals.requestId` に設定し、レスポンスヘッダにも反映。
- ログ: `httpRequestLogger` が各リクエスト完了時に `secureLogger.info('http_request', {...})` を出力。

## 構造化JSONログ
- 環境変数 `STRUCTURED_LOG_JSON=true` でJSONログを有効化。
- ロガー: `backend/utils/secure-logger.mjs` はSANITIZE後に `{"level","message","ts","data"}` を1行JSONで出力。
- 推奨: 本番/staging でJSONログを有効にし、ログ集約（GCP/CloudWatch/ELK等）でパース。

## メトリクス/トレース
- メトリクス: `backend/middleware/http-metrics.mjs` が全リクエストのレイテンシ/件数を計測。
  - `http_requests_total{method,path,status}`
  - `http_request_duration_ms_{count,sum,min,max}{method,path,status}`
  - `http_429_total{path}` / `http_5xx_total{path,status}`
  - 取得: `/v1/metrics`（本番は管理トークン/IP許可で保護）
- トレース: 現状は軽量トレーサースタブで対応（後にOpenTelemetryへ差し替え）。
  - 実装: `backend/utils/tracer.mjs` + `backend/middleware/tracing.mjs`
  - 1リクエスト=1スパン（`http.request`）を出力。`secureLogger`経由で構造化ログに記録。
  - 将来的にOTel導入時はここを置換し、相関ID（`X-Request-ID`）と連携する。

## チェックリスト（OBS）
- [x] リクエストID付与とアクセスログの構造化（本ドキュメント/実装）
- [ ] 主要エンドポイントのメトリクス拡充（レイテンシ、エラー、スループット）
- [ ] OpenTelemetry による分散トレース導入
