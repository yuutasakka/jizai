import { useState, useEffect } from 'react';
import { track } from './lib/analytics';
import { setupGlobalErrorHandling, setupPerformanceMonitoring, errorTracker } from './lib/error-tracking';
import { ZenModeProvider } from './contexts/ZenModeContext';
import { MemorialIntelligenceProvider } from './contexts/MemorialIntelligenceContext';
import { GrowthAchievementProvider } from './contexts/GrowthAchievementContext';
import { FamilyBondingProvider } from './contexts/FamilyBondingContext';
import { PersonalizationProvider } from './contexts/PersonalizationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { JizaiSplashScreen } from './components/screens/jizai-splash-screen';
import { JizaiLoginScreen } from './components/screens/jizai-login-screen';
import { JizaiOnboardingScreen } from './components/screens/jizai-onboarding-screen';
import { JizaiHomeScreen } from './components/screens/jizai-home-screen';
import { JizaiProgressScreen } from './components/screens/jizai-progress-screen';
import { ResultsScreen } from './components/screens/results-screen';
import { SettingsScreen } from './components/screens/settings-screen';
import { TutorialExamplesScreen } from './components/screens/tutorial-examples-screen';
import { UserGalleryScreen } from './components/screens/user-gallery-screen';
import { MemorialPhotoScreen } from './components/screens/memorial-photo-screen';
import { LongTermEngagementScreen } from './components/screens/long-term-engagement-screen';
import { ProfileScreen } from './components/screens/profile-screen';
import { NotificationsScreen } from './components/screens/notifications-screen';
import { AppStoreScreenshot } from './components/screenshots/app-store-screenshots';
import { DesignSystemReference } from './components/design-tokens/design-system-reference';
import { JZButton } from './components/design-system/jizai-button';
import { JZHomeIcon, JZMemorialPhotoIcon, JZPlusIcon, JZSearchIcon, JZUserIcon } from './components/design-system/jizai-icons';
import { CreateImageScreen } from './components/screens/create-image-screen';
import { PromptHistoryScreen } from './components/screens/prompt-history-screen';
import { StorageScreen } from './components/screens/storage-screen';
import { PurchaseScreen } from './components/screens/purchase-screen';
import { PricingScreen } from './components/screens/pricing-screen';

type Screen = 'splash' | 'login' | 'onboarding' | 'home' | 'progress' | 'results' | 'settings' | 'tutorial-examples' | 'screenshots' | 'design-tokens' | 'user-gallery' | 'memorial-photo' | 'long-term-engagement' | 'profile' | 'notifications' | 'create' | 'storage' | 'purchase' | 'pricing' | 'prompt-history';

interface ExampleData {
  title: string;
  promptEn: string;
  description: string;
  thumbnailImage?: string;
  beforeImage?: string;
  afterImage?: string;
}

function InnerApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [hasCompletedSplash, setHasCompletedSplash] = useState(false);
  const [selectedExample, setSelectedExample] = useState<ExampleData | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { isLoginRequired, isAuthenticated } = useAuth();

  // Type-safe navigation function
  const navigate = (screen: string) => {
    if (isValidScreen(screen)) {
      setCurrentScreen(screen);
    } else {
      console.warn(`Invalid screen: ${screen}`);
    }
  };

  // Screen validation helper
  const isValidScreen = (screen: string): screen is Screen => {
    const validScreens: Screen[] = ['splash', 'login', 'onboarding', 'home', 'progress', 'results', 'settings', 'tutorial-examples', 'screenshots', 'design-tokens', 'user-gallery', 'memorial-photo', 'long-term-engagement', 'profile', 'notifications', 'create', 'storage', 'purchase', 'pricing', 'prompt-history'];
    return validScreens.includes(screen as Screen);
  };

  // Handle splash screen completion
  const handleSplashComplete = () => {
    setHasCompletedSplash(true);
    setCurrentScreen('onboarding');
  };

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
    setCurrentScreen('login');
  };

  // Handle onboarding skip
  const handleOnboardingSkip = () => {
    setHasCompletedOnboarding(true);
    setCurrentScreen('login');
  };

  // Handle login completion
  const handleLoginComplete = () => {
    setCurrentScreen('home');
  };


  // エラートラッキングとモニタリングの初期化
  useEffect(() => {
    setupGlobalErrorHandling();
    setupPerformanceMonitoring();
    
    errorTracker.log('info', 'App initialized', {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
  }, []);

  // Detect preset complete from URL (/?usecase=&preset=) and fire event once per session
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const usecase = url.searchParams.get('usecase');
      if (usecase) {
        const preset = url.searchParams.get('preset') || '';
        if (!sessionStorage.getItem('ga_preset_complete')) {
          track('preset_complete', { usecase, preset });
          sessionStorage.setItem('ga_preset_complete', '1');
        }
      }
    } catch {}
  }, []);


  const handleExampleSelected = (example: ExampleData) => {
    setIsTransitioning(true);
    setSelectedExample(example);
    
    // Smart Animate風の遷移効果
    setTimeout(() => {
      setCurrentScreen('home');
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 100);
  };

  const handleClearExample = () => {
    setSelectedExample(null);
  };

  const renderScreen = () => {
    // Show splash screen first
    if (!hasCompletedSplash && currentScreen === 'splash') {
      return <JizaiSplashScreen onComplete={handleSplashComplete} />;
    }

    // Show onboarding if not completed
    if (!hasCompletedOnboarding) {
      return (
        <JizaiOnboardingScreen 
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      );
    }

    // Show login screen if onboarding completed but login is required and user not authenticated
    if (hasCompletedOnboarding && isLoginRequired && !isAuthenticated && currentScreen === 'login') {
      return <JizaiLoginScreen onComplete={handleLoginComplete} />;
    }

    switch (currentScreen) {
      case 'splash':
        return <JizaiSplashScreen onComplete={handleSplashComplete} />;
      case 'login':
        return <JizaiLoginScreen onComplete={handleLoginComplete} />;
      case 'onboarding':
        return (
          <JizaiOnboardingScreen 
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
          />
        );
      case 'home':
        return <JizaiHomeScreen onNavigate={navigate} />;
      case 'progress':
        return <JizaiProgressScreen onNavigate={navigate} />;
      case 'results':
        return <ResultsScreen onNavigate={navigate} />;
      case 'settings':
        return <SettingsScreen onNavigate={navigate} />;
      case 'profile':
        return <ProfileScreen onNavigate={navigate} />;
      case 'notifications':
        return <NotificationsScreen onNavigate={navigate} />;
      case 'tutorial-examples':
        return <TutorialExamplesScreen onNavigate={navigate} onExampleSelected={handleExampleSelected} />;
      case 'user-gallery':
        return <UserGalleryScreen onNavigate={navigate} />;
      case 'memorial-photo':
        return <MemorialPhotoScreen onNavigate={navigate} />;
      case 'long-term-engagement':
        return <LongTermEngagementScreen onNavigate={navigate} />;
      case 'design-tokens':
        return <DesignSystemReference />;
      case 'screenshots':
        return <ScreenshotGallery onNavigate={navigate} />;
      case 'create':
        return <CreateImageScreen onNavigate={navigate} />;
      case 'storage':
        return <StorageScreen onNavigate={navigate} />;
      case 'prompt-history':
        return <PromptHistoryScreen onNavigate={navigate} />;
      case 'purchase':
        return <PurchaseScreen onNavigate={navigate} />;
      case 'pricing':
        return <PricingScreen onNavigate={navigate} />;
      default:
        return <JizaiHomeScreen onNavigate={navigate} />;
    }
  };

  // Show navigation on all screens except splash, login, and onboarding
  const hideNavigationScreens = ['splash', 'login', 'onboarding'];
  const showBottomNavigation = hasCompletedOnboarding && isAuthenticated && !hideNavigationScreens.includes(currentScreen);

  return (
    <PersonalizationProvider>
      <MemorialIntelligenceProvider>
        <GrowthAchievementProvider>
          <FamilyBondingProvider>
            <ZenModeProvider>
      <div className="min-h-screen bg-[color:var(--color-jz-surface)]">
        {/* Main Content */}
        <div className={`${showBottomNavigation ? 'pb-[100px]' : ''} ${isTransitioning ? 'transition-all duration-300 ease-in-out transform scale-95 opacity-90' : 'transition-all duration-300 ease-in-out transform scale-100 opacity-100'}`}>
          {renderScreen()}
        </div>

        {/* Premium Bottom Navigation */}
        {showBottomNavigation && (
          <div className="fixed bottom-0 left-0 right-0 z-50">
            {/* Solid Black Background - No Transparency */}
            <div className="bg-black border-t border-white/20 shadow-2xl relative">
              {/* Extra opacity layer to ensure no transparency */}
              <div className="absolute inset-0 bg-black"></div>
              <div className="mx-auto max-w-[720px] px-6 relative z-10">
                <div className="flex items-center justify-between h-[72px] relative">
                  {/* Home */}
                  <button
                    className={`relative h-[48px] w-[48px] flex flex-col items-center justify-center rounded-2xl transition-all duration-300 group ${
                      currentScreen === 'home'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/40 transform scale-110'
                        : 'hover:bg-white/10 hover:scale-105'
                    }`}
                    onClick={() => setCurrentScreen('home')}
                  >
                    <div className={`transition-all duration-300 ${
                      currentScreen === 'home'
                        ? 'text-white drop-shadow-lg'
                        : 'text-white/70 group-hover:text-white'
                    }`}>
                      <JZHomeIcon size={24} />
                    </div>
                    {currentScreen === 'home' && (
                      <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full animate-pulse" />
                    )}
                    <span className="sr-only">ホーム</span>
                  </button>

                  {/* Folders -> User Gallery */}
                  <button
                    className={`relative h-[48px] w-[48px] flex flex-col items-center justify-center rounded-2xl transition-all duration-300 group ${
                      currentScreen === 'user-gallery'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/40 transform scale-110'
                        : 'hover:bg-white/10 hover:scale-105'
                    }`}
                    onClick={() => setCurrentScreen('user-gallery')}
                  >
                    <div className={`transition-all duration-300 ${
                      currentScreen === 'user-gallery'
                        ? 'text-white drop-shadow-lg'
                        : 'text-white/70 group-hover:text-white'
                    }`}>
                      <JZMemorialPhotoIcon size={24} />
                    </div>
                    {currentScreen === 'user-gallery' && (
                      <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full animate-pulse" />
                    )}
                    <span className="sr-only">フォルダ</span>
                  </button>

                  {/* Premium Center Plus Button */}
                  <button
                    aria-label="新規作成"
                    className={`relative rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white w-14 h-14 flex items-center justify-center shadow-2xl border-2 border-white/30 transition-all duration-300 group hover:scale-110 hover:shadow-purple-500/50 ${
                      currentScreen === 'create' ? 'scale-110' : ''
                    }`}
                    onClick={() => setCurrentScreen('create')}
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                    <JZPlusIcon size={22} />
                  </button>

                  {/* Templates (Search) */}
                  <button
                    className={`relative h-[48px] w-[48px] flex flex-col items-center justify-center rounded-2xl transition-all duration-300 group ${
                      currentScreen === 'tutorial-examples'
                        ? 'bg-gradient-to-r from-orange-500 to-red-600 shadow-lg shadow-orange-500/40 transform scale-110'
                        : 'hover:bg-white/10 hover:scale-105'
                    }`}
                    onClick={() => setCurrentScreen('tutorial-examples')}
                  >
                    <div className={`transition-all duration-300 ${
                      currentScreen === 'tutorial-examples'
                        ? 'text-white drop-shadow-lg'
                        : 'text-white/70 group-hover:text-white'
                    }`}>
                      <JZSearchIcon size={24} />
                    </div>
                    {currentScreen === 'tutorial-examples' && (
                      <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full animate-pulse" />
                    )}
                    <span className="sr-only">テンプレート</span>
                  </button>

                  {/* Profile (User) */}
                  <button
                    className={`relative h-[48px] w-[48px] flex flex-col items-center justify-center rounded-2xl transition-all duration-300 group ${
                      currentScreen === 'profile'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/40 transform scale-110'
                        : 'hover:bg-white/10 hover:scale-105'
                    }`}
                    onClick={() => setCurrentScreen('profile')}
                  >
                    <div className={`transition-all duration-300 ${
                      currentScreen === 'profile'
                        ? 'text-white drop-shadow-lg'
                        : 'text-white/70 group-hover:text-white'
                    }`}>
                      <JZUserIcon size={24} />
                    </div>
                    {currentScreen === 'profile' && (
                      <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full animate-pulse" />
                    )}
                    <span className="sr-only">プロフィール</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
            </ZenModeProvider>
          </FamilyBondingProvider>
        </GrowthAchievementProvider>
      </MemorialIntelligenceProvider>
    </PersonalizationProvider>
  );
}

// Main App component that wraps InnerApp with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  );
}

// Screenshot Gallery Component
const ScreenshotGallery = ({ onNavigate }: { onNavigate: (screen: Screen) => void }) => {
  const [screenshotMode, setScreenshotMode] = useState<{ type: 'before-after' | 'text-replace' | 'sale-change' | 'color-change' | 'object-removal' | 'purchase'; size: '6.7' | '5.5' }>({
    type: 'before-after',
    size: '6.7'
  });

  const screenshots = [
    { type: 'before-after' as const, title: '1. Before/After', description: 'OPENをCLOSEDに - スライダーでコントロール' },
    { type: 'text-replace' as const, title: '2. 文字差し替え', description: 'フォント維持で自然な仕上がり' },
    { type: 'sale-change' as const, title: '3. SALE変更', description: '20%→30% 数字だけピンポイント' },
    { type: 'color-change' as const, title: '4. 色替え', description: '質感はそのまま色だけ変更' },
    { type: 'object-removal' as const, title: '5. 不要物削除', description: '背景も自然に復元' },
    { type: 'purchase' as const, title: '6. 購入', description: '成功時のみ消費でお得感' }
  ];

  return (
    <div className="min-h-screen bg-[color:var(--color-jz-surface)]">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="jz-glass-effect border-b border-[color:var(--color-jz-border)]">
          <div className="flex items-center pt-[44px] px-[var(--space-16)] pb-[var(--space-16)]">
            <JZButton
              tone="tertiary"
              size="md"
              onClick={() => onNavigate('settings')}
              className="mr-[var(--space-12)]"
            >
              ← 戻る
            </JZButton>
            <h1 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)]">
              スクリーンショット
            </h1>
          </div>
        </div>
      </div>

      <div className="pt-[140px] pb-[var(--space-24)] px-[var(--space-16)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-[var(--space-32)]">
            <h2 className="jz-font-display jz-text-display-large text-[color:var(--color-jz-text-primary)] mb-[var(--space-16)]">
              JIZAI App Store Screenshots
            </h2>
            <p className="jz-text-body text-[color:var(--color-jz-text-secondary)] mb-[var(--space-24)]">
              6つのスクリーンショット用画面 - SwiftUI実装準備完了
            </p>

            {/* Size Toggle */}
            <div className="flex justify-center gap-[var(--space-12)] mb-[var(--space-32)]">
              <JZButton
                tone={screenshotMode.size === '6.7' ? 'primary' : 'secondary'}
                onClick={() => setScreenshotMode({ ...screenshotMode, size: '6.7' })}
              >
                iPhone 6.7"
              </JZButton>
              <JZButton
                tone={screenshotMode.size === '5.5' ? 'primary' : 'secondary'}
                onClick={() => setScreenshotMode({ ...screenshotMode, size: '5.5' })}
              >
                iPhone 5.5"
              </JZButton>
              <JZButton
                tone="secondary"
                onClick={() => onNavigate('design-tokens')}
              >
                Design Tokens
              </JZButton>
            </div>
          </div>

          {/* Large Preview */}
          <div className="flex justify-center mb-[var(--space-32)]">
            <div className="bg-[color:var(--color-jz-card)] p-[var(--space-24)] rounded-[--radius-jz-preview] border border-[color:var(--color-jz-border)] jz-shadow-card">
              <div className="text-center mb-[var(--space-24)]">
                <h3 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)] mb-[var(--space-8)]">
                  {screenshots.find(s => s.type === screenshotMode.type)?.title}
                </h3>
                <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
                  {screenshotMode.size}" iPhone | JZSurface背景統一 | 十分な余白確保
                </p>
              </div>
              
              <AppStoreScreenshot 
                screenSize={screenshotMode.size} 
                type={screenshotMode.type}
              />
            </div>
          </div>

          {/* Screenshot Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-[var(--space-16)]">
            {screenshots.map((screenshot) => (
              <div
                key={screenshot.type}
                className={`bg-[color:var(--color-jz-card)] border border-[color:var(--color-jz-border)] rounded-[--radius-jz-card] p-[var(--space-16)] cursor-pointer transition-all hover:scale-105 ${
                  screenshotMode.type === screenshot.type 
                    ? 'border-[color:var(--color-jz-accent)] bg-[color:var(--color-jz-accent)]/10' 
                    : 'hover:border-[color:var(--color-jz-accent)]/50'
                }`}
                onClick={() => setScreenshotMode({ ...screenshotMode, type: screenshot.type })}
              >
                <div className="text-center">
                  <h4 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-[var(--space-8)]">
                    {screenshot.title}
                  </h4>
                  <p className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
                    {screenshot.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
