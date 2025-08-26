import React, { useState, useEffect } from 'react';
import { DSButton } from '../design-system/button';
import { DSCard, DSCardHeader, DSCardContent } from '../design-system/card';
import { DSChip } from '../design-system/chip';
import { DSToolbar } from '../design-system/toolbar';
import { DSEmptyState } from '../design-system/empty-state';
import { PhotoIcon, PlusIcon, SparklesIcon, BoltCircleIcon } from '../design-system/icons';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { cn } from '../ui/utils';
import { apiClient } from '../../api/client';
import { Progress } from '../ui/progress';
import { pickBarClass, toPercent } from '../../config/storage';

export const HomeScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [tier, setTier] = useState<string>('free');
  const [storage, setStorage] = useState<{quota: number; used: number}>({ quota: 0, used: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presets = [
    { id: 'anime', label: 'アニメ風', icon: <SparklesIcon size={16} /> },
    { id: 'realistic', label: '写実的', icon: <SparklesIcon size={16} /> },
    { id: 'painting', label: '絵画風', icon: <SparklesIcon size={16} /> },
    { id: 'sketch', label: 'スケッチ', icon: <SparklesIcon size={16} /> },
    { id: 'vintage', label: 'ビンテージ', icon: <SparklesIcon size={16} /> }
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
      const result = await apiClient.editImage(selectedImage, prompt);
      
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
    <div className="min-h-screen bg-[color:var(--color-surface)]">
      {/* Header with Glass Effect */}
      <DSToolbar position="top" transparent className="gradient-accent">
        <div className="flex justify-between items-center pt-[44px]">
          <h1 className="font-display text-display-medium text-white">画像編集AI</h1>
          <DSButton
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('purchase')}
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            <BoltCircleIcon size={16} />
            プラン: {tier.toUpperCase()} / 保存 {formatStorage(storage.used)} / {formatStorage(storage.quota)}
          </DSButton>
        </div>
      </DSToolbar>

      {/* Content */}
      <div className="pt-[140px] pb-[var(--space-24)] px-[var(--space-16)] grid-8pt">
        {/* Storage Usage */}
        <div className="mb-4 p-4 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[color:var(--color-text-primary)] text-sm font-medium">保存容量</span>
            <span className="text-[color:var(--color-text-secondary)] text-xs">
              {formatStorage(storage.used)} / {formatStorage(storage.quota)}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[color:var(--color-border)] overflow-hidden">
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
        {/* Photo Selection */}
        <DSCard>
          <DSCardHeader>
            <h2 className="font-display text-display-small text-[color:var(--color-text-primary)]">写真を選択</h2>
          </DSCardHeader>
          <DSCardContent>
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
                    <DSButton variant="secondary" size="sm" className="bg-white/20 border-white/30 text-white">
                      <PhotoIcon size={16} />
                      変更
                    </DSButton>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="aspect-square rounded-[--radius-preview] bg-[color:var(--color-border)] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-[48px] h-[48px] border-2 border-[color:var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-[16px]" />
                    <p className="text-body text-[color:var(--color-text-secondary)]">読み込み中...</p>
                  </div>
                </div>
              ) : (
                <DSEmptyState
                  icon={<PlusIcon size={48} />}
                  title="写真を選択"
                  description="編集したい写真をタップして選択してください"
                />
              )}
            </div>
          </DSCardContent>
        </DSCard>

        {/* Presets */}
        <DSCard>
          <DSCardHeader>
            <h2 className="font-display text-display-small text-[color:var(--color-text-primary)]">プリセット</h2>
          </DSCardHeader>
          <DSCardContent>
            <div className="grid grid-cols-2 gap-[12px]">
              {presets.map((preset) => (
                <DSChip
                  key={preset.id}
                  variant={selectedPreset === preset.id ? 'selected' : 'default'}
                  onClick={() => {
                    setSelectedPreset(selectedPreset === preset.id ? '' : preset.id);
                    if (customPrompt) setCustomPrompt('');
                  }}
                  icon={preset.icon}
                >
                  {preset.label}
                </DSChip>
              ))}
            </div>
          </DSCardContent>
        </DSCard>

        {/* Custom Prompt */}
        <DSCard>
          <DSCardHeader>
            <h2 className="font-display text-display-small text-[color:var(--color-text-primary)]">カスタムプロンプト</h2>
          </DSCardHeader>
          <DSCardContent>
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
          </DSCardContent>
        </DSCard>

        {/* Recommended Prompts */}
        <DSCard>
          <DSCardHeader>
            <h2 className="font-display text-display-small text-[color:var(--color-text-primary)]">推奨プロンプト</h2>
          </DSCardHeader>
          <DSCardContent>
            <div className="space-y-[8px]">
              {recommendedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleRecommendedPrompt(prompt)}
                  className="w-full text-left p-[12px] rounded-[--radius-button] bg-[color:var(--color-border)] hover:bg-[color:var(--color-accent)]/10 transition-colors text-body text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-accent)]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </DSCardContent>
        </DSCard>
      </div>

        {/* Generate Button */}
        <div className="mt-[var(--space-20)]">
          <DSButton
            variant="primary"
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
                <SparklesIcon size={20} />
                生成する
              </>
            )}
          </DSButton>
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
