# 改善項目チェックリスト

## フロントエンド改善項目

### APIクライアント整備
- [x] 認証ヘッダのインターセプタ実装 (done: 2025-09-27 by bot) [ID: FE-1]
- [x] 自動再試行機能の実装 (done: 2025-09-27 by bot) [ID: FE-2]
- [x] 429バックオフ対応の実装 (done: 2025-09-27 by bot) [ID: FE-3]
- [x] 共通エラーハンドリングの実装 (done: 2025-09-27 by bot) [ID: FE-4]

### 認証フロー堅牢化
- [x] Supabaseセッション更新処理の実装 (done: 2025-09-27 by bot) [ID: AUTH-1]
- [x] セッション失効時のリダイレクト処理 (done: 2025-09-27 by bot) [ID: AUTH-2]
- [x] UI状態の標準化 (done: 2025-09-27 by bot) [ID: AUTH-3]
- [x] AuthContextの再ログイン誘導実装 (done: 2025-09-27 by bot) [ID: AUTH-4]

### ストレージ利用ポリシー
- [x] localStorage/sessionStorageキー命名ガイド (done: 2025-09-27 by bot) [ID: STORAGE-1]
- [x] データ寿命管理の実装 (done: 2025-09-27 by bot) [ID: STORAGE-2]
- [x] 消去タイミングの標準化 (done: 2025-09-27 by bot) [ID: STORAGE-3]
- [x] 個人情報保存禁止原則の徹底 (done: 2025-09-27 by bot) [ID: STORAGE-4]

### アクセシビリティ/性能改善
- [x] 画像loading=lazy の徹底 (done: 2025-09-27 by bot) [ID: PERF-1]
- [x] コンポーネント分割とSuspense対応 (done: 2025-09-27 by bot) [ID: PERF-2]
- [x] lazyローディングでバンドル削減 (done: 2025-09-27 by bot) [ID: PERF-3]
- [x] フォント最適化 (done: 2025-09-27 by bot) [ID: PERF-4]

## バックエンド改善項目

### セキュリティ強化
- [x] レート制限の実装 (done: 2025-09-27 by bot) [ID: BE-1]
- [x] IPホワイトリスト機能 (done: 2025-09-27 by bot) [ID: BE-2]
- [x] セキュリティヘッダーの追加 (done: 2025-09-27 by bot) [ID: BE-3]

### パフォーマンス最適化
- [x] データベースクエリ最適化 (done: 2025-09-27 by bot) [ID: BE-4]
- [x] キャッシュ戦略の実装 (done: 2025-09-27 by bot) [ID: BE-5]
- [x] CDN統合 (done: 2025-09-27 by bot) [ID: BE-6]

## インフラ改善項目

### 監視・ログ
- [x] アプリケーション監視の実装 (done: 2025-09-27 by bot) [ID: INFRA-1]
- [x] エラーログ集約 (done: 2025-09-27 by bot) [ID: INFRA-2]
- [x] パフォーマンス監視 (done: 2025-09-27 by bot) [ID: INFRA-3]

### デプロイメント
- [x] CI/CDパイプライン改善 (done: 2025-09-27 by bot) [ID: INFRA-4]
- [x] 自動テスト強化 (done: 2025-09-27 by bot) [ID: INFRA-5]
- [x] ロールバック機能 (done: 2025-09-27 by bot) [ID: INFRA-6]

---

## 使い方

### 手動更新
```markdown
- [x] 完了した項目 (done: 2025-09-27 by bot) [ID: FE-1]
```

### スクリプト更新
```bash
# 完了にする
node scripts/todo-mark.mjs docs/IMPROVEMENT_TODO.md FE-1 done --by=your_name

# 未完了に戻す
node scripts/todo-mark.mjs docs/IMPROVEMENT_TODO.md FE-1 undo
```

---

## 運用・セキュリティ・アーキテクチャ改善項目（拡張）

### アーキテクチャ (ARC)
- [x] 環境分離（dev/stg/prod）と設定の厳格化を整備 (done: 2025-09-27 by bot) [ID: ARC-1]
- [x] 12factorに沿った設定集中管理をドキュメント化 (done: 2025-09-27 by bot) [ID: ARC-2]
- [x] フィーチャーフラグの導入と運用ガイド作成（+軽量ユーティリティ） (done: 2025-09-27 by bot) [ID: ARC-3]
- [x] APIバージョニング方針（v2移行規約）を策定 (done: 2025-09-27 by bot) [ID: ARC-4]

### セキュリティ (SEC)
- [x] CSPをReport-Onlyから本番強制へ（nonce運用含む） (done: 2025-09-27 by bot) [ID: SEC-1]
- [x] 画像ストレージPrivate化に備え、署名URL運用（`USE_SIGNED_URLS`）へ対応 (done: 2025-09-27 by bot) [ID: SEC-2]
- [x] アップロードファイル名乱数を`crypto.getRandomValues`へ変更 (done: 2025-09-27 by bot) [ID: SEC-3]
- [x] 管理エンドポイント強化（`ADMIN_TOKEN`≥32, IP許可, 監査拡充） (done: 2025-09-27 by bot) [ID: SEC-4]
- [x] 依存パッケージの月次脆弱性スキャン/更新の運用確立 (done: 2025-09-27 by bot) [ID: SEC-5]

### オブザーバビリティ (OBS)
- [x] 構造化JSONログ＋相関ID（リクエストID）を全経路に適用 (done: 2025-09-27 by bot) [ID: OBS-1]
- [x] メトリクスの拡充（レイテンシ/429/リトライ等）としきい値監視 (done: 2025-09-27 by bot) [ID: OBS-2]
- [x] OpenTelemetryで分散トレースを導入 (done: 2025-09-27 by bot) [ID: OBS-3]
