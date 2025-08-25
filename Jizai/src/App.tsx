import React, { useState } from 'react';
import { JizaiOnboardingScreen } from './components/screens/jizai-onboarding-screen';
import { JizaiHomeScreen } from './components/screens/jizai-home-screen';
import { JizaiProgressScreen } from './components/screens/jizai-progress-screen';
import { ResultsScreen } from './components/screens/results-screen';
import { PurchaseScreen } from './components/screens/purchase-screen';
import { SettingsScreen } from './components/screens/settings-screen';
import { TutorialExamplesScreen } from './components/screens/tutorial-examples-screen';
import { UserGalleryScreen } from './components/screens/user-gallery-screen';
import { AppStoreScreenshot } from './components/screenshots/app-store-screenshots';
import { DesignSystemReference } from './components/design-tokens/design-system-reference';
import { JZButton } from './components/design-system/jizai-button';
import { JZPhotoIcon, JZCreditCardIcon, JZSettingsIcon } from './components/design-system/jizai-icons';

type Screen = 'onboarding' | 'home' | 'progress' | 'results' | 'purchase' | 'settings' | 'tutorial-examples' | 'screenshots' | 'design-tokens' | 'user-gallery';

interface ExampleData {
  title: string;
  promptEn: string;
  description: string;
  thumbnailImage?: string;
  beforeImage?: string;
  afterImage?: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [selectedExample, setSelectedExample] = useState<ExampleData | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
    setCurrentScreen('home');
  };

  const handleOnboardingSkip = () => {
    setHasCompletedOnboarding(true);
    setCurrentScreen('home');
  };

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
    if (!hasCompletedOnboarding && currentScreen === 'onboarding') {
      return (
        <JizaiOnboardingScreen 
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      );
    }

    switch (currentScreen) {
      case 'onboarding':
        return (
          <JizaiOnboardingScreen 
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
          />
        );
      case 'home':
        return <JizaiHomeScreen onNavigate={setCurrentScreen} selectedExample={selectedExample} onClearExample={handleClearExample} />;
      case 'progress':
        return <JizaiProgressScreen onNavigate={setCurrentScreen} />;
      case 'results':
        return <ResultsScreen onNavigate={setCurrentScreen} />;
      case 'purchase':
        return <PurchaseScreen onNavigate={setCurrentScreen} />;
      case 'settings':
        return <SettingsScreen onNavigate={setCurrentScreen} />;
      case 'tutorial-examples':
        return <TutorialExamplesScreen onNavigate={setCurrentScreen} onExampleSelected={handleExampleSelected} />;
      case 'user-gallery':
        return <UserGalleryScreen onNavigate={setCurrentScreen} />;
      case 'design-tokens':
        return <DesignSystemReference />;
      case 'screenshots':
        return <ScreenshotGallery onNavigate={setCurrentScreen} />;
      default:
        return <JizaiHomeScreen onNavigate={setCurrentScreen} />;
    }
  };

  const showBottomNavigation = hasCompletedOnboarding && ['home', 'purchase', 'settings'].includes(currentScreen);

  return (
    <div className="min-h-screen bg-[color:var(--color-jz-surface)]">
      {/* Main Content */}
      <div className={`${showBottomNavigation ? 'pb-[140px]' : ''} ${isTransitioning ? 'transition-all duration-300 ease-in-out transform scale-95 opacity-90' : 'transition-all duration-300 ease-in-out transform scale-100 opacity-100'}`}>
        {renderScreen()}
      </div>

      {/* Bottom Navigation */}
      {showBottomNavigation && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="jz-glass-effect border-t border-[color:var(--color-jz-border)]">
            <div className="flex justify-around items-center py-[var(--space-16)] px-[var(--space-16)]">
              <JZButton
                tone="tertiary"
                className={`flex flex-col items-center gap-[var(--space-8)] min-h-[56px] px-[var(--space-12)] ${
                  currentScreen === 'home' 
                    ? 'text-[color:var(--color-jz-accent)]' 
                    : 'text-[color:var(--color-jz-text-tertiary)]'
                }`}
                onClick={() => setCurrentScreen('home')}
              >
                <JZPhotoIcon size={20} />
                <span className="jz-text-caption">ホーム</span>
              </JZButton>
              
              <JZButton
                tone="tertiary"
                className={`flex flex-col items-center gap-[var(--space-8)] min-h-[56px] px-[var(--space-12)] ${
                  currentScreen === 'purchase' 
                    ? 'text-[color:var(--color-jz-accent)]' 
                    : 'text-[color:var(--color-jz-text-tertiary)]'
                } hover:text-[color:var(--color-jz-text-secondary)]`}
                onClick={() => setCurrentScreen('purchase')}
              >
                <JZCreditCardIcon size={20} />
                <span className="jz-text-caption">買う</span>
              </JZButton>
              
              <JZButton
                tone="tertiary"
                className={`flex flex-col items-center gap-[var(--space-8)] min-h-[56px] px-[var(--space-12)] ${
                  currentScreen === 'settings' 
                    ? 'text-[color:var(--color-jz-accent)]' 
                    : 'text-[color:var(--color-jz-text-tertiary)]'
                } hover:text-[color:var(--color-jz-text-secondary)]`}
                onClick={() => setCurrentScreen('settings')}
              >
                <JZSettingsIcon size={20} />
                <span className="jz-text-caption">設定</span>
              </JZButton>
            </div>
          </div>
        </div>
      )}
    </div>
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