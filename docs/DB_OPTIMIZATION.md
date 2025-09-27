# DB最適化ガイド（BE-4）

## 目的
主要クエリの実行計画を定期レビューし、適切なインデックスとアクセスパターンでレイテンシ/コストを抑制。

## 手順
1. 頻出/重いクエリの洗い出し（アクセスログ/メトリクス）
2. 実行計画の確認（Supabase SQL editor or psql EXPLAIN/ANALYZE）
3. インデックス設計の見直し（複合・部分・カバリング）
4. N+1/不要列の排除、LIMIT/OFFSET→キー継続のページング検討
5. 週次でモニタリング、月次で棚卸し

## 候補テーブル
- `user_prompts`, `user_prompt_popularity`, `print_exports`, `subscriptions`, `family_*` 系

## 運用
- 変更はマイグレーションで管理（リハ→本番）
- RLSとの相互作用を考慮（ポリシーに沿うインデックス）

