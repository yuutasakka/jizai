import React, { useState, useEffect } from 'react';
import { JZButton } from '../design-system/jizai-button';
import { JZCard, JZCardContent } from '../design-system/jizai-card';
import { JZErrorCard } from '../design-system/jizai-error-card';
import { JZRangeSelector } from '../design-system/jizai-range-selector';
import { JZChip } from '../design-system/jizai-chip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { 
  JZDownloadIcon, 
  JZRefreshIcon, 
  JZSliderIcon,
  JZExclamationBubbleIcon,
  JZChevronDownIcon
} from '../design-system/jizai-icons';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { cn } from '../ui/utils';

export const ResultsScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const [beforeAfterSlider, setBeforeAfterSlider] = useState(50);
  const [isRangeSelectMode, setIsRangeSelectMode] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(2); // 無料やり直し残り回数
  const [translationEnabled] = useState(true); // 翻訳の状態
  const [showEnglishLog, setShowEnglishLog] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [usedPrompt, setUsedPrompt] = useState<string>('');
  
  // sessionStorageから画像データを取得
  useEffect(() => {
    const generatedUrl = sessionStorage.getItem('generated-image-url');
    const originalUrl = sessionStorage.getItem('original-image-url');
    const prompt = sessionStorage.getItem('used-prompt') || '';
    
    if (generatedUrl && originalUrl) {
      setGeneratedImage(generatedUrl);
      setOriginalImage(originalUrl);
      setUsedPrompt(prompt);
    } else {
      // データがない場合はホーム画面に戻る
      onNavigate('home');
    }
  }, [onNavigate]);
  
  // 実際に送信された英語指示
  const sentEnglishInstruction = usedPrompt;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('画像を保存しました！');
    } catch (error) {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (retryCount > 0) {
      setRetryCount(retryCount - 1);
    }
    onNavigate('progress');
  };

  const handleRangeRespecify = () => {
    setIsRangeSelectMode(!isRangeSelectMode);
  };

  const handleReport = () => {
    alert('不適切なコンテンツとして報告しました。');
  };

  const handleRetryError = () => {
    setHasError(false);
  };

  const handleRangeSelection = (selection: any) => {
    console.log('Range selected:', selection);
    setIsRangeSelectMode(false);
    onNavigate('progress');
  };

  if (hasError) {
    return (
      <div className="min-h-screen bg-[color:var(--color-jz-surface)] flex items-center justify-center px-[var(--space-16)]">
        <JZErrorCard
          title="写真を変えられませんでした"
          message="うまくいきませんでした。もう少し詳しく書いてみてください。"
          onRetry={handleRetryError}
          retryLabel="戻る"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-jz-surface)]">
      {/* Header with Glass Effect */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="jz-glass-effect border-b border-[color:var(--color-jz-border)]">
          <div className="flex items-center justify-between pt-[44px] px-[var(--space-16)] pb-[var(--space-16)]">
            <JZButton
              tone="tertiary"
              size="md"
              onClick={() => onNavigate('home')}
            >
              ← ホーム
            </JZButton>
            <h1 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)]">
              できました
            </h1>
            <div className="w-[80px]"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-[140px] pb-[var(--space-24)] px-[var(--space-16)] jz-grid-8pt jz-spacing-20">
        {/* Result Status */}
        <JZCard>
          <JZCardContent className="p-[var(--space-16)]">
            <div className="flex items-center justify-between mb-[var(--space-12)]">
              <div className="flex items-center gap-[var(--space-12)]">
                <JZChip 
                  size="sm" 
                  variant="selected"
                  className="bg-[color:var(--color-jz-success)]/20 text-[color:var(--color-jz-success)] border-[color:var(--color-jz-success)]/30"
                >
                  翻訳：ON（DashScopeへは英訳を送信）
                </JZChip>
              </div>
              
              <div className="text-right">
                <span className={cn(
                  "jz-text-caption",
                  retryCount > 0 ? "text-[color:var(--color-jz-success)]" : "text-[color:var(--color-jz-text-tertiary)]"
                )}>
                  やり直し（無料） 残り{retryCount}回
                </span>
              </div>
            </div>
            
            {/* 英語送信ログ折りたたみ */}
            <Collapsible open={showEnglishLog} onOpenChange={setShowEnglishLog}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer p-[var(--space-12)] bg-[color:var(--color-jz-card)] rounded-[--radius-jz-button] border border-[color:var(--color-jz-border)] hover:bg-[color:var(--color-jz-card)]/80 transition-colors">
                  <span className="jz-text-body text-[color:var(--color-jz-text-primary)]">
                    最終英語指示（送信ログ）
                  </span>
                  <JZChevronDownIcon 
                    size={16} 
                    className={cn(
                      "text-[color:var(--color-jz-text-secondary)] transition-transform",
                      showEnglishLog && "rotate-180"
                    )}
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-[var(--space-8)]">
                <div className="p-[var(--space-16)] bg-[color:var(--color-jz-surface)] rounded-[--radius-jz-button] border border-[color:var(--color-jz-border)]">
                  <div className="jz-text-caption text-[color:var(--color-jz-text-secondary)] font-mono leading-relaxed">
                    {sentEnglishInstruction}
                  </div>
                </div>
                
                {/* 注意書き */}
                <div className="p-[var(--space-12)] bg-[color:var(--color-jz-card)] rounded-[--radius-jz-button] border border-[color:var(--color-jz-border)] mt-[var(--space-8)]">
                  <p className="jz-text-caption text-[#A1A1AA]">
                    ※<strong>画像に日本語の文字を入れる場合は、その部分を日本語に置き換えて</strong>ください。
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </JZCardContent>
        </JZCard>

        {/* Before/After Preview */}
        <JZCard>
          <JZCardContent className="p-0">
            <div className="relative aspect-square rounded-[--radius-jz-preview] overflow-hidden border border-[color:var(--color-jz-border)]">
              {/* Before Image */}
              <div 
                className="absolute inset-0"
                style={{
                  clipPath: `polygon(0 0, ${beforeAfterSlider}% 0, ${beforeAfterSlider}% 100%, 0 100%)`
                }}
              >
                <img
                  src={originalImage || ''}
                  alt="Before"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-[var(--space-12)] left-[var(--space-12)]">
                  <span className="bg-black/60 text-white px-[var(--space-12)] py-[var(--space-8)] rounded-[8px] jz-text-caption">
                    変更前
                  </span>
                </div>
              </div>

              {/* After Image */}
              <div 
                className="absolute inset-0"
                style={{
                  clipPath: `polygon(${beforeAfterSlider}% 0, 100% 0, 100% 100%, ${beforeAfterSlider}% 100%)`
                }}
              >
                <img
                  src={generatedImage || ''}
                  alt="After"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-[var(--space-12)] right-[var(--space-12)]">
                  <span className="bg-[color:var(--color-jz-accent)] text-white px-[var(--space-12)] py-[var(--space-8)] rounded-[8px] jz-text-caption">
                    変更後
                  </span>
                </div>
              </div>

              {/* Slider Handle */}
              <div 
                className="absolute top-0 bottom-0 w-[4px] bg-white shadow-lg cursor-col-resize z-10"
                style={{ left: `${beforeAfterSlider}%`, transform: 'translateX(-50%)' }}
              >
                <div className="absolute top-1/2 left-1/2 w-[32px] h-[32px] bg-white rounded-full border-2 border-[color:var(--color-jz-accent)] transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-col-resize">
                  <JZSliderIcon size={16} className="text-[color:var(--color-jz-accent)]" />
                </div>
              </div>

              {/* Slider Input */}
              <input
                type="range"
                min="0"
                max="100"
                value={beforeAfterSlider}
                onChange={(e) => setBeforeAfterSlider(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-col-resize"
              />

              {/* Range Selection Overlay */}
              <JZRangeSelector
                isActive={isRangeSelectMode}
                onSelectionChange={handleRangeSelection}
              />
            </div>
          </JZCardContent>
        </JZCard>

        {/* Action Buttons */}
        <JZCard>
          <JZCardContent>
            <div className="grid grid-cols-2 gap-[var(--space-12)]">
              <JZButton
                tone="secondary"
                onClick={handleRangeRespecify}
                state={isRangeSelectMode ? 'pressed' : 'default'}
                className="flex flex-col gap-[var(--space-8)] h-[72px]"
              >
                <JZSliderIcon size={20} />
                <span className="jz-text-caption">範囲再指定</span>
              </JZButton>

              <JZButton
                tone="secondary"
                onClick={handleRegenerate}
                className="flex flex-col gap-[var(--space-8)] h-[72px]"
              >
                <JZRefreshIcon size={20} />
                <span className="jz-text-caption">強度再調整</span>
              </JZButton>
            </div>
          </JZCardContent>
        </JZCard>

        {/* Additional Actions */}
        <JZCard>
          <JZCardContent>
            <div className="space-y-[var(--space-12)]">
              <JZButton
                tone="primary"
                size="lg"
                fullWidth
                onClick={handleSave}
                state={isLoading ? 'loading' : 'default'}
              >
                <JZDownloadIcon size={20} />
                保存
              </JZButton>

              <div className="grid grid-cols-2 gap-[var(--space-12)]">
                <JZButton
                  tone="secondary"
                  onClick={handleRegenerate}
                  className="flex flex-col gap-[var(--space-4)] h-[56px]"
                >
                  <span>やり直し{retryCount > 0 ? '（無料）' : ''}</span>
                  {retryCount > 0 && (
                    <span className="jz-text-caption text-[color:var(--color-jz-success)]">
                      残り{retryCount}回
                    </span>
                  )}
                </JZButton>

                <JZButton
                  tone="destructive"
                  onClick={handleReport}
                >
                  <JZExclamationBubbleIcon size={16} />
                  通報
                </JZButton>
              </div>
            </div>
          </JZCardContent>
        </JZCard>
      </div>
    </div>
  );
};