-- =========================================
-- TASUKARU CSRF保護システム用 Supabaseスキーマ
-- =========================================

-- RLSを有効化
ALTER DATABASE postgres SET "app.settings.jwt_secret" = 'super-secret-jwt-token-with-at-least-32-characters-long';

-- 1. CSRF トークン管理テーブル
CREATE TABLE IF NOT EXISTS csrf_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash TEXT NOT NULL UNIQUE,
    user_session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    -- インデックス用
    CONSTRAINT csrf_tokens_expires_check CHECK (expires_at > created_at)
);

-- CSRFトークンテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_hash ON csrf_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_expires ON csrf_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_session ON csrf_tokens(user_session_id);
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_ip ON csrf_tokens(ip_address);

-- 2. 電話番号認証セッション管理テーブル
CREATE TABLE IF NOT EXISTS phone_verification_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL UNIQUE,
    phone_number TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    diagnosis_answers JSONB,
    raw_diagnosis_answers JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes'),
    verified_at TIMESTAMPTZ,
    verification_attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    is_verified BOOLEAN DEFAULT FALSE,
    csrf_token_id UUID REFERENCES csrf_tokens(id) ON DELETE SET NULL,
    -- セキュリティ制約
    CONSTRAINT phone_verification_max_attempts CHECK (verification_attempts <= max_attempts),
    CONSTRAINT phone_verification_expires_check CHECK (expires_at > created_at)
);

-- 電話番号認証テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_phone_verification_session_id ON phone_verification_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_phone_verification_phone ON phone_verification_sessions(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_verification_expires ON phone_verification_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_phone_verification_ip ON phone_verification_sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_phone_verification_created ON phone_verification_sessions(created_at);

-- 3. 管理者認証テーブル
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    phone_number TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_super_admin BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- セキュリティ制約
    CONSTRAINT admin_users_username_length CHECK (char_length(username) >= 3),
    CONSTRAINT admin_users_password_not_empty CHECK (char_length(password_hash) > 0)
);

-- 管理者認証テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_users_locked ON admin_users(locked_until);

-- 4. 管理者ログインセッション管理テーブル
CREATE TABLE IF NOT EXISTS admin_login_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    csrf_token_id UUID REFERENCES csrf_tokens(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '2 hours'),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    logout_at TIMESTAMPTZ,
    -- セキュリティ制約
    CONSTRAINT admin_sessions_expires_check CHECK (expires_at > created_at)
);

-- 管理者セッションテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_login_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_login_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_login_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_active ON admin_login_sessions(is_active);

-- 5. セキュリティログテーブル
CREATE TABLE IF NOT EXISTS security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    event_category TEXT NOT NULL, -- 'csrf_attack', 'login_attempt', 'rate_limit', etc.
    severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
    ip_address INET,
    user_agent TEXT,
    user_id UUID, -- 関連するユーザーID（管理者など）
    session_id TEXT,
    csrf_token_id UUID REFERENCES csrf_tokens(id) ON DELETE SET NULL,
    request_method TEXT,
    request_url TEXT,
    request_headers JSONB,
    event_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- インデックス用制約
    CONSTRAINT security_logs_severity_check CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    CONSTRAINT security_logs_event_type_not_empty CHECK (char_length(event_type) > 0)
);

-- セキュリティログテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_category ON security_logs(event_category);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip ON security_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_logs_created ON security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);

-- 6. レート制限管理テーブル
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- IP address or user identifier
    identifier_type TEXT NOT NULL, -- 'ip', 'user', 'session'
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    window_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 minute'),
    blocked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- 制約
    CONSTRAINT rate_limits_window_check CHECK (window_end > window_start),
    CONSTRAINT rate_limits_count_positive CHECK (request_count > 0),
    CONSTRAINT rate_limits_identifier_type_check CHECK (identifier_type IN ('ip', 'user', 'session'))
);

-- レート制限テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end ON rate_limits(window_end);
CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked ON rate_limits(blocked_until);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_unique ON rate_limits(identifier, endpoint, window_start);

-- 7. 診断結果保存テーブル（既存システムとの互換性）
CREATE TABLE IF NOT EXISTS diagnosis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL UNIQUE,
    phone_number TEXT NOT NULL,
    phone_verification_session_id UUID REFERENCES phone_verification_sessions(id) ON DELETE SET NULL,
    diagnosis_answers JSONB NOT NULL,
    raw_diagnosis_answers JSONB,
    computed_results JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- データ整合性制約
    CONSTRAINT diagnosis_results_phone_format CHECK (phone_number ~ '^\+81[0-9]{10}$')
);

-- 診断結果テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_diagnosis_results_session ON diagnosis_results(session_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_results_phone ON diagnosis_results(phone_number);
CREATE INDEX IF NOT EXISTS idx_diagnosis_results_created ON diagnosis_results(created_at);

-- =========================================
-- RLS (Row Level Security) ポリシー設定
-- =========================================

-- CSRFトークンテーブル: システム内部からのみアクセス可能
ALTER TABLE csrf_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "csrf_tokens_system_only" ON csrf_tokens FOR ALL USING (false);

-- 電話番号認証: セッションIDベースでのアクセス制御
ALTER TABLE phone_verification_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "phone_verification_session_access" ON phone_verification_sessions 
FOR SELECT USING (
    session_id = current_setting('app.current_session_id', true) OR
    auth.role() = 'service_role'
);

-- 管理者ユーザー: 管理者のみアクセス可能
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_users_admin_only" ON admin_users FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (
        SELECT 1 FROM admin_login_sessions als 
        WHERE als.admin_user_id = auth.uid() 
        AND als.is_active = true 
        AND als.expires_at > NOW()
    )
);

-- 管理者セッション: 該当管理者のみアクセス可能
ALTER TABLE admin_login_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_sessions_own_only" ON admin_login_sessions FOR ALL USING (
    admin_user_id = auth.uid() OR auth.role() = 'service_role'
);

-- セキュリティログ: 管理者と system role のみ参照可能
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "security_logs_admin_read" ON security_logs FOR SELECT USING (
    auth.role() = 'service_role' OR
    EXISTS (
        SELECT 1 FROM admin_login_sessions als 
        JOIN admin_users au ON als.admin_user_id = au.id
        WHERE als.admin_user_id = auth.uid() 
        AND als.is_active = true 
        AND als.expires_at > NOW()
        AND au.is_active = true
    )
);

-- レート制限: システム内部からのみアクセス
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rate_limits_system_only" ON rate_limits FOR ALL USING (auth.role() = 'service_role');

-- 診断結果: セッションIDまたは電話番号ベースでのアクセス制御
ALTER TABLE diagnosis_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diagnosis_results_session_access" ON diagnosis_results FOR SELECT USING (
    session_id = current_setting('app.current_session_id', true) OR
    phone_number = current_setting('app.current_phone_number', true) OR
    auth.role() = 'service_role'
);

-- =========================================
-- 自動削除・クリーンアップ機能
-- =========================================

-- 期限切れCSRFトークンの自動削除関数
CREATE OR REPLACE FUNCTION cleanup_expired_csrf_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM csrf_tokens 
    WHERE expires_at < NOW() OR (is_used = true AND used_at < NOW() - INTERVAL '1 hour');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    INSERT INTO security_logs (event_type, event_category, severity, event_details)
    VALUES (
        'csrf_token_cleanup',
        'maintenance',
        'info',
        jsonb_build_object('deleted_count', deleted_count, 'cleanup_time', NOW())
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 期限切れ電話認証セッションの自動削除関数
CREATE OR REPLACE FUNCTION cleanup_expired_phone_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM phone_verification_sessions 
    WHERE expires_at < NOW() AND is_verified = false;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    INSERT INTO security_logs (event_type, event_category, severity, event_details)
    VALUES (
        'phone_session_cleanup',
        'maintenance', 
        'info',
        jsonb_build_object('deleted_count', deleted_count, 'cleanup_time', NOW())
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 古いセキュリティログの自動削除関数（30日以上古いもの）
CREATE OR REPLACE FUNCTION cleanup_old_security_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM security_logs 
    WHERE created_at < NOW() - INTERVAL '30 days' AND severity IN ('info', 'warning');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- トリガー関数
-- =========================================

-- CSRFトークン使用時の自動更新
CREATE OR REPLACE FUNCTION mark_csrf_token_used()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_used = true AND OLD.is_used = false THEN
        NEW.used_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER csrf_token_used_trigger
    BEFORE UPDATE ON csrf_tokens
    FOR EACH ROW
    EXECUTE FUNCTION mark_csrf_token_used();

-- 管理者最終ログイン時刻の自動更新
CREATE OR REPLACE FUNCTION update_admin_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE admin_users 
    SET last_login_at = NOW(), failed_login_attempts = 0
    WHERE id = NEW.admin_user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_login_success_trigger
    AFTER INSERT ON admin_login_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_last_login();

-- =========================================
-- 初期データ投入
-- =========================================

-- デフォルト管理者アカウント作成（パスワード: admin123）
INSERT INTO admin_users (username, email, password_hash, is_super_admin) VALUES 
(
    'admin',
    'admin@tasukaru.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/0.MplJSMjxZ9E/AoG', -- admin123のハッシュ
    true
) ON CONFLICT (username) DO NOTHING;

-- セキュリティログ初期エントリ
INSERT INTO security_logs (event_type, event_category, severity, event_details) VALUES 
(
    'database_initialization',
    'system',
    'info',
    jsonb_build_object(
        'message', 'CSRF protection database schema initialized',
        'version', '1.0.0',
        'timestamp', NOW()
    )
);

-- =========================================
-- ビュー作成（管理画面用）
-- =========================================

-- セキュリティダッシュボード用ビュー
CREATE OR REPLACE VIEW security_dashboard AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    event_category,
    severity,
    COUNT(*) as event_count,
    COUNT(DISTINCT ip_address) as unique_ips
FROM security_logs 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), event_category, severity
ORDER BY hour DESC;

-- アクティブセッション監視ビュー
CREATE OR REPLACE VIEW active_sessions_monitor AS
SELECT 
    als.id,
    au.username,
    als.ip_address,
    als.created_at,
    als.last_activity_at,
    als.expires_at,
    EXTRACT(EPOCH FROM (als.expires_at - NOW())) / 60 as minutes_remaining
FROM admin_login_sessions als
JOIN admin_users au ON als.admin_user_id = au.id
WHERE als.is_active = true 
AND als.expires_at > NOW()
ORDER BY als.last_activity_at DESC;

-- レート制限監視ビュー  
CREATE OR REPLACE VIEW rate_limit_monitor AS
SELECT 
    identifier,
    endpoint,
    request_count,
    window_end,
    blocked_until,
    CASE 
        WHEN blocked_until > NOW() THEN 'BLOCKED'
        WHEN window_end > NOW() THEN 'ACTIVE'
        ELSE 'EXPIRED'
    END as status
FROM rate_limits
WHERE window_end > NOW() - INTERVAL '1 hour'
ORDER BY request_count DESC;

COMMENT ON TABLE csrf_tokens IS 'CSRF攻撃対策用トークン管理テーブル';
COMMENT ON TABLE phone_verification_sessions IS '電話番号認証セッション管理テーブル';
COMMENT ON TABLE admin_users IS '管理者ユーザー情報テーブル';
COMMENT ON TABLE admin_login_sessions IS '管理者ログインセッション管理テーブル';
COMMENT ON TABLE security_logs IS 'セキュリティイベントログテーブル';
COMMENT ON TABLE rate_limits IS 'レート制限管理テーブル';
COMMENT ON TABLE diagnosis_results IS '診断結果保存テーブル';