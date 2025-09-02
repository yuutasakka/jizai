# Family Sharing Service RLS 修正パッチ

## 修正が必要な箇所

### 1. joinFamilyVault メソッド
```javascript
// 修正前
const { data: familyVault, error: familyError } = await supabaseService
  .from('family_vaults')
  .select('*')
  .eq('invite_code', inviteCode)
  .single();

// 修正後  
// システム操作 - 招待コードでファミリーVaultを検索（全体検索必要）
monitorServiceClientUsage('find_family_vault_by_invite', 'system_operation', { invite_code: inviteCode }, true);
const { data: familyVault, error: familyError } = await supabaseService
  .from('family_vaults')
  .select('*')
  .eq('invite_code', inviteCode)
  .single();
```

### 2. メンバー操作メソッド
以下のメソッドで `supabaseService` → `supabaseAuth` に変更:
- `removeFamilyMember`
- `getFamilyMemberships` 
- `approveFamilyMember`
- `transferOwnership`

### 3. 管理操作は supabaseService 維持
- `generateUniqueInviteCode` - 招待コード重複チェック
- `joinFamilyVault` での招待コード検索

## 一括修正スクリプト

```bash
# family-sharing-service.mjs の修正
sed -i 's/async joinFamilyVault(deviceId/async joinFamilyVault(supabaseAuth, deviceId/g' backend/services/family-sharing-service.mjs
sed -i 's/async removeFamilyMember(deviceId/async removeFamilyMember(supabaseAuth, deviceId/g' backend/services/family-sharing-service.mjs
sed -i 's/async getFamilyMemberships(deviceId/async getFamilyMemberships(supabaseAuth, deviceId/g' backend/services/family-sharing-service.mjs
```

## 呼び出し側の修正も必要

Route handlers で認証クライアントを渡すように修正:

```javascript
// 修正前
const result = await familyService.joinFamilyVault(deviceId, inviteCode);

// 修正後
const result = await familyService.joinFamilyVault(req.supabaseAuth, deviceId, inviteCode);
```