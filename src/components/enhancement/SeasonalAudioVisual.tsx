import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useZenMode } from '../../contexts/ZenModeContext';
import { usePersonalization } from '../../contexts/PersonalizationContext';

// Audio-Visual Enhancement Types
interface AudioTrack {
  id: string;
  name: string;
  url: string; // In production, these would be real audio files
  duration: number;
  loop: boolean;
  season: 'spring' | 'summer' | 'autumn' | 'winter' | 'all';
  mood: 'peaceful' | 'contemplative' | 'gentle' | 'warm' | 'serene';
  volume: number; // 0-1
  fadeIn: boolean;
  fadeOut: boolean;
}

interface VisualEffect {
  id: string;
  name: string;
  type: 'particle' | 'ambient' | 'transition' | 'decorative';
  season: 'spring' | 'summer' | 'autumn' | 'winter' | 'all';
  intensity: 'subtle' | 'moderate' | 'prominent';
  duration: number; // -1 for continuous
  zIndex: number;
  particles?: {
    count: number;
    size: { min: number; max: number };
    speed: { min: number; max: number };
    opacity: { min: number; max: number };
    color: string[];
    shape: 'circle' | 'petal' | 'leaf' | 'snowflake' | 'spark';
    physics: {
      gravity: number;
      wind: number;
      drift: number;
    };
  };
  ambient?: {
    colorOverlay: string;
    blendMode: 'multiply' | 'screen' | 'overlay' | 'soft-light';
    gradientDirection: number; // degrees
    pulsation: boolean;
    pulseDuration: number;
  };
}

interface AudioVisualState {
  currentSeason: 'spring' | 'summer' | 'autumn' | 'winter';
  ambientAudioEnabled: boolean;
  ambientAudioVolume: number;
  visualEffectsEnabled: boolean;
  visualEffectsIntensity: 'subtle' | 'moderate' | 'prominent';
  activeAudioTracks: Set<string>;
  activeVisualEffects: Set<string>;
  userPreferences: {
    preferredMoods: string[];
    disabledEffects: string[];
    customVolumes: Map<string, number>;
    timeBasedAdjustments: boolean;
    culturalSoundscape: boolean;
  };
  contextualMode: 'memorial_creation' | 'family_viewing' | 'reflection' | 'celebration' | 'default';
}

// Predefined Audio Tracks (URLs would point to actual audio files in production)
const audioLibrary: AudioTrack[] = [
  // Spring Sounds
  {
    id: 'spring_breeze',
    name: '春風',
    url: '/audio/spring_breeze.mp3',
    duration: 180,
    loop: true,
    season: 'spring',
    mood: 'gentle',
    volume: 0.3,
    fadeIn: true,
    fadeOut: true
  },
  {
    id: 'cherry_blossoms',
    name: '桜のささやき',
    url: '/audio/cherry_blossoms.mp3',
    duration: 240,
    loop: true,
    season: 'spring',
    mood: 'peaceful',
    volume: 0.25,
    fadeIn: true,
    fadeOut: true
  },
  
  // Summer Sounds
  {
    id: 'summer_cicadas',
    name: '夏の蝉',
    url: '/audio/summer_cicadas.mp3',
    duration: 300,
    loop: true,
    season: 'summer',
    mood: 'warm',
    volume: 0.2,
    fadeIn: true,
    fadeOut: true
  },
  {
    id: 'gentle_waves',
    name: '静かな波音',
    url: '/audio/gentle_waves.mp3',
    duration: 360,
    loop: true,
    season: 'summer',
    mood: 'serene',
    volume: 0.3,
    fadeIn: true,
    fadeOut: true
  },
  
  // Autumn Sounds
  {
    id: 'autumn_leaves',
    name: '落ち葉のささやき',
    url: '/audio/autumn_leaves.mp3',
    duration: 200,
    loop: true,
    season: 'autumn',
    mood: 'contemplative',
    volume: 0.25,
    fadeIn: true,
    fadeOut: true
  },
  {
    id: 'temple_bells',
    name: '寺の鐘',
    url: '/audio/temple_bells.mp3',
    duration: 120,
    loop: false,
    season: 'autumn',
    mood: 'contemplative',
    volume: 0.4,
    fadeIn: true,
    fadeOut: true
  },
  
  // Winter Sounds
  {
    id: 'gentle_snow',
    name: '雪のささやき',
    url: '/audio/gentle_snow.mp3',
    duration: 270,
    loop: true,
    season: 'winter',
    mood: 'serene',
    volume: 0.2,
    fadeIn: true,
    fadeOut: true
  },
  {
    id: 'winter_silence',
    name: '静寂',
    url: '/audio/winter_silence.mp3',
    duration: 180,
    loop: true,
    season: 'winter',
    mood: 'peaceful',
    volume: 0.15,
    fadeIn: true,
    fadeOut: true
  },
  
  // Universal Sounds
  {
    id: 'meditation_bowl',
    name: '瞑想の鈴',
    url: '/audio/meditation_bowl.mp3',
    duration: 30,
    loop: false,
    season: 'all',
    mood: 'contemplative',
    volume: 0.5,
    fadeIn: false,
    fadeOut: true
  },
  {
    id: 'gentle_rain',
    name: '優しい雨音',
    url: '/audio/gentle_rain.mp3',
    duration: 420,
    loop: true,
    season: 'all',
    mood: 'peaceful',
    volume: 0.3,
    fadeIn: true,
    fadeOut: true
  }
];

// Predefined Visual Effects
const visualEffectsLibrary: VisualEffect[] = [
  // Spring Effects
  {
    id: 'sakura_petals',
    name: '桜の花びら',
    type: 'particle',
    season: 'spring',
    intensity: 'moderate',
    duration: -1,
    zIndex: 10,
    particles: {
      count: 15,
      size: { min: 3, max: 8 },
      speed: { min: 0.5, max: 2 },
      opacity: { min: 0.6, max: 0.9 },
      color: ['#FFB7C5', '#FFC0CB', '#FFFFFF', '#F8BBD9'],
      shape: 'petal',
      physics: {
        gravity: 0.1,
        wind: 0.3,
        drift: 0.5
      }
    }
  },
  
  // Summer Effects
  {
    id: 'light_sparkles',
    name: '光のきらめき',
    type: 'particle',
    season: 'summer',
    intensity: 'subtle',
    duration: -1,
    zIndex: 5,
    particles: {
      count: 8,
      size: { min: 1, max: 3 },
      speed: { min: 0.2, max: 1 },
      opacity: { min: 0.4, max: 0.8 },
      color: ['#FFD700', '#FFFFFF', '#FFF8DC', '#F0E68C'],
      shape: 'spark',
      physics: {
        gravity: -0.05,
        wind: 0.1,
        drift: 0.8
      }
    }
  },
  
  // Autumn Effects
  {
    id: 'falling_leaves',
    name: '落ち葉',
    type: 'particle',
    season: 'autumn',
    intensity: 'moderate',
    duration: -1,
    zIndex: 10,
    particles: {
      count: 12,
      size: { min: 4, max: 10 },
      speed: { min: 0.8, max: 2.5 },
      opacity: { min: 0.7, max: 0.95 },
      color: ['#CD853F', '#D2691E', '#B22222', '#FF8C00', '#DAA520'],
      shape: 'leaf',
      physics: {
        gravity: 0.15,
        wind: 0.4,
        drift: 0.6
      }
    }
  },
  
  // Winter Effects
  {
    id: 'snowflakes',
    name: '雪の結晶',
    type: 'particle',
    season: 'winter',
    intensity: 'moderate',
    duration: -1,
    zIndex: 15,
    particles: {
      count: 20,
      size: { min: 2, max: 6 },
      speed: { min: 0.3, max: 1.5 },
      opacity: { min: 0.5, max: 0.9 },
      color: ['#FFFFFF', '#F0F8FF', '#E6E6FA'],
      shape: 'snowflake',
      physics: {
        gravity: 0.08,
        wind: 0.2,
        drift: 0.4
      }
    }
  },
  
  // Ambient Effects
  {
    id: 'warm_glow',
    name: '温かな光',
    type: 'ambient',
    season: 'all',
    intensity: 'subtle',
    duration: -1,
    zIndex: 1,
    ambient: {
      colorOverlay: 'rgba(255, 248, 220, 0.1)',
      blendMode: 'soft-light',
      gradientDirection: 45,
      pulsation: true,
      pulseDuration: 8000
    }
  }
];

interface SeasonalAudioVisualProps {
  className?: string;
  contextualMode?: AudioVisualState['contextualMode'];
  onEffectChange?: (effectId: string, active: boolean) => void;
}

export const SeasonalAudioVisual: React.FC<SeasonalAudioVisualProps> = ({
  className = '',
  contextualMode = 'default',
  onEffectChange
}) => {
  // Contexts
  const { currentSeason } = useZenMode();
  const { adaptiveInterface, culturalPersonalization } = usePersonalization();
  
  // State
  const [audioVisualState, setAudioVisualState] = useState<AudioVisualState>({
    currentSeason: currentSeason || 'spring',
    ambientAudioEnabled: true,
    ambientAudioVolume: 0.3,
    visualEffectsEnabled: true,
    visualEffectsIntensity: 'moderate',
    activeAudioTracks: new Set(),
    activeVisualEffects: new Set(),
    userPreferences: {
      preferredMoods: ['peaceful', 'contemplative'],
      disabledEffects: [],
      customVolumes: new Map(),
      timeBasedAdjustments: true,
      culturalSoundscape: culturalPersonalization?.seasonalPreferences.observe_japanese_calendar || true
    },
    contextualMode
  });

  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const gainNodesRef = useRef<Map<string, GainNode>>(new Map());

  // Initialize Audio Context
  useEffect(() => {
    const initializeAudioContext = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Resume context if suspended (required for some browsers)
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
      } catch (error) {
        console.warn('Failed to initialize AudioContext:', error);
      }
    };

    initializeAudioContext();
  }, []);

  // Season-based Audio Selection
  const getRelevantAudioTracks = useCallback((season: string, mood?: string) => {
    return audioLibrary.filter(track => 
      (track.season === season || track.season === 'all') &&
      (!mood || track.mood === mood) &&
      !audioVisualState.userPreferences.disabledEffects.includes(track.id)
    );
  }, [audioVisualState.userPreferences.disabledEffects]);

  // Season-based Visual Effects Selection
  const getRelevantVisualEffects = useCallback((season: string, intensity: string) => {
    return visualEffectsLibrary.filter(effect =>
      (effect.season === season || effect.season === 'all') &&
      effect.intensity === intensity &&
      !audioVisualState.userPreferences.disabledEffects.includes(effect.id)
    );
  }, [audioVisualState.userPreferences.disabledEffects]);

  // Audio Management
  const playAudioTrack = useCallback(async (trackId: string) => {
    if (!audioContextRef.current) return;

    const track = audioLibrary.find(t => t.id === trackId);
    if (!track) return;

    try {
      // Create or get audio element
      let audioElement = audioElementsRef.current.get(trackId);
      if (!audioElement) {
        audioElement = new Audio();
        audioElement.src = track.url; // In production, this would be a real URL
        audioElement.loop = track.loop;
        audioElementsRef.current.set(trackId, audioElement);

        // Create gain node for volume control
        const source = audioContextRef.current.createMediaElementSource(audioElement);
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
        
        source.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        gainNodesRef.current.set(trackId, gainNode);
      }

      const gainNode = gainNodesRef.current.get(trackId);
      if (!gainNode) return;

      // Set initial volume
      const customVolume = audioVisualState.userPreferences.customVolumes.get(trackId);
      const targetVolume = (customVolume !== undefined ? customVolume : track.volume) * 
                          audioVisualState.ambientAudioVolume;

      // Fade in if enabled
      if (track.fadeIn) {
        gainNode.gain.linearRampToValueAtTime(targetVolume, audioContextRef.current.currentTime + 2);
      } else {
        gainNode.gain.setValueAtTime(targetVolume, audioContextRef.current.currentTime);
      }

      await audioElement.play();
      
      setAudioVisualState(prev => ({
        ...prev,
        activeAudioTracks: new Set([...prev.activeAudioTracks, trackId])
      }));

      onEffectChange?.(trackId, true);

    } catch (error) {
      console.warn(`Failed to play audio track ${trackId}:`, error);
      
      // Fallback: Simulate audio with visual feedback only
      setAudioVisualState(prev => ({
        ...prev,
        activeAudioTracks: new Set([...prev.activeAudioTracks, trackId])
      }));
    }
  }, [audioVisualState.ambientAudioVolume, audioVisualState.userPreferences.customVolumes, onEffectChange]);

  const stopAudioTrack = useCallback((trackId: string) => {
    const audioElement = audioElementsRef.current.get(trackId);
    const gainNode = gainNodesRef.current.get(trackId);

    if (audioElement && gainNode && audioContextRef.current) {
      const track = audioLibrary.find(t => t.id === trackId);
      
      if (track?.fadeOut) {
        gainNode.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 1);
        setTimeout(() => {
          audioElement.pause();
          audioElement.currentTime = 0;
        }, 1000);
      } else {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    }

    setAudioVisualState(prev => ({
      ...prev,
      activeAudioTracks: new Set([...prev.activeAudioTracks].filter(id => id !== trackId))
    }));

    onEffectChange?.(trackId, false);
  }, [onEffectChange]);

  // Visual Effects Rendering
  const renderParticleEffect = useCallback((effect: VisualEffect) => {
    if (!effect.particles) return null;

    const particles = Array.from({ length: effect.particles.count }, (_, i) => {
      const size = Math.random() * (effect.particles!.size.max - effect.particles!.size.min) + effect.particles!.size.min;
      const speed = Math.random() * (effect.particles!.speed.max - effect.particles!.speed.min) + effect.particles!.speed.min;
      const opacity = Math.random() * (effect.particles!.opacity.max - effect.particles!.opacity.min) + effect.particles!.opacity.min;
      const color = effect.particles!.color[Math.floor(Math.random() * effect.particles!.color.length)];
      const startX = Math.random() * window.innerWidth;
      const startY = Math.random() * -100 - 50; // Start above viewport

      return (
        <div
          key={`${effect.id}-particle-${i}`}
          className="absolute pointer-events-none animate-fall"
          style={{
            left: startX,
            top: startY,
            width: size,
            height: size,
            backgroundColor: color,
            opacity,
            borderRadius: effect.particles!.shape === 'circle' ? '50%' : '0%',
            zIndex: effect.zIndex,
            animationDuration: `${20 / speed}s`,
            animationDelay: `${Math.random() * 5}s`,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'linear'
          }}
        />
      );
    });

    return particles;
  }, []);

  const renderAmbientEffect = useCallback((effect: VisualEffect) => {
    if (!effect.ambient) return null;

    return (
      <div
        key={`${effect.id}-ambient`}
        className="fixed inset-0 pointer-events-none"
        style={{
          background: effect.ambient.colorOverlay,
          mixBlendMode: effect.ambient.blendMode,
          zIndex: effect.zIndex,
          animation: effect.ambient.pulsation ? `pulse ${effect.ambient.pulseDuration}ms infinite ease-in-out` : undefined
        }}
      />
    );
  }, []);

  // Seasonal Adaptation
  const adaptToSeason = useCallback((season: 'spring' | 'summer' | 'autumn' | 'winter') => {
    // Stop current effects
    audioVisualState.activeAudioTracks.forEach(trackId => stopAudioTrack(trackId));
    
    setAudioVisualState(prev => ({
      ...prev,
      currentSeason: season,
      activeVisualEffects: new Set()
    }));

    // Start new seasonal effects
    if (audioVisualState.ambientAudioEnabled) {
      const relevantTracks = getRelevantAudioTracks(season);
      const selectedTrack = relevantTracks.find(track => 
        audioVisualState.userPreferences.preferredMoods.includes(track.mood)
      ) || relevantTracks[0];

      if (selectedTrack) {
        playAudioTrack(selectedTrack.id);
      }
    }

    if (audioVisualState.visualEffectsEnabled) {
      const relevantEffects = getRelevantVisualEffects(season, audioVisualState.visualEffectsIntensity);
      
      setAudioVisualState(prev => ({
        ...prev,
        activeVisualEffects: new Set(relevantEffects.map(e => e.id))
      }));
    }
  }, [audioVisualState.ambientAudioEnabled, audioVisualState.visualEffectsEnabled, audioVisualState.visualEffectsIntensity, audioVisualState.userPreferences.preferredMoods, getRelevantAudioTracks, getRelevantVisualEffects, playAudioTrack, stopAudioTrack]);

  // Time-based Adjustments
  useEffect(() => {
    if (!audioVisualState.userPreferences.timeBasedAdjustments) return;

    const adjustForTimeOfDay = () => {
      const hour = new Date().getHours();
      let volumeMultiplier = 1;

      // Quieter during early morning and late evening
      if (hour < 7 || hour > 22) {
        volumeMultiplier = 0.5;
      } else if (hour < 9 || hour > 20) {
        volumeMultiplier = 0.7;
      }

      setAudioVisualState(prev => ({
        ...prev,
        ambientAudioVolume: Math.min(0.5, prev.ambientAudioVolume * volumeMultiplier)
      }));
    };

    adjustForTimeOfDay();
    const interval = setInterval(adjustForTimeOfDay, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, [audioVisualState.userPreferences.timeBasedAdjustments]);

  // Season Detection and Adaptation
  useEffect(() => {
    if (currentSeason && currentSeason !== audioVisualState.currentSeason) {
      adaptToSeason(currentSeason);
    }
  }, [currentSeason, audioVisualState.currentSeason, adaptToSeason]);

  // Contextual Mode Adaptation
  useEffect(() => {
    const adaptToContext = () => {
      switch (contextualMode) {
        case 'memorial_creation':
          setAudioVisualState(prev => ({
            ...prev,
            ambientAudioVolume: Math.min(prev.ambientAudioVolume, 0.2),
            visualEffectsIntensity: 'subtle',
            userPreferences: {
              ...prev.userPreferences,
              preferredMoods: ['peaceful', 'contemplative']
            }
          }));
          break;

        case 'family_viewing':
          setAudioVisualState(prev => ({
            ...prev,
            ambientAudioVolume: Math.min(prev.ambientAudioVolume, 0.25),
            visualEffectsIntensity: 'moderate'
          }));
          break;

        case 'celebration':
          setAudioVisualState(prev => ({
            ...prev,
            ambientAudioVolume: Math.min(prev.ambientAudioVolume, 0.4),
            visualEffectsIntensity: 'prominent'
          }));
          break;

        default:
          // No specific adaptations for default mode
          break;
      }
    };

    adaptToContext();
  }, [contextualMode]);

  // Cleanup
  useEffect(() => {
    return () => {
      // Stop all audio tracks and clean up
      audioVisualState.activeAudioTracks.forEach(trackId => stopAudioTrack(trackId));
      audioElementsRef.current.clear();
      gainNodesRef.current.clear();
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Render Active Visual Effects
  const activeEffects = Array.from(audioVisualState.activeVisualEffects)
    .map(effectId => visualEffectsLibrary.find(e => e.id === effectId))
    .filter(Boolean) as VisualEffect[];

  return (
    <div className={`fixed inset-0 pointer-events-none ${className}`}>
      {/* Ambient Effects */}
      {activeEffects
        .filter(effect => effect.type === 'ambient')
        .map(effect => renderAmbientEffect(effect))}

      {/* Particle Effects */}
      {activeEffects
        .filter(effect => effect.type === 'particle')
        .map(effect => renderParticleEffect(effect))}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-100px) translateX(0px) rotate(0deg);
          }
          100% {
            transform: translateY(100vh) translateX(50px) rotate(360deg);
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        
        .animate-fall {
          animation: fall linear infinite;
        }
      `}</style>
    </div>
  );
};

// Control Panel Component
interface AudioVisualControlsProps {
  className?: string;
}

export const AudioVisualControls: React.FC<AudioVisualControlsProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-white/80 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white/90 transition-colors"
      >
        🎵
      </button>
      
      {isExpanded && (
        <div className="absolute top-12 right-0 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-xl min-w-[200px]">
          <h3 className="font-medium mb-3">環境設定</h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600 block mb-1">音響効果</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                className="w-full" 
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-600 block mb-1">視覚効果</label>
              <select className="w-full text-sm border rounded p-1">
                <option value="subtle">控えめ</option>
                <option value="moderate">適度</option>
                <option value="prominent">豊か</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span>季節の自動調整</span>
              <input type="checkbox" defaultChecked />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};