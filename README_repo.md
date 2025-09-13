# Jizai - iOS 画像編集アプリ

日本向け iOS 画像編集アプリ（フロントエンド：SwiftUI、バックエンド：Qwen-Image-Edit API）

## プロジェクト構成

```
Jizai/
├── backend/          # Node.js Express サーバー
├── ios/              # SwiftUI iOS アプリ（iOS 16+）
├── docs/             # ドキュメント・法務関連
├── .gitignore        # Git 除外設定
├── README_repo.md    # このファイル
└── Makefile          # 共通操作用スクリプト
```

## 各ディレクトリの役割

### `/backend`
- **役割**: Qwen-Image-Edit API との連携、残高管理、課金処理
- **技術**: Node.js 20 + Express
- **主要機能**:
  - 画像編集API (`/v1/edit`)
  - 残高確認 (`/v1/balance`)
  - 課金処理 (`/v1/purchase`)
  - 通報機能 (`/v1/report`)
  - ヘルスチェック (`/v1/health`)

### `/ios`
- **役割**: ユーザー向け iOS アプリ
- **技術**: SwiftUI (iOS 16+)
- **主要機能**:
  - 画像選択・編集指示入力
  - 編集結果表示・保存
  - App内課金（消費型）
  - 残高表示
  - 通報機能

### `/docs`
- **役割**: プロジェクト文書、法務関連文書
- **内容**:
  - プライバシーポリシー
  - 利用規約
  - 特定商取引法に基づく表記
  - App Review 用資料
  - OpenAPI 仕様書

## 開発フロー

1. **初期化** (Step 0): モノレポ構造作成
2. **バックエンド開発** (Step 1-6): API実装・文書化
3. **iOS開発** (Step 7-9): アプリ実装・課金・通報
4. **CI/CD** (Step 10): 自動テスト・ビルド
5. **審査準備** (Step 11-12): 法務文書・App Store 提出

## 必要な環境変数

```
DASHSCOPE_API_KEY=sk-xxxx          # Qwen API キー
PORT=3000                          # サーバーポート
RATE_LIMIT_RPS=2                   # レート制限
ORIGIN_ALLOWLIST=http://localhost:3000
S3_BUCKET=                         # 画像保存用
S3_REGION=ap-northeast-1
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
```

## セキュリティ・法務対応

- UGC 1.2 対策（通報・ブロック・24時間対応）
- プロンプトモデレーション
- 課金処理の適切な実装
- プライバシーポリシー・利用規約の整備

## 次のステップ

Step 0 が完了しました。次は Step 1 のバックエンド雛形作成を実行してください。