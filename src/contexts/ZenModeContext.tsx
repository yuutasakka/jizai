import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { track } from '../lib/analytics';

// Types
interface MemorialSession {
  id: string;
  userId: string;
  imageData: string | null;
  processingStage: 'idle' | 'uploading' | 'detecting' | 'enhancing' | 'generating' | 'complete';
  candidates: MemorialCandidate[];
  selectedCandidate: string | null;
  progress: number;
  timestamp: number;
  lastSave: number;
  isComplete: boolean;
  memorialDate?: string;
  personalNote?: string;
}

interface MemorialCandidate {
  id: string;
  imageUrl: string;
  style: 'elegant' | 'warm' | 'serene';
  description: string;
}

interface UserSkillProfile {
  level: number;
  sessionsCompleted: number;
  averageCompletionTime: number;
  preferredStyles: string[];
  skillUnlocks: string[];
  lastActivityDate: number;
  behaviorPattern: {
    quickDecisionMaker: boolean;
    perfectionist: boolean;
    traditionalist: boolean;
    modernist: boolean;
  };
}

interface DelightState {
  easterEggsFound: string[];
  specialDates: { date: string; type: string; message: string }[];
  seasonalTheme: 'spring' | 'summer' | 'autumn' | 'winter';
  completionCount: number;
  lastCompletionDate: number;
  streakDays: number;
  unlockedMessages: string[];
  culturalEvents: { date: string; event: string; greeting: string }[];
}

interface ZenState {
  currentSession: MemorialSession | null;
  userSkillProfile: UserSkillProfile;
  delightState: DelightState;
  isAutoSaving: boolean;
  isPaused: boolean;
  lastInteraction: number;
  networkStatus: 'online' | 'offline' | 'slow';
  saveStatus: 'saved' | 'saving' | 'error' | 'pending';
}

type ZenAction =
  | { type: 'START_SESSION'; session: MemorialSession }
  | { type: 'UPDATE_SESSION'; updates: Partial<MemorialSession> }
  | { type: 'PAUSE_SESSION'; reason: string }
  | { type: 'RESUME_SESSION' }
  | { type: 'COMPLETE_SESSION'; candidate: string }
  | { type: 'AUTO_SAVE' }
  | { type: 'NETWORK_CHANGE'; status: 'online' | 'offline' | 'slow' }
  | { type: 'UPDATE_SKILLS'; updates: Partial<UserSkillProfile> }
  | { type: 'UNLOCK_EASTER_EGG'; eggId: string }
  | { type: 'UPDATE_DELIGHT'; updates: Partial<DelightState> }
  | { type: 'SEASONAL_CHANGE'; season: 'spring' | 'summer' | 'autumn' | 'winter' };

// IndexedDB utilities
class MemorialDB {
  private dbName = 'JizaiMemorialDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('userId', 'userId', { unique: false });
          sessionStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Skills store
        if (!db.objectStoreNames.contains('skills')) {
          db.createObjectStore('skills', { keyPath: 'userId' });
        }
        
        // Delight store
        if (!db.objectStoreNames.contains('delight')) {
          db.createObjectStore('delight', { keyPath: 'userId' });
        }
      };
    });
  }

  async saveSession(session: MemorialSession): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      const request = store.put({ ...session, lastSave: Date.now() });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async loadSession(sessionId: string): Promise<MemorialSession | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readonly');
      const store = transaction.objectStore('sessions');
      const request = store.get(sessionId);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveSkillProfile(profile: UserSkillProfile & { userId: string }): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['skills'], 'readwrite');
      const store = transaction.objectStore('skills');
      const request = store.put(profile);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async loadSkillProfile(userId: string): Promise<UserSkillProfile | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['skills'], 'readonly');
      const store = transaction.objectStore('skills');
      const request = store.get(userId);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const { userId: _, ...profile } = result;
          resolve(profile);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveDelightState(state: DelightState & { userId: string }): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['delight'], 'readwrite');
      const store = transaction.objectStore('delight');
      const request = store.put(state);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async loadDelightState(userId: string): Promise<DelightState | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['delight'], 'readonly');
      const store = transaction.objectStore('delight');
      const request = store.get(userId);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const { userId: _, ...state } = result;
          resolve(state);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

// Seasonal and cultural utilities
const getCurrentSeason = (): 'spring' | 'summer' | 'autumn' | 'winter' => {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
};

const getCulturalEvents = (): { date: string; event: string; greeting: string }[] => {
  const year = new Date().getFullYear();
  return [
    { date: `${year}-01-01`, event: '元旦', greeting: '新年あけましておめでとうございます。大切なお写真を美しく仕上げさせていただきます。' },
    { date: `${year}-03-21`, event: '春分の日', greeting: '春の訪れとともに、お写真に新しい輝きをお届けいたします。' },
    { date: `${year}-04-08`, event: '花祭り', greeting: '花々が咲き誇る季節に、思い出のお写真を大切に仕上げます。' },
    { date: `${year}-05-05`, event: 'こどもの日', greeting: '新緑の季節、家族の絆を感じるお写真作りをお手伝いいたします。' },
    { date: `${year}-07-07`, event: '七夕', greeting: '織姫と彦星のように、大切な思い出を永遠に美しく残します。' },
    { date: `${year}-08-15`, event: 'お盆', greeting: 'ご先祖様への感謝とともに、心を込めてお写真をお作りいたします。' },
    { date: `${year}-09-23`, event: '秋分の日', greeting: '実りの秋に、思い出の写真も美しく実らせましょう。' },
    { date: `${year}-11-15`, event: '七五三', greeting: '成長への祈りと共に、この大切な瞬間を美しく残します。' },
    { date: `${year}-12-31`, event: '大晦日', greeting: '一年の感謝と共に、大切なお写真を心を込めて仕上げさせていただきます。' }
  ];
};

const memorialDB = new MemorialDB();

// Initial state
const initialState: ZenState = {
  currentSession: null,
  userSkillProfile: {
    level: 1,
    sessionsCompleted: 0,
    averageCompletionTime: 0,
    preferredStyles: [],
    skillUnlocks: [],
    lastActivityDate: Date.now(),
    behaviorPattern: {
      quickDecisionMaker: false,
      perfectionist: false,
      traditionalist: false,
      modernist: false
    }
  },
  delightState: {
    easterEggsFound: [],
    specialDates: [],
    seasonalTheme: getCurrentSeason(),
    completionCount: 0,
    lastCompletionDate: 0,
    streakDays: 0,
    unlockedMessages: [],
    culturalEvents: getCulturalEvents()
  },
  isAutoSaving: false,
  isPaused: false,
  lastInteraction: Date.now(),
  networkStatus: 'online',
  saveStatus: 'saved'
};

// Reducer
const zenReducer = (state: ZenState, action: ZenAction): ZenState => {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...state,
        currentSession: action.session,
        isPaused: false,
        lastInteraction: Date.now(),
        saveStatus: 'pending'
      };

    case 'UPDATE_SESSION':
      if (!state.currentSession) return state;
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          ...action.updates,
          timestamp: Date.now()
        },
        lastInteraction: Date.now(),
        saveStatus: 'pending'
      };

    case 'PAUSE_SESSION':
      return {
        ...state,
        isPaused: true,
        isAutoSaving: true
      };

    case 'RESUME_SESSION':
      return {
        ...state,
        isPaused: false,
        lastInteraction: Date.now()
      };

    case 'COMPLETE_SESSION':
      if (!state.currentSession) return state;
      
      const completionTime = Date.now() - state.currentSession.timestamp;
      const newAverage = state.userSkillProfile.sessionsCompleted === 0 
        ? completionTime 
        : (state.userSkillProfile.averageCompletionTime * state.userSkillProfile.sessionsCompleted + completionTime) / (state.userSkillProfile.sessionsCompleted + 1);

      // Detect behavior patterns
      const isQuick = completionTime < 60000; // Under 1 minute
      const isPerfectionist = state.currentSession.candidates.length > 1; // Used retry
      
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          selectedCandidate: action.candidate,
          isComplete: true
        },
        userSkillProfile: {
          ...state.userSkillProfile,
          sessionsCompleted: state.userSkillProfile.sessionsCompleted + 1,
          averageCompletionTime: newAverage,
          behaviorPattern: {
            ...state.userSkillProfile.behaviorPattern,
            quickDecisionMaker: isQuick || state.userSkillProfile.behaviorPattern.quickDecisionMaker,
            perfectionist: isPerfectionist || state.userSkillProfile.behaviorPattern.perfectionist
          }
        },
        delightState: {
          ...state.delightState,
          completionCount: state.delightState.completionCount + 1,
          lastCompletionDate: Date.now()
        },
        saveStatus: 'saving'
      };

    case 'AUTO_SAVE':
      return {
        ...state,
        isAutoSaving: true,
        saveStatus: 'saving'
      };

    case 'NETWORK_CHANGE':
      return {
        ...state,
        networkStatus: action.status
      };

    case 'UPDATE_SKILLS':
      return {
        ...state,
        userSkillProfile: {
          ...state.userSkillProfile,
          ...action.updates
        }
      };

    case 'UNLOCK_EASTER_EGG':
      return {
        ...state,
        delightState: {
          ...state.delightState,
          easterEggsFound: [...state.delightState.easterEggsFound, action.eggId]
        }
      };

    case 'UPDATE_DELIGHT':
      return {
        ...state,
        delightState: {
          ...state.delightState,
          ...action.updates
        }
      };

    case 'SEASONAL_CHANGE':
      return {
        ...state,
        delightState: {
          ...state.delightState,
          seasonalTheme: action.season,
          culturalEvents: getCulturalEvents()
        }
      };

    default:
      return state;
  }
};

// Context
interface ZenContextType {
  state: ZenState;
  dispatch: React.Dispatch<ZenAction>;
  startSession: (imageFile: File) => Promise<void>;
  updateSession: (updates: Partial<MemorialSession>) => void;
  pauseSession: (reason: string) => void;
  resumeSession: () => void;
  completeSession: (candidateId: string) => Promise<void>;
  unlockEasterEgg: (eggId: string) => void;
  getPersonalizedMessage: () => string;
  getTodaysGreeting: () => string;
  checkSpecialDate: () => { isSpecial: boolean; message?: string };
}

const ZenContext = createContext<ZenContextType | undefined>(undefined);

// Provider component
export const ZenModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(zenReducer, initialState);

  // Initialize database and load saved data
  useEffect(() => {
    const initializeZenMode = async () => {
      try {
        await memorialDB.init();
        
        // Load user data
        const userId = 'default-user'; // In real app, get from auth
        const skillProfile = await memorialDB.loadSkillProfile(userId);
        const delightState = await memorialDB.loadDelightState(userId);
        
        if (skillProfile) {
          dispatch({ type: 'UPDATE_SKILLS', updates: skillProfile });
        }
        
        if (delightState) {
          dispatch({ type: 'UPDATE_DELIGHT', updates: delightState });
        }
      } catch (error) {
        console.warn('Failed to initialize ZenMode:', error);
      }
    };

    initializeZenMode();
  }, []);

  // Auto-save mechanism
  useEffect(() => {
    const saveInterval = setInterval(async () => {
      if (state.currentSession && state.saveStatus === 'pending') {
        dispatch({ type: 'AUTO_SAVE' });
        
        try {
          await memorialDB.saveSession(state.currentSession);
          // Save skill profile and delight state
          const userId = 'default-user';
          await memorialDB.saveSkillProfile({ ...state.userSkillProfile, userId });
          await memorialDB.saveDelightState({ ...state.delightState, userId });
          
          // Update save status after successful save
          setTimeout(() => {
            dispatch({ type: 'NETWORK_CHANGE', status: 'online' });
          }, 100);
        } catch (error) {
          console.warn('Auto-save failed:', error);
        }
      }
    }, 30000); // 30 seconds

    return () => clearInterval(saveInterval);
  }, [state.currentSession, state.saveStatus, state.userSkillProfile, state.delightState]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'NETWORK_CHANGE', status: 'online' });
    const handleOffline = () => dispatch({ type: 'NETWORK_CHANGE', status: 'offline' });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Visibility change handling (for phone calls, app switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App is going into background
        if (state.currentSession && !state.isPaused) {
          dispatch({ type: 'PAUSE_SESSION', reason: 'background' });
        }
      } else {
        // App is coming back to foreground
        if (state.isPaused) {
          dispatch({ type: 'RESUME_SESSION' });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.currentSession, state.isPaused]);

  // Seasonal updates
  useEffect(() => {
    const checkSeason = () => {
      const currentSeason = getCurrentSeason();
      if (currentSeason !== state.delightState.seasonalTheme) {
        dispatch({ type: 'SEASONAL_CHANGE', season: currentSeason });
      }
    };

    // Check season daily
    const seasonInterval = setInterval(checkSeason, 24 * 60 * 60 * 1000);
    return () => clearInterval(seasonInterval);
  }, [state.delightState.seasonalTheme]);

  // Context functions
  const startSession = useCallback(async (imageFile: File) => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const reader = new FileReader();
    
    reader.onload = () => {
      const newSession: MemorialSession = {
        id: sessionId,
        userId: 'default-user',
        imageData: reader.result as string,
        processingStage: 'idle',
        candidates: [],
        selectedCandidate: null,
        progress: 0,
        timestamp: Date.now(),
        lastSave: Date.now(),
        isComplete: false
      };

      dispatch({ type: 'START_SESSION', session: newSession });
      track('zen_session_started', { sessionId });
    };

    reader.readAsDataURL(imageFile);
  }, []);

  const updateSession = useCallback((updates: Partial<MemorialSession>) => {
    dispatch({ type: 'UPDATE_SESSION', updates });
  }, []);

  const pauseSession = useCallback((reason: string) => {
    dispatch({ type: 'PAUSE_SESSION', reason });
    track('zen_session_paused', { reason });
  }, []);

  const resumeSession = useCallback(() => {
    dispatch({ type: 'RESUME_SESSION' });
    track('zen_session_resumed');
  }, []);

  const completeSession = useCallback(async (candidateId: string) => {
    dispatch({ type: 'COMPLETE_SESSION', candidate: candidateId });
    
    // Check for easter eggs
    if (state.userSkillProfile.sessionsCompleted === 0) {
      dispatch({ type: 'UNLOCK_EASTER_EGG', eggId: 'first_completion' });
    }
    
    if (state.delightState.completionCount + 1 === 10) {
      dispatch({ type: 'UNLOCK_EASTER_EGG', eggId: 'ten_completions' });
    }

    track('zen_session_completed', { 
      candidateId, 
      sessionCount: state.userSkillProfile.sessionsCompleted + 1 
    });
  }, [state.userSkillProfile.sessionsCompleted, state.delightState.completionCount]);

  const unlockEasterEgg = useCallback((eggId: string) => {
    dispatch({ type: 'UNLOCK_EASTER_EGG', eggId });
    track('easter_egg_unlocked', { eggId });
  }, []);

  const getPersonalizedMessage = useCallback((): string => {
    const { sessionsCompleted, behaviorPattern } = state.userSkillProfile;
    const { completionCount } = state.delightState;
    
    if (sessionsCompleted === 0) {
      return "初めてのご利用、ありがとうございます。大切なお写真を心を込めて仕上げさせていただきます。";
    }
    
    if (sessionsCompleted < 5) {
      return "いつもご利用いただき、ありがとうございます。お客様のご要望にお応えできるよう努めております。";
    }
    
    if (behaviorPattern.quickDecisionMaker) {
      return "いつも素早いご判断をありがとうございます。効率的にお手伝いさせていただきます。";
    }
    
    if (behaviorPattern.perfectionist) {
      return "細部へのこだわりをお持ちのお客様ですね。より美しい仕上がりを目指してまいります。";
    }
    
    if (completionCount > 20) {
      return "長きに渡りご愛用いただき、心より感謝申し上げます。これからも末永くお付き合いください。";
    }
    
    return "今日も大切なお写真を美しく仕上げさせていただきます。";
  }, [state.userSkillProfile, state.delightState]);

  const getTodaysGreeting = useCallback((): string => {
    const today = new Date().toISOString().split('T')[0];
    const culturalEvent = state.delightState.culturalEvents.find(event => event.date === today);
    
    if (culturalEvent) {
      return culturalEvent.greeting;
    }
    
    const hour = new Date().getHours();
    if (hour < 10) return "おはようございます。今日も心を込めて、お写真をお作りいたします。";
    if (hour < 17) return "こんにちは。美しいお写真作りをお手伝いさせていただきます。";
    return "こんばんは。大切なお時間に、丁寧にお写真を仕上げさせていただきます。";
  }, [state.delightState.culturalEvents]);

  const checkSpecialDate = useCallback((): { isSpecial: boolean; message?: string } => {
    const today = new Date().toISOString().split('T')[0];
    const culturalEvent = state.delightState.culturalEvents.find(event => event.date === today);
    
    if (culturalEvent) {
      return { isSpecial: true, message: `${culturalEvent.event}ですね。${culturalEvent.greeting}` };
    }
    
    // Check if it's exactly one year after first use
    const firstUse = new Date(state.userSkillProfile.lastActivityDate);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    if (Math.abs(firstUse.getTime() - oneYearAgo.getTime()) < 24 * 60 * 60 * 1000) {
      return { 
        isSpecial: true, 
        message: "ご利用開始から1年が経ちました。長きに渡りご愛用いただき、誠にありがとうございます。これからも美しい思い出作りをお手伝いさせていただきます。" 
      };
    }
    
    return { isSpecial: false };
  }, [state.delightState.culturalEvents, state.userSkillProfile.lastActivityDate]);

  const contextValue: ZenContextType = {
    state,
    dispatch,
    startSession,
    updateSession,
    pauseSession,
    resumeSession,
    completeSession,
    unlockEasterEgg,
    getPersonalizedMessage,
    getTodaysGreeting,
    checkSpecialDate
  };

  return (
    <ZenContext.Provider value={contextValue}>
      {children}
    </ZenContext.Provider>
  );
};

// Custom hook
export const useZenMode = () => {
  const context = useContext(ZenContext);
  if (context === undefined) {
    throw new Error('useZenMode must be used within a ZenModeProvider');
  }
  return context;
};

// Export types for other components
export type { MemorialSession, MemorialCandidate, UserSkillProfile, DelightState, ZenState };