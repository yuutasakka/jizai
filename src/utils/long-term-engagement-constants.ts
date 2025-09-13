/**
 * 長期愛用システム - 定数定義
 * Constants for Long-term User Engagement System
 */

import { Achievement, AudioTrack, CulturalEvent } from '../types/long-term-engagement';

// ===============================
// Achievement Definitions
// ===============================

export const ACHIEVEMENTS: Achievement[] = [
  // Common Achievements (日常の達成)
  {
    id: 'first-edit',
    category: 'milestone',
    rarity: 'common',
    title: '初めての一歩',
    description: '最初の写真編集を完了しました',
    icon: '✨',
    requirements: { actionsCount: 1 },
    rewards: { experience: 10 }
  },
  {
    id: 'daily-editor',
    category: 'consistency',
    rarity: 'common',
    title: '日課の始まり',
    description: '3日連続で写真編集をしました',
    icon: '📅',
    requirements: { streakDays: 3 },
    rewards: { experience: 30 }
  },
  {
    id: 'speed-learner',
    category: 'mastery',
    rarity: 'common',
    title: 'スピード向上',
    description: '編集スピードが向上しました',
    icon: '⚡',
    requirements: { skillThreshold: { editing_speed: 0.6 } },
    rewards: { experience: 20 }
  },

  // Uncommon Achievements (ちょっと特別)
  {
    id: 'family-first',
    category: 'milestone',
    rarity: 'uncommon',
    title: '家族の絆',
    description: '初めて写真を家族と共有しました',
    icon: '👨‍👩‍👧‍👦',
    requirements: { actionsCount: 1 },
    rewards: { experience: 50, unlockFeatures: ['family-reactions'] }
  },
  {
    id: 'week-warrior',
    category: 'consistency',
    rarity: 'uncommon',
    title: '一週間の継続',
    description: '7日連続で活動しました',
    icon: '🗓️',
    requirements: { streakDays: 7 },
    rewards: { experience: 80 }
  },
  {
    id: 'artistic-eye',
    category: 'creativity',
    rarity: 'uncommon',
    title: '芸術的センス',
    description: '構図の美しさが向上しました',
    icon: '🎨',
    requirements: { skillThreshold: { composition_quality: 0.7 } },
    rewards: { experience: 60, customization: ['artistic-filters'] }
  },

  // Rare Achievements (レア)
  {
    id: 'month-master',
    category: 'dedication',
    rarity: 'rare',
    title: '一か月の達人',
    description: '30日間継続的に活動しました',
    icon: '🌟',
    requirements: { daysActive: 30 },
    rewards: { experience: 200, unlockFeatures: ['advanced-editing'] }
  },
  {
    id: 'color-harmony',
    category: 'mastery',
    rarity: 'rare',
    title: '色彩の調和',
    description: '色彩感覚が優れたレベルに達しました',
    icon: '🌈',
    requirements: { skillThreshold: { color_harmony: 0.8 } },
    rewards: { experience: 150, customization: ['color-themes'] }
  },
  {
    id: 'memory-keeper',
    category: 'creativity',
    rarity: 'rare',
    title: '記憶の番人',
    description: '50枚の写真を美しく編集しました',
    icon: '📸',
    requirements: { actionsCount: 50 },
    rewards: { experience: 180, unlockFeatures: ['memorial-timeline'] }
  },

  // Epic Achievements (エピック)
  {
    id: 'technical-master',
    category: 'mastery',
    rarity: 'epic',
    title: '技術の達人',
    description: '技術的精度が最高レベルに達しました',
    icon: '⚙️',
    requirements: { skillThreshold: { technical_precision: 0.9 } },
    rewards: { experience: 300, unlockFeatures: ['pro-tools'] }
  },
  {
    id: 'emotion-artist',
    category: 'creativity',
    rarity: 'epic',
    title: '感情の芸術家',
    description: '写真に深い感情を込められるようになりました',
    icon: '💝',
    requirements: { skillThreshold: { emotional_expression: 0.85 } },
    rewards: { experience: 320, customization: ['emotional-presets'] }
  },
  {
    id: 'century-editor',
    category: 'dedication',
    rarity: 'epic',
    title: '百日の編集者',
    description: '100日間活動を続けました',
    icon: '💯',
    requirements: { daysActive: 100 },
    rewards: { experience: 500, unlockFeatures: ['master-gallery'] }
  },

  // Legendary Achievements (レジェンダリー)
  {
    id: 'perfectionist',
    category: 'mastery',
    rarity: 'legendary',
    title: '完璧主義者',
    description: 'すべてのスキルで最高レベルに到達しました',
    icon: '👑',
    requirements: { 
      skillThreshold: { 
        editing_speed: 0.9,
        composition_quality: 0.9,
        color_harmony: 0.9,
        emotional_expression: 0.9,
        technical_precision: 0.9
      }
    },
    rewards: { experience: 1000, unlockFeatures: ['legendary-status'] }
  },
  {
    id: 'family-bridge',
    category: 'creativity',
    rarity: 'legendary',
    title: '家族の架け橋',
    description: '3世代にわたって写真を共有しました',
    icon: '🌉',
    requirements: { actionsCount: 100 }, // Special logic required
    rewards: { experience: 800, unlockFeatures: ['generational-timeline'] }
  },

  // Mythical Achievement (神話級)
  {
    id: 'jizai-master',
    category: 'milestone',
    rarity: 'mythical',
    title: '自在の極み',
    description: 'JIZAI写真アプリの真の達人となりました',
    icon: '🏆',
    requirements: { 
      actionsCount: 1000,
      daysActive: 365,
      skillThreshold: { consistency: 0.95 }
    },
    rewards: { 
      experience: 2000, 
      unlockFeatures: ['master-mode', 'infinite-storage'],
      customization: ['mythical-effects']
    }
  }
];

// ===============================
// Audio Track Library
// ===============================

export const AUDIO_TRACKS: AudioTrack[] = [
  // Spring (春)
  {
    id: 'spring-breeze',
    name: '春のそよ風',
    season: 'spring',
    mood: 'peaceful',
    timeOfDay: 'morning',
    culturalContext: '新緑の季節、希望に満ちた始まり',
    volume: 0.3,
    duration: 180,
    src: '/audio/spring-breeze.mp3'
  },
  {
    id: 'cherry-blossoms',
    name: '桜のささやき',
    season: 'spring',
    mood: 'contemplative',
    timeOfDay: 'afternoon',
    culturalContext: '桜の季節、儚くも美しい瞬間',
    volume: 0.4,
    duration: 240,
    src: '/audio/cherry-blossoms.mp3'
  },

  // Summer (夏)
  {
    id: 'summer-cicadas',
    name: '夏の蝉しぐれ',
    season: 'summer',
    mood: 'warm',
    timeOfDay: 'afternoon',
    culturalContext: '暑い夏の日、思い出に残る音',
    volume: 0.2,
    duration: 300,
    src: '/audio/summer-cicadas.mp3'
  },
  {
    id: 'evening-breeze',
    name: '夕涼み',
    season: 'summer',
    mood: 'gentle',
    timeOfDay: 'evening',
    culturalContext: '夏の夕方、涼しい風と共に',
    volume: 0.3,
    duration: 220,
    src: '/audio/evening-breeze.mp3'
  },

  // Autumn (秋)
  {
    id: 'autumn-leaves',
    name: '紅葉のささやき',
    season: 'autumn',
    mood: 'contemplative',
    timeOfDay: 'afternoon',
    culturalContext: '秋の深まり、落ち葉の美しさ',
    volume: 0.35,
    duration: 200,
    src: '/audio/autumn-leaves.mp3'
  },
  {
    id: 'harvest-moon',
    name: '十五夜の静寂',
    season: 'autumn',
    mood: 'serene',
    timeOfDay: 'night',
    culturalContext: '中秋の名月、家族を思う夜',
    volume: 0.25,
    duration: 280,
    src: '/audio/harvest-moon.mp3'
  },

  // Winter (冬)
  {
    id: 'winter-silence',
    name: '雪の静寂',
    season: 'winter',
    mood: 'peaceful',
    timeOfDay: 'morning',
    culturalContext: '雪化粧した朝、清らかな空気',
    volume: 0.2,
    duration: 250,
    src: '/audio/winter-silence.mp3'
  },
  {
    id: 'kotatsu-warmth',
    name: 'こたつのぬくもり',
    season: 'winter',
    mood: 'warm',
    timeOfDay: 'evening',
    culturalContext: '冬の夜、家族と過ごす温かい時間',
    volume: 0.4,
    duration: 320,
    src: '/audio/kotatsu-warmth.mp3'
  },

  // All seasons (通年)
  {
    id: 'gentle-rain',
    name: '優しい雨音',
    season: 'all',
    mood: 'contemplative',
    timeOfDay: 'any',
    culturalContext: '雨の日、心を落ち着ける自然の音',
    volume: 0.3,
    duration: 360,
    src: '/audio/gentle-rain.mp3'
  },
  {
    id: 'temple-bells',
    name: '寺の鐘',
    season: 'all',
    mood: 'serene',
    timeOfDay: 'evening',
    culturalContext: '夕暮れの鐘、心を清める音',
    volume: 0.25,
    duration: 180,
    src: '/audio/temple-bells.mp3'
  }
];

// ===============================
// Cultural Events Calendar
// ===============================

export const CULTURAL_EVENTS: CulturalEvent[] = [
  // Spring Events
  {
    id: 'cherry-blossom-festival',
    name: '桜まつり',
    date: new Date(2024, 3, 15), // April 15
    description: '桜の開花を祝う伝統的な祭り',
    region: 'national',
    type: 'festival',
    associatedEmotions: ['joy', 'hope', 'renewal'],
    suggestedActivities: ['桜の写真撮影', '家族でお花見', '桜の思い出を振り返る']
  },
  {
    id: 'childrens-day',
    name: 'こどもの日',
    date: new Date(2024, 4, 5), // May 5
    description: '子どもの健やかな成長を願う日',
    region: 'national',
    type: 'traditional',
    associatedEmotions: ['love', 'hope', 'family'],
    suggestedActivities: ['子どもの写真を整理', '成長記録を作成', '家族の絆を深める']
  },

  // Summer Events
  {
    id: 'tanabata',
    name: '七夕',
    date: new Date(2024, 6, 7), // July 7
    description: '織姫と彦星の伝説、願い事をする日',
    region: 'national',
    type: 'traditional',
    associatedEmotions: ['romance', 'hope', 'dreams'],
    suggestedActivities: ['星空の写真', '願い事を家族と共有', '夏の思い出作り']
  },
  {
    id: 'obon',
    name: 'お盆',
    date: new Date(2024, 7, 15), // August 15
    description: '先祖を供養し、家族が集まる大切な時期',
    region: 'national',
    type: 'memorial',
    associatedEmotions: ['remembrance', 'family', 'gratitude'],
    suggestedActivities: ['先祖の写真を整理', '家族の歴史を振り返る', '思い出話を共有']
  },

  // Autumn Events
  {
    id: 'moon-viewing',
    name: '十五夜',
    date: new Date(2024, 8, 15), // September 15
    description: '中秋の名月を愛でる伝統行事',
    region: 'national',
    type: 'seasonal',
    associatedEmotions: ['contemplation', 'beauty', 'tranquility'],
    suggestedActivities: ['月の写真撮影', '家族で月見', '秋の夜長を楽しむ']
  },
  {
    id: 'autumn-leaves',
    name: '紅葉狩り',
    date: new Date(2024, 10, 15), // November 15
    description: '紅葉の美しさを楽しむ秋の恒例行事',
    region: 'national',
    type: 'seasonal',
    associatedEmotions: ['beauty', 'tranquility', 'reflection'],
    suggestedActivities: ['紅葉の写真撮影', '自然散策', '季節の移り変わりを感じる']
  },

  // Winter Events
  {
    id: 'new-year',
    name: 'お正月',
    date: new Date(2024, 0, 1), // January 1
    description: '新年を祝い、家族が集まる最も大切な行事',
    region: 'national',
    type: 'traditional',
    associatedEmotions: ['celebration', 'hope', 'family'],
    suggestedActivities: ['家族写真撮影', '一年の振り返り', '新年の目標設定']
  },
  {
    id: 'setsubun',
    name: '節分',
    date: new Date(2024, 1, 3), // February 3
    description: '豆まきをして厄除けをする伝統行事',
    region: 'national',
    type: 'traditional',
    associatedEmotions: ['protection', 'family', 'tradition'],
    suggestedActivities: ['家族の豆まき写真', '季節の変わり目を感じる', '厄除けの願い']
  }
];

// ===============================
// Skill Development Constants
// ===============================

export const SKILL_DEVELOPMENT = {
  INITIAL_VALUES: {
    editing_speed: 0.1,
    composition_quality: 0.2,
    color_harmony: 0.15,
    emotional_expression: 0.25,
    technical_precision: 0.1,
    consistency: 0.3
  },
  
  IMPROVEMENT_RATES: {
    editing_speed: 0.05,      // Fast improvement
    composition_quality: 0.03, // Slower, requires practice
    color_harmony: 0.04,      // Moderate improvement
    emotional_expression: 0.02, // Slowest, most subjective
    technical_precision: 0.06, // Fast with proper guidance
    consistency: 0.01         // Very slow, long-term metric
  },
  
  THRESHOLDS: {
    BEGINNER: 0.3,
    INTERMEDIATE: 0.6,
    ADVANCED: 0.8,
    EXPERT: 0.95
  }
};

// ===============================
// Personalization Constants
// ===============================

export const PERSONALITY_WEIGHTS = {
  CAREFULNESS: {
    editing_precision: 0.4,
    time_spent: 0.3,
    undo_usage: 0.2,
    feature_exploration: -0.1
  },
  
  CREATIVITY: {
    unique_choices: 0.5,
    filter_variety: 0.3,
    original_compositions: 0.2
  },
  
  EFFICIENCY: {
    editing_speed: 0.4,
    shortcut_usage: 0.3,
    session_frequency: 0.3
  },
  
  SOCIABILITY: {
    sharing_frequency: 0.5,
    family_interactions: 0.3,
    comment_activity: 0.2
  },
  
  TRADITIONALISM: {
    cultural_choices: 0.4,
    seasonal_preferences: 0.3,
    memorial_engagement: 0.3
  },
  
  EMOTIONALITY: {
    emotional_photo_choices: 0.4,
    memorial_photo_focus: 0.3,
    reaction_sensitivity: 0.3
  }
};

// ===============================
// Cultural Context Constants
// ===============================

export const JAPANESE_SEASONS = {
  spring: {
    months: [3, 4, 5],
    keywords: ['桜', '新緑', '春風', '花見', '入学', '新学期'],
    colors: ['#FFB7C5', '#98FB98', '#F0FFF0'],
    emoji: '🌸',
    mood: 'hopeful'
  },
  summer: {
    months: [6, 7, 8],
    keywords: ['夏祭り', '海', '花火', '蝉', '夏休み', '浴衣'],
    colors: ['#87CEEB', '#FFD700', '#FF6347'],
    emoji: '🌻',
    mood: 'energetic'
  },
  autumn: {
    months: [9, 10, 11],
    keywords: ['紅葉', '月見', '収穫', '読書', '秋祭り', '紅葉狩り'],
    colors: ['#D2691E', '#CD853F', '#B22222'],
    emoji: '🍁',
    mood: 'contemplative'
  },
  winter: {
    months: [12, 1, 2],
    keywords: ['雪', 'お正月', 'こたつ', '年末', '節分', '寒さ'],
    colors: ['#F0F8FF', '#E6E6FA', '#D3D3D3'],
    emoji: '❄️',
    mood: 'peaceful'
  }
};

// ===============================
// UI Constants
// ===============================

export const ACHIEVEMENT_COLORS = {
  common: '#9CA3AF',      // Gray
  uncommon: '#10B981',    // Green
  rare: '#3B82F6',       // Blue
  epic: '#8B5CF6',       // Purple
  legendary: '#F59E0B',  // Orange/Gold
  mythical: '#EF4444'    // Red/Rainbow
};

export const PROGRESS_MESSAGES = {
  BEGINNER: [
    'いいスタートですね！',
    '少しずつ上達しています',
    '継続が力になります'
  ],
  INTERMEDIATE: [
    'スキルが向上しています！',
    'なかなかの腕前ですね',
    'センスを感じます'
  ],
  ADVANCED: [
    '素晴らしい技術力です！',
    'プロ級の仕上がりですね',
    '感動的な作品です'
  ],
  EXPERT: [
    'まさに達人の域です！',
    '芸術作品のような美しさ',
    '心に響く作品ですね'
  ]
};

export const FAMILY_ROLE_TITLES = {
  parent: 'お父さん・お母さん',
  child: 'お子さん',
  grandparent: 'おじいちゃん・おばあちゃん',
  sibling: 'きょうだい',
  spouse: '配偶者',
  other: 'ご家族'
};