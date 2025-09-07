import { useState, useEffect, useRef, useCallback } from 'react';
import { JZButton } from '../design-system/jizai-button';
import { JZPhotoIcon, JZSparklesIcon, JZHeartIcon } from '../design-system/jizai-icons';
import { track } from '../../lib/analytics';
import { useZenMode } from '../../contexts/ZenModeContext';
import { DelightLayers } from '../zen/DelightLayers';
import { SeasonalTheme, useSeasonalContext } from '../zen/SeasonalTheme';

interface MemorialPhotoScreenProps {
  onNavigate: (screen: string) => void;
}

type ProcessingStage = 'idle' | 'uploading' | 'detecting' | 'enhancing' | 'generating' | 'complete';

interface MemorialCandidate {
  id: string;
  imageUrl: string;
  style: 'elegant' | 'warm' | 'serene';
  description: string;
}

export const MemorialPhotoScreen: React.FC<MemorialPhotoScreenProps> = ({ onNavigate }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('idle');
  const [candidates, setCandidates] = useState<MemorialCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [showRetryButton, setShowRetryButton] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Zen Mode integration
  const {
    state: zenState,
    startSession,
    updateSession,
    pauseSession,
    resumeSession,
    completeSession,
    getPersonalizedMessage,
    getTodaysGreeting,
    checkSpecialDate
  } = useZenMode();
  
  const { getSeasonalGreeting, getTodaysCulturalEvent, getSeasonalSymbol } = useSeasonalContext();
  
  // 呼吸リズムアニメーション
  const [breathingScale, setBreathingScale] = useState(1);
  const breathingInterval = useRef<NodeJS.Timeout>();
  
  // ハプティックフィードバックとオーディオ
  const audioContext = useRef<AudioContext>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 時間帯に応じた色温度
  const [colorTemperature, setColorTemperature] = useState('5000K');
  
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6 || hour > 20) {
      setColorTemperature('2700K'); // 夜 - 温かい光
    } else if (hour < 10 || hour > 16) {
      setColorTemperature('3000K'); // 朝夕 - やや温かい光
    } else {
      setColorTemperature('5000K'); // 日中 - 自然光
    }
  }, []);

  // 呼吸リズムアニメーション (4秒周期 = 15回/分)
  useEffect(() => {
    const startBreathingAnimation = () => {
      let progress = 0;
      breathingInterval.current = setInterval(() => {
        progress += 0.016; // 60fps想定
        const breathingValue = 1 + 0.02 * Math.sin(progress * Math.PI / 2); // 2%の拡縮
        setBreathingScale(breathingValue);
      }, 16);
    };

    startBreathingAnimation();
    
    return () => {
      if (breathingInterval.current) {
        clearInterval(breathingInterval.current);
      }
    };
  }, []);

  // Web Audio APIの初期化
  useEffect(() => {
    try {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }, []);

  // ハプティックフィードバック関数
  const triggerHapticFeedback = useCallback((duration: number = 5) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  }, []);

  // 温もりのある音を生成 (440Hz木の温もり音)
  const playWarmTone = useCallback(() => {
    if (!audioContext.current) return;
    
    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);
    
    oscillator.frequency.setValueAtTime(440, audioContext.current.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.current.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.current.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.current.currentTime + 0.5);
    
    oscillator.start();
    oscillator.stop(audioContext.current.currentTime + 0.5);
  }, []);

  // 完了音 (528Hz)
  const playCompletionTone = useCallback(() => {
    if (!audioContext.current) return;
    
    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);
    
    oscillator.frequency.setValueAtTime(528, audioContext.current.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.current.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, audioContext.current.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.current.currentTime + 0.8);
    
    oscillator.start();
    oscillator.stop(audioContext.current.currentTime + 0.8);
  }, []);

  // 画像選択処理（Zen Mode統合）
  const handleImageSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 瞬間フィードバック (0.1秒以内の反応)
    triggerHapticFeedback(5);
    playWarmTone();
    
    if (file.size > 10 * 1024 * 1024) {
      alert('画像サイズは10MB以下にしてください。');
      return;
    }

    setSelectedImage(file);
    
    // Zen Mode セッション開始
    await startSession(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      // 画像選択と同時にAI処理を開始
      setTimeout(() => startMagicalProcessing(file), 100);
    };
    reader.readAsDataURL(file);
  }, [startSession, triggerHapticFeedback, playWarmTone]);

  // 魔法的な処理プロセス（Zen Mode統合）
  const startMagicalProcessing = useCallback(async (file: File) => {
    track('memorial_photo_processing_started');
    
    const stages: ProcessingStage[] = ['uploading', 'detecting', 'enhancing', 'generating'];
    
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      setProcessingStage(stage);
      setProgress((i / stages.length) * 100);
      
      // Zen Mode セッション更新
      updateSession({ 
        processingStage: stage,
        progress: (i / stages.length) * 100
      });
      
      // 各段階で適切な時間をかける
      const duration = i === 0 ? 300 : i === 3 ? 1500 : 800; // 生成に最も時間をかける
      await new Promise(resolve => setTimeout(resolve, duration));
    }
    
    // 季節とユーザーのスタイル傾向を考慮した候補生成
    const seasonalSymbol = getSeasonalSymbol();
    const personalMessage = getPersonalizedMessage();
    
    const mockCandidates: MemorialCandidate[] = [
      {
        id: '1',
        imageUrl: imagePreview || '',
        style: 'elegant',
        description: `気品ある仕上がり ${seasonalSymbol}`
      },
      {
        id: '2', 
        imageUrl: imagePreview || '',
        style: 'warm',
        description: `温かな印象 ${seasonalSymbol}`
      },
      {
        id: '3',
        imageUrl: imagePreview || '',
        style: 'serene',
        description: `穏やかな雰囲気 ${seasonalSymbol}`
      }
    ];
    
    setCandidates(mockCandidates);
    setProcessingStage('complete');
    setProgress(100);
    setShowRetryButton(true);
    
    // Zen Mode セッション更新
    updateSession({
      processingStage: 'complete',
      progress: 100,
      candidates: mockCandidates
    });
    
    // 完了音とハプティック
    playCompletionTone();
    triggerHapticFeedback(10);
    
    track('memorial_photo_processing_completed', { 
      processing_time: 3000,
      candidates_generated: 3,
      seasonal_theme: zenState.delightState.seasonalTheme,
      user_level: zenState.userSkillProfile.level
    });
  }, [imagePreview, playCompletionTone, triggerHapticFeedback, updateSession, getSeasonalSymbol, getPersonalizedMessage, zenState]);

  // もう一度魔法をかける
  const handleRetryMagic = useCallback(() => {
    if (!selectedImage) return;
    
    triggerHapticFeedback(5);
    playWarmTone();
    setCandidates([]);
    setSelectedCandidate(null);
    setShowRetryButton(false);
    
    setTimeout(() => startMagicalProcessing(selectedImage), 100);
  }, [selectedImage, startMagicalProcessing, triggerHapticFeedback, playWarmTone]);

  const getProcessingMessage = () => {
    switch (processingStage) {
      case 'uploading':
        return '✨ 画像を受け取っています...';
      case 'detecting':
        return '👁️ 表情を理解しています...';
      case 'enhancing':
        return '💫 光を調整しています...';
      case 'generating':
        return '🎨 美しく調整中...';
      case 'complete':
        return '✨ 完成しました';
      default:
        return '';
    }
  };

  // 自動セッション復旧（Zen Mode）
  useEffect(() => {
    if (zenState.currentSession && !zenState.isPaused) {
      // セッションを復旧
      const session = zenState.currentSession;
      if (session.imageData) {
        setImagePreview(session.imageData);
        setProcessingStage(session.processingStage);
        setCandidates(session.candidates);
        setSelectedCandidate(session.selectedCandidate);
        setProgress(session.progress);
        setShowRetryButton(session.isComplete);
      }
    }
  }, [zenState.currentSession, zenState.isPaused]);

  return (
    <SeasonalTheme>
      <div 
        className="min-h-screen bg-[color:var(--jz-seasonal-background)] relative overflow-hidden"
        style={{ 
          transform: `scale(${breathingScale})`,
          transition: 'transform 0.1s ease-out',
          filter: `sepia(0.1) contrast(1.02)` // 色温度調整
        }}
      >
        {/* Delight Layers for Easter Eggs and animations */}
        <DelightLayers />
        
        {/* 季節の背景パターン */}
        <div className="absolute inset-0 pointer-events-none opacity-20" />
        
        {/* ネットワーク状態表示 */}
        {zenState.networkStatus !== 'online' && (
          <div className="fixed top-4 right-4 z-50 bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-2 text-sm text-yellow-800">
            {zenState.networkStatus === 'offline' ? '思い出を大切に保管中...' : 'ゆっくりと処理中...'}
          </div>
        )}
        
        {/* 自動保存状態表示 */}
        {zenState.isAutoSaving && (
          <div className="fixed bottom-4 right-4 z-50 bg-blue-100 border border-blue-300 rounded-lg px-3 py-2 text-sm text-blue-800 flex items-center gap-2">
            <div className="animate-spin h-3 w-3 border-2 border-blue-600 rounded-full border-t-transparent"></div>
            思い出を安全に保存中...
          </div>
        )}

      {/* メインコンテンツ */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        {/* ヘッダー */}
        <div className="absolute top-8 left-8">
          <JZButton
            tone="tertiary"
            onClick={() => onNavigate('home')}
            className="text-[color:var(--color-jz-text-secondary)]"
          >
            ← 戻る
          </JZButton>
        </div>

        {!selectedImage && processingStage === 'idle' && (
          <>
            {/* メインボタン - 画面中央の大きな1つのボタン */}
            <div className="text-center mb-16">
              {/* 季節とパーソナライズドメッセージ */}
              <div className="mb-8">
                {getTodaysCulturalEvent() && (
                  <div className="mb-4 p-4 bg-[color:var(--jz-seasonal-surface)] border border-[color:var(--jz-seasonal-accent)]/30 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-xl">{getTodaysCulturalEvent()?.symbolEmoji}</span>
                      <span className="font-semibold text-[color:var(--jz-seasonal-accent)]">{getTodaysCulturalEvent()?.name}</span>
                    </div>
                    <p className="text-sm text-[color:var(--jz-seasonal-text-secondary)]">
                      {getTodaysCulturalEvent()?.description}
                    </p>
                  </div>
                )}
                <p className="text-sm text-[color:var(--jz-seasonal-text-secondary)] italic">
                  {getSeasonalGreeting()}
                </p>
              </div>
              
              <h1 className="jz-font-display jz-text-display-large text-[color:var(--jz-seasonal-text-primary)] mb-6">
                美しい遺影を作成
              </h1>
              <p className="jz-text-body text-[color:var(--jz-seasonal-text-secondary)] mb-8">
                {getPersonalizedMessage()}
              </p>
              <p className="jz-text-body text-[color:var(--jz-seasonal-text-secondary)] mb-12">
                写真を選ぶだけで、AIが自動で美しく調整します
              </p>
            </div>

            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-80 h-80 bg-gradient-to-br from-[color:var(--color-jz-accent)]/20 to-[color:var(--color-jz-secondary)]/20 rounded-full flex flex-col items-center justify-center border-2 border-dashed border-[color:var(--color-jz-accent)]/30 hover:border-[color:var(--color-jz-accent)]/60 transition-all duration-300 hover:scale-105 cursor-pointer">
                <JZPhotoIcon size={80} className="text-[color:var(--color-jz-accent)] mb-6" />
                <div className="text-center">
                  <div className="jz-text-display-medium text-[color:var(--color-jz-text-primary)] mb-2">
                    写真を選択
                  </div>
                  <div className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
                    タップして開始
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="jz-text-caption text-[color:var(--color-jz-text-tertiary)]">
                JPEGまたはPNG形式、10MB以下
              </p>
            </div>
          </>
        )}

        {/* 処理中画面 */}
        {selectedImage && processingStage !== 'idle' && processingStage !== 'complete' && (
          <div className="text-center">
            <div className="w-60 h-60 rounded-lg overflow-hidden mb-8 shadow-lg">
              {imagePreview && (
                <img 
                  src={imagePreview} 
                  alt="選択された画像" 
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            <div className="mb-8">
              <div className="jz-text-display-medium text-[color:var(--color-jz-text-primary)] mb-4">
                {getProcessingMessage()}
              </div>
              
              {/* プログレスバー */}
              <div className="w-80 h-2 bg-[color:var(--color-jz-border)] rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-gradient-to-r from-[color:var(--color-jz-accent)] to-[color:var(--color-jz-secondary)] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              <div className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
                少しお待ちください...
              </div>
            </div>
          </div>
        )}

        {/* 完成画面 */}
        {processingStage === 'complete' && candidates.length > 0 && (
          <div className="text-center max-w-4xl">
            <div className="mb-8">
              <JZSparklesIcon size={48} className="text-[color:var(--color-jz-accent)] mx-auto mb-4" />
              <h2 className="jz-text-display-large text-[color:var(--color-jz-text-primary)] mb-2">
                美しく完成しました
              </h2>
              <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
                3つのスタイルからお選びください
              </p>
            </div>

            {/* 3つの候補 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className={`relative cursor-pointer transition-all duration-300 ${
                    selectedCandidate === candidate.id 
                      ? 'scale-105 ring-4 ring-[color:var(--color-jz-accent)]' 
                      : 'hover:scale-105'
                  }`}
                  onClick={() => {
                    setSelectedCandidate(candidate.id);
                    triggerHapticFeedback(5);
                    playWarmTone();
                  }}
                >
                  <div className="bg-[color:var(--color-jz-card)] rounded-lg p-4 shadow-lg">
                    <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center">
                      <JZHeartIcon size={32} className="text-[color:var(--color-jz-text-tertiary)]" />
                    </div>
                    <div className="text-center">
                      <div className="jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-1">
                        {candidate.description}
                      </div>
                      <div className="jz-text-caption text-[color:var(--color-jz-text-secondary)] capitalize">
                        {candidate.style}スタイル
                      </div>
                    </div>
                  </div>
                  {selectedCandidate === candidate.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-[color:var(--color-jz-accent)] rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* アクションボタン */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {showRetryButton && (
                <JZButton
                  tone="secondary"
                  onClick={handleRetryMagic}
                  className="px-8 py-3"
                >
                  ✨ もう一度魔法をかける
                </JZButton>
              )}
              
              {selectedCandidate && (
                <JZButton
                  tone="primary"
                  onClick={() => {
                    triggerHapticFeedback(10);
                    playCompletionTone();
                    track('memorial_photo_selected', { style: selectedCandidate });
                    // 保存処理へ
                  }}
                  className="px-8 py-3"
                >
                  この写真で決定
                </JZButton>
              )}
            </div>
          </div>
        )}

        {/* 優しいメッセージ */}
        {processingStage === 'idle' && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <p className="jz-text-caption text-[color:var(--color-jz-text-tertiary)] text-center">
              大切な思い出を、美しい形で残しましょう
            </p>
          </div>
        )}
      </div>
    </SeasonalTheme>
  );
};