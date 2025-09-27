import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface JizaiLoginScreenProps {
  onComplete?: () => void;
}

export function JizaiLoginScreen({ 
  onComplete = () => console.log('Login completed')
}: JizaiLoginScreenProps = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithGoogle, loginWithApple, devLogin, isDevLoginEnabled } = useAuth();

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 200);
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle(); // will redirect
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithApple(); // will redirect
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevLogin = async () => {
    if (isDevLoginEnabled && devLogin) {
      try {
        setIsLoading(true);
        const result = await devLogin();
        if (result.user && !result.error) {
          onComplete();
        } else if (result.error) {
          console.error('Development login failed:', result.error);
        }
      } catch (error) {
        console.error('Development login error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="options-form-root-0-1-2963">
      <div 
        className={`w-full max-w-sm transition-all duration-500 ${
          isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
        }`}
      >
        
        {/* Logo and Title */}
        <div className="text-center mb-16">
          <h1 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)] mb-[var(--space-12)] tracking-wide">
            JIZAI
          </h1>
          <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
            アカウントでサインインしてはじめましょう
          </p>
        </div>

        {/* Login Buttons */}
        <div className="space-y-6">
          {/* Google Login (with hover icon above) */}
          <div className="relative group pt-10">
            {/* Floating icon above button */}
            <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 transform transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:drop-shadow-lg">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-[color:var(--color-jz-card)] border border-[color:var(--color-jz-border)] rounded-[var(--radius-jz-button)] px-6 py-4 flex items-center justify-center space-x-3 hover:bg-[color:var(--color-jz-card)]/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="jz-text-button text-[color:var(--color-jz-text-primary)]">
                {isLoading ? '接続中' : 'Googleで続ける'}
              </span>
            </button>
          </div>

          {/* Apple Login (with hover icon above) */}
          <div className="relative group pt-10">
            {/* Floating icon above button */}
            <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 transform transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:drop-shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.017 0C8.396 0 8.006 3.46 8.006 3.46l.017-.02c0-.58-.01-1.84-.01-2.98.03.94.098 1.594.244 2.062.138.42.315.808.497 1.162.182.354.372.64.501.842.129.202.158.3.158.3s.076-.1.158-.3c.129-.202.319-.488.501-.842.182-.354.359-.742.497-1.162.146-.468.214-1.122.244-2.062 0 1.14-.01 2.4-.01 2.98l.017.02S15.621 0 12.017 0z"/>
              </svg>
            </div>

            <button
              onClick={handleAppleLogin}
              disabled={isLoading}
              className="w-full bg-[color:var(--color-jz-card)] border border-[color:var(--color-jz-border)] text-[color:var(--color-jz-text-primary)] rounded-[var(--radius-jz-button)] px-6 py-4 flex items-center justify-center space-x-3 hover:bg-[color:var(--color-jz-card)]/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.017 0C8.396 0 8.006 3.46 8.006 3.46l.017-.02c0-.58-.01-1.84-.01-2.98.03.94.098 1.594.244 2.062.138.42.315.808.497 1.162.182.354.372.64.501.842.129.202.158.3.158.3s.076-.1.158-.3c.129-.202.319-.488.501-.842.182-.354.359-.742.497-1.162.146-.468.214-1.122.244-2.062 0 1.14-.01 2.4-.01 2.98l.017.02S15.621 0 12.017 0z"/>
              </svg>
              <span className="jz-text-button text-[color:var(--color-jz-text-primary)]">
                {isLoading ? '接続中' : 'Appleでサインイン'}
              </span>
            </button>
          </div>

          {/* Development-only quick login */}
          {isDevLoginEnabled && (
            <div className="pt-8 space-y-4">
              <div className="flex items-center">
                <div className="flex-1 h-px bg-[color:var(--color-jz-border)]"></div>
                <span className="px-4 jz-text-caption text-[color:var(--color-jz-text-secondary)]">開発環境</span>
                <div className="flex-1 h-px bg-[color:var(--color-jz-border)]"></div>
              </div>

              <button
                onClick={handleDevLogin}
                disabled={isLoading}
                className="w-full bg-[color:var(--color-jz-accent)]/10 border border-[color:var(--color-jz-accent)]/30 rounded-[var(--radius-jz-button)] px-6 py-4 flex items-center justify-center space-x-3 hover:bg-[color:var(--color-jz-accent)]/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[color:var(--color-jz-accent)]"></div>
                ) : (
                  <svg className="w-5 h-5 text-[color:var(--color-jz-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                )}
                <span className="jz-text-button text-[color:var(--color-jz-accent)]">
                  {isLoading ? "ログイン中..." : "開発用テストユーザーでログイン"}
                </span>
              </button>

              <p className="text-center jz-text-caption text-[color:var(--color-jz-text-secondary)]">
                開発環境用のテスト認証です<br/>
                本番環境では削除されます
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
