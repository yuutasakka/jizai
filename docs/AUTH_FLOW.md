# 認証フロー運用（AUTH-1〜4）

本ドキュメントは、Supabase セッションの更新、期限切れ時の誘導、UI標準化の方針をまとめます。

## 実装ポイント
- コンテキスト: `src/contexts/AuthContext.tsx`
  - `refreshSession()`: Supabaseのセッション更新を実行（成功時に状態反映）
  - 期限監視: 有効期限5分前で自動更新を試行、失敗時は `promptReLogin()`
  - 401時のサインアウト処理はAPIインターセプタ経由で連動
- バナー: `src/components/auth/SessionExpiryBanner.tsx`
  - 残り10分を切ると固定バナーを表示（更新/再ログインボタン）
  - `src/App.tsx` のトップに組み込み

## UI標準化
- 非認証時: `useAuthGuard()` で `/login?redirect=...` に誘導
- 期限切れ間近: バナーで明示し、更新/再ログインの選択肢を提供
- 完全失効: `promptReLogin()` により状態クリア→リダイレクト

## チェックリスト（AUTH）
- [x] セッション更新の実装（自動/手動）
- [x] 失効時の誘導（リダイレクト/ストレージクリア）
- [x] UI状態（非認証・期限間近・認証済）を標準化
- [ ] OAuthリダイレクト後のフロー図を追加（今後）

