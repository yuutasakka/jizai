# 🚨 CRITICAL: RLS移行で重大な漏れを発見

## 重大な問題

### ❌ Route Handlers が旧API使用
**ファイル**: `routes/family-sharing.mjs`、`routes/print-export.mjs`、`routes/subscriptions.mjs`

**問題**: 認証ミドルウェアは適用されているが、route handlers 内でサービス呼び出し時に認証クライアントを渡していない。

```javascript
// ❌ 現在の実装 (認証バイパス)
const familyVault = await familySharingService.createFamilyVault(
    deviceId,      // ← 旧API
    vaultId, 
    familyName
);

// ✅ 必要な修正
const familyVault = await familySharingService.createFamilyVault(
    req.supabaseAuth,  // ← 認証クライアント渡し
    vaultId, 
    familyName
);
```

### ❌ Notification Service 監査不足  
**ファイル**: `services/notification-service.mjs`

**問題**: 16箇所の `supabaseService` 使用が監査されていない。

```javascript
// ❌ 現在 (監査なし)
const { data, error } = await supabaseService
  .from('notifications')
  .insert(notification);

// ✅ 必要な修正
monitorServiceClientUsage('system_notification', 'notification_system', { type: notification.type }, true);
const { data, error } = await supabaseService
  .from('notifications')
  .insert(notification);
```

## 即座に修正が必要な箇所

### 1. Family Sharing Routes
```javascript
// routes/family-sharing.mjs 内の全サービス呼び出し
- createFamilyVault(deviceId, ...) → createFamilyVault(req.supabaseAuth, ...)
- joinFamilyVault(deviceId, ...) → joinFamilyVault(req.supabaseAuth, deviceId, ...)
- その他全メソッド
```

### 2. Print Export Routes  
```javascript
// routes/print-export.mjs 内の全サービス呼び出し
- generatePrintExport(deviceId, ...) → generatePrintExport(req.supabaseAuth, deviceId, ...)
- getUserExports(deviceId) → getUserExports(req.supabaseAuth)
```

### 3. Subscription Routes
```javascript
// routes/subscriptions.mjs の確認が必要
// すでにRLS準拠の可能性があるが検証必要
```

## セキュリティ影響

### 現在の状況
- ✅ 認証ミドルウェア適用済み → JWT生成は機能
- ❌ サービス層で認証クライアント未使用 → **RLS実際には機能していない**
- ❌ 一部操作で依然としてRLSバイパス発生

### 危険度: HIGH
- ユーザーデータへの不正アクセスが理論上可能
- アプリケーションバグによるデータ漏洩リスク継続
- セキュリティ修正が不完全

## 緊急修正計画

1. **即座**: Route handlers での認証クライアント渡しを修正
2. **即座**: Notification service への監査ログ追加  
3. **検証**: 修正後のRLS動作確認
4. **テスト**: 認証なしアクセスが適切に拒否されることを確認

---
**⚠️ この修正なしでは RLS セキュリティが実際には機能しません**