# CSRF攻撃対策実装ドキュメント

## 🛡️ 実装概要

電話番号認証と管理画面ログインにCSRF（Cross-Site Request Forgery）トークンを設置し、CSRF攻撃を防ぐセキュリティ機能を実装しました。

## 📋 実装内容

### 1. 共通ライブラリ（shared-lib）

#### CSRFProtectionクラス
- **ファイル**: `shared-lib/src/security/csrf.ts`
- **機能**:
  - セキュアなCSRFトークン生成
  - セッション・メタタグでのトークン管理
  - タイミング攻撃対策の定数時間比較
  - React Hook (`useCSRFProtection`)
  - Express.js ミドルウェア

#### 主要メソッド
```typescript
CSRFProtection.generateToken()        // トークン生成
CSRFProtection.initializeSession()    // セッション初期化
CSRFProtection.getCSRFHeaders()       // HTTPヘッダー取得
CSRFProtection.validateRequest()      // リクエスト検証
```

### 2. 電話番号認証の保護

#### フロントエンド
- **ファイル**: `tasukaru_demo/src/components/CSRFProtectedPhoneVerification.tsx`
- **機能**:
  - ページ読み込み時にCSRFトークンを自動生成
  - SMS送信・OTP検証時にCSRFヘッダーを自動付与
  - CSRF検証失敗時の自動復旧機能
  - 開発環境でのトークン状態表示

#### バックエンドAPI
- **SMS送信**: `tasukaru_demo/api/send-otp-csrf.ts`
- **OTP検証**: `tasukaru_demo/api/verify-otp-csrf.ts`
- **機能**:
  - リクエスト毎のCSRF検証
  - レート制限機能
  - セキュリティイベントログ
  - IP制限対応

### 3. 管理画面ログインの保護

#### フロントエンド
- **ファイル**: `tasukaru_admin/src/components/CSRFProtectedAdminLogin.tsx`
- **機能**:
  - 強化されたCSRF保護
  - ブルートフォース攻撃対策
  - アカウントロック機能
  - セキュリティ状態の可視化

#### バックエンドAPI
- **管理者ログイン**: `tasukaru_admin/api/admin/login-csrf.ts`
- **機能**:
  - 厳格なCSRF検証
  - リプレイ攻撃対策
  - セキュリティログ記録
  - CORS制限

### 4. サーバーサイドセキュリティ

#### CSRFミドルウェア
- **ファイル**: `tasukaru_demo/api/middleware/csrf-protection.ts`
- **機能**:
  - 自動CSRF検証
  - レート制限機能
  - セキュリティヘッダー自動付与
  - 攻撃検出・ログ機能

## 🔒 セキュリティ特徴

### 1. 多層防御
- **トークン生成**: 暗号学的に安全な乱数 + タイムスタンプ
- **有効期限**: 30分の自動失効
- **定数時間比較**: タイミング攻撃対策
- **レート制限**: DDoS攻撃対策

### 2. 攻撃対策
- **CSRF攻撃**: 全POSTリクエストでトークン検証
- **リプレイ攻撃**: タイムスタンプベース検証
- **ブルートフォース攻撃**: 試行回数制限・アカウントロック
- **タイミング攻撃**: 定数時間文字列比較

### 3. ユーザビリティ
- **自動復旧**: CSRF失敗時の新トークン自動生成
- **透明性**: 開発環境でのトークン状態表示
- **エラーハンドリング**: 分かりやすいエラーメッセージ

## 🧪 セキュリティテスト

### 1. CSRF攻撃シミュレーション

#### 悪意のあるHTMLページ例
```html
<!-- 攻撃者のサイト上のフォーム -->
<form action="https://yourdomain.com/api/send-otp" method="POST" id="malicious-form">
  <input name="phone_number" value="+81901234567" />
  <input name="diagnosis_answers" value="{}" />
</form>
<script>
  // 自動送信を試行（CSRF攻撃）
  document.getElementById('malicious-form').submit();
</script>
```

#### 期待される動作
- ✅ **403 Forbidden** エラーが返される
- ✅ `CSRF_TOKEN_INVALID` エラーコードが設定される
- ✅ セキュリティログに攻撃として記録される

### 2. 正常なリクエストフロー

#### 1. CSRFトークン取得
```javascript
// フロントエンド
const token = CSRFProtection.initializeSession();
console.log('CSRF Token:', token);
```

#### 2. 保護されたAPI呼び出し
```javascript
const response = await fetch('/api/send-otp-csrf', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': token
  },
  body: JSON.stringify({
    phone_number: '+81901234567',
    diagnosis_answers: {}
  })
});
```

#### 3. 成功レスポンス
```json
{
  "success": true,
  "message": "SMS認証コードを送信しました",
  "expires_in": 300
}
```

### 3. エラーケーステスト

#### CSRFトークンなし
```bash
curl -X POST https://yourdomain.com/api/send-otp-csrf \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+81901234567"}'

# 期待: 403 Forbidden + CSRF_TOKEN_INVALID
```

#### 無効なCSRFトークン
```bash
curl -X POST https://yourdomain.com/api/send-otp-csrf \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: invalid-token" \
  -d '{"phone_number": "+81901234567"}'

# 期待: 403 Forbidden + CSRF_TOKEN_INVALID
```

#### 期限切れトークン
```bash
# 31分前のトークンを使用
curl -X POST https://yourdomain.com/api/send-otp-csrf \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <expired-token>" \
  -d '{"phone_number": "+81901234567"}'

# 期待: 403 Forbidden + CSRF_TOKEN_INVALID
```

## 📊 セキュリティログ

### ログフォーマット
```json
{
  "event": "csrf_attack",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0 ...",
  "method": "POST",
  "url": "/api/send-otp-csrf",
  "referer": "https://attacker.com",
  "origin": "https://attacker.com",
  "details": {
    "error": "CSRF token missing",
    "providedToken": "missing"
  }
}
```

### 監視すべきイベント
- `csrf_attack`: CSRF攻撃の検出
- `csrf_success`: 正常なCSRF検証
- `rate_limit_exceeded`: レート制限違反
- `admin_login_failed`: 管理者ログイン失敗

## 🚀 デプロイ設定

### 環境変数
```bash
# 共通設定
NODE_ENV=production
ALLOWED_ORIGIN=https://yourdomain.com

# 管理画面設定
ADMIN_ALLOWED_ORIGIN=https://admin.yourdomain.com
BASIC_AUTH_USER=admin
BASIC_AUTH_PASS=secure-password

# セキュリティ設定
CSRF_SECRET_KEY=your-secret-key
MAX_FAILED_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
```

### Vercel設定 (vercel.json)
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options", 
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## ✅ セキュリティチェックリスト

### 実装完了項目
- [x] CSRFトークン生成・管理システム
- [x] 電話番号認証のCSRF保護
- [x] 管理画面ログインのCSRF保護
- [x] サーバーサイドCSRF検証
- [x] レート制限機能
- [x] セキュリティログ機能
- [x] タイミング攻撃対策
- [x] リプレイ攻撃対策
- [x] ブルートフォース攻撃対策
- [x] 自動復旧機能

### 運用時の推奨事項
- [ ] セキュリティログの監視システム設置
- [ ] 異常検出時のアラート設定
- [ ] 定期的なセキュリティ監査
- [ ] ペネトレーションテスト実施
- [ ] CSRFトークンの定期的なローテーション

## 🔍 今後の拡張案

1. **JWT Based CSRF**: JWTトークンとの統合
2. **Double Submit Cookie**: Cookieベースの追加検証
3. **SameSite Cookie**: よりモダンなCSRF対策
4. **Content Security Policy**: XSS対策との統合
5. **Captcha連携**: ボット攻撃対策

---

この実装により、TASUKARUシステムは主要なCSRF攻撃から保護され、多層的なセキュリティ対策が確立されました。🛡️