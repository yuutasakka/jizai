import { useState, useEffect } from 'react';
import { track } from '../../lib/analytics';
import { JZButton } from '../design-system/jizai-button';
import { useAuth } from '../../contexts/AuthContext';

interface JizaiLoginScreenProps {
  onComplete: () => void;
}

export const JizaiLoginScreen: React.FC<JizaiLoginScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const [showBenefits, setShowBenefits] = useState(false);
  const { loginWithGoogle, loginWithApple, isLoading } = useAuth();

  useEffect(() => {
    track('login_screen_shown');

    // 段階的な表示アニメーション
    const timers = [
      setTimeout(() => setIsVisible(true), 200),
      setTimeout(() => setShowBenefits(true), 800),
      setTimeout(() => setShowLoginOptions(true), 1400),
    ];

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
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


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* 背景装飾 */}
      <div className="absolute inset-0">
        {/* 桜の花びら風エフェクト */}
        <div className="absolute top-20 left-20 w-4 h-4 bg-pink-200 rounded-full opacity-40 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <div className="absolute top-40 right-32 w-3 h-3 bg-purple-200 rounded-full opacity-30 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '4s' }} />
        <div className="absolute bottom-32 left-1/3 w-5 h-5 bg-orange-200 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '1s', animationDuration: '3.5s' }} />
        <div className="absolute bottom-20 right-20 w-4 h-4 bg-pink-300 rounded-full opacity-25 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '4.5s' }} />
      </div>

      {/* メインコンテンツ */}
      <div className="relative z-10 text-center max-w-md mx-auto px-6">
        
        {/* ヘッダー */}
        <div className={`mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`}>
          {/* ロゴ */}
          <div className="mb-8">
            <div className="relative mx-auto w-24 h-24 mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 rounded-full shadow-lg opacity-90"></div>
              <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center shadow-inner">
                <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-400 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5 2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" />
                </svg>
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-2">
            JIZAI
          </h1>
          <div className="text-lg text-gray-600 font-medium mb-4 tracking-wide">
            自在
          </div>
          <p className="text-gray-500 text-sm">
            アカウントでより充実した体験を
          </p>
        </div>

        {/* 会員登録のメリット */}
        <div className={`mb-8 transition-all duration-1000 ${showBenefits ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`}>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">会員登録で広がる世界</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                クラウド同期で写真を安全に保存
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-5 h-5 bg-pink-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-3 h-3 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                家族との思い出共有機能
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-3 h-3 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                AIによる記念日の自動リマインダー
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                個人化された編集提案
              </div>
            </div>
          </div>
        </div>

        {/* ログインオプション */}
        <div className={`space-y-4 mb-8 transition-all duration-1000 ${showLoginOptions ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`}>
          
          {/* Google ログイン */}
          <JZButton
            tone="secondary"
            size="lg"
            className="w-full py-4 flex items-center justify-center space-x-3 bg-white/80 hover:bg-white/90 border border-gray-200 shadow-md"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-gray-700 font-medium">
              {isLoading ? 'ログイン中...' : 'Googleで続ける'}
            </span>
          </JZButton>

          {/* Apple ログイン */}
          <JZButton
            tone="primary"
            size="lg"
            className="w-full py-4 flex items-center justify-center space-x-3 bg-black hover:bg-gray-800 text-white"
            onClick={handleAppleLogin}
            disabled={isLoading}
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.017 0C8.396 0 8.006 3.46 8.006 3.46l.017-.02c0-.58-.01-1.84-.01-2.98.03.94.098 1.594.244 2.062.138.42.315.808.497 1.162.182.354.372.64.501.842.129.202.158.3.158.3s.076-.1.158-.3c.129-.202.319-.488.501-.842.182-.354.359-.742.497-1.162.146-.468.214-1.122.244-2.062 0 1.14-.01 2.4-.01 2.98l.017.02S15.621 0 12.017 0zm-.751 4.932c-.386.072-.711.44-.61.836.08.318.29.595.52.776.24.188.54.31.85.31.39 0 .73-.16.99-.42.26-.26.42-.6.42-.99 0-.38-.15-.73-.39-.99-.24-.26-.58-.42-.97-.42-.11 0-.22.016-.32.046-.1.03-.2.07-.29.12-.18.1-.34.24-.44.42-.1.18-.15.38-.14.59.01.21.06.42.15.61.09.19.21.36.36.5.15.14.33.25.52.31z"/>
            </svg>
            <span className="font-medium">
              {isLoading ? 'ログイン中...' : 'Appleでサインイン'}
            </span>
          </JZButton>

          {/* プライバシーポリシー */}
          <p className="text-xs text-gray-500 text-center mt-4 px-4">
            続行することで、<span className="text-purple-600 underline">利用規約</span>と
            <span className="text-purple-600 underline">プライバシーポリシー</span>に同意したものとみなされます
          </p>
        </div>

      </div>

      {/* フッター */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-xs text-gray-400 font-light">
          Made with ❤️ for preserving memories
        </p>
      </div>
    </div>
  );
};