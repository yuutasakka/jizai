# 長期愛用システム - 実装ガイド

## はじめに

本ガイドでは、JIZAI写真アプリの長期愛用システムの実装方法について詳しく説明します。このシステムは心理学的な設計原則に基づいており、ユーザーが自然に継続利用したくなる体験を提供します。

## プロジェクト構成

```
src/
├── types/
│   └── long-term-engagement.ts          # 型定義
├── utils/
│   ├── long-term-engagement-constants.ts # 定数定義
│   └── long-term-engagement-helpers.ts   # ヘルパー関数
├── contexts/
│   ├── PersonalizationContext.tsx        # 個人化システム
│   ├── MemorialIntelligenceContext.tsx   # 記念日インテリジェンス
│   ├── GrowthAchievementContext.tsx      # 成長実感システム
│   ├── FamilyBondingContext.tsx          # 家族絆機能
│   └── ZenModeContext.tsx               # UI状態管理（既存）
├── components/
│   ├── screens/
│   │   ├── long-term-engagement-screen.tsx # メインダッシュボード
│   │   └── memorial-photo-screen.tsx      # 記念写真スクリーン
│   └── enhancement/
│       └── SeasonalAudioVisual.tsx       # 音響視覚強化
└── docs/
    ├── LONG_TERM_ENGAGEMENT_ARCHITECTURE.md # アーキテクチャ
    ├── LONG_TERM_ENGAGEMENT_API.md          # API仕様
    └── IMPLEMENTATION_GUIDE.md              # このファイル
```

## セットアップ手順

### 1. 依存関係の確認

必要な依存関係がpackage.jsonに含まれていることを確認してください。

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0"
  }
}
```

### 2. 型定義のインポート

```typescript
// 新しいコンポーネントファイルの先頭
import { 
  PersonalityProfile, 
  SkillMetrics, 
  Achievement,
  FamilyMember,
  PhotoAnalysis 
} from '../types/long-term-engagement';
```

### 3. ContextProvider の設定

App.tsx で適切な順序でプロバイダーを配置：

```typescript
// App.tsx
import { PersonalizationProvider } from './contexts/PersonalizationContext';
import { MemorialIntelligenceProvider } from './contexts/MemorialIntelligenceContext';
import { GrowthAchievementProvider } from './contexts/GrowthAchievementContext';
import { FamilyBondingProvider } from './contexts/FamilyBondingContext';

function App() {
  return (
    <PersonalizationProvider>
      <MemorialIntelligenceProvider>
        <GrowthAchievementProvider>
          <FamilyBondingProvider>
            <ZenModeProvider>
              {/* 既存のアプリケーション */}
            </ZenModeProvider>
          </FamilyBondingProvider>
        </GrowthAchievementProvider>
      </MemorialIntelligenceProvider>
    </PersonalizationProvider>
  );
}
```

## 実装パターン

### 1. 新しい機能の追加

#### Step 1: 型定義の追加

```typescript
// types/long-term-engagement.ts に追加
export interface NewFeature {
  id: string;
  name: string;
  settings: {
    enabled: boolean;
    priority: number;
  };
}
```

#### Step 2: Context の拡張

```typescript
// contexts/適切なContext.tsx を更新
interface ExtendedContextType {
  // 既存のプロパティ...
  newFeature: NewFeature | null;
  
  // 新しいメソッド
  enableNewFeature: (settings: NewFeature['settings']) => Promise<void>;
  disableNewFeature: () => Promise<void>;
}
```

#### Step 3: UI コンポーネントの作成

```typescript
// components/NewFeatureComponent.tsx
import React from 'react';
import { useExtendedContext } from '../contexts/ExtendedContext';

export const NewFeatureComponent: React.FC = () => {
  const { newFeature, enableNewFeature } = useExtendedContext();
  
  const handleEnable = async () => {
    await enableNewFeature({
      enabled: true,
      priority: 1
    });
  };
  
  return (
    <div className="new-feature">
      <h3>新機能</h3>
      {!newFeature?.settings.enabled && (
        <button onClick={handleEnable}>
          機能を有効にする
        </button>
      )}
    </div>
  );
};
```

### 2. データ永続化の実装

#### IndexedDB との連携

```typescript
// utils/storage.ts
import { saveToIndexedDB, loadFromIndexedDB } from '../utils/long-term-engagement-helpers';

export const persistFeatureData = async (featureId: string, data: any) => {
  try {
    await saveToIndexedDB('features', { id: featureId, ...data });
    console.log(`機能 ${featureId} のデータを保存しました`);
  } catch (error) {
    console.error('データ保存エラー:', error);
    // ローカルストレージへのフォールバック
    localStorage.setItem(`feature_${featureId}`, JSON.stringify(data));
  }
};

export const loadFeatureData = async <T>(featureId: string): Promise<T | null> => {
  try {
    return await loadFromIndexedDB<T>('features', featureId);
  } catch (error) {
    console.error('データ読み込みエラー:', error);
    // ローカルストレージからのフォールバック
    const fallbackData = localStorage.getItem(`feature_${featureId}`);
    return fallbackData ? JSON.parse(fallbackData) : null;
  }
};
```

### 3. イベント駆動アーキテクチャ

#### Context 間のイベント通信

```typescript
// hooks/useEngagementEvents.ts
import { createContext, useContext, useCallback } from 'react';

type EventListener<T = any> = (data: T) => void;

interface EventBusContextType {
  subscribe: <T>(event: string, listener: EventListener<T>) => void;
  unsubscribe: <T>(event: string, listener: EventListener<T>) => void;
  emit: <T>(event: string, data: T) => void;
}

const EventBusContext = createContext<EventBusContextType | null>(null);

export const EventBusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const listeners = useRef(new Map<string, EventListener[]>());
  
  const subscribe = useCallback(<T,>(event: string, listener: EventListener<T>) => {
    if (!listeners.current.has(event)) {
      listeners.current.set(event, []);
    }
    listeners.current.get(event)!.push(listener);
  }, []);
  
  const unsubscribe = useCallback(<T,>(event: string, listener: EventListener<T>) => {
    const eventListeners = listeners.current.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }, []);
  
  const emit = useCallback(<T,>(event: string, data: T) => {
    const eventListeners = listeners.current.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(data));
    }
  }, []);
  
  return (
    <EventBusContext.Provider value={{ subscribe, unsubscribe, emit }}>
      {children}
    </EventBusContext.Provider>
  );
};

export const useEngagementEvents = () => {
  const context = useContext(EventBusContext);
  if (!context) {
    throw new Error('useEngagementEvents must be used within EventBusProvider');
  }
  return context;
};
```

## 心理学的設計の実装

### 1. 漸進的コミット (Progressive Commitment)

```typescript
// components/ProgressiveOnboarding.tsx
export const ProgressiveOnboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const { recordAction } = useGrowthAchievement();
  
  const onboardingSteps = [
    {
      title: "最初の写真をアップロード",
      description: "簡単な操作から始めましょう",
      action: "upload",
      reward: "初回編集ボーナス！"
    },
    {
      title: "色調整を試してみる",
      description: "写真をより美しく仕上げましょう",
      action: "color_edit",
      reward: "色彩センスが向上しました！"
    },
    {
      title: "家族と共有",
      description: "大切な人と思い出をシェア",
      action: "family_share",
      reward: "家族の絆が深まります"
    }
  ];
  
  const handleStepComplete = async (action: string) => {
    await recordAction(action, 1.0); // 完璧な完了
    setStep(step + 1);
    
    // 即座のポジティブフィードバック
    toast.success(onboardingSteps[step - 1].reward);
  };
  
  return (
    <div className="progressive-onboarding">
      {step <= onboardingSteps.length && (
        <OnboardingStep 
          step={onboardingSteps[step - 1]}
          onComplete={handleStepComplete}
        />
      )}
    </div>
  );
};
```

### 2. 見えない成長 (Invisible Progress)

```typescript
// hooks/useInvisibleProgress.ts
export const useInvisibleProgress = () => {
  const { skillMetrics, recordAction } = useGrowthAchievement();
  const [lastNotificationTime, setLastNotificationTime] = useState<Date | null>(null);
  
  // 非侵入的なスキル追跡
  const trackInvisibleAction = useCallback(async (
    element: HTMLElement,
    actionType: string
  ) => {
    const startTime = Date.now();
    
    // DOM イベントから品質を推測
    const trackQuality = () => {
      const duration = Date.now() - startTime;
      const quality = Math.min(1, Math.max(0.1, 1 - (duration - 1000) / 10000));
      return quality;
    };
    
    // 要素の blur 時にスキル記録
    element.addEventListener('blur', () => {
      recordAction(actionType, trackQuality());
    }, { once: true });
    
  }, [recordAction]);
  
  // 控えめな成長通知
  const showSubtleProgress = useCallback((skillName: string, improvement: number) => {
    const now = new Date();
    
    // 通知頻度を制限（5分に1回まで）
    if (lastNotificationTime && 
        now.getTime() - lastNotificationTime.getTime() < 5 * 60 * 1000) {
      return;
    }
    
    // 改善が顕著な場合のみ通知
    if (improvement > 0.05) {
      toast.info(`${skillName}が少し向上しました ✨`, {
        position: 'bottom-right',
        duration: 2000,
        className: 'subtle-progress-toast'
      });
      setLastNotificationTime(now);
    }
  }, [lastNotificationTime]);
  
  return { trackInvisibleAction, showSubtleProgress };
};
```

### 3. 文化的共鳴 (Cultural Resonance)

```typescript
// components/CulturalContextualizer.tsx
export const CulturalContextualizer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getCurrentSeason, isSpecialCulturalPeriod } = useMemorialIntelligence();
  const currentSeason = getCurrentSeason();
  const culturalEvent = isSpecialCulturalPeriod();
  
  // 季節に応じたスタイル適用
  const seasonalStyle = {
    '--primary-color': JAPANESE_SEASONS[currentSeason].colors[0],
    '--secondary-color': JAPANESE_SEASONS[currentSeason].colors[1],
    '--accent-color': JAPANESE_SEASONS[currentSeason].colors[2],
  } as React.CSSProperties;
  
  return (
    <div 
      className={`cultural-context season-${currentSeason}`}
      style={seasonalStyle}
      data-cultural-event={culturalEvent?.name || ''}
    >
      {culturalEvent && (
        <div className="cultural-event-banner">
          <span className="event-emoji">{culturalEvent.type === 'festival' ? '🎉' : '🙏'}</span>
          <span className="event-text">{culturalEvent.name}の時期ですね</span>
        </div>
      )}
      {children}
    </div>
  );
};
```

### 4. 社会的証明 (Social Proof)

```typescript
// components/SocialProofIndicators.tsx
export const SocialProofIndicators: React.FC<{ photoId: string }> = ({ photoId }) => {
  const { sharedPhotos, familyMembers } = useFamilyBonding();
  const sharedPhoto = sharedPhotos.find(p => p.originalPhotoId === photoId);
  
  if (!sharedPhoto || sharedPhoto.reactions.length === 0) return null;
  
  const reactionCounts = sharedPhoto.reactions.reduce((acc, reaction) => {
    acc[reaction.type] = (acc[reaction.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topReactions = Object.entries(reactionCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);
  
  return (
    <div className="social-proof-indicators">
      <div className="reaction-summary">
        {topReactions.map(([emoji, count]) => (
          <span key={emoji} className="reaction-indicator">
            {emoji} {count}
          </span>
        ))}
      </div>
      
      <div className="family-engagement">
        <small>
          {familyMembers.length > 1 
            ? `家族${familyMembers.length}人がこの写真を見ています`
            : '家族と共有中'
          }
        </small>
      </div>
      
      {sharedPhoto.comments.length > 0 && (
        <div className="recent-comment">
          <small>
            💬 最新: "{sharedPhoto.comments[sharedPhoto.comments.length - 1].text.substring(0, 20)}..."
          </small>
        </div>
      )}
    </div>
  );
};
```

## パフォーマンス最適化

### 1. 遅延初期化

```typescript
// contexts/OptimizedProvider.tsx
export const OptimizedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [data, setData] = useState(null);
  
  // 必要時のみ初期化
  const initializeWhenNeeded = useCallback(async () => {
    if (!isInitialized) {
      const loadedData = await loadFromIndexedDB('engagement-data', 'main');
      setData(loadedData || getDefaultData());
      setIsInitialized(true);
    }
  }, [isInitialized]);
  
  // Intersection Observer を使用した遅延初期化
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          initializeWhenNeeded();
        }
      });
    });
    
    const trigger = document.querySelector('#engagement-trigger');
    if (trigger) {
      observer.observe(trigger);
    }
    
    return () => observer.disconnect();
  }, [initializeWhenNeeded]);
  
  return (
    <EngagementContext.Provider value={{ data, isInitialized }}>
      {children}
    </EngagementContext.Provider>
  );
};
```

### 2. メモ化とキャッシュ

```typescript
// hooks/useOptimizedSkills.ts
export const useOptimizedSkills = () => {
  const { skillMetrics, progressHistory } = useGrowthAchievement();
  
  // 重い計算結果をメモ化
  const skillAnalysis = useMemo(() => {
    return {
      totalScore: calculateOverallSkillScore(skillMetrics),
      improvementRate: calculateImprovementRate(progressHistory),
      predictedAchievements: predictUpcomingAchievements(skillMetrics)
    };
  }, [skillMetrics, progressHistory]);
  
  // キャッシュ付きのスキル予測
  const skillPredictionCache = useRef(new Map());
  
  const predictSkillGrowth = useCallback((days: number) => {
    const cacheKey = `${JSON.stringify(skillMetrics)}-${days}`;
    
    if (skillPredictionCache.current.has(cacheKey)) {
      return skillPredictionCache.current.get(cacheKey);
    }
    
    const prediction = calculateSkillPrediction(skillMetrics, progressHistory, days);
    skillPredictionCache.current.set(cacheKey, prediction);
    
    // キャッシュサイズ制限
    if (skillPredictionCache.current.size > 50) {
      const firstKey = skillPredictionCache.current.keys().next().value;
      skillPredictionCache.current.delete(firstKey);
    }
    
    return prediction;
  }, [skillMetrics, progressHistory]);
  
  return { skillAnalysis, predictSkillGrowth };
};
```

## テスト戦略

### 1. 単体テストの作成

```typescript
// __tests__/GrowthAchievementContext.test.tsx
import { renderHook, act } from '@testing-library/react';
import { GrowthAchievementProvider, useGrowthAchievement } from '../contexts/GrowthAchievementContext';

describe('GrowthAchievementContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GrowthAchievementProvider>{children}</GrowthAchievementProvider>
  );
  
  test('初期スキル値が正しく設定される', () => {
    const { result } = renderHook(() => useGrowthAchievement(), { wrapper });
    
    expect(result.current.skillMetrics.editing_speed).toBe(0.1);
    expect(result.current.skillMetrics.composition_quality).toBe(0.2);
  });
  
  test('アクション記録でスキルが向上する', async () => {
    const { result } = renderHook(() => useGrowthAchievement(), { wrapper });
    
    const initialSpeed = result.current.skillMetrics.editing_speed;
    
    await act(async () => {
      await result.current.recordAction('edit', 0.8);
    });
    
    expect(result.current.skillMetrics.editing_speed).toBeGreaterThan(initialSpeed);
  });
  
  test('実績解除の閾値チェック', async () => {
    const { result } = renderHook(() => useGrowthAchievement(), { wrapper });
    
    // スキルを閾値まで上げる
    for (let i = 0; i < 20; i++) {
      await act(async () => {
        await result.current.recordAction('edit', 0.9);
      });
    }
    
    const speedLearnerUnlocked = result.current.unlockedAchievements.includes('speed-learner');
    expect(speedLearnerUnlocked).toBe(true);
  });
});
```

### 2. 統合テストの実装

```typescript
// __tests__/EngagementFlowIntegration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EngagementTestWrapper } from '../test-utils/EngagementTestWrapper';
import { PhotoUploadFlow } from '../components/PhotoUploadFlow';

describe('写真アップロード完全フロー', () => {
  test('写真アップロードから家族共有まで', async () => {
    const user = userEvent.setup();
    
    render(
      <EngagementTestWrapper>
        <PhotoUploadFlow />
      </EngagementTestWrapper>
    );
    
    // 写真ファイルをアップロード
    const fileInput = screen.getByLabelText(/写真を選択/);
    const testFile = new File(['test image'], 'test.jpg', { type: 'image/jpeg' });
    
    await user.upload(fileInput, testFile);
    
    // 写真分析の完了を待つ
    await waitFor(() => {
      expect(screen.getByText(/記念度/)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // スキル向上の通知確認
    await waitFor(() => {
      expect(screen.getByText(/スキルが向上/)).toBeInTheDocument();
    });
    
    // 家族共有ボタンのクリック
    const shareButton = screen.getByRole('button', { name: /家族と共有/ });
    await user.click(shareButton);
    
    // 共有完了の確認
    await waitFor(() => {
      expect(screen.getByText(/家族と共有されました/)).toBeInTheDocument();
    });
  });
});
```

## デバッグとモニタリング

### 1. 開発用デバッグツール

```typescript
// utils/debug-tools.ts
export const EngagementDebugger = {
  // スキル状態の可視化
  logSkillState: (skillMetrics: SkillMetrics) => {
    console.group('🎯 Skill Metrics');
    Object.entries(skillMetrics).forEach(([skill, value]) => {
      const level = calculateSkillLevel(value);
      const bar = '█'.repeat(Math.floor(value * 20)) + '░'.repeat(20 - Math.floor(value * 20));
      console.log(`${skill}: ${bar} ${(value * 100).toFixed(1)}% (${level})`);
    });
    console.groupEnd();
  },
  
  // 実績進捗の確認
  logAchievementProgress: (achievements: Achievement[], skillMetrics: SkillMetrics, stats: any) => {
    console.group('🏆 Achievement Progress');
    achievements.forEach(achievement => {
      const progress = calculateAchievementProgress(achievement, skillMetrics, stats.totalActions, stats.currentStreak, stats.daysActive);
      const progressBar = '█'.repeat(Math.floor(progress * 10)) + '░'.repeat(10 - Math.floor(progress * 10));
      console.log(`${achievement.title}: ${progressBar} ${(progress * 100).toFixed(1)}%`);
    });
    console.groupEnd();
  },
  
  // データ整合性チェック
  validateDataIntegrity: (data: any) => {
    const issues = [];
    
    if (!validateEngagementData(data)) {
      issues.push('基本データ構造が無効');
    }
    
    // 追加のバリデーション...
    
    if (issues.length > 0) {
      console.warn('⚠️ Data Integrity Issues:', issues);
    } else {
      console.log('✅ Data integrity check passed');
    }
  }
};

// 開発環境でのデバッグUI
export const DebugPanel: React.FC = () => {
  const { skillMetrics } = useGrowthAchievement();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Ctrl+Shift+D でデバッグパネル表示
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
        setIsVisible(!isVisible);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);
  
  if (!isVisible || process.env.NODE_ENV === 'production') return null;
  
  return (
    <div className="debug-panel">
      <h3>🛠️ Debug Panel</h3>
      <button onClick={() => EngagementDebugger.logSkillState(skillMetrics)}>
        Log Skills
      </button>
      {/* 他のデバッグ機能... */}
    </div>
  );
};
```

### 2. パフォーマンス監視

```typescript
// hooks/usePerformanceMonitor.ts
export const usePerformanceMonitor = () => {
  const performanceRef = useRef({
    renderCount: 0,
    lastRenderTime: performance.now(),
    averageRenderTime: 0
  });
  
  useEffect(() => {
    performanceRef.current.renderCount++;
    const currentTime = performance.now();
    const renderTime = currentTime - performanceRef.current.lastRenderTime;
    
    performanceRef.current.averageRenderTime = 
      (performanceRef.current.averageRenderTime * (performanceRef.current.renderCount - 1) + renderTime) / 
      performanceRef.current.renderCount;
    
    performanceRef.current.lastRenderTime = currentTime;
    
    // 異常に遅いレンダリングを警告
    if (renderTime > 16) { // 60fps を下回る場合
      console.warn(`🐌 Slow render detected: ${renderTime.toFixed(2)}ms`);
    }
  });
  
  return {
    getPerformanceMetrics: () => performanceRef.current,
    logPerformance: () => {
      const metrics = performanceRef.current;
      console.log(`📊 Render Performance: ${metrics.renderCount} renders, avg: ${metrics.averageRenderTime.toFixed(2)}ms`);
    }
  };
};
```

## デプロイメント

### 1. ビルド最適化

```typescript
// vite.config.ts での最適化設定
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'engagement': [
            './src/contexts/PersonalizationContext.tsx',
            './src/contexts/MemorialIntelligenceContext.tsx',
            './src/contexts/GrowthAchievementContext.tsx',
            './src/contexts/FamilyBondingContext.tsx'
          ],
          'engagement-utils': [
            './src/utils/long-term-engagement-helpers.ts',
            './src/utils/long-term-engagement-constants.ts'
          ]
        }
      }
    }
  }
});
```

### 2. 環境設定

```typescript
// 環境固有の設定
const getEngagementConfig = () => {
  const env = process.env.NODE_ENV;
  
  const baseConfig = {
    enableAnalytics: false,
    debugMode: false,
    persistenceEnabled: true
  };
  
  switch (env) {
    case 'development':
      return {
        ...baseConfig,
        debugMode: true,
        enableAnalytics: false
      };
    case 'production':
      return {
        ...baseConfig,
        enableAnalytics: true,
        debugMode: false
      };
    default:
      return baseConfig;
  }
};
```

## トラブルシューティング

### よくある問題と解決方法

1. **IndexedDB が利用できない場合**
   - localStorage への自動フォールバック
   - 機能の制限された状態での動作継続

2. **メモリリークの防止**
   - useEffect の適切なクリーンアップ
   - イベントリスナーの解除
   - タイマーの停止

3. **パフォーマンス問題**
   - 重い計算の React.memo 化
   - 不要な re-render の防止
   - バックグラウンド処理の実装

4. **データ整合性の問題**
   - バリデーション関数の使用
   - エラー境界コンポーネントの実装
   - 自動修復機能

このガイドに従って実装することで、心理学的に効果的な長期愛用システムを構築できます。