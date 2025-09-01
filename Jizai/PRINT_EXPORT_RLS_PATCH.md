# Print Export Service RLS 修正パッチ

## 修正済み
- ✅ `generatePrintExport` メソッドシグネチャ更新
- ✅ Memory 取得を認証クライアントに変更
- ✅ Export record 挿入を認証クライアントに変更

## 残りの修正が必要な箇所

### 1. ユーザーデータ操作 → 認証クライアント
```javascript
// getUserExports メソッド
async getUserExports(supabaseAuth) {
  const { data: exports, error } = await supabaseAuth
    .from('print_exports')
    .select('*')
    .order('created_at', { ascending: false });
}
```

### 2. 管理操作 → 監査ログ付きサービスクライアント
```javascript
// cleanupExpiredExports メソッド
async cleanupExpiredExports() {
  monitorServiceClientUsage('cleanup_expired_exports', 'system_cleanup', {}, true);
  const { data: expiredExports, error } = await supabaseService
    .from('print_exports')
    .select('file_path')
    .lt('expires_at', new Date());
}

// getExportStatistics メソッド  
async getExportStatistics() {
  monitorServiceClientUsage('export_statistics', 'system_reporting', {}, true);
  // supabaseService 使用継続（統計は全体データ必要）
}
```

### 3. メソッド呼び出し更新
Route handlers での呼び出しを更新:
```javascript
// 修正前
const exports = await printService.getUserExports(deviceId);

// 修正後
const exports = await printService.getUserExports(req.supabaseAuth);
```

## 修正分類

### RLS対応 (認証クライアント使用)
- `generatePrintExport` ✅
- `getUserExports` - ユーザーのエクスポート履歴
- Export record 作成 ✅

### 管理操作 (サービスクライアント継続)
- `cleanupExpiredExports` - 期限切れファイル削除
- `getExportStatistics` - システム統計
- `checkMonthlyUsage` - 使用量チェック

## 期待効果
- ユーザーは自分のエクスポート履歴のみアクセス可能
- メモリへのアクセスがRLSで保護
- システム管理機能は適切に監査