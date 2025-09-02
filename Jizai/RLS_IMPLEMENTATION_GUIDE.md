# 🛡️ RLS 修正実装ガイド

## 実装完了内容

### ✅ 作成したファイル

1. **`backend/middleware/rls-auth.mjs`** - JWT認証ミドルウェア
2. **`backend/utils/service-client-audit.mjs`** - 監査ユーティリティ
3. **`RLS_FIXES_EXAMPLES.md`** - 修正パターン例集
4. **`SECURITY_ASSESSMENT_RLS.md`** - セキュリティ評価レポート

### ✅ 修正したファイル

1. **`backend/index-vault-integration.mjs`**
   - RLS認証ミドルウェア追加
   - Vault操作を認証クライアントに変更
   - メモリ挿入を認証クライアントに変更

2. **`backend/.env-vault.example`**
   - `SUPABASE_JWT_SECRET` 環境変数追加
   - セキュリティコメント追加

3. **`backend/services/family-sharing-service.mjs`**
   - 監査ユーティリティ import 追加

## 次に必要な作業

### Phase 1: 残りのサービス修正 🔧

```bash
# 各サービスファイルで同様の修正が必要
backend/services/subscription-service.mjs
backend/services/print-export-service.mjs
backend/services/notification-service.mjs
backend/services/storage-quota-service.mjs
backend/services/appstore-webhook.mjs
```

### Phase 2: 環境設定 ⚙️

```bash
# 1. Supabase ダッシュボードから JWT Secret を取得
# Settings → API → JWT Secret

# 2. .env ファイルに追加
echo "SUPABASE_JWT_SECRET=your_actual_jwt_secret" >> .env

# 3. JWT パッケージをインストール
npm install jsonwebtoken
```

### Phase 3: エンドポイント認証適用 🔐

```javascript
// 全てのユーザーデータエンドポイントに適用
app.use('/v1/vault/*', rlsAuthMiddleware());
app.use('/v1/family/*', rlsAuthMiddleware());
app.use('/v1/subscription/*', rlsAuthMiddleware());
app.use('/v1/memory/*', rlsAuthMiddleware());
```

### Phase 4: テスト実施 🧪

```javascript
// 1. JWT 生成テスト
const jwt = createUserJWT('device123', { id: 'user123', email: 'test@example.com' });

// 2. RLS 動作確認
const { data, error } = await supabaseAuth.from('vaults').select('*');
// → ユーザーの Vault のみ取得されることを確認

// 3. 認証なしアクセステスト  
const { data, error } = await supabase.from('vaults').select('*');
// → error.code === '42501' (権限不足) を確認
```

## 修正優先順位

### 🚨 Priority 1 (即座に修正)
- `index-vault-integration.mjs` ✅ **完了**
- `services/subscription-service.mjs`
- `services/family-sharing-service.mjs`

### ⚠️ Priority 2 (1週間以内)
- `services/print-export-service.mjs`
- `services/storage-quota-service.mjs`
- Route ハンドラーの認証適用

### 📋 Priority 3 (管理操作の適切な分離)
- `services/notification-service.mjs` - システム通知 vs ユーザー通知
- `services/appstore-webhook.mjs` - Webhook 処理の監査強化

## 監査とモニタリング

### 使用状況確認
```bash
# サービスクライアント使用箇所を検索
grep -r "supabaseService" backend/ --include="*.mjs"

# 監査ログ確認
grep "Service client used" logs/security.log
```

### 定期チェック
```javascript
// 週次実行推奨
import { generateAuditReport } from './utils/service-client-audit.mjs';

const report = generateAuditReport(
  new Date('2024-01-01'),
  new Date('2024-01-07')
);
console.log(report);
```

## 期待される効果

### 🛡️ セキュリティ向上
- データベースレベルでの認証・認可
- アプリケーション脆弱性への耐性向上
- 最小権限の原則適用

### 📊 運用改善  
- 監査ログによる透明性
- セキュリティインシデントの早期発見
- コンプライアンス対応強化

### 🔧 保守性向上
- 認証ロジックのデータベース集約
- コード重複削減
- セキュリティポリシーの一元管理

## 注意事項

1. **段階的移行**: 一度にすべて変更せず機能ごとに実施
2. **テスト徹底**: 各修正後に動作確認必須
3. **パフォーマンス**: JWT生成コストを考慮
4. **エラー処理**: RLS拒否エラーの適切な処理
5. **互換性**: 既存クライアントとの互換性確認

---

**重要**: この修正により、Supabase RLS ポリシーが実際に機能するようになり、真のセキュリティ保護が実現されます。