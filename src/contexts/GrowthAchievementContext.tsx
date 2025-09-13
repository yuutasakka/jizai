import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Growth Achievement Types
interface SkillMetric {
  skillType: 'editing_speed' | 'composition_quality' | 'color_harmony' | 'emotional_expression' | 'technical_precision';
  currentLevel: number; // 0-100
  previousLevel: number;
  improvementRate: number; // Positive/negative change rate
  lastUpdate: Date;
  milestones: {
    level: number;
    achievedDate?: Date;
    title: string;
    description: string;
  }[];
}

interface CreationSession {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in milliseconds
  actionsPerformed: number;
  qualityScore: number; // 0-100
  efficiencyScore: number; // actions per minute
  emotionalEngagement: 'high' | 'medium' | 'low';
  userSatisfaction?: number; // 1-5 rating
  photoId: string;
  improvements: {
    type: string;
    before: any;
    after: any;
    timestamp: Date;
  }[];
}

interface Achievement {
  id: string;
  category: 'mastery' | 'consistency' | 'creativity' | 'dedication' | 'milestone';
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary' | 'mythical';
  unlockedDate?: Date;
  progress: number; // 0-100
  requirements: {
    type: string;
    target: number;
    current: number;
  }[];
  rewards: {
    type: 'feature_unlock' | 'cosmetic' | 'insight' | 'badge';
    value: string;
  }[];
}

interface PersonalizedFeedback {
  id: string;
  type: 'encouragement' | 'milestone' | 'insight' | 'suggestion' | 'celebration';
  message: string;
  tone: 'warm' | 'proud' | 'gentle' | 'excited' | 'reflective';
  triggerEvent: string;
  personalizedElements: {
    userName?: string;
    specificImprovement?: string;
    comparisonData?: string;
    emotionalContext?: string;
  };
  displayUntil: Date;
  isRead: boolean;
  canDismiss: boolean;
}

interface GrowthVisualization {
  timeframe: 'week' | 'month' | 'quarter' | 'year' | 'all_time';
  skillProgression: {
    skillType: string;
    dataPoints: { date: Date; level: number; }[];
    trendDirection: 'improving' | 'stable' | 'declining';
    insights: string[];
  }[];
  creationQuality: {
    averageScore: number;
    bestSession: CreationSession;
    recentTrend: number; // Change over last period
    qualityDistribution: { range: string; count: number; }[];
  };
  personalRecords: {
    fastestCompletion: CreationSession;
    highestQuality: CreationSession;
    mostEfficient: CreationSession;
    longestStreak: { days: number; startDate: Date; endDate: Date; };
  };
}

interface GrowthAchievementState {
  // Skill Tracking
  skillMetrics: Map<string, SkillMetric>;
  
  // Session History
  creationSessions: CreationSession[];
  currentSession: CreationSession | null;
  
  // Achievements
  achievements: Achievement[];
  unlockedAchievements: Set<string>;
  nearbyAchievements: Achievement[]; // Close to unlocking
  
  // Feedback System
  personalizedFeedback: PersonalizedFeedback[];
  feedbackQueue: PersonalizedFeedback[];
  
  // Growth Visualization
  growthData: GrowthVisualization;
  
  // User Preferences
  growthSettings: {
    feedbackFrequency: 'frequent' | 'moderate' | 'minimal';
    achievementNotifications: boolean;
    progressSharing: boolean;
    comparisonMode: 'self_only' | 'anonymous' | 'community';
    motivationStyle: 'encouraging' | 'analytical' | 'celebratory';
  };
  
  // Learning Insights
  personalizedInsights: {
    strengths: string[];
    improvementAreas: string[];
    nextRecommendations: string[];
    learningPattern: 'steady' | 'burst' | 'cyclical' | 'experimental';
  };
  
  // Consistency Tracking
  usageStreaks: {
    currentStreak: number;
    longestStreak: number;
    streakStartDate: Date;
    lastActiveDate: Date;
  };
}

interface GrowthAchievementActions {
  // Session Management
  startCreationSession: (photoId: string) => string;
  updateCurrentSession: (updates: Partial<CreationSession>) => void;
  completeCurrentSession: (userSatisfaction?: number) => void;
  
  // Skill Tracking
  recordSkillImprovement: (skillType: string, newLevel: number) => void;
  calculateSkillProgression: (sessions: CreationSession[]) => void;
  
  // Achievement System
  checkForNewAchievements: () => Achievement[];
  unlockAchievement: (achievementId: string) => void;
  getProgressTowardsAchievement: (achievementId: string) => number;
  
  // Feedback Generation
  generatePersonalizedFeedback: (triggerEvent: string, sessionData?: CreationSession) => void;
  dismissFeedback: (feedbackId: string) => void;
  markFeedbackAsRead: (feedbackId: string) => void;
  
  // Growth Analysis
  analyzeGrowthPattern: () => void;
  generateInsights: () => void;
  updateVisualizationData: () => void;
  
  // Motivation Engine
  getEncouragingMessage: (context: 'start_session' | 'mid_session' | 'completion' | 'milestone') => string;
  celebrateImprovement: (improvementType: string, amount: number) => void;
  
  // Settings & Preferences
  updateGrowthSettings: (settings: Partial<GrowthAchievementState['growthSettings']>) => void;
}

type GrowthAchievementContextType = GrowthAchievementState & GrowthAchievementActions;

const defaultAchievements: Achievement[] = [
  // Mastery Achievements
  {
    id: 'first_creation',
    category: 'milestone',
    title: 'はじめの一歩',
    description: '初めての遺影を作成しました',
    icon: '🌸',
    rarity: 'common',
    progress: 0,
    requirements: [{ type: 'photos_created', target: 1, current: 0 }],
    rewards: [{ type: 'insight', value: '美しい思い出の始まりです' }]
  },
  {
    id: 'speed_improver',
    category: 'mastery',
    title: '手際よく',
    description: '編集速度が20%向上しました',
    icon: '⚡',
    rarity: 'uncommon',
    progress: 0,
    requirements: [{ type: 'speed_improvement', target: 20, current: 0 }],
    rewards: [{ type: 'feature_unlock', value: 'quick_edit_mode' }]
  },
  {
    id: 'quality_master',
    category: 'mastery',
    title: '品質への拘り',
    description: '5回連続で高品質スコアを達成',
    icon: '✨',
    rarity: 'rare',
    progress: 0,
    requirements: [{ type: 'consecutive_quality', target: 5, current: 0 }],
    rewards: [{ type: 'feature_unlock', value: 'advanced_filters' }]
  },
  {
    id: 'dedication_week',
    category: 'dedication',
    title: '一週間の思い',
    description: '7日間連続でアプリを使用',
    icon: '📅',
    rarity: 'uncommon',
    progress: 0,
    requirements: [{ type: 'daily_streak', target: 7, current: 0 }],
    rewards: [{ type: 'cosmetic', value: 'seasonal_theme' }]
  },
  {
    id: 'creativity_explorer',
    category: 'creativity',
    title: '創造の探求者',
    description: '10種類の異なる編集スタイルを試用',
    icon: '🎨',
    rarity: 'rare',
    progress: 0,
    requirements: [{ type: 'styles_used', target: 10, current: 0 }],
    rewards: [{ type: 'feature_unlock', value: 'custom_styles' }]
  },
  {
    id: 'master_craftsman',
    category: 'mastery',
    title: '匠の技',
    description: '全スキルで80%以上を達成',
    icon: '🏆',
    rarity: 'legendary',
    progress: 0,
    requirements: [
      { type: 'editing_speed', target: 80, current: 0 },
      { type: 'composition_quality', target: 80, current: 0 },
      { type: 'color_harmony', target: 80, current: 0 },
      { type: 'emotional_expression', target: 80, current: 0 }
    ],
    rewards: [
      { type: 'badge', value: 'master_craftsman' },
      { type: 'feature_unlock', value: 'professional_tools' }
    ]
  }
];

const skillDefinitions: Record<string, { name: string; description: string; }> = {
  editing_speed: { 
    name: '編集速度', 
    description: '効率的で迅速な編集技術' 
  },
  composition_quality: { 
    name: '構図品質', 
    description: '美しいバランスの構図作り' 
  },
  color_harmony: { 
    name: '色彩調和', 
    description: '心に響く色彩の組み合わせ' 
  },
  emotional_expression: { 
    name: '感情表現', 
    description: '深い感情を込めた表現力' 
  },
  technical_precision: { 
    name: '技術精度', 
    description: '細部まで丁寧な技術力' 
  }
};

const GrowthAchievementContext = createContext<GrowthAchievementContextType | null>(null);

export const useGrowthAchievement = () => {
  const context = useContext(GrowthAchievementContext);
  if (!context) {
    throw new Error('useGrowthAchievement must be used within a GrowthAchievementProvider');
  }
  return context;
};

interface GrowthAchievementProviderProps {
  children: React.ReactNode;
}

export const GrowthAchievementProvider: React.FC<GrowthAchievementProviderProps> = ({ children }) => {
  // State Management
  const [state, setState] = useState<GrowthAchievementState>({
    skillMetrics: new Map(),
    creationSessions: [],
    currentSession: null,
    achievements: defaultAchievements,
    unlockedAchievements: new Set(),
    nearbyAchievements: [],
    personalizedFeedback: [],
    feedbackQueue: [],
    growthData: {
      timeframe: 'month',
      skillProgression: [],
      creationQuality: {
        averageScore: 0,
        bestSession: {} as CreationSession,
        recentTrend: 0,
        qualityDistribution: []
      },
      personalRecords: {} as any
    },
    growthSettings: {
      feedbackFrequency: 'moderate',
      achievementNotifications: true,
      progressSharing: false,
      comparisonMode: 'self_only',
      motivationStyle: 'encouraging'
    },
    personalizedInsights: {
      strengths: [],
      improvementAreas: [],
      nextRecommendations: [],
      learningPattern: 'steady'
    },
    usageStreaks: {
      currentStreak: 0,
      longestStreak: 0,
      streakStartDate: new Date(),
      lastActiveDate: new Date()
    }
  });

  // Session Management
  const startCreationSession = useCallback((photoId: string): string => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSession: CreationSession = {
      id: sessionId,
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      actionsPerformed: 0,
      qualityScore: 0,
      efficiencyScore: 0,
      emotionalEngagement: 'medium',
      photoId,
      improvements: []
    };

    setState(prev => ({
      ...prev,
      currentSession: newSession
    }));

    return sessionId;
  }, []);

  const updateCurrentSession = useCallback((updates: Partial<CreationSession>) => {
    setState(prev => ({
      ...prev,
      currentSession: prev.currentSession 
        ? { ...prev.currentSession, ...updates }
        : null
    }));
  }, []);

  const completeCurrentSession = useCallback((userSatisfaction?: number) => {
    if (!state.currentSession) return;

    const completedSession: CreationSession = {
      ...state.currentSession,
      endTime: new Date(),
      duration: new Date().getTime() - state.currentSession.startTime.getTime(),
      userSatisfaction
    };

    // Calculate efficiency score
    completedSession.efficiencyScore = completedSession.actionsPerformed / 
      (completedSession.duration / (1000 * 60)); // actions per minute

    // Calculate quality score based on improvements and user satisfaction
    completedSession.qualityScore = calculateQualityScore(completedSession);

    setState(prev => ({
      ...prev,
      creationSessions: [...prev.creationSessions, completedSession],
      currentSession: null
    }));

    // Update skills based on session
    updateSkillsFromSession(completedSession);
    
    // Check for achievements
    checkForNewAchievements();
    
    // Generate personalized feedback
    generatePersonalizedFeedback('session_completed', completedSession);
  }, [state.currentSession]);

  // Skill Progression Calculation
  const calculateQualityScore = (session: CreationSession): number => {
    let score = 50; // Base score
    
    // Factor in user satisfaction
    if (session.userSatisfaction) {
      score += (session.userSatisfaction - 3) * 15; // Scale 1-5 to impact
    }
    
    // Factor in efficiency
    if (session.efficiencyScore > 2) score += 10; // Bonus for efficiency
    if (session.efficiencyScore < 1) score -= 5; // Penalty for slow work
    
    // Factor in number of improvements
    score += Math.min(session.improvements.length * 5, 20); // Up to 20 bonus points
    
    // Factor in emotional engagement
    const engagementBonus = {
      high: 15,
      medium: 0,
      low: -10
    };
    score += engagementBonus[session.emotionalEngagement];
    
    return Math.max(0, Math.min(100, score));
  };

  const updateSkillsFromSession = (session: CreationSession) => {
    setState(prev => {
      const newSkillMetrics = new Map(prev.skillMetrics);
      
      // Update editing speed
      updateSkillMetric(newSkillMetrics, 'editing_speed', session.efficiencyScore * 10);
      
      // Update composition quality based on session quality
      updateSkillMetric(newSkillMetrics, 'composition_quality', session.qualityScore * 0.8);
      
      // Update emotional expression based on engagement
      const emotionalScore = session.emotionalEngagement === 'high' ? 85 : 
                           session.emotionalEngagement === 'medium' ? 70 : 50;
      updateSkillMetric(newSkillMetrics, 'emotional_expression', emotionalScore);
      
      // Update technical precision based on number of improvements
      const precisionScore = Math.min(90, 60 + session.improvements.length * 5);
      updateSkillMetric(newSkillMetrics, 'technical_precision', precisionScore);
      
      return { ...prev, skillMetrics: newSkillMetrics };
    });
  };

  const updateSkillMetric = (skillMap: Map<string, SkillMetric>, skillType: string, newScore: number) => {
    const existing = skillMap.get(skillType);
    const currentLevel = existing ? existing.currentLevel : 30; // Start at 30%
    const improvementRate = (newScore - currentLevel) * 0.1; // Gradual improvement
    const newLevel = Math.min(100, Math.max(0, currentLevel + improvementRate));
    
    const updated: SkillMetric = {
      skillType: skillType as any,
      currentLevel: newLevel,
      previousLevel: currentLevel,
      improvementRate,
      lastUpdate: new Date(),
      milestones: existing?.milestones || generateSkillMilestones(skillType)
    };
    
    skillMap.set(skillType, updated);
  };

  const generateSkillMilestones = (skillType: string) => [
    { level: 25, title: '基礎習得', description: `${skillDefinitions[skillType]?.name}の基礎をマスター` },
    { level: 50, title: '中級者', description: `${skillDefinitions[skillType]?.name}で安定した結果を` },
    { level: 75, title: '上級者', description: `${skillDefinitions[skillType]?.name}で優れた技術を発揮` },
    { level: 90, title: '匠の域', description: `${skillDefinitions[skillType]?.name}で職人レベルの技術` },
    { level: 100, title: '完全マスター', description: `${skillDefinitions[skillType]?.name}を完全に習得` }
  ];

  // Achievement System
  const checkForNewAchievements = useCallback(() => {
    const newAchievements: Achievement[] = [];
    
    state.achievements.forEach(achievement => {
      if (state.unlockedAchievements.has(achievement.id)) return;
      
      let canUnlock = true;
      achievement.requirements.forEach(req => {
        let currentValue = 0;
        
        switch (req.type) {
          case 'photos_created':
            currentValue = state.creationSessions.length;
            break;
          case 'speed_improvement':
            const speedSkill = state.skillMetrics.get('editing_speed');
            currentValue = speedSkill ? speedSkill.currentLevel - 30 : 0; // Improvement from baseline
            break;
          case 'consecutive_quality':
            const recentSessions = state.creationSessions.slice(-req.target);
            currentValue = recentSessions.every(s => s.qualityScore > 75) ? recentSessions.length : 0;
            break;
          case 'daily_streak':
            currentValue = state.usageStreaks.currentStreak;
            break;
          case 'styles_used':
            // This would be tracked separately in a real implementation
            currentValue = Math.min(req.target, state.creationSessions.length);
            break;
          default:
            const skill = state.skillMetrics.get(req.type);
            currentValue = skill ? skill.currentLevel : 0;
            break;
        }
        
        // Update current value in requirement
        req.current = currentValue;
        
        if (currentValue < req.target) {
          canUnlock = false;
        }
      });
      
      if (canUnlock) {
        newAchievements.push(achievement);
      }
    });
    
    // Unlock new achievements
    if (newAchievements.length > 0) {
      setState(prev => ({
        ...prev,
        unlockedAchievements: new Set([
          ...prev.unlockedAchievements,
          ...newAchievements.map(a => a.id)
        ])
      }));
      
      // Generate celebration feedback
      newAchievements.forEach(achievement => {
        generatePersonalizedFeedback('achievement_unlocked', undefined, achievement);
      });
    }
    
    return newAchievements;
  }, [state.achievements, state.unlockedAchievements, state.creationSessions, state.skillMetrics, state.usageStreaks]);

  // Personalized Feedback Generation
  const generatePersonalizedFeedback = useCallback((
    triggerEvent: string, 
    sessionData?: CreationSession, 
    achievement?: Achievement
  ) => {
    const feedbackMessages = generateContextualFeedback(triggerEvent, sessionData, achievement, state);
    
    setState(prev => ({
      ...prev,
      feedbackQueue: [...prev.feedbackQueue, ...feedbackMessages]
    }));
  }, [state]);

  const generateContextualFeedback = (
    triggerEvent: string, 
    sessionData?: CreationSession, 
    achievement?: Achievement,
    currentState?: GrowthAchievementState
  ): PersonalizedFeedback[] => {
    const feedback: PersonalizedFeedback[] = [];
    
    switch (triggerEvent) {
      case 'session_completed':
        if (sessionData) {
          if (sessionData.qualityScore > 80) {
            feedback.push({
              id: `feedback_${Date.now()}`,
              type: 'celebration',
              message: '素晴らしい作品が完成しましたね！品質の高さが際立っています。',
              tone: 'proud',
              triggerEvent,
              personalizedElements: {
                specificImprovement: `品質スコア: ${sessionData.qualityScore}点`,
              },
              displayUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
              isRead: false,
              canDismiss: true
            });
          } else if (sessionData.efficiencyScore > 3) {
            feedback.push({
              id: `feedback_${Date.now()}`,
              type: 'encouragement',
              message: '手際よく作業できるようになりましたね！スピードが向上しています。',
              tone: 'excited',
              triggerEvent,
              personalizedElements: {
                specificImprovement: `作業効率が向上`,
              },
              displayUntil: new Date(Date.now() + 12 * 60 * 60 * 1000),
              isRead: false,
              canDismiss: true
            });
          }
        }
        break;
        
      case 'achievement_unlocked':
        if (achievement) {
          feedback.push({
            id: `achievement_${achievement.id}_${Date.now()}`,
            type: 'milestone',
            message: `🎉 ${achievement.title}を獲得しました！${achievement.description}`,
            tone: 'excited',
            triggerEvent,
            personalizedElements: {
              specificImprovement: achievement.title,
            },
            displayUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
            isRead: false,
            canDismiss: false // Achievements should be acknowledged
          });
        }
        break;
        
      case 'skill_improvement':
        feedback.push({
          id: `skill_${Date.now()}`,
          type: 'insight',
          message: '編集技術が着実に向上しています。継続は力なりですね。',
          tone: 'warm',
          triggerEvent,
          personalizedElements: {},
          displayUntil: new Date(Date.now() + 6 * 60 * 60 * 1000),
          isRead: false,
          canDismiss: true
        });
        break;
    }
    
    return feedback;
  };

  // Encouraging Messages
  const getEncouragingMessage = useCallback((
    context: 'start_session' | 'mid_session' | 'completion' | 'milestone'
  ): string => {
    const messages = {
      start_session: [
        '今日も心を込めて、美しい思い出を形にしましょう',
        '新しい作品への期待が膨らみます',
        'いつものように、丁寧に進めていきましょう',
        '大切な方への想いを込めて'
      ],
      mid_session: [
        '順調に進んでいますね。このペースで',
        '細かな調整が作品を輝かせています',
        '集中した取り組みが素晴らしいです',
        '一つ一つの工程に心を込めて'
      ],
      completion: [
        '素晴らしい作品が完成しました',
        '丁寧な作業の成果が表れています',
        '心のこもった美しい仕上がりですね',
        'きっと喜んでもらえる作品です'
      ],
      milestone: [
        '大きな成長を遂げましたね',
        '継続された努力が実を結びました',
        '技術の向上が目に見えて分かります',
        '次のステップへの準備が整いました'
      ]
    };
    
    const contextMessages = messages[context];
    return contextMessages[Math.floor(Math.random() * contextMessages.length)];
  }, []);

  // Initialize skills on mount
  useEffect(() => {
    if (state.skillMetrics.size === 0) {
      setState(prev => {
        const initialSkills = new Map<string, SkillMetric>();
        Object.keys(skillDefinitions).forEach(skillType => {
          initialSkills.set(skillType, {
            skillType: skillType as any,
            currentLevel: 30, // Start at 30%
            previousLevel: 30,
            improvementRate: 0,
            lastUpdate: new Date(),
            milestones: generateSkillMilestones(skillType)
          });
        });
        
        return { ...prev, skillMetrics: initialSkills };
      });
    }
  }, [state.skillMetrics.size]);

  // Actions Implementation
  const actions: GrowthAchievementActions = {
    startCreationSession,
    updateCurrentSession,
    completeCurrentSession,
    recordSkillImprovement: (skillType, newLevel) => {
      setState(prev => {
        const newSkillMetrics = new Map(prev.skillMetrics);
        updateSkillMetric(newSkillMetrics, skillType, newLevel);
        return { ...prev, skillMetrics: newSkillMetrics };
      });
    },
    calculateSkillProgression: (sessions) => {
      // Implementation for skill progression analysis
    },
    checkForNewAchievements,
    unlockAchievement: (achievementId) => {
      setState(prev => ({
        ...prev,
        unlockedAchievements: new Set([...prev.unlockedAchievements, achievementId])
      }));
    },
    getProgressTowardsAchievement: (achievementId) => {
      const achievement = state.achievements.find(a => a.id === achievementId);
      if (!achievement) return 0;
      
      const totalRequirements = achievement.requirements.length;
      const metRequirements = achievement.requirements.filter(req => req.current >= req.target).length;
      
      return (metRequirements / totalRequirements) * 100;
    },
    generatePersonalizedFeedback,
    dismissFeedback: (feedbackId) => {
      setState(prev => ({
        ...prev,
        personalizedFeedback: prev.personalizedFeedback.filter(f => f.id !== feedbackId),
        feedbackQueue: prev.feedbackQueue.filter(f => f.id !== feedbackId)
      }));
    },
    markFeedbackAsRead: (feedbackId) => {
      setState(prev => ({
        ...prev,
        personalizedFeedback: prev.personalizedFeedback.map(f => 
          f.id === feedbackId ? { ...f, isRead: true } : f
        ),
        feedbackQueue: prev.feedbackQueue.map(f => 
          f.id === feedbackId ? { ...f, isRead: true } : f
        )
      }));
    },
    analyzeGrowthPattern: () => {
      // Implementation for growth pattern analysis
    },
    generateInsights: () => {
      // Generate personalized insights based on user data
      const insights = {
        strengths: ['色彩調和', '感情表現'],
        improvementAreas: ['編集速度', '構図品質'],
        nextRecommendations: ['高度なフィルターの活用', '構図理論の学習'],
        learningPattern: 'steady' as const
      };
      
      setState(prev => ({
        ...prev,
        personalizedInsights: insights
      }));
    },
    updateVisualizationData: () => {
      // Update growth visualization data
    },
    getEncouragingMessage,
    celebrateImprovement: (improvementType, amount) => {
      generatePersonalizedFeedback('skill_improvement');
    },
    updateGrowthSettings: (settings) => {
      setState(prev => ({
        ...prev,
        growthSettings: { ...prev.growthSettings, ...settings }
      }));
    }
  };

  return (
    <GrowthAchievementContext.Provider value={{ ...state, ...actions }}>
      {children}
    </GrowthAchievementContext.Provider>
  );
};