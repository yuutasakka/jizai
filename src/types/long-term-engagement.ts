/**
 * 長期愛用システム - 型定義
 * Types for Long-term User Engagement System
 */

// ===============================
// Memorial Intelligence Types
// ===============================

export interface PhotoAnalysis {
  id: string;
  fileName: string;
  dateCreated: Date;
  memorialSignificance: number; // 0-1 score
  emotionalContext: 'celebration' | 'remembrance' | 'milestone' | 'everyday';
  suggestedReminders: MemorialReminder[];
  culturalEvents: CulturalEvent[];
  location?: {
    name: string;
    coordinates?: { lat: number; lng: number };
  };
  people?: string[]; // Names or IDs of people in the photo
}

export interface MemorialReminder {
  id: string;
  type: 'anniversary' | 'birthday' | 'seasonal' | 'cultural' | 'personal';
  date: Date;
  title: string;
  message: string;
  significance: number; // 0-1
  isRecurring: boolean;
  recurrenceType?: 'yearly' | 'monthly';
  culturalContext?: string; // 例: "お盆", "桜の季節"
  suggestedAction?: string; // 例: "写真を見返す", "家族に連絡する"
}

export interface CulturalEvent {
  id: string;
  name: string;
  date: Date;
  description: string;
  region: 'national' | 'regional' | 'local';
  type: 'festival' | 'memorial' | 'seasonal' | 'traditional';
  associatedEmotions: string[];
  suggestedActivities: string[];
}

// ===============================
// Growth Achievement Types  
// ===============================

export interface SkillMetrics {
  editing_speed: number; // Actions per minute
  composition_quality: number; // 0-1 aesthetic score
  color_harmony: number; // 0-1 color theory score
  emotional_expression: number; // 0-1 emotional impact
  technical_precision: number; // 0-1 technical accuracy
  consistency: number; // Standard deviation of quality
}

export interface Achievement {
  id: string;
  category: 'mastery' | 'consistency' | 'creativity' | 'dedication' | 'milestone';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythical';
  title: string;
  description: string;
  icon: string;
  requirements: {
    skillThreshold?: Partial<SkillMetrics>;
    actionsCount?: number;
    daysActive?: number;
    streakDays?: number;
  };
  rewards: {
    experience: number;
    unlockFeatures?: string[];
    customization?: string[];
  };
  unlockedAt?: Date;
  progress?: number; // 0-1 for partially completed achievements
}

export interface ProgressHistory {
  date: Date;
  metrics: SkillMetrics;
  actionsCount: number;
  sessionDuration: number; // minutes
  achievements?: string[]; // IDs of achievements unlocked
}

// ===============================
// Family Bonding Types
// ===============================

export interface FamilyMember {
  id: string;
  name: string;
  role: 'parent' | 'child' | 'grandparent' | 'sibling' | 'spouse' | 'other';
  avatar?: string;
  joinedAt: Date;
  preferences: {
    culturalRole: string; // e.g., '長男', '次女', 'お母さん'
    notificationStyle: 'gentle' | 'standard' | 'minimal';
    preferredLanguage: 'ja' | 'en';
    timeZone: string;
  };
  stats: {
    photosShared: number;
    commentsGiven: number;
    wisdomShared: number;
  };
}

export interface SharedPhoto {
  id: string;
  originalPhotoId: string;
  sharedBy: string; // FamilyMember ID
  sharedAt: Date;
  caption?: string;
  reactions: PhotoReaction[];
  comments: PhotoComment[];
  visibility: 'family' | 'private' | 'ancestors'; // ancestors = 先祖への報告
}

export interface PhotoReaction {
  id: string;
  memberId: string;
  type: '❤️' | '😊' | '👏' | '😢' | '🙏' | '🌸'; // Cultural appropriate emojis
  timestamp: Date;
}

export interface PhotoComment {
  id: string;
  memberId: string;
  text: string;
  timestamp: Date;
  isWisdom: boolean; // Mark as generational wisdom
  culturalContext?: string;
}

export interface WisdomEntry {
  id: string;
  authorId: string; // FamilyMember ID
  title: string;
  content: string;
  category: 'life' | 'family' | 'tradition' | 'recipe' | 'skill' | 'story';
  tags: string[];
  relatedPhotos?: string[]; // Photo IDs
  createdAt: Date;
  reactions: PhotoReaction[];
  isAncestralWisdom: boolean; // From older generations
  culturalSignificance: number; // 0-1
}

// ===============================
// Personalization Types
// ===============================

export interface PersonalityProfile {
  traits: {
    carefulness: number; // 0-1, based on editing precision
    creativity: number; // 0-1, based on unique choices
    efficiency: number; // 0-1, based on speed and shortcuts
    sociability: number; // 0-1, based on sharing behavior
    traditionalism: number; // 0-1, based on cultural choices
    emotionality: number; // 0-1, based on photo selections
  };
  adaptations: {
    preferredPace: 'slow' | 'moderate' | 'fast';
    feedbackStyle: 'encouraging' | 'detailed' | 'minimal';
    interfaceComplexity: 'simple' | 'standard' | 'advanced';
    culturalContext: 'traditional' | 'modern' | 'mixed';
  };
  lastUpdated: Date;
  confidence: number; // 0-1, how confident we are in the profile
}

export interface BehaviorPattern {
  id: string;
  type: 'editing' | 'navigation' | 'sharing' | 'timing';
  pattern: string;
  frequency: number;
  lastObserved: Date;
  confidence: number;
  associatedTraits: string[];
}

export interface SmartSuggestion {
  id: string;
  type: 'feature' | 'photo' | 'family' | 'memorial' | 'enhancement';
  title: string;
  description: string;
  action: string;
  relevanceScore: number; // 0-1
  reasoning: string;
  validUntil?: Date;
  isAccepted?: boolean;
  acceptedAt?: Date;
}

// ===============================
// Audio Visual Enhancement Types
// ===============================

export interface AudioTrack {
  id: string;
  name: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter' | 'all';
  mood: 'peaceful' | 'contemplative' | 'gentle' | 'warm' | 'serene';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'any';
  culturalContext: string;
  volume: number; // 0-1
  duration: number; // seconds
  src: string;
}

export interface ParticleEffect {
  id: string;
  name: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  particles: {
    type: 'cherry-blossom' | 'snow' | 'leaves' | 'firefly' | 'rain';
    count: number;
    speed: number;
    size: number;
    opacity: number;
    color: string;
  };
}

// ===============================
// System State Types
// ===============================

export interface EngagementSession {
  startTime: Date;
  endTime?: Date;
  actionsPerformed: string[];
  skillProgress: Partial<SkillMetrics>;
  achievementsUnlocked: string[];
  photosAnalyzed: number;
  familyInteractions: number;
  audioTracksPlayed: string[];
  userMood?: 'focused' | 'relaxed' | 'creative' | 'nostalgic';
}

export interface SystemPreferences {
  audioEnabled: boolean;
  particleEffectsEnabled: boolean;
  notificationsEnabled: boolean;
  familySharingEnabled: boolean;
  memorialRemindersEnabled: boolean;
  achievementCelebrationsEnabled: boolean;
  culturalContextEnabled: boolean;
  language: 'ja' | 'en';
  theme: 'light' | 'dark' | 'auto';
  soundVolume: number; // 0-1
  visualEffectsIntensity: number; // 0-1
}

// ===============================
// Utility Types
// ===============================

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type EngagementLevel = 'low' | 'moderate' | 'high' | 'obsessed';
export type CulturalPriority = 'traditional' | 'balanced' | 'modern';

export interface DatabaseSchema {
  photoAnalyses: PhotoAnalysis[];
  memorialReminders: MemorialReminder[];
  achievements: Achievement[];
  progressHistory: ProgressHistory[];
  familyMembers: FamilyMember[];
  sharedPhotos: SharedPhoto[];
  wisdomEntries: WisdomEntry[];
  personalityProfile?: PersonalityProfile;
  behaviorPatterns: BehaviorPattern[];
  smartSuggestions: SmartSuggestion[];
  engagementSessions: EngagementSession[];
  systemPreferences: SystemPreferences;
  lastSync: Date;
  version: string;
}