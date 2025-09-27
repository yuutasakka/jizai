# CI/CDパイプライン改善（INFRA-4〜6）

## 目的
品質を保ちながら安全にリリース。異常時に迅速なロールバック。

## 現状
- `ci.yml`: 型チェック+ビルド、backend preflight（非ブロッキング）
- `security-audit.yml`: 週次の `npm audit`

## 改善案
- Lint/型/UT/E2E/ビルド/デプロイの段階化（最小→拡張）
- E2E（Playwright）をstagingで実行
- リリース作業の自動タグ付け、CHANGELOG生成
- Blue/Green/ロールバック手順のRunbook整備

## ロールバック（例）
1. 直前の安定タグへデプロイ
2. DBマイグレーションは前方互換/段階的を徹底
3. 影響分析とアナウンス

