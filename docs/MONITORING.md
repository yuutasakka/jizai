# 監視・ログ・性能監視（INFRA-1〜3）

## 目的
稼働状況を可視化し、SLO/SLAを達成できるように運用監視を整備する。

## 監視対象
- 可用性: `/v1/health` の200応答率、依存（DB/外部API）の健全性
- レイテンシ/エラー: `/v1/metrics`（Prometheus形式）
- 重要イベント: 構造化ログ（`STRUCTURED_LOG_JSON=true`）

## 設定
- ダッシュボード/アラート: メトリクスからSLOを定義
  - 例: p95レイテンシ、5xx率、429発生数
- ログ集約: JSONログをELK/CloudWatch/Stackdriver等で収集し、相関ID/トレースと紐付け

## 手順
1. 本番に `STRUCTURED_LOG_JSON=true` を設定
2. メトリクスエンドポイントをPrometheus等でスクレイプ
3. 主要SLOしきい値を定義し、アラートを設定

