import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Memorial Intelligence Types
interface PhotoAnalysis {
  id: string;
  fileName: string;
  dateCreated: Date;
  locationMetadata?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  emotionalContext?: {
    lifeStage: 'youth' | 'adult' | 'elderly';
    settingType: 'formal' | 'casual' | 'celebration' | 'ceremony';
    estimatedYear?: number;
  };
  memorialSignificance: number; // 0-1 score
}

interface MemorialDate {
  id: string;
  type: 'monthly_memorial' | 'annual_memorial' | 'seasonal_reflection' | 'birthday' | 'anniversary';
  date: Date;
  title: string;
  description: string;
  photoIds: string[];
  isActive: boolean;
  reminderSettings: {
    daysBeforeReminder: number;
    timeOfDay: 'morning' | 'afternoon' | 'evening';
    tone: 'gentle' | 'warm' | 'respectful';
  };
}

interface MemorialSuggestion {
  id: string;
  type: 'photo_creation' | 'gallery_review' | 'seasonal_reflection' | 'family_sharing';
  title: string;
  description: string;
  actionText: string;
  urgency: 'low' | 'medium' | 'high';
  availableUntil?: Date;
  relatedPhotoIds?: string[];
}

interface SeasonalReflection {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  theme: string;
  suggestedActivities: string[];
  backgroundMood: {
    colorPalette: string[];
    ambientSound?: string;
    visualEffects: string[];
  };
}

interface MemorialIntelligenceState {
  // Photo Analysis
  analyzedPhotos: Map<string, PhotoAnalysis>;
  
  // Memorial Dates
  memorialDates: MemorialDate[];
  upcomingReminders: MemorialDate[];
  
  // Suggestions
  activeSuggestions: MemorialSuggestion[];
  dismissedSuggestions: Set<string>;
  
  // Seasonal Context
  currentSeasonalReflection: SeasonalReflection | null;
  lastSeasonalUpdate: Date | null;
  
  // Intelligence Learning
  userPreferences: {
    preferredReminderTiming: 'morning' | 'afternoon' | 'evening';
    reminderFrequency: 'frequent' | 'moderate' | 'minimal';
    emotionalSensitivity: 'high' | 'medium' | 'low';
    culturalBackground: 'japanese' | 'international' | 'mixed';
  };
  
  // Engagement Tracking
  memorialEngagementHistory: {
    date: Date;
    actionType: 'photo_created' | 'reminder_acknowledged' | 'reflection_participated' | 'family_shared';
    emotionalResponse?: 'positive' | 'neutral' | 'overwhelmed';
  }[];
}

interface MemorialIntelligenceActions {
  // Photo Analysis
  analyzePhoto: (file: File, metadata?: any) => Promise<PhotoAnalysis>;
  updatePhotoAnalysis: (photoId: string, updates: Partial<PhotoAnalysis>) => void;
  
  // Memorial Dates
  createMemorialDate: (date: MemorialDate) => void;
  updateMemorialDate: (dateId: string, updates: Partial<MemorialDate>) => void;
  getUpcomingReminders: (daysAhead?: number) => MemorialDate[];
  
  // Suggestions
  generateIntelligentSuggestions: () => void;
  dismissSuggestion: (suggestionId: string) => void;
  actOnSuggestion: (suggestionId: string) => void;
  
  // Seasonal Reflections
  updateSeasonalReflection: () => void;
  participateInSeasonalReflection: (activity: string) => void;
  
  // Learning & Personalization
  recordEngagement: (actionType: string, emotionalResponse?: string) => void;
  updateUserPreferences: (preferences: Partial<MemorialIntelligenceState['userPreferences']>) => void;
  
  // Intelligence Engine
  processPhotoForMemorialDates: (analysis: PhotoAnalysis) => MemorialDate[];
  calculateMemorialSignificance: (photoMetadata: any) => number;
  generateGentleReminder: (memorialDate: MemorialDate) => string;
}

type MemorialIntelligenceContextType = MemorialIntelligenceState & MemorialIntelligenceActions;

const defaultSeasonalReflections: Record<string, SeasonalReflection> = {
  spring: {
    season: 'spring',
    theme: '新しい始まりと思い出の芽吹き',
    suggestedActivities: [
      '桜の写真と共に故人を偲ぶ',
      '春の陽だまりで思い出話',
      '新芽のような希望を見つける'
    ],
    backgroundMood: {
      colorPalette: ['#FFE5E5', '#F0F8FF', '#E8F5E8'],
      ambientSound: 'gentle_breeze',
      visualEffects: ['sakura_petals', 'soft_light']
    }
  },
  summer: {
    season: 'summer',
    theme: '生命力と共に過ごした夏の記憶',
    suggestedActivities: [
      '夏祭りの思い出を振り返る',
      '青空と共に明るい記憶を',
      '生命の輝きを感じる時間'
    ],
    backgroundMood: {
      colorPalette: ['#E6F3FF', '#FFF8E1', '#E8F8F5'],
      ambientSound: 'summer_cicadas',
      visualEffects: ['sunlight_rays', 'gentle_waves']
    }
  },
  autumn: {
    season: 'autumn',
    theme: '実りの季節と深まる感謝',
    suggestedActivities: [
      '紅葉と共に人生の美しさを',
      '収穫の喜びを故人と分かち合う',
      '静寂の中で心を整える'
    ],
    backgroundMood: {
      colorPalette: ['#FFF3E0', '#F3E5F5', '#FFF8E1'],
      ambientSound: 'autumn_leaves',
      visualEffects: ['falling_leaves', 'warm_glow']
    }
  },
  winter: {
    season: 'winter',
    theme: '静寂の中の温かな思い出',
    suggestedActivities: [
      '雪景色に心を重ねて',
      '暖かな室内での思い出語り',
      '一年の感謝を込めて'
    ],
    backgroundMood: {
      colorPalette: ['#F5F5F5', '#E3F2FD', '#FFF'],
      ambientSound: 'gentle_snow',
      visualEffects: ['snowflakes', 'warm_light']
    }
  }
};

const MemorialIntelligenceContext = createContext<MemorialIntelligenceContextType | null>(null);

export const useMemorialIntelligence = () => {
  const context = useContext(MemorialIntelligenceContext);
  if (!context) {
    throw new Error('useMemorialIntelligence must be used within a MemorialIntelligenceProvider');
  }
  return context;
};

interface MemorialIntelligenceProviderProps {
  children: React.ReactNode;
}

export const MemorialIntelligenceProvider: React.FC<MemorialIntelligenceProviderProps> = ({ children }) => {
  // State Management
  const [state, setState] = useState<MemorialIntelligenceState>({
    analyzedPhotos: new Map(),
    memorialDates: [],
    upcomingReminders: [],
    activeSuggestions: [],
    dismissedSuggestions: new Set(),
    currentSeasonalReflection: null,
    lastSeasonalUpdate: null,
    userPreferences: {
      preferredReminderTiming: 'afternoon',
      reminderFrequency: 'moderate',
      emotionalSensitivity: 'high',
      culturalBackground: 'japanese'
    },
    memorialEngagementHistory: []
  });

  // Photo Analysis Engine
  const analyzePhoto = useCallback(async (file: File, metadata?: any): Promise<PhotoAnalysis> => {
    // Simulate advanced photo analysis
    const analysis: PhotoAnalysis = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileName: file.name,
      dateCreated: metadata?.dateCreated || new Date(file.lastModified),
      memorialSignificance: 0.7 // Base significance
    };

    // Analyze EXIF data and file properties
    if (metadata?.exif) {
      analysis.locationMetadata = {
        latitude: metadata.exif.latitude,
        longitude: metadata.exif.longitude,
        address: metadata.exif.address
      };
      
      // Enhance significance based on location context
      if (metadata.exif.address?.includes('cemetery') || metadata.exif.address?.includes('temple')) {
        analysis.memorialSignificance = Math.min(1.0, analysis.memorialSignificance + 0.2);
      }
    }

    // Emotional context analysis (simulated AI)
    const fileName = file.name.toLowerCase();
    if (fileName.includes('formal') || fileName.includes('portrait')) {
      analysis.emotionalContext = {
        lifeStage: 'adult',
        settingType: 'formal',
        estimatedYear: metadata?.year || new Date().getFullYear()
      };
      analysis.memorialSignificance = Math.min(1.0, analysis.memorialSignificance + 0.1);
    } else if (fileName.includes('celebration') || fileName.includes('party')) {
      analysis.emotionalContext = {
        lifeStage: 'adult',
        settingType: 'celebration',
        estimatedYear: metadata?.year || new Date().getFullYear()
      };
    }

    // Store analysis
    setState(prev => ({
      ...prev,
      analyzedPhotos: new Map(prev.analyzedPhotos).set(analysis.id, analysis)
    }));

    return analysis;
  }, []);

  // Memorial Date Generation
  const processPhotoForMemorialDates = useCallback((analysis: PhotoAnalysis): MemorialDate[] => {
    const memorialDates: MemorialDate[] = [];
    const photoDate = analysis.dateCreated;

    // Generate monthly memorial (月命日)
    if (analysis.memorialSignificance > 0.6) {
      memorialDates.push({
        id: `monthly_${analysis.id}`,
        type: 'monthly_memorial',
        date: new Date(photoDate.getFullYear(), photoDate.getMonth(), photoDate.getDate()),
        title: '月命日',
        description: 'やさしい思い出の日',
        photoIds: [analysis.id],
        isActive: true,
        reminderSettings: {
          daysBeforeReminder: 1,
          timeOfDay: state.userPreferences.preferredReminderTiming,
          tone: 'gentle'
        }
      });

      // Annual memorial (年忌)
      memorialDates.push({
        id: `annual_${analysis.id}`,
        type: 'annual_memorial',
        date: new Date(photoDate.getFullYear() + 1, photoDate.getMonth(), photoDate.getDate()),
        title: '一年忌',
        description: '大切な記念の日',
        photoIds: [analysis.id],
        isActive: true,
        reminderSettings: {
          daysBeforeReminder: 7,
          timeOfDay: 'morning',
          tone: 'respectful'
        }
      });
    }

    return memorialDates;
  }, [state.userPreferences]);

  // Intelligent Suggestion Generation
  const generateIntelligentSuggestions = useCallback(() => {
    const suggestions: MemorialSuggestion[] = [];
    const now = new Date();
    const recentPhotos = Array.from(state.analyzedPhotos.values())
      .filter(photo => now.getTime() - photo.dateCreated.getTime() < 30 * 24 * 60 * 60 * 1000); // Last 30 days

    // Seasonal reflection suggestions
    const currentSeason = getCurrentSeason();
    if (!state.currentSeasonalReflection || state.currentSeasonalReflection.season !== currentSeason) {
      suggestions.push({
        id: `seasonal_${currentSeason}`,
        type: 'seasonal_reflection',
        title: `${getSeasonalEmoji(currentSeason)} ${getSeasonalTitle(currentSeason)}`,
        description: '季節の移り変わりと共に、大切な思い出を振り返りませんか？',
        actionText: '季節の振り返りを始める',
        urgency: 'medium'
      });
    }

    // Photo creation suggestions
    if (recentPhotos.length === 0) {
      suggestions.push({
        id: 'photo_creation_encouragement',
        type: 'photo_creation',
        title: '新しい思い出の写真を',
        description: '最近、新しい遺影を作成していませんね。大切な方の思い出を形にしませんか？',
        actionText: '写真を選んで始める',
        urgency: 'low'
      });
    }

    // Gallery review suggestions
    if (state.analyzedPhotos.size > 5) {
      const oldPhotos = Array.from(state.analyzedPhotos.values())
        .filter(photo => now.getTime() - photo.dateCreated.getTime() > 90 * 24 * 60 * 60 * 1000); // Over 90 days
      
      if (oldPhotos.length > 0) {
        suggestions.push({
          id: 'gallery_review_suggestion',
          type: 'gallery_review',
          title: '過去の作品を振り返る',
          description: '以前に作成された美しい遺影があります。改めて見直してみませんか？',
          actionText: 'ギャラリーを見る',
          urgency: 'low',
          relatedPhotoIds: oldPhotos.slice(0, 3).map(p => p.id)
        });
      }
    }

    // Filter out dismissed suggestions
    const filteredSuggestions = suggestions.filter(s => !state.dismissedSuggestions.has(s.id));

    setState(prev => ({
      ...prev,
      activeSuggestions: filteredSuggestions
    }));
  }, [state.analyzedPhotos, state.dismissedSuggestions, state.currentSeasonalReflection]);

  // Seasonal Update Engine
  const updateSeasonalReflection = useCallback(() => {
    const currentSeason = getCurrentSeason();
    const reflection = defaultSeasonalReflections[currentSeason];
    
    setState(prev => ({
      ...prev,
      currentSeasonalReflection: reflection,
      lastSeasonalUpdate: new Date()
    }));
  }, []);

  // Engagement Recording
  const recordEngagement = useCallback((actionType: string, emotionalResponse?: string) => {
    setState(prev => ({
      ...prev,
      memorialEngagementHistory: [
        ...prev.memorialEngagementHistory,
        {
          date: new Date(),
          actionType: actionType as any,
          emotionalResponse: emotionalResponse as any
        }
      ].slice(-50) // Keep last 50 entries
    }));
  }, []);

  // Helper Functions
  const getCurrentSeason = (): 'spring' | 'summer' | 'autumn' | 'winter' => {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  };

  const getSeasonalEmoji = (season: string): string => {
    const emojis = {
      spring: '🌸',
      summer: '🌞',
      autumn: '🍁',
      winter: '❄️'
    };
    return emojis[season as keyof typeof emojis] || '🌸';
  };

  const getSeasonalTitle = (season: string): string => {
    const titles = {
      spring: '春の思い出',
      summer: '夏の記憶',
      autumn: '秋の感謝',
      winter: '冬の静寂'
    };
    return titles[season as keyof typeof titles] || '季節の思い出';
  };

  // Initialize seasonal reflection on mount
  useEffect(() => {
    if (!state.currentSeasonalReflection) {
      updateSeasonalReflection();
    }
  }, [state.currentSeasonalReflection, updateSeasonalReflection]);

  // Generate suggestions periodically
  useEffect(() => {
    const interval = setInterval(generateIntelligentSuggestions, 10 * 60 * 1000); // Every 10 minutes
    generateIntelligentSuggestions(); // Initial generation
    return () => clearInterval(interval);
  }, [generateIntelligentSuggestions]);

  // Action Implementations
  const actions: MemorialIntelligenceActions = {
    analyzePhoto,
    updatePhotoAnalysis: (photoId, updates) => {
      setState(prev => {
        const newMap = new Map(prev.analyzedPhotos);
        const existing = newMap.get(photoId);
        if (existing) {
          newMap.set(photoId, { ...existing, ...updates });
        }
        return { ...prev, analyzedPhotos: newMap };
      });
    },
    createMemorialDate: (date) => {
      setState(prev => ({
        ...prev,
        memorialDates: [...prev.memorialDates, date]
      }));
    },
    updateMemorialDate: (dateId, updates) => {
      setState(prev => ({
        ...prev,
        memorialDates: prev.memorialDates.map(date => 
          date.id === dateId ? { ...date, ...updates } : date
        )
      }));
    },
    getUpcomingReminders: (daysAhead = 7) => {
      const now = new Date();
      const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
      
      return state.memorialDates.filter(date => 
        date.isActive && date.date >= now && date.date <= future
      );
    },
    generateIntelligentSuggestions,
    dismissSuggestion: (suggestionId) => {
      setState(prev => ({
        ...prev,
        dismissedSuggestions: new Set([...prev.dismissedSuggestions, suggestionId]),
        activeSuggestions: prev.activeSuggestions.filter(s => s.id !== suggestionId)
      }));
    },
    actOnSuggestion: (suggestionId) => {
      const suggestion = state.activeSuggestions.find(s => s.id === suggestionId);
      if (suggestion) {
        recordEngagement('suggestion_acted', 'positive');
        // Remove from active suggestions after acting
        setState(prev => ({
          ...prev,
          activeSuggestions: prev.activeSuggestions.filter(s => s.id !== suggestionId)
        }));
      }
    },
    updateSeasonalReflection,
    participateInSeasonalReflection: (activity) => {
      recordEngagement('reflection_participated', 'positive');
    },
    recordEngagement,
    updateUserPreferences: (preferences) => {
      setState(prev => ({
        ...prev,
        userPreferences: { ...prev.userPreferences, ...preferences }
      }));
    },
    processPhotoForMemorialDates,
    calculateMemorialSignificance: (photoMetadata) => {
      let significance = 0.5; // Base score
      
      // Enhance based on metadata
      if (photoMetadata.isPortrait) significance += 0.2;
      if (photoMetadata.isFormal) significance += 0.1;
      if (photoMetadata.hasLocation) significance += 0.1;
      if (photoMetadata.emotionalContext) significance += 0.1;
      
      return Math.min(1.0, significance);
    },
    generateGentleReminder: (memorialDate) => {
      const messages = {
        gentle: [
          'やさしい思い出の時間です',
          '大切な方を偲ぶひとときを',
          '心静かに思い出を辿って'
        ],
        warm: [
          '温かな記憶と共に',
          '愛しい思い出を胸に',
          '美しい時間を振り返って'
        ],
        respectful: [
          '深い感謝を込めて',
          '厳かな気持ちで',
          '敬意を持って偲んで'
        ]
      };
      
      const toneMessages = messages[memorialDate.reminderSettings.tone];
      return toneMessages[Math.floor(Math.random() * toneMessages.length)];
    }
  };

  return (
    <MemorialIntelligenceContext.Provider value={{ ...state, ...actions }}>
      {children}
    </MemorialIntelligenceContext.Provider>
  );
};