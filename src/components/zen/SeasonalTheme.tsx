import React, { useEffect, useState, useMemo } from 'react';
import { useZenMode } from '../../contexts/ZenModeContext';

// Types for seasonal theming
interface SeasonalColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  gradient: string;
  overlay: string;
}

interface CulturalEvent {
  date: string;
  name: string;
  greeting: string;
  colors?: Partial<SeasonalColors>;
  symbolEmoji: string;
  description: string;
}

interface SeasonalTheme {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  colors: SeasonalColors;
  backgroundPattern: string;
  culturalEvents: CulturalEvent[];
  greetingMessages: string[];
  seasonalSymbols: string[];
  timeOfDayAdjustments: {
    morning: Partial<SeasonalColors>;
    afternoon: Partial<SeasonalColors>;
    evening: Partial<SeasonalColors>;
    night: Partial<SeasonalColors>;
  };
}

// Seasonal themes configuration
const SEASONAL_THEMES: Record<string, SeasonalTheme> = {
  spring: {
    season: 'spring',
    colors: {
      primary: '#ff6b9d', // 桜ピンク
      secondary: '#c4e4ff', // 空の青
      accent: '#ff8c94', // 薄桜色
      background: '#fefefe', // 清らかな白
      surface: '#fef9f9', // ほんのり桜色
      text: {
        primary: '#2d3748',
        secondary: '#4a5568',
        tertiary: '#718096'
      },
      gradient: 'linear-gradient(135deg, #ff6b9d 0%, #c4e4ff 100%)',
      overlay: 'rgba(255, 107, 157, 0.1)'
    },
    backgroundPattern: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ff6b9d' fill-opacity='0.05'%3E%3Cpath d='M20 20c0 2.76-2.24 5-5 5s-5-2.24-5-5 2.24-5 5-5 5 2.24 5 5zm10 0c0 2.76-2.24 5-5 5s-5-2.24-5-5 2.24-5 5-5 5 2.24 5 5z'/%3E%3C/g%3E%3C/svg%3E")`,
    culturalEvents: [
      {
        date: '03-21',
        name: '春分の日',
        greeting: '春の陽気と共に、心温まるお写真作りをお手伝いいたします。新しい季節の始まりを大切な思い出と共に。',
        symbolEmoji: '🌸',
        description: '昼と夜の長さが等しくなる、バランスの取れた特別な日'
      },
      {
        date: '04-08',
        name: '花祭り（灌仏会）',
        greeting: 'お釈迦様の誕生をお祝いする花祭りの日。美しい花々のように、お写真も華やかに仕上げさせていただきます。',
        symbolEmoji: '🏛️',
        description: 'お釈迦様の誕生を祝う仏教の大切な行事'
      },
      {
        date: '05-05',
        name: 'こどもの日',
        greeting: '子どもたちの健やかな成長を願う日。家族の絆を感じるお写真作りをお手伝いいたします。',
        symbolEmoji: '🎏',
        description: '子どもの人格を重んじ、健やかな成長を願う国民の祝日'
      }
    ],
    greetingMessages: [
      '桜咲く季節、新たな始まりと共にお写真を美しく仕上げます。',
      '春風に包まれるような優しい仕上がりをお届けいたします。',
      '花々が微笑むように、お写真も輝かしく生まれ変わります。',
      '新緑の生命力を感じる、清々しいお写真をお作りいたします。'
    ],
    seasonalSymbols: ['🌸', '🌱', '🦋', '🌿', '🌼'],
    timeOfDayAdjustments: {
      morning: { accent: '#ffb3c1' },
      afternoon: { accent: '#ff8c94' },
      evening: { accent: '#ff6b80' },
      night: { accent: '#e55a7a', overlay: 'rgba(229, 90, 122, 0.1)' }
    }
  },

  summer: {
    season: 'summer',
    colors: {
      primary: '#4ecdc4', // 青緑
      secondary: '#ffe66d', // 夏の日差し
      accent: '#ff6b6b', // 夏祭りの赤
      background: '#fafafa',
      surface: '#f7fdfc', // 涼やかな白
      text: {
        primary: '#2d3748',
        secondary: '#4a5568', 
        tertiary: '#718096'
      },
      gradient: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
      overlay: 'rgba(78, 205, 196, 0.1)'
    },
    backgroundPattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234ecdc4' fill-opacity='0.08'%3E%3Cpath d='m30 60 30-30-30-30L0 30l30 30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    culturalEvents: [
      {
        date: '07-07',
        name: '七夕',
        greeting: '織姫と彦星のように、大切な思い出を永遠に結ぶお写真を作らせていただきます。願いを込めた美しい仕上がりを。',
        symbolEmoji: '🎋',
        description: '年に一度の星の逢瀬を祝う、ロマンチックな夏の行事'
      },
      {
        date: '08-15',
        name: 'お盆',
        greeting: 'ご先祖様をお迎えする大切な時期。心を込めて、思い出のお写真を美しく仕上げさせていただきます。',
        symbolEmoji: '🏮',
        description: 'ご先祖様の霊をお迎えし、供養する仏教行事'
      }
    ],
    greetingMessages: [
      '夏の青空のように爽やかなお写真をお届けいたします。',
      '涼風を感じる、心地よい仕上がりをお約束いたします。',
      '夏祭りの提灯のように、温かな光に包まれたお写真を。',
      '海の輝きのような美しさを、お写真に込めてお作りいたします。'
    ],
    seasonalSymbols: ['🌻', '🍉', '🎐', '⛱️', '🌊'],
    timeOfDayAdjustments: {
      morning: { accent: '#5ed3ca' },
      afternoon: { accent: '#4ecdc4' },
      evening: { accent: '#44a08d' },
      night: { accent: '#38897d', overlay: 'rgba(56, 137, 125, 0.1)' }
    }
  },

  autumn: {
    season: 'autumn',
    colors: {
      primary: '#d2691e', // 山吹色
      secondary: '#cd853f', // ペルー色
      accent: '#dc143c', // 深紅
      background: '#fefbf5',
      surface: '#fdf9f0', // 温かみのある白
      text: {
        primary: '#3c2415',
        secondary: '#5a3a24',
        tertiary: '#8b6f47'
      },
      gradient: 'linear-gradient(135deg, #d2691e 0%, #cd853f 100%)',
      overlay: 'rgba(210, 105, 30, 0.1)'
    },
    backgroundPattern: `url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d2691e' fill-opacity='0.06'%3E%3Cpath d='M25 0l10 20-10 5-10-5L25 0zM0 25l20-10 5 10-5 10L0 25zm50 0l-20 10-5-10 5-10L50 25zM25 50l-10-20 10-5 10 5-10 20z'/%3E%3C/g%3E%3C/svg%3E")`,
    culturalEvents: [
      {
        date: '09-23',
        name: '秋分の日',
        greeting: '実りの季節に感謝し、思い出のお写真も美しく実らせましょう。深い情緒を込めた仕上がりを目指します。',
        symbolEmoji: '🍂',
        description: '昼と夜の長さが等しくなる、収穫への感謝の日'
      },
      {
        date: '11-15',
        name: '七五三',
        greeting: 'お子様の健やかな成長への祈りと共に、この大切な瞬間を美しく永遠に残します。',
        symbolEmoji: '👘',
        description: '子どもの成長を祝う、日本の美しい伝統行事'
      },
      {
        date: '11-23',
        name: '勤労感謝の日',
        greeting: '日々の努力への感謝と共に、心を込めてお写真をお作りいたします。',
        symbolEmoji: '🙏',
        description: '勤労を尊び、生産を祝い、国民が互いに感謝する日'
      }
    ],
    greetingMessages: [
      '紅葉の美しさのように、温かみのあるお写真をお届けします。',
      '実りの季節にふさわしい、豊かな表情のお写真を。',
      '秋の夕日のような優しい光に包まれた仕上がりを。',
      '深まる秋の情緒を感じる、心に響くお写真をお作りいたします。'
    ],
    seasonalSymbols: ['🍁', '🌰', '🍄', '🦔', '🌾'],
    timeOfDayAdjustments: {
      morning: { accent: '#e8831e' },
      afternoon: { accent: '#d2691e' },
      evening: { accent: '#b8530f' },
      night: { accent: '#a0450c', overlay: 'rgba(160, 69, 12, 0.1)' }
    }
  },

  winter: {
    season: 'winter',
    colors: {
      primary: '#4a90e2', // 冬の空色
      secondary: '#e6f3ff', // 雪の白
      accent: '#2c5aa0', // 深い青
      background: '#fafbfc',
      surface: '#f8fafc', // 静寂の白
      text: {
        primary: '#1a202c',
        secondary: '#2d3748',
        tertiary: '#4a5568'
      },
      gradient: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
      overlay: 'rgba(74, 144, 226, 0.1)'
    },
    backgroundPattern: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%234a90e2' fill-opacity='0.05'%3E%3Cpath d='M15 0l7.5 7.5L30 0v30l-7.5-7.5L15 30 7.5 22.5 0 30V0l7.5 7.5L15 0z'/%3E%3C/g%3E%3C/svg%3E")`,
    culturalEvents: [
      {
        date: '01-01',
        name: '元旦',
        greeting: '新年あけましておめでとうございます。新たな一年の始まりに、心を込めて美しいお写真をお作りいたします。',
        symbolEmoji: '🎍',
        description: '新しい年の始まりを祝う、最も大切な国民の祝日'
      },
      {
        date: '12-31',
        name: '大晦日',
        greeting: '一年間お疲れさまでした。年末の大切な時期に、思い出深いお写真を心を込めて仕上げさせていただきます。',
        symbolEmoji: '🔔',
        description: '一年を振り返り、新年への準備をする意義深い日'
      }
    ],
    greetingMessages: [
      '雪景色のような清らかで美しいお写真をお届けします。',
      '静寂の中にある温もりを感じるお写真を。',
      '冬の星座のように輝く、特別な仕上がりを目指します。',
      '心温まる冬の陽だまりのような、優しいお写真をお作りいたします。'
    ],
    seasonalSymbols: ['❄️', '⛄', '🎿', '🔥', '🌲'],
    timeOfDayAdjustments: {
      morning: { accent: '#5aa3f0' },
      afternoon: { accent: '#4a90e2' },
      evening: { accent: '#357abd' },
      night: { accent: '#1e4a73', overlay: 'rgba(30, 74, 115, 0.1)' }
    }
  }
};

// Buddhist and Shinto calendar integration
const RELIGIOUS_EVENTS: CulturalEvent[] = [
  {
    date: '02-03',
    name: '節分',
    greeting: '邪気を払い福を招く節分の日。新たな気持ちでお写真作りをお手伝いいたします。',
    symbolEmoji: '👹',
    description: '季節の変わり目に邪気を払い、福を呼び込む行事'
  },
  {
    date: '03-21',
    name: '春彼岸（中日）',
    greeting: 'ご先祖様への感謝の気持ちを込めて、心を込めてお写真をお作りいたします。',
    symbolEmoji: '🙏',
    description: '先祖を供養し、感謝の気持ちを捧げる仏教の大切な期間'
  },
  {
    date: '09-23',
    name: '秋彼岸（中日）',
    greeting: '秋の彼岸、ご先祖様への思いと共に、大切なお写真を美しく仕上げます。',
    symbolEmoji: '🕯️',
    description: '先祖を供養し、自らの生き方を見つめ直す期間'
  }
];

// Time-of-day greeting functions
const getTimeOfDayGreeting = (season: string): string => {
  const hour = new Date().getHours();
  const greetings = SEASONAL_THEMES[season]?.greetingMessages || [];
  
  if (hour >= 5 && hour < 10) {
    // 朝
    return `おはようございます。${greetings[0] || '清々しい朝に、美しいお写真作りを始めましょう。'}`;
  } else if (hour >= 10 && hour < 17) {
    // 昼
    return `こんにちは。${greetings[1] || '穏やかな昼下がりに、心を込めてお写真をお作りいたします。'}`;
  } else if (hour >= 17 && hour < 21) {
    // 夕方
    return `こんばんは。${greetings[2] || '夕暮れ時の美しさを、お写真にも込めてお届けいたします。'}`;
  } else {
    // 夜
    return `おそくまでありがとうございます。${greetings[3] || '静かな夜に、大切なお写真を丁寧にお作りいたします。'}`;
  }
};

// Main Seasonal Theme Component
interface SeasonalThemeProps {
  children: React.ReactNode;
}

export const SeasonalTheme: React.FC<SeasonalThemeProps> = ({ children }) => {
  const { state } = useZenMode();
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');
  
  // Determine current time of day
  useEffect(() => {
    const updateTimeOfDay = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setCurrentTimeOfDay('morning');
      else if (hour >= 12 && hour < 17) setCurrentTimeOfDay('afternoon');
      else if (hour >= 17 && hour < 21) setCurrentTimeOfDay('evening');
      else setCurrentTimeOfDay('night');
    };

    updateTimeOfDay();
    const interval = setInterval(updateTimeOfDay, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  // Get current theme
  const currentTheme = useMemo(() => {
    const baseTheme = SEASONAL_THEMES[state.delightState.seasonalTheme];
    if (!baseTheme) return SEASONAL_THEMES.spring;

    // Apply time-of-day adjustments
    const timeAdjustments = baseTheme.timeOfDayAdjustments[currentTimeOfDay];
    
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        ...timeAdjustments
      }
    };
  }, [state.delightState.seasonalTheme, currentTimeOfDay]);

  // Check for cultural events today
  const todayCulturalEvent = useMemo(() => {
    const today = new Date();
    const todayString = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    return [...currentTheme.culturalEvents, ...RELIGIOUS_EVENTS].find(event => 
      event.date === todayString
    );
  }, [currentTheme.culturalEvents]);

  // Apply theme to CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    const { colors } = currentTheme;
    
    root.style.setProperty('--jz-seasonal-primary', colors.primary);
    root.style.setProperty('--jz-seasonal-secondary', colors.secondary);
    root.style.setProperty('--jz-seasonal-accent', colors.accent);
    root.style.setProperty('--jz-seasonal-background', colors.background);
    root.style.setProperty('--jz-seasonal-surface', colors.surface);
    root.style.setProperty('--jz-seasonal-text-primary', colors.text.primary);
    root.style.setProperty('--jz-seasonal-text-secondary', colors.text.secondary);
    root.style.setProperty('--jz-seasonal-text-tertiary', colors.text.tertiary);
    root.style.setProperty('--jz-seasonal-gradient', colors.gradient);
    root.style.setProperty('--jz-seasonal-overlay', colors.overlay);
    root.style.setProperty('--jz-seasonal-pattern', currentTheme.backgroundPattern);
  }, [currentTheme]);

  return (
    <div className="seasonal-theme-container relative min-h-screen">
      {/* Seasonal background */}
      <div 
        className="fixed inset-0 z-0 opacity-30"
        style={{
          backgroundImage: currentTheme.backgroundPattern,
          backgroundSize: '60px 60px'
        }}
      />
      
      {/* Cultural event notification */}
      {todayCulturalEvent && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 max-w-md">
          <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{todayCulturalEvent.symbolEmoji}</span>
              <div>
                <div className="font-semibold text-sm text-gray-800">
                  {todayCulturalEvent.name}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {todayCulturalEvent.description}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seasonal accent elements */}
      <div className="fixed top-8 right-8 z-30 text-2xl opacity-20">
        {currentTheme.seasonalSymbols.map((symbol, index) => (
          <span 
            key={index} 
            className="inline-block animate-pulse mx-1"
            style={{ 
              animationDelay: `${index * 0.5}s`,
              animationDuration: '3s'
            }}
          >
            {symbol}
          </span>
        ))}
      </div>

      {/* Main content with seasonal overlay */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Subtle seasonal overlay */}
      <div 
        className="fixed inset-0 z-5 pointer-events-none"
        style={{
          background: currentTheme.colors.overlay,
          mixBlendMode: 'soft-light'
        }}
      />
    </div>
  );
};

// Hook to get current seasonal context
export const useSeasonalContext = () => {
  const { state } = useZenMode();
  const currentTheme = SEASONAL_THEMES[state.delightState.seasonalTheme];
  
  const getSeasonalGreeting = () => {
    return getTimeOfDayGreeting(state.delightState.seasonalTheme);
  };

  const getTodaysCulturalEvent = () => {
    const today = new Date();
    const todayString = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    return [...(currentTheme?.culturalEvents || []), ...RELIGIOUS_EVENTS].find(event => 
      event.date === todayString
    );
  };

  const getSeasonalSymbol = () => {
    if (!currentTheme) return '🌸';
    return currentTheme.seasonalSymbols[Math.floor(Math.random() * currentTheme.seasonalSymbols.length)];
  };

  return {
    currentTheme,
    getSeasonalGreeting,
    getTodaysCulturalEvent,
    getSeasonalSymbol,
    season: state.delightState.seasonalTheme
  };
};

export default SeasonalTheme;