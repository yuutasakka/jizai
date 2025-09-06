import React, { useState, useEffect } from 'react';
import { JZButton } from '../design-system/jizai-button';
import { JZCard, JZCardHeader, JZCardContent } from '../design-system/jizai-card';
import { JZChip } from '../design-system/jizai-chip';
import { EngineSelector, EngineProfile } from '../EngineSelector';
import { JZPhotographIcon, JZPlusIcon, JZMagicWandIcon, JZBoltIcon } from '../design-system/jizai-icons';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { cn } from '../ui/utils';
import { apiClient } from '../../api/client';
import { track } from '../../lib/analytics';
import { Progress } from '../ui/progress';
import { pickBarClass, toPercent } from '../../config/storage';

export const HomeScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [engineProfile, setEngineProfile] = useState<EngineProfile>('standard');
  const [tier, setTier] = useState<string>('free');
  const [storage, setStorage] = useState<{quota: number; used: number}>({ quota: 0, used: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presets = [
    { id: 'anime', label: 'アニメ風', icon: <JZMagicWandIcon size={16} /> },
    { id: 'realistic', label: '写実的', icon: <JZMagicWandIcon size={16} /> },
    { id: 'painting', label: '絵画風', icon: <JZMagicWandIcon size={16} /> },
    { id: 'sketch', label: 'スケッチ', icon: <JZMagicWandIcon size={16} /> },
    { id: 'vintage', label: 'ビンテージ', icon: <JZMagicWandIcon size={16} /> }
  ];

  const recommendedPrompts = [
    "美しい桜の背景に変更",
    "プロフィール写真風に加工",
    "映画のポスターのような雰囲気"
  ];

  // 初期化時にプランと保存容量を取得
  useEffect(() => {
    const loadBalance = async () => {
      try {
        const balance = await apiClient.getBalance();
        if (balance.subscription?.tier) setTier(balance.subscription.tier);
        if (balance.storage) setStorage(balance.storage);
      } catch (error) {
        console.error('Failed to load balance:', error);
        setError('プラン情報の取得に失敗しました');
      }
    };
    
    loadBalance();
  }, []);

  // URLクエリから事前設定（/?usecase=&preset=&engine=）+ デモ画像処理
  useEffect(() => {
    try {
      track('begin_edit');
      const params = new URLSearchParams(window.location.search);
      
      // デモモードの処理
      const isDemo = params.get('demo') === 'true';
      if (isDemo) {
        const demoImageUrl = sessionStorage.getItem('demo-image-url');
        const demoPreset = sessionStorage.getItem('demo-preset');
        
        if (demoImageUrl) {
          // デモ画像をFileオブジェクトに変換
          fetch(demoImageUrl).then(response => response.blob()).then(blob => {
            const file = new File([blob], 'demo-image.jpg', { type: blob.type });
            setSelectedImage(file);
            setIsLoading(false);
          }).catch(console.error);
        }
        
        if (demoPreset) {
          setSelectedPreset(demoPreset);
        }
      }
      const usecase = params.get('usecase') || '';
      const presetId = params.get('preset') || '';
      const engine = (params.get('engine') as EngineProfile) || 'standard';
      
      // 例IDが来た場合は用途別JSONまたは全量JSONから日本語プロンプトを注入
      if (presetId) {
        const fetchExamples = async () => {
          try {
            let examples: any[] = [];
            if (usecase) {
              // 用途別JSONを試す
              try {
                const response = await fetch(`/examples/${usecase}.json`);
                if (response.ok) {
                  examples = await response.json();
                }
              } catch {
                // フォールバック: 全量JSONから該当用途をフィルタ
                const fallbackResponse = await fetch('/examples/examples.json');
                const allExamples = await fallbackResponse.json();
                examples = (allExamples as any[]).filter((x) => x.usecase === usecase);
              }
            } else {
              // usecaseがない場合は全量JSONを使用
              const response = await fetch('/examples/examples.json');
              examples = await response.json();
            }
            
            const ex = examples.find((x) => x.id === presetId);
            if (ex?.prompt_ja) {
              setCustomPrompt(ex.prompt_ja);
              setSelectedPreset('');
            } else {
              // 既存プリセットIDの場合は選択状態にする
              setSelectedPreset(presetId);
            }
          } catch {
            setSelectedPreset(presetId);
          }
        };
        
        fetchExamples();
      }
      setEngineProfile(engine);
    } catch {}
  }, []);

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setIsLoading(true);
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSelectedImage(event.target.files[0]);
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage) {
      alert('写真を選択してください');
      return;
    }
    if (!selectedPreset && !customPrompt) {
      alert('プリセットを選択するか、カスタムプロンプトを入力してください');
      return;
    }
    setIsGenerating(true);
    setError(null);
    
    try {
      // プロンプトの決定（プリセットまたはカスタム）
      const prompt = customPrompt || getPresetPrompt(selectedPreset);
      
      // 画像生成API呼び出し
      const result = await apiClient.editImage(selectedImage, prompt, engineProfile);
      
      // 生成された画像をローカルストレージに保存（一時的に）
      const imageUrl = URL.createObjectURL(result.blob);
      sessionStorage.setItem('generated-image-url', imageUrl);
      sessionStorage.setItem('original-image-url', URL.createObjectURL(selectedImage));
      sessionStorage.setItem('used-prompt', prompt);
      
      // 結果画面に遷移
      onNavigate('results');
      
    } catch (error: any) {
      console.error('Generation failed:', error);
      
      if (error.message.includes('SAFETY_BLOCKED')) {
        setError('プロンプトに不適切な内容が含まれています。別の内容で試してください。');
      } else if (error.message.includes('API_UNAVAILABLE')) {
        setError('サービスが一時的に利用できません。しばらく待ってから再試行してください。');
      } else {
        setError('画像生成に失敗しました。もう一度お試しください。');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const getPresetPrompt = (presetId: string): string => {
    const presetPrompts: Record<string, string> = {
      anime: 'Convert this image to anime/manga art style with clean lines and vibrant colors',
      realistic: 'Enhance this image to be more photorealistic with better lighting and details',
      painting: 'Transform this image into a beautiful oil painting style artwork',
      sketch: 'Convert this image to a detailed pencil sketch with fine lines and shading',
      vintage: 'Apply vintage film photography effect with warm tones and film grain'
    };
    return presetPrompts[presetId] || '';
  };

  const handleRecommendedPrompt = (prompt: string) => {
    setCustomPrompt(prompt);
    setSelectedPreset('');
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-jz-surface)]">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="jz-glass-effect border-b border-[color:var(--color-jz-border)]">
          <div className="flex items-center justify-between pt-[44px] px-[var(--space-16)] pb-[var(--space-16)]">
            <h1 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)]">画像編集</h1>
            <JZButton
              tone="secondary"
              size="sm"
              onClick={() => onNavigate('purchase')}
            >
              <JZBoltIcon size={16} />
              プラン: {tier.toUpperCase()} / 保存 {formatStorage(storage.used)} / {formatStorage(storage.quota)}
            </JZButton>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-[140px] pb-[var(--space-24)] px-[var(--space-16)] jz-grid-8pt jz-spacing-20">
        {/* Storage Usage */}
        <div className="mb-4 p-4 rounded-lg border border-[color:var(--color-jz-border)] bg-[color:var(--color-jz-card)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[color:var(--color-jz-text-primary)] text-sm font-medium">保存容量</span>
            <span className="text-[color:var(--color-jz-text-secondary)] text-xs">
              {formatStorage(storage.used)} / {formatStorage(storage.quota)}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[color:var(--color-jz-border)] overflow-hidden">
            <div
              className={pickBarClass(storage.used, storage.quota)}
              style={{ width: `${toPercent(storage.used, storage.quota)}%`, height: '100%' }}
            />
          </div>
        </div>
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        {/* 編集エンジン */}
        <JZCard>
          <JZCardHeader>
            <h2 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)]">編集エンジン</h2>
          </JZCardHeader>
          <JZCardContent>
            <EngineSelector value={engineProfile} onChange={setEngineProfile} />
          </JZCardContent>
        </JZCard>

        {/* Photo Selection */}
        <JZCard>
          <JZCardHeader>
            <h2 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)]">写真を選択</h2>
          </JZCardHeader>
          <JZCardContent>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                id="photo-input"
                disabled={isLoading}
              />
              
              {selectedImage ? (
                <div className="relative aspect-square rounded-[--radius-preview] overflow-hidden bg-[color:var(--color-border)]">
                  <img
                    src={URL.createObjectURL(selectedImage)}
                    alt="選択された画像"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <JZButton tone="secondary" size="sm" className="bg-white/20 border-white/30 text-white">
                      <JZPhotographIcon size={16} />
                      変更
                    </JZButton>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="aspect-square rounded-[--radius-preview] bg-[color:var(--color-border)] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-[48px] h-[48px] border-2 border-[color:var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-[16px]" />
                    <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">読み込み中...</p>
                  </div>
                </div>
              ) : (
                <div className="aspect-square rounded-[var(--radius-jz-card)] bg-[color:var(--color-jz-border)] flex flex-col items-center justify-center text-center p-[var(--space-20)]">
                  <JZPlusIcon size={48} className="text-[color:var(--color-jz-text-tertiary)] mb-[var(--space-12)]" />
                  <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-[var(--space-8)]">写真を選択</h3>
                  <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">編集したい写真をタップして選択してください</p>
                </div>
              )}
            </div>
          </JZCardContent>
        </JZCard>

        {/* Presets */}
        <JZCard>
          <JZCardHeader>
            <h2 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)]">プリセット</h2>
          </JZCardHeader>
          <JZCardContent>
            <div className="grid grid-cols-2 gap-[12px]">
              {presets.map((preset) => (
                <JZChip
                  key={preset.id}
                  variant={selectedPreset === preset.id ? 'selected' : 'default'}
                  onClick={() => {
                    setSelectedPreset(selectedPreset === preset.id ? '' : preset.id);
                    if (customPrompt) setCustomPrompt('');
                  }}
                  icon={preset.icon}
                >
                  {preset.label}
                </JZChip>
              ))}
            </div>
          </JZCardContent>
        </JZCard>

        {/* Custom Prompt */}
        <JZCard>
          <JZCardHeader>
            <h2 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)]">カスタムプロンプト</h2>
          </JZCardHeader>
          <JZCardContent>
            <textarea
              value={customPrompt}
              onChange={(e) => {
                setCustomPrompt(e.target.value);
                if (e.target.value && selectedPreset) setSelectedPreset('');
              }}
              placeholder="どのような編集をしたいかを入力してください..."
              className="w-full h-[120px] p-[16px] bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-[--radius-button] resize-none focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] focus:border-transparent text-body text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-tertiary)]"
              rows={4}
            />
          </JZCardContent>
        </JZCard>

        {/* Recommended Prompts */}
        <JZCard>
          <JZCardHeader>
            <h2 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)]">推奨プロンプト</h2>
          </JZCardHeader>
          <JZCardContent>
            <div className="space-y-[8px]">
              {recommendedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleRecommendedPrompt(prompt)}
                  className="w-full text-left p-[12px] rounded-[--radius-button] bg-[color:var(--color-border)] hover:bg-[color:var(--color-accent)]/10 transition-colors jz-text-body text-[color:var(--color-jz-text-secondary)] hover:text-[color:var(--color-accent)]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </JZCardContent>
        </JZCard>
      </div>

        {/* Generate Button */}
        <div className="mt-[var(--space-20)]">
          <JZButton
            tone="primary"
            size="lg"
            fullWidth
            onClick={handleGenerate}
            state={!selectedImage || (!selectedPreset && !customPrompt) || isGenerating ? 'disabled' : 'enabled'}
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <JZMagicWandIcon size={20} />
                生成する
              </>
            )}
          </JZButton>
        </div>
    </div>
  );
};

function formatStorage(bytes: number) {
  if (!bytes || bytes <= 0) return '0B';
  const k = 1024;
  const sizes = ['B','KB','MB','GB','TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = (bytes / Math.pow(k, i)).toFixed(1);
  return `${value}${sizes[i]}`;
}

// バーの色と割合は src/config/storage.ts の設定値を使用
