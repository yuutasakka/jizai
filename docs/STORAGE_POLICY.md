# ストレージ運用ポリシー（STORAGE-1〜4）

## 目的
localStorage/sessionStorage のキー命名・寿命・消去・PII禁止を標準化し、個人情報保護と不具合低減を図る。

## 実装
- ユーティリティ: `src/utils/storage-policy.ts`
  - プレフィックス: `jizai-...`
  - カテゴリ別キー: settings/theme/language/device-id/...
  - TTL: `session`/`temporary`/`cache`/`persistent`
  - 破損/期限切れの自動クリーンアップ
  - PIIを示すキーワード（email/phone/address等）が含まれるキーはデフォルト禁止

## 使用例
```ts
import { storagePolicy, userSettings, sessionCache, promptCache } from '../utils/storage-policy';

// 任意キーで保存（推奨: カテゴリAPI）
storagePolicy.set('jizai-custom-flag', true, { key: 'jizai-custom-flag', type: 'localStorage', ttl: 3600_000 });

// カテゴリAPI（推奨）
userSettings.set('ui-density', 'comfortable');
const density = userSettings.get<string>('ui-density');

// セッションキャッシュ
sessionCache.set('upload-preview', { width: 100, height: 100 });
```

## ガイドライン
- STORAGE-1: キー命名
  - すべて `jizai-<category>[-<identifier>]`。カテゴリは `storage-policy.ts` の定義を使用。
- STORAGE-2: 寿命管理
  - 永続が必要な設定以外はTTLを付与。キャッシュは7日、テンポラリは1時間を目安。
- STORAGE-3: 消去タイミング
  - ログアウト/セッション失効時は永続設定を除きクリア（`clearAllData(false)`）。
  - アプリ起動時・1時間ごとに期限切れの自動クリーンアップ。
- STORAGE-4: PII禁止
  - メール/電話/住所等をキーや値に保存しない。必要な場合はサーバ保存または暗号化領域（未実装）を検討。

## チェックリスト
- [x] ユーティリティ実装
- [x] 命名/TTL/消去/PIIのガイド化
- [ ] 暗号化保存の選定・実装（必要時）

