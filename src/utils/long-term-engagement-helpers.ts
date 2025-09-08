/**
 * 長期愛用システム - ヘルパー関数
 * Helper functions for Long-term User Engagement System
 */

import { 
  Season, 
  SkillMetrics, 
  PersonalityProfile,
  Achievement,
  AudioTrack,
  CulturalEvent,
  BehaviorPattern
} from '../types/long-term-engagement';
import { 
  JAPANESE_SEASONS, 
  SKILL_DEVELOPMENT, 
  PERSONALITY_WEIGHTS,
  ACHIEVEMENTS,
  AUDIO_TRACKS,
  CULTURAL_EVENTS,
  PROGRESS_MESSAGES
} from './long-term-engagement-constants';

// ===============================
// Season and Time Utilities
// ===============================

/**
 * 現在の季節を取得
 */
export const getCurrentSeason = (): Season => {
  const month = new Date().getMonth() + 1; // 0-based to 1-based
  
  if (JAPANESE_SEASONS.spring.months.includes(month)) return 'spring';
  if (JAPANESE_SEASONS.summer.months.includes(month)) return 'summer';
  if (JAPANESE_SEASONS.autumn.months.includes(month)) return 'autumn';
  return 'winter';
};

/**
 * 季節に応じた絵文字を取得
 */
export const getSeasonalEmoji = (season: Season): string => {
  return JAPANESE_SEASONS[season].emoji;
};

/**
 * 季節の色パレットを取得
 */
export const getSeasonalColors = (season: Season): string[] => {
  return JAPANESE_SEASONS[season].colors;
};

/**
 * 現在の時間帯を取得
 */
export const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

/**
 * 文化的な時期かどうかを判定
 */
export const isSpecialCulturalPeriod = (date: Date = new Date()): CulturalEvent | null => {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  return CULTURAL_EVENTS.find(event => {
    const eventDate = new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate());
    const timeDiff = Math.abs(today.getTime() - eventDate.getTime());
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // イベントの前後3日以内を特別期間とする
    return dayDiff <= 3;
  }) || null;
};

// ===============================
// Skill Calculation Utilities
// ===============================

/**
 * スキルレベルを計算
 */
export const calculateSkillLevel = (value: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' => {
  if (value >= SKILL_DEVELOPMENT.THRESHOLDS.EXPERT) return 'expert';
  if (value >= SKILL_DEVELOPMENT.THRESHOLDS.ADVANCED) return 'advanced';
  if (value >= SKILL_DEVELOPMENT.THRESHOLDS.INTERMEDIATE) return 'intermediate';
  return 'beginner';
};

/**
 * スキルの総合スコアを計算
 */
export const calculateOverallSkillScore = (metrics: SkillMetrics): number => {
  const weights = {
    editing_speed: 0.15,
    composition_quality: 0.25,
    color_harmony: 0.20,
    emotional_expression: 0.25,
    technical_precision: 0.10,
    consistency: 0.05
  };
  
  return Object.entries(weights).reduce((total, [key, weight]) => {
    return total + (metrics[key as keyof SkillMetrics] * weight);
  }, 0);
};

/**
 * スキル改善を適用
 */
export const applySkillImprovement = (
  currentMetrics: SkillMetrics, 
  actionType: string,
  quality: number = 0.5
): SkillMetrics => {
  const improvement = { ...currentMetrics };
  
  // アクションタイプに応じた改善
  switch (actionType) {
    case 'edit':
      improvement.editing_speed = Math.min(1, improvement.editing_speed + SKILL_DEVELOPMENT.IMPROVEMENT_RATES.editing_speed * quality);
      improvement.technical_precision = Math.min(1, improvement.technical_precision + SKILL_DEVELOPMENT.IMPROVEMENT_RATES.technical_precision * quality);
      break;
    case 'composition':
      improvement.composition_quality = Math.min(1, improvement.composition_quality + SKILL_DEVELOPMENT.IMPROVEMENT_RATES.composition_quality * quality);
      break;
    case 'color':
      improvement.color_harmony = Math.min(1, improvement.color_harmony + SKILL_DEVELOPMENT.IMPROVEMENT_RATES.color_harmony * quality);
      break;
    case 'emotional':
      improvement.emotional_expression = Math.min(1, improvement.emotional_expression + SKILL_DEVELOPMENT.IMPROVEMENT_RATES.emotional_expression * quality);
      break;
  }
  
  // 一貫性を長期的に更新
  improvement.consistency = Math.min(1, improvement.consistency + SKILL_DEVELOPMENT.IMPROVEMENT_RATES.consistency);
  
  return improvement;
};

/**
 * 励ましのメッセージを取得
 */
export const getEncouragementMessage = (skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'): string => {
  const messages = PROGRESS_MESSAGES[skillLevel.toUpperCase() as keyof typeof PROGRESS_MESSAGES];
  return messages[Math.floor(Math.random() * messages.length)];
};

// ===============================
// Achievement System Utilities
// ===============================

/**
 * 達成可能な実績をチェック
 */
export const checkAchievements = (
  metrics: SkillMetrics,
  actionsCount: number,
  streakDays: number,
  daysActive: number,
  unlockedAchievements: string[] = []
): Achievement[] => {
  return ACHIEVEMENTS.filter(achievement => {
    // 既に解除済みの実績は除外
    if (unlockedAchievements.includes(achievement.id)) return false;
    
    const req = achievement.requirements;
    
    // スキル閾値のチェック
    if (req.skillThreshold) {
      const meetsThreshold = Object.entries(req.skillThreshold).every(([skill, threshold]) => {
        return metrics[skill as keyof SkillMetrics] >= threshold;
      });
      if (!meetsThreshold) return false;
    }
    
    // その他の要件チェック
    if (req.actionsCount && actionsCount < req.actionsCount) return false;
    if (req.streakDays && streakDays < req.streakDays) return false;
    if (req.daysActive && daysActive < req.daysActive) return false;
    
    return true;
  });
};

/**
 * 実績の進捗を計算
 */
export const calculateAchievementProgress = (
  achievement: Achievement,
  metrics: SkillMetrics,
  actionsCount: number,
  streakDays: number,
  daysActive: number
): number => {
  const req = achievement.requirements;
  let progress = 1; // Start with 100% and reduce based on unmet requirements
  
  if (req.skillThreshold) {
    const skillProgress = Object.entries(req.skillThreshold).map(([skill, threshold]) => {
      return Math.min(1, metrics[skill as keyof SkillMetrics] / threshold);
    });
    progress = Math.min(progress, Math.min(...skillProgress));
  }
  
  if (req.actionsCount) {
    progress = Math.min(progress, actionsCount / req.actionsCount);
  }
  
  if (req.streakDays) {
    progress = Math.min(progress, streakDays / req.streakDays);
  }
  
  if (req.daysActive) {
    progress = Math.min(progress, daysActive / req.daysActive);
  }
  
  return Math.max(0, Math.min(1, progress));
};

// ===============================
// Personality Analysis Utilities
// ===============================

/**
 * 行動パターンから性格特性を更新
 */
export const updatePersonalityFromBehavior = (
  currentProfile: PersonalityProfile,
  behaviorData: {
    editing_precision: number;
    time_spent: number;
    undo_usage: number;
    feature_exploration: number;
    unique_choices: number;
    filter_variety: number;
    original_compositions: number;
    editing_speed: number;
    shortcut_usage: number;
    session_frequency: number;
    sharing_frequency: number;
    family_interactions: number;
    comment_activity: number;
    cultural_choices: number;
    seasonal_preferences: number;
    memorial_engagement: number;
    emotional_photo_choices: number;
    memorial_photo_focus: number;
    reaction_sensitivity: number;
  }
): PersonalityProfile => {
  const updated = { ...currentProfile };
  const learningRate = 0.1; // How fast personality adapts
  
  // Calculate new trait values
  const newCarefulness = Object.entries(PERSONALITY_WEIGHTS.CAREFULNESS).reduce((sum, [behavior, weight]) => {
    return sum + (behaviorData[behavior as keyof typeof behaviorData] || 0) * weight;
  }, 0);
  
  const newCreativity = Object.entries(PERSONALITY_WEIGHTS.CREATIVITY).reduce((sum, [behavior, weight]) => {
    return sum + (behaviorData[behavior as keyof typeof behaviorData] || 0) * weight;
  }, 0);
  
  const newEfficiency = Object.entries(PERSONALITY_WEIGHTS.EFFICIENCY).reduce((sum, [behavior, weight]) => {
    return sum + (behaviorData[behavior as keyof typeof behaviorData] || 0) * weight;
  }, 0);
  
  const newSociability = Object.entries(PERSONALITY_WEIGHTS.SOCIABILITY).reduce((sum, [behavior, weight]) => {
    return sum + (behaviorData[behavior as keyof typeof behaviorData] || 0) * weight;
  }, 0);
  
  const newTraditionalism = Object.entries(PERSONALITY_WEIGHTS.TRADITIONALISM).reduce((sum, [behavior, weight]) => {
    return sum + (behaviorData[behavior as keyof typeof behaviorData] || 0) * weight;
  }, 0);
  
  const newEmotionality = Object.entries(PERSONALITY_WEIGHTS.EMOTIONALITY).reduce((sum, [behavior, weight]) => {
    return sum + (behaviorData[behavior as keyof typeof behaviorData] || 0) * weight;
  }, 0);
  
  // Apply gradual learning
  updated.traits = {
    carefulness: Math.max(0, Math.min(1, updated.traits.carefulness * (1 - learningRate) + newCarefulness * learningRate)),
    creativity: Math.max(0, Math.min(1, updated.traits.creativity * (1 - learningRate) + newCreativity * learningRate)),
    efficiency: Math.max(0, Math.min(1, updated.traits.efficiency * (1 - learningRate) + newEfficiency * learningRate)),
    sociability: Math.max(0, Math.min(1, updated.traits.sociability * (1 - learningRate) + newSociability * learningRate)),
    traditionalism: Math.max(0, Math.min(1, updated.traits.traditionalism * (1 - learningRate) + newTraditionalism * learningRate)),
    emotionality: Math.max(0, Math.min(1, updated.traits.emotionality * (1 - learningRate) + newEmotionality * learningRate))
  };
  
  // Update adaptations based on new traits
  updated.adaptations = {
    preferredPace: updated.traits.efficiency > 0.7 ? 'fast' : updated.traits.efficiency > 0.4 ? 'moderate' : 'slow',
    feedbackStyle: updated.traits.emotionality > 0.6 ? 'encouraging' : updated.traits.carefulness > 0.7 ? 'detailed' : 'minimal',
    interfaceComplexity: updated.traits.efficiency > 0.8 ? 'advanced' : updated.traits.carefulness > 0.6 ? 'standard' : 'simple',
    culturalContext: updated.traits.traditionalism > 0.7 ? 'traditional' : updated.traits.traditionalism > 0.4 ? 'mixed' : 'modern'
  };
  
  updated.lastUpdated = new Date();
  updated.confidence = Math.min(1, updated.confidence + 0.01); // Gradually increase confidence
  
  return updated;
};

// ===============================
// Audio Selection Utilities
// ===============================

/**
 * 現在の状況に最適な音楽を選択
 */
export const selectOptimalAudio = (
  season: Season = getCurrentSeason(),
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = getTimeOfDay(),
  mood?: 'peaceful' | 'contemplative' | 'gentle' | 'warm' | 'serene',
  personalityProfile?: PersonalityProfile
): AudioTrack | null => {
  let candidates = AUDIO_TRACKS.filter(track => 
    track.season === season || track.season === 'all'
  );
  
  // Filter by time of day
  candidates = candidates.filter(track => 
    track.timeOfDay === timeOfDay || track.timeOfDay === 'any'
  );
  
  // If mood is specified, prefer matching mood
  if (mood) {
    const moodMatches = candidates.filter(track => track.mood === mood);
    if (moodMatches.length > 0) {
      candidates = moodMatches;
    }
  }
  
  // Personality-based selection
  if (personalityProfile) {
    candidates.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      
      // Traditional personality prefers cultural tracks
      if (personalityProfile.traits.traditionalism > 0.6) {
        if (a.culturalContext.length > b.culturalContext.length) scoreA += 0.3;
        else scoreB += 0.3;
      }
      
      // Emotional personality prefers contemplative mood
      if (personalityProfile.traits.emotionality > 0.6) {
        if (a.mood === 'contemplative') scoreA += 0.2;
        if (b.mood === 'contemplative') scoreB += 0.2;
      }
      
      return scoreB - scoreA;
    });
  }
  
  return candidates.length > 0 ? candidates[0] : null;
};

// ===============================
// Data Persistence Utilities
// ===============================

/**
 * IndexedDBに安全にデータを保存
 */
export const saveToIndexedDB = async (storeName: string, data: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('JizaiEngagement', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const putRequest = store.put(data);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' });
      }
    };
  });
};

/**
 * IndexedDBからデータを読み込み
 */
export const loadFromIndexedDB = async <T>(storeName: string, id: string): Promise<T | null> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('JizaiEngagement', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      const getRequest = store.get(id);
      getRequest.onsuccess = () => resolve(getRequest.result || null);
      getRequest.onerror = () => reject(getRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' });
      }
    };
  });
};

// ===============================
// Date and Time Utilities
// ===============================

/**
 * 日本語の相対時間表示
 */
export const getRelativeTimeInJapanese = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return 'たった今';
  if (diffMinutes < 60) return `${diffMinutes}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}ヶ月前`;
  return `${Math.floor(diffDays / 365)}年前`;
};

/**
 * 数値を日本語の単位付きで表示
 */
export const formatNumberInJapanese = (num: number, unit: string): string => {
  if (num >= 10000) {
    return `${Math.floor(num / 10000)}万${num % 10000 > 0 ? Math.floor((num % 10000) / 1000) : ''}${unit}`;
  }
  if (num >= 1000) {
    return `${Math.floor(num / 1000)}千${num % 1000 > 0 ? Math.floor((num % 1000) / 100) : ''}${unit}`;
  }
  return `${num}${unit}`;
};

// ===============================
// Validation Utilities
// ===============================

/**
 * データの整合性チェック
 */
export const validateEngagementData = (data: any): boolean => {
  try {
    // Basic structure validation
    if (!data || typeof data !== 'object') return false;
    
    // Check required fields exist
    const requiredFields = ['version', 'lastSync'];
    for (const field of requiredFields) {
      if (!(field in data)) return false;
    }
    
    // Validate arrays
    const arrayFields = ['achievements', 'progressHistory', 'familyMembers'];
    for (const field of arrayFields) {
      if (data[field] && !Array.isArray(data[field])) return false;
    }
    
    return true;
  } catch (error) {
    console.error('Data validation error:', error);
    return false;
  }
};