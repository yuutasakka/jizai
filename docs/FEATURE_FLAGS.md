# フィーチャーフラグ運用ガイド

段階的リリース・A/B・安全なロールバックのため、フィーチャーフラグを導入します。

## 方針
- 読み取り専用のビルド時フラグ（`VITE_FLAG_*`）と、実行時のオーバーライド（URL/LocalStorage）を併用。
- 重要機能はデフォルトOFFで本番にデプロイし、段階的にON。問題時には即OFF可能。

## 使い方（フロント）
1. フラグ定義例
   - ビルド時: `VITE_FLAG_NEW_UI=true`
   - 実行時オーバーライド:
     - URL: `?ff_new_ui=1` / `?ff_new_ui=0`
     - localStorage: `localStorage.setItem('ff_new_ui','1')`
2. 判定
   ```ts
   import { flags } from '../src/lib/flags';
   if (flags.isEnabled('new_ui')) { /* 新UIを表示 */ }
   ```

## 使い方（バックエンド）
- バックエンドでは環境変数で切替（`FLAG_NEW_PIPELINE=1` 等）し、`process.env.FLAG_*` を参照。

## チェックリスト（フィーチャーフラグ）
- [x] 運用ガイド作成
- [x] 軽量なフロント用ユーティリティ追加
- [ ] 主要な新機能の導入時に必ずフラグを検討
