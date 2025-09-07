import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useZenMode } from '../../contexts/ZenModeContext';

// Types for Delight Layers
interface EasterEgg {
  id: string;
  name: string;
  description: string;
  triggerCondition: string;
  reward: string;
  rarity: 'common' | 'rare' | 'legendary';
  animation: string;
  message: string;
  unlockSound?: string;
}

interface DelightAnimation {
  type: 'sakura' | 'sparkles' | 'hearts' | 'lanterns' | 'snow';
  intensity: 'gentle' | 'moderate' | 'celebration';
  duration: number;
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
}

// Easter Eggs Database
const EASTER_EGGS: EasterEgg[] = [
  {
    id: 'first_completion',
    name: '初めての魔法',
    description: '初回完了時の特別な祝福',
    triggerCondition: 'first_memorial_completion',
    reward: 'special_sakura_animation',
    rarity: 'common',
    animation: 'gentle_sakura_fall',
    message: 'はじめての遺影作成、おつかれさまでした。きっと故人様もお喜びになられていることでしょう。',
    unlockSound: 'gentle_chime'
  },
  {
    id: 'ten_completions',
    name: '熟練の証',
    description: '10回完了達成の特別報酬',
    triggerCondition: 'ten_completions',
    reward: 'golden_sparkles',
    rarity: 'rare',
    animation: 'golden_sparkles_rain',
    message: '10件のお写真を美しく仕上げられました。お客様の思いやりに心から敬意を表します。',
    unlockSound: 'success_bells'
  },
  {
    id: 'perfect_timing',
    name: '心のタイミング',
    description: '特別な日での作成',
    triggerCondition: 'memorial_on_special_date',
    reward: 'cultural_blessing',
    rarity: 'rare',
    animation: 'cultural_lanterns',
    message: '特別な日にお写真を作成いただき、ありがとうございます。思い出の灯火が永遠に輝きますように。',
    unlockSound: 'temple_bell'
  },
  {
    id: 'midnight_devotion',
    name: '深夜の想い',
    description: '深夜の献身的な作業',
    triggerCondition: 'midnight_completion',
    reward: 'moonlight_glow',
    rarity: 'rare',
    animation: 'moonlight_sparkles',
    message: '遅い時間まで大切な方のことを想われているのですね。その愛情の深さに胸を打たれます。',
    unlockSound: 'gentle_wind_chime'
  },
  {
    id: 'season_master',
    name: '四季の守人',
    description: '全4季節での作成完了',
    triggerCondition: 'four_seasons_complete',
    reward: 'seasonal_harmony',
    rarity: 'legendary',
    animation: 'four_seasons_celebration',
    message: '春夏秋冬、すべての季節でお写真を作成されました。まさに思い出の四季を大切にされる素晴らしい心をお持ちです。',
    unlockSound: 'harmony_chimes'
  },
  {
    id: 'anniversary_surprise',
    name: '記念日の奇跡',
    description: '利用開始1年後の特別サプライズ',
    triggerCondition: 'one_year_anniversary',
    reward: 'anniversary_celebration',
    rarity: 'legendary',
    animation: 'anniversary_fireworks',
    message: 'ご利用開始から1年が経ちました。長きに渡り私たちと共に大切な思い出を育んでくださり、心より感謝申し上げます。これからも末永くお付き合いください。',
    unlockSound: 'celebration_fanfare'
  },
  {
    id: 'quick_master',
    name: '迅速な愛情',
    description: '3回連続で1分以内完了',
    triggerCondition: 'three_quick_completions',
    reward: 'efficiency_aura',
    rarity: 'rare',
    animation: 'swift_light_trails',
    message: '迅速さの中にも愛情の深さを感じます。効率的でありながら心のこもった作業を称賛いたします。',
    unlockSound: 'swift_bell'
  },
  {
    id: 'perfectionist',
    name: '完璧主義者の美学',
    description: '5回以上やり直しを使用',
    triggerCondition: 'perfectionist_behavior',
    reward: 'precision_crystals',
    rarity: 'rare',
    animation: 'crystal_formation',
    message: '細部へのこだわりが美しい結果を生み出します。完璧を求める姿勢に深く敬意を表します。',
    unlockSound: 'crystal_chime'
  }
];

// Seasonal Animations
const SEASONAL_ANIMATIONS: Record<string, DelightAnimation> = {
  spring: {
    type: 'sakura',
    intensity: 'gentle',
    duration: 8000,
    season: 'spring'
  },
  summer: {
    type: 'sparkles',
    intensity: 'moderate',
    duration: 6000,
    season: 'summer'
  },
  autumn: {
    type: 'hearts',
    intensity: 'gentle',
    duration: 7000,
    season: 'autumn'
  },
  winter: {
    type: 'snow',
    intensity: 'gentle',
    duration: 10000,
    season: 'winter'
  }
};

// Completion Messages by Level
const getCompletionMessage = (
  completionCount: number, 
  isSpecialDate: boolean, 
  behaviorPattern: any
): string => {
  if (isSpecialDate) {
    return "特別な日に心を込めて作成いただき、ありがとうございます。きっとお喜びいただけることでしょう。";
  }

  if (completionCount === 1) {
    return "初回のご利用、ありがとうございました。美しい仕上がりになりました。故人様もきっとお喜びになられていることでしょう。";
  }

  if (completionCount <= 5) {
    return "今回も美しく仕上がりました。大切な思い出を永遠に残すお手伝いができて光栄です。";
  }

  if (completionCount <= 10) {
    return "いつもご利用いただき、ありがとうございます。お客様の愛情が込められた素晴らしい作品となりました。";
  }

  if (completionCount <= 20) {
    const messages = [
      "熟練されたお客様ならではの美しい仕上がりですね。心より感謝申し上げます。",
      "継続してご利用いただき、誠にありがとうございます。今回も素晴らしい作品となりました。",
      "お客様の深い愛情を感じる仕上がりです。思い出の輝きを永遠に保てるでしょう。"
    ];
    return messages[completionCount % messages.length];
  }

  if (behaviorPattern?.quickDecisionMaker) {
    return "素早い判断力と深い愛情が生み出した素晴らしい作品です。いつも効率的にご利用いただき、ありがとうございます。";
  }

  if (behaviorPattern?.perfectionist) {
    return "細部へのこだわりが美しい結果となりました。完璧を求めるお客様の姿勢に深く敬意を表します。";
  }

  const longTermMessages = [
    "長きに渡りご愛用いただき、心より感謝申し上げます。今日もまた美しい思い出を残すお手伝いができました。",
    "お客様との長いお付き合いを大切に、今回も心を込めて仕上げさせていただきました。",
    "いつものように素晴らしい作品となりました。末永くお付き合いいただけることを光栄に思います。"
  ];

  return longTermMessages[completionCount % longTermMessages.length];
};

// Progressive Reward Messages
const getProgressiveMessage = (level: number): string => {
  const messages = [
    "これからも大切な思い出作りをお手伝いさせていただきます。", // Level 1
    "お客様の細やかなお心遣いを感じております。", // Level 2  
    "熟練されたご利用、誠にありがとうございます。", // Level 3
    "お客様の深い愛情を感じる美しい仕上がりです。", // Level 4
    "長きに渡るご愛用に心より感謝申し上げます。", // Level 5
    "お客様との絆を大切に、これからも精進してまいります。", // Level 6
    "末永くお付き合いいただけることを光栄に思います。", // Level 7
    "お客様の思い出を守る責任を感じながら、日々努力しております。", // Level 8
    "お客様との信頼関係に深く感謝し、さらなる向上を目指します。", // Level 9
    "お客様と共に歩んできた時間は、私たちの宝物です。" // Level 10+
  ];

  const index = Math.min(level - 1, messages.length - 1);
  return messages[index];
};

// Main Delight Layers Component
interface DelightLayersProps {
  onEasterEggFound?: (egg: EasterEgg) => void;
  onAnimationComplete?: () => void;
}

export const DelightLayers: React.FC<DelightLayersProps> = ({
  onEasterEggFound,
  onAnimationComplete
}) => {
  const { state, unlockEasterEgg, checkSpecialDate } = useZenMode();
  const [activeAnimation, setActiveAnimation] = useState<DelightAnimation | null>(null);
  const [showMessage, setShowMessage] = useState<string | null>(null);
  const [easterEggQueue, setEasterEggQueue] = useState<EasterEgg[]>([]);
  const animationRef = useRef<HTMLDivElement>(null);

  // Check for Easter Eggs
  const checkEasterEggs = useCallback(() => {
    const foundEggs: EasterEgg[] = [];

    EASTER_EGGS.forEach(egg => {
      if (state.delightState.easterEggsFound.includes(egg.id)) return;

      let shouldUnlock = false;

      switch (egg.triggerCondition) {
        case 'first_memorial_completion':
          shouldUnlock = state.userSkillProfile.sessionsCompleted === 1;
          break;
        case 'ten_completions':
          shouldUnlock = state.delightState.completionCount === 10;
          break;
        case 'memorial_on_special_date':
          shouldUnlock = checkSpecialDate().isSpecial;
          break;
        case 'midnight_completion':
          shouldUnlock = new Date().getHours() >= 23 || new Date().getHours() <= 2;
          break;
        case 'four_seasons_complete':
          // Check if completed in all 4 seasons (simplified logic)
          shouldUnlock = state.userSkillProfile.sessionsCompleted >= 4;
          break;
        case 'one_year_anniversary':
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          shouldUnlock = Math.abs(
            new Date(state.userSkillProfile.lastActivityDate).getTime() - 
            oneYearAgo.getTime()
          ) < 24 * 60 * 60 * 1000;
          break;
        case 'three_quick_completions':
          shouldUnlock = state.userSkillProfile.behaviorPattern.quickDecisionMaker;
          break;
        case 'perfectionist_behavior':
          shouldUnlock = state.userSkillProfile.behaviorPattern.perfectionist;
          break;
      }

      if (shouldUnlock) {
        foundEggs.push(egg);
        unlockEasterEgg(egg.id);
      }
    });

    if (foundEggs.length > 0) {
      setEasterEggQueue(prev => [...prev, ...foundEggs]);
    }
  }, [state, checkSpecialDate, unlockEasterEgg]);

  // Process Easter Egg queue
  useEffect(() => {
    if (easterEggQueue.length > 0) {
      const egg = easterEggQueue[0];
      
      // Show animation
      const animation = getEasterEggAnimation(egg);
      setActiveAnimation(animation);
      
      // Show message
      setTimeout(() => {
        setShowMessage(egg.message);
      }, 1000);
      
      // Notify parent
      onEasterEggFound?.(egg);
      
      // Clean up
      setTimeout(() => {
        setActiveAnimation(null);
        setShowMessage(null);
        setEasterEggQueue(prev => prev.slice(1));
        onAnimationComplete?.();
      }, animation.duration + 2000);
    }
  }, [easterEggQueue, onEasterEggFound, onAnimationComplete]);

  // Helper function to get Easter Egg animation
  const getEasterEggAnimation = (egg: EasterEgg): DelightAnimation => {
    switch (egg.animation) {
      case 'gentle_sakura_fall':
        return { type: 'sakura', intensity: 'gentle', duration: 8000 };
      case 'golden_sparkles_rain':
        return { type: 'sparkles', intensity: 'celebration', duration: 6000 };
      case 'cultural_lanterns':
        return { type: 'lanterns', intensity: 'moderate', duration: 8000 };
      case 'moonlight_sparkles':
        return { type: 'sparkles', intensity: 'gentle', duration: 10000 };
      case 'four_seasons_celebration':
        return { type: 'sparkles', intensity: 'celebration', duration: 12000 };
      case 'anniversary_fireworks':
        return { type: 'sparkles', intensity: 'celebration', duration: 15000 };
      case 'swift_light_trails':
        return { type: 'sparkles', intensity: 'moderate', duration: 4000 };
      case 'crystal_formation':
        return { type: 'sparkles', intensity: 'gentle', duration: 6000 };
      default:
        return { type: 'sparkles', intensity: 'gentle', duration: 5000 };
    }
  };

  // Trigger seasonal animation
  const triggerSeasonalAnimation = useCallback(() => {
    const seasonalAnim = SEASONAL_ANIMATIONS[state.delightState.seasonalTheme];
    if (seasonalAnim) {
      setActiveAnimation(seasonalAnim);
      
      setTimeout(() => {
        setActiveAnimation(null);
      }, seasonalAnim.duration);
    }
  }, [state.delightState.seasonalTheme]);

  // Check for completion rewards
  useEffect(() => {
    if (state.currentSession?.isComplete) {
      checkEasterEggs();
      
      // Show completion message
      const { isSpecial } = checkSpecialDate();
      const message = getCompletionMessage(
        state.delightState.completionCount,
        isSpecial,
        state.userSkillProfile.behaviorPattern
      );
      
      setTimeout(() => {
        setShowMessage(message);
        setTimeout(() => setShowMessage(null), 5000);
      }, 2000);
    }
  }, [state.currentSession?.isComplete, checkEasterEggs, checkSpecialDate, state.delightState.completionCount, state.userSkillProfile.behaviorPattern]);

  // Render animation layers
  const renderAnimation = () => {
    if (!activeAnimation) return null;

    const { type, intensity } = activeAnimation;
    
    const getAnimationClass = () => {
      const base = `delight-animation delight-${type}`;
      const intensityClass = `delight-${intensity}`;
      return `${base} ${intensityClass}`;
    };

    return (
      <div 
        ref={animationRef}
        className={`fixed inset-0 pointer-events-none z-50 ${getAnimationClass()}`}
      >
        {type === 'sakura' && renderSakuraAnimation()}
        {type === 'sparkles' && renderSparklesAnimation()}
        {type === 'hearts' && renderHeartsAnimation()}
        {type === 'lanterns' && renderLanternsAnimation()}
        {type === 'snow' && renderSnowAnimation()}
      </div>
    );
  };

  const renderSakuraAnimation = () => (
    <div className="sakura-container">
      {Array.from({ length: activeAnimation?.intensity === 'celebration' ? 20 : 8 }).map((_, i) => (
        <div
          key={i}
          className="sakura-petal"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${8 + Math.random() * 4}s`
          }}
        >
          🌸
        </div>
      ))}
    </div>
  );

  const renderSparklesAnimation = () => (
    <div className="sparkles-container">
      {Array.from({ length: activeAnimation?.intensity === 'celebration' ? 30 : 15 }).map((_, i) => (
        <div
          key={i}
          className="sparkle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            fontSize: `${12 + Math.random() * 8}px`
          }}
        >
          ✨
        </div>
      ))}
    </div>
  );

  const renderHeartsAnimation = () => (
    <div className="hearts-container">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="heart"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 6}s`
          }}
        >
          💖
        </div>
      ))}
    </div>
  );

  const renderLanternsAnimation = () => (
    <div className="lanterns-container">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="lantern"
          style={{
            left: `${20 + i * 12}%`,
            animationDelay: `${i * 0.5}s`
          }}
        >
          🏮
        </div>
      ))}
    </div>
  );

  const renderSnowAnimation = () => (
    <div className="snow-container">
      {Array.from({ length: 25 }).map((_, i) => (
        <div
          key={i}
          className="snowflake"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${10 + Math.random() * 5}s`
          }}
        >
          ❄️
        </div>
      ))}
    </div>
  );

  return (
    <>
      {renderAnimation()}
      
      {/* Message overlay */}
      {showMessage && (
        <div className="fixed inset-0 flex items-center justify-center z-60 pointer-events-none">
          <div className="bg-[color:var(--color-jz-card)] border border-[color:var(--color-jz-border)] rounded-lg p-6 max-w-md mx-4 shadow-xl backdrop-blur-sm">
            <p className="jz-text-body text-center text-[color:var(--color-jz-text-primary)] leading-relaxed">
              {showMessage}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

// CSS-in-JS styles for animations
const delightStyles = `
  @keyframes sakura-fall {
    0% {
      transform: translateY(-10vh) translateX(0) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(110vh) translateX(-20px) rotate(360deg);
      opacity: 0;
    }
  }
  
  @keyframes sparkle-twinkle {
    0%, 100% { opacity: 0; transform: scale(0); }
    50% { opacity: 1; transform: scale(1); }
  }
  
  @keyframes heart-float {
    0% {
      transform: translateY(100vh) translateX(0) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(-10vh) translateX(-10px) rotate(15deg);
      opacity: 0;
    }
  }
  
  @keyframes lantern-sway {
    0%, 100% { transform: translateX(0) rotate(0deg); }
    50% { transform: translateX(10px) rotate(2deg); }
  }
  
  @keyframes snow-fall {
    0% {
      transform: translateY(-10vh) translateX(0);
      opacity: 1;
    }
    100% {
      transform: translateY(110vh) translateX(-15px);
      opacity: 0;
    }
  }
  
  .sakura-petal {
    position: absolute;
    animation: sakura-fall linear infinite;
    font-size: 20px;
    user-select: none;
  }
  
  .sparkle {
    position: absolute;
    animation: sparkle-twinkle 2s ease-in-out infinite;
    color: #ffd700;
    user-select: none;
  }
  
  .heart {
    position: absolute;
    animation: heart-float linear infinite;
    font-size: 16px;
    animation-duration: 8s;
    user-select: none;
  }
  
  .lantern {
    position: absolute;
    top: 10%;
    animation: lantern-sway 3s ease-in-out infinite;
    font-size: 24px;
    user-select: none;
  }
  
  .snowflake {
    position: absolute;
    animation: snow-fall linear infinite;
    font-size: 14px;
    user-select: none;
  }
  
  .delight-gentle .sakura-petal {
    animation-duration: 12s;
  }
  
  .delight-celebration .sakura-petal {
    animation-duration: 8s;
  }
  
  .delight-celebration .sparkle {
    animation-duration: 1.5s;
    color: #ff6b6b;
  }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.querySelector('#delight-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'delight-styles';
  styleSheet.textContent = delightStyles;
  document.head.appendChild(styleSheet);
}

export default DelightLayers;