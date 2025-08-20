# Jizai iOS App

SwiftUI ベース iOS アプリ (iOS 16+)

## 機能概要

- 写真選択・プレビュー
- 画像編集指示入力
- AI画像編集結果表示
- 画像保存機能
- App内課金（消費型）
- 残高表示
- 通報機能

## 技術要件

- iOS 16.0+
- SwiftUI
- StoreKit 2（App内課金）
- PhotosUI（画像選択）

## 開発準備

1. Xcodeで新規プロジェクト作成
2. プロジェクト設定:
   - Bundle ID: `com.example.jizai` (変更してください)
   - Deployment Target: iOS 16.0
   - Interface: SwiftUI
   - Language: Swift

## 予定される主要ファイル

- `ContentView.swift` - メイン画面
- `APIClient.swift` - バックエンドAPI通信
- `DeviceID.swift` - デバイス識別
- `IAPManager.swift` - App内課金管理
- `ImageEditView.swift` - 編集画面
- `ReportView.swift` - 通報画面

## Info.plist 設定項目

```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>写真を選択して画像編集を行うために使用します</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>編集した画像を写真ライブラリに保存するために使用します</string>
```

## App内課金商品予定

- `com.example.jizai.coins20` - 20クレジット
- `com.example.jizai.coins100` - 100クレジット  
- `com.example.jizai.coins300` - 300クレジット

注意: Bundle IDは実際のアプリに合わせて変更してください。