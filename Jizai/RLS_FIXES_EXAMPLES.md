# RLS バイパス修正例とガイドライン

## 修正パターン

### ❌ 修正前（RLS バイパス）
```javascript
// サービスクライアント使用 - RLS をバイパス
const { data: vault } = await supabaseService
  .from('vaults')
  .select('*')
  .eq('id', vaultId)
  .eq('device_id', deviceId)  // アプリレベル認証
  .single();
```

### ✅ 修正後（RLS 準拠）
```javascript
// 認証クライアント使用 - RLS ポリシーで保護
const { data: vault } = await req.supabaseAuth
  .from('vaults')
  .select('*')
  .eq('id', vaultId)  // RLS が自動的に所有者チェック
  .single();
```

## Family Sharing Service 修正例

### 1. createFamilyVault 関数
```javascript
// 修正前
async createFamilyVault(deviceId, vaultId, familyName) {
  const { data: vault } = await supabaseService
    .from('vaults')
    .select('*')
    .eq('id', vaultId)
    .eq('device_id', deviceId);  // 手動認証

// 修正後  
async createFamilyVault(supabaseAuth, vaultId, familyName) {
  const { data: vault } = await supabaseAuth
    .from('vaults')
    .select('*')
    .eq('id', vaultId);  // RLS が自動認証
```

### 2. サービス呼び出し修正
```javascript
// 修正前
app.post('/family/create', async (req, res) => {
  const result = await familyService.createFamilyVault(
    req.headers['x-device-id'],
    req.body.vaultId,
    req.body.familyName
  );

// 修正後
app.post('/family/create', rlsAuthMiddleware(), async (req, res) => {
  const result = await familyService.createFamilyVault(
    req.supabaseAuth,  // 認証クライアント渡す
    req.body.vaultId,
    req.body.familyName
  );
```

## 適切なサービスクライアント使用例

### ✅ 正当な使用（管理操作）
```javascript
// 1. システム清掃
async cleanupExpiredSessions() {
  monitorServiceClientUsage('cleanup_expired_sessions');
  return await supabaseService
    .from('sessions')
    .delete()
    .lt('expires_at', new Date());
}

// 2. 統計生成
async generateSystemStats() {
  monitorServiceClientUsage('system_statistics');
  return await supabaseService
    .from('users')
    .select('count(*), created_at');
}

// 3. Webhook 処理
async processWebhook(data) {
  monitorServiceClientUsage('webhook_processing', { source: data.source });
  return await supabaseService
    .from('webhook_events')
    .insert(data);
}
```

### ❌ 不適切な使用（ユーザー操作）
```javascript
// ユーザーデータアクセス - RLS で保護すべき
async getUserVaults(deviceId) {
  // これは NG - 認証クライアント使用すべき
  return await supabaseService
    .from('vaults')
    .select('*')
    .eq('device_id', deviceId);
}
```

## 段階的移行計画

### Phase 1: 重要なユーザーデータ操作
1. ✅ `index-vault-integration.mjs` - Vault 作成・メモリ挿入
2. 🔄 `family-sharing-service.mjs` - ファミリー機能
3. 📋 `subscription-service.mjs` - サブスクリプション管理

### Phase 2: 認証ミドルウェア拡張
```javascript
// 全エンドポイントに適用
app.use('/v1/vault/*', rlsAuthMiddleware());
app.use('/v1/family/*', rlsAuthMiddleware());
app.use('/v1/subscription/*', rlsAuthMiddleware());
```

### Phase 3: 監査と最適化
```javascript
// 使用状況ログ
function logServiceClientUsage() {
  secureLogger.warn('Service client bypass', {
    operation: 'vault_creation',
    justification: 'admin_operation',
    review_required: true
  });
}
```

## 設定要件

### 環境変数
```bash
# .env に追加
SUPABASE_JWT_SECRET=your_jwt_secret_from_supabase_dashboard
```

### Supabase ダッシュボード設定
1. Settings → API → JWT Secret をコピー
2. 必要な場合は JWT 有効期限を調整
3. RLS ポリシーが全テーブルで有効か確認

## テスト方法

### 1. RLS 動作確認
```javascript
// 認証なしでアクセス試行（拒否されるべき）
const { data, error } = await supabase
  .from('vaults')
  .select('*');
// error.code should be '42501' (insufficient privilege)
```

### 2. 認証後アクセス確認
```javascript
// JWT 設定後（成功すべき）
const supabaseAuth = createAuthenticatedClient(user, deviceId);
const { data, error } = await supabaseAuth
  .from('vaults')
  .select('*');
// data should contain user's vaults only
```

## 注意事項

1. **段階的移行**: 一度にすべて変更せず、機能ごとに移行
2. **テスト重視**: 各修正後に動作確認実施
3. **ログ監視**: サービスクライアント使用を監査
4. **パフォーマンス**: JWT 生成オーバーヘッドを考慮
5. **エラーハンドリング**: RLS 拒否エラーの適切な処理