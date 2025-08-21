# Jizai iOS App

SwiftUI画像編集アプリ - Qwen-Image-Edit API統合

## 概要

JizaiはAI搭載の画像編集iOSアプリです。Node.jsバックエンドとQwen-Image-Edit APIを使用して、自然言語での画像編集を実現します。

## 機能

### ✅ 実装済み機能
- 📱 **画像選択**: カメラ撮影・フォトライブラリから選択
- 🤖 **AI画像編集**: 英語プロンプトによる画像編集
- 💰 **クレジット管理**: デバイス別残高管理（初回10クレジット付与）
- 🛒 **課金システム**: 3つの課金パック（20/100/300クレジット）
- 📱 **デバイス認証**: デバイスIDベース認証
- 🚨 **通報機能**: UGC 1.2準拠の通報システム
- 💾 **画像保存**: 編集結果の保存・共有機能

### 📋 主要コンポーネント

#### **APIClient.swift**
- バックエンドAPI通信管理
- エラーハンドリング（クレジット不足、安全性ブロック等）
- マルチパートフォームデータ対応

#### **Models.swift** 
- データモデル定義（CreditBalance, PurchaseRequest等）
- AppState（アプリ全体の状態管理）
- 製品・通報理由の定義

#### **DeviceManager.swift**
- デバイスID生成・管理
- UserDefaults永続化

#### **ImageEditService.swift**
- 画像選択・処理ロジック
- 画像リサイズ・圧縮機能
- UIImagePickerController統合

#### **ContentView.swift**
- メインUI実装
- 画像編集ワークフロー
- 購入・通報UI

## 技術仕様

### 要件
- **iOS**: 16.0+
- **Xcode**: 15.0+
- **Swift**: 5.0+
- **フレームワーク**: SwiftUI, PhotosUI

### アーキテクチャ
```
JizaiApp.swift           // アプリエントリーポイント
├── ContentView.swift    // メインUI
├── APIClient.swift      // API通信レイヤー
├── Models.swift         // データモデル
├── DeviceManager.swift  // デバイス管理
└── ImageEditService.swift // 画像処理サービス
```

### API統合
- **Base URL**: `http://localhost:3000` (開発環境)
- **認証**: `x-device-id` ヘッダー
- **エンドポイント**:
  - `GET /v1/health` - ヘルスチェック
  - `GET /v1/balance` - クレジット残高確認  
  - `POST /v1/edit` - 画像編集（1クレジット消費）
  - `POST /v1/purchase` - 課金処理
  - `POST /v1/report` - 通報機能

## セットアップ

### 1. プロジェクト構成確認
```bash
ios/
├── Jizai.xcodeproj/     # Xcodeプロジェクト
├── Jizai/               # ソースコード
│   ├── JizaiApp.swift
│   ├── ContentView.swift
│   ├── APIClient.swift
│   ├── Models.swift
│   ├── DeviceManager.swift
│   ├── ImageEditService.swift
│   └── Assets.xcassets/
└── README.md
```

### 2. Xcodeでプロジェクトを開く
```bash
cd ios
open Jizai.xcodeproj
```

### 3. バックエンド起動
```bash
cd ../backend
npm run dev
```

### 4. iOS Simulatorで実行
- Xcode でプロジェクトを開く
- iOS Simulator（iPhone 15 Pro推奨）を選択
- `⌘ + R` でビルド・実行

## 使用フロー

### 基本的な編集フロー
1. **残高確認**: アプリ起動時に自動確認（新規は10クレジット付与）
2. **画像選択**: 「+」ボタンからカメラ撮影またはライブラリ選択
3. **プロンプト入力**: 英語で具体的な編集指示を入力
4. **編集実行**: 「編集開始」ボタンで処理開始（1クレジット消費）
5. **結果確認**: 編集結果の表示・保存・共有

### クレジット管理
- **初回起動**: 自動で10クレジット付与
- **残高確認**: ヘッダー部分で常時表示
- **購入**: 「購入」ボタンから課金パック選択
- **消費**: 編集成功時のみ1クレジット消費

### 通報機能
- **通報理由**: 著作権、プライバシー、性的コンテンツ、暴力、その他
- **詳細入力**: 任意で詳細説明を追加可能
- **UGC 1.2準拠**: App Store審査対応

## 課金パック

| パック | クレジット数 | 価格 | Product ID |
|--------|-------------|------|------------|
| Small | 20クレジット | ¥320 | `com.example.jizai.coins20` |
| Medium | 100クレジット | ¥1,200 | `com.example.jizai.coins100` |
| Large | 300クレジット | ¥2,800 | `com.example.jizai.coins300` |

## エラーハンドリング

### 主要エラータイプ
- **クレジット不足**: 課金促進UI表示
- **安全性ブロック**: NGワード検出時の警告
- **画像サイズエラー**: 10MB制限超過時の警告
- **ネットワークエラー**: 接続失敗時の再試行提案

### デバッグ情報
- **Device ID**: DeviceManager で自動生成・管理
- **API Response**: コンソールでレスポンス確認可能
- **状態管理**: AppState で全状態を一元管理

## 次のステップ

### Step 8: StoreKit 2統合
- 実際のApp内課金実装
- レシート検証システム
- 課金状態の永続化

### 追加実装項目
- **オフライン対応**: 編集履歴のローカル保存
- **UI改善**: アニメーション・ローディング状態
- **多言語対応**: 日本語・英語切り替え
- **プッシュ通知**: 編集完了通知
- **ダークモード**: 完全対応

## デバッグ・テスト

### バックエンド接続確認
```bash
# ヘルスチェック
curl http://localhost:3000/v1/health

# 残高確認（デバイスID指定）
curl "http://localhost:3000/v1/balance?deviceId=ios_test_device"
```

### よくある問題
1. **ネットワーク接続エラー**: バックエンドが起動していることを確認
2. **画像選択できない**: iOS Simulatorで権限設定を確認
3. **クレジット不足**: 課金フローまたは手動でバックエンドDBリセット