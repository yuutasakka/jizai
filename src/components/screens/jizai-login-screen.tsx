import { useState, useEffect } from 'react';
import { track } from '../../lib/analytics';
import { useAuth } from '../../contexts/AuthContext';

interface JizaiLoginScreenProps {
  onComplete: () => void;
}

export const JizaiLoginScreen: React.FC<JizaiLoginScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { loginWithGoogle, loginWithApple, isLoading, skipLogin } = useAuth();

  useEffect(() => {
    track('login_screen_shown');
    setTimeout(() => setIsVisible(true), 300);
  }, []);

  const handleGoogleLogin = async () => {
    try {
      track('login_attempt', { provider: 'google' });
      await loginWithGoogle();
      track('login_success', { provider: 'google' });
      onComplete();
    } catch (error) {
      track('login_error', { provider: 'google', error: String(error) });
      console.error('Googleログインエラー:', error);
    }
  };

  const handleAppleLogin = async () => {
    try {
      track('login_attempt', { provider: 'apple' });
      await loginWithApple();
      track('login_success', { provider: 'apple' });
      onComplete();
    } catch (error) {
      track('login_error', { provider: 'apple', error: String(error) });
      console.error('Appleログインエラー:', error);
    }
  };

  const handleSkipLogin = () => {
    track('login_skipped');
    skipLogin();
    onComplete();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">JIZAI</h1>
          <button 
            onClick={handleSkipLogin}
            className="text-gray-500 text-sm hover:text-gray-700"
          >
            スキップ
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div 
          className={`max-w-md mx-auto w-full transition-all duration-700 ${
            isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
          }`}
        >
          {/* Logo and Title */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">📷</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              アカウントでもっと便利に
            </h2>
            <p className="text-gray-600">
              写真の保存や設定の同期ができます
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">アカウント登録のメリット</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                写真の自動保存とバックアップ
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                設定や履歴の端末間同期
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                優先サポートと新機能の早期利用
              </div>
            </div>
          </div>

          {/* Login Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-white border border-gray-300 rounded-lg px-6 py-3 flex items-center justify-center space-x-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-medium text-gray-700">
                {isLoading ? 'ログイン中...' : 'Googleで続ける'}
              </span>
            </button>

            <button
              onClick={handleAppleLogin}
              disabled={isLoading}
              className="w-full bg-black text-white rounded-lg px-6 py-3 flex items-center justify-center space-x-3 hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C8.396 0 8.006 3.46 8.006 3.46l.017-.02c0-.58-.01-1.84-.01-2.98.03.94.098 1.594.244 2.062.138.42.315.808.497 1.162.182.354.372.64.501.842.129.202.158.3.158.3s.076-.1.158-.3c.129-.202.319-.488.501-.842.182-.354.359-.742.497-1.162.146-.468.214-1.122.244-2.062 0 1.14-.01 2.4-.01 2.98l.017.02S15.621 0 12.017 0zm-.751 4.932c-.386.072-.711.44-.61.836.08.318.29.595.52.776.24.188.54.31.85.31.39 0 .73-.16.99-.42.26-.26.42-.6.42-.99 0-.38-.15-.73-.39-.99-.24-.26-.58-.42-.97-.42-.11 0-.22.016-.32.046-.1.03-.2.07-.29.12-.18.1-.34.24-.44.42-.1.18-.15.38-.14.59.01.21.06.42.15.61.09.19.21.36.36.5.15.14.33.25.52.31z"/>
              </svg>
              <span className="font-medium">
                {isLoading ? 'ログイン中...' : 'Appleでサインイン'}
              </span>
            </button>
          </div>

          {/* Skip Option */}
          <div className="text-center mt-8">
            <button
              onClick={handleSkipLogin}
              className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
            >
              後でログインする
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 text-center">
        <p className="text-xs text-gray-500">
          続行することで、
          <span className="text-blue-600 underline">利用規約</span>と
          <span className="text-blue-600 underline">プライバシーポリシー</span>に同意したものとみなされます
        </p>
      </div>
    </div>
  );
};