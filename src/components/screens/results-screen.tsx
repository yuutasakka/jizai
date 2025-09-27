import React, { useState, useEffect } from 'react';
import { JZButton } from '../design-system/jizai-button';
import { JZCard, JZCardContent } from '../design-system/jizai-card';
import { JZErrorCard } from '../design-system/jizai-error-card';
import { JZChip } from '../design-system/jizai-chip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import {
  JZChevronDownIcon
} from '../design-system/jizai-icons';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { cn } from '../ui/utils';
import { track } from '../../lib/analytics';
import { FrameCard } from '../commerce/FrameCard';

export const ResultsScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const [beforeAfterSlider, setBeforeAfterSlider] = useState(50);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // 無料やり直し制度を廃止したため、カウンタは撤去
  const [translationEnabled] = useState(true); // 変換の状態
  const [showEnglishLog, setShowEnglishLog] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [usedPrompt, setUsedPrompt] = useState<string>('');
  const promptTitleMap: Record<string, string> = {
    bg_remove: '背景の変更・除去',
    skin_tone: '顔色の補正・血色改善',
    attire_suit: '服装の変更（ダークスーツ）',
    attire_dress: '服装の変更（ダークドレス）',
    enhance_quality: '画質向上・鮮明化処理',
    smile_adjust: '笑顔への表情変更',
    wrinkle_spot_reduce: 'しわ・シミの軽減',
    hair_fix: '髪の毛の修正',
    glasses_reflection: 'メガネの反射除去・調整',
  };
  
  const [isDemoResult, setIsDemoResult] = useState(false);

  // sessionStorageから画像データを取得
  useEffect(() => {
    const generatedUrl = sessionStorage.getItem('generated-image-url');
    const originalUrl = sessionStorage.getItem('original-image-url');
    const prompt = sessionStorage.getItem('used-prompt') || '';
    const demoMode = sessionStorage.getItem('demo_mode_result') === 'true';

    if (generatedUrl && originalUrl) {
      setGeneratedImage(generatedUrl);
      setOriginalImage(originalUrl);
      setUsedPrompt(prompt);
      setIsDemoResult(demoMode);

      if (!demoMode) {
        // 通知: 生成完了によりサーバ側のメモリ一覧が更新されている可能性
        try { window.dispatchEvent(new CustomEvent('jizai:memories:updated')); } catch {}
      }
    } else {
      // データがない場合はホーム画面に戻る
      onNavigate('home');
    }
  }, [onNavigate]);

  // 生成結果をローカルギャラリーに保存（デモ用途）
  useEffect(() => {
    const persistToGallery = async () => {
      try {
        if (!originalImage || !generatedImage) return;
        // 画像URLをDataURLに変換（ObjectURLでも可能だが、再起動後の持続性のため）
        const toDataUrl = async (url: string) => {
          const res = await fetch(url);
          const blob = await res.blob();
          return await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        };

        const [origDataUrl, genDataUrl] = await Promise.all([
          toDataUrl(originalImage),
          toDataUrl(generatedImage),
        ]);

        const entry = {
          id: `${Date.now()}`,
          originalImage: origDataUrl,
          generatedImage: genDataUrl,
          prompt: usedPrompt,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          title: promptTitleMap[usedPrompt] || '生成結果'
        };

        const raw = localStorage.getItem('jizai_gallery');
        const parsed = raw ? JSON.parse(raw) : [];
        // 直近の重複保存を避ける（同一generatedImageが直近と同じならスキップ）
        if (!parsed.length || parsed[parsed.length - 1].generatedImage !== entry.generatedImage) {
          parsed.push(entry);
          localStorage.setItem('jizai_gallery', JSON.stringify(parsed));
        }
      } catch (e) {
        // 保存失敗は致命ではないので握り潰す
      }
    };
    persistToGallery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalImage, generatedImage, usedPrompt]);
  
  // 実際に送信された英語指示
  const sentEnglishInstruction = '';

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('画像を保存しました！');
      track('export_print');
    } catch (error) {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };


  const handleReport = () => {
    alert('不適切なコンテンツとして報告しました。');
  };

  const handleRegenerate = () => {
    // Navigate back to creation screen for regeneration
    onNavigate('create');
  };

  const handleRetryError = () => {
    setHasError(false);
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
              {isDemoResult ? 'デモ完了' : 'できました'}
            </h1>
            <div className="w-[80px]"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-[140px] pb-[var(--space-24)] px-[var(--space-16)] jz-grid-8pt jz-spacing-20">
        {/* Demo Mode Banner */}
        {isDemoResult && (
          <JZCard className="mb-[var(--space-16)] border-[color:var(--color-jz-accent)] bg-[color:var(--color-jz-accent)]/5">
            <JZCardContent className="p-[var(--space-16)]">
              <div className="flex items-center gap-[var(--space-12)]">
                <div className="text-2xl">🎭</div>
                <div>
                  <h3 className="jz-font-body font-semibold text-[color:var(--color-jz-accent)] mb-[var(--space-4)]">
                    デモモード結果
                  </h3>
                  <p className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
                    これはデモンストレーション用の結果です。実際の画像生成は行われていません。
                  </p>
                </div>
              </div>
            </JZCardContent>
          </JZCard>
        )}

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
                  変換：ON
                </JZChip>
              </div>
              
              <div className="text-right" />
            </div>
            
            {/* 送信ログ折りたたみ */}
            <Collapsible open={showEnglishLog} onOpenChange={setShowEnglishLog}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer p-[var(--space-12)] bg-[color:var(--color-jz-card)] rounded-[--radius-jz-button] border border-[color:var(--color-jz-border)] hover:bg-[color:var(--color-jz-card)]/80 transition-colors">
                  <span className="jz-text-body text-[color:var(--color-jz-text-primary)]">
                    最終送信内容（機密のため非表示）
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
                  <div className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">（表示しません）</div>
                </div>
                
                {/* 追加案内なし（機密のためプロンプトは非表示） */}
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
                className="absolute top-0 bottom-0 w-[6px] bg-white/90 shadow-lg cursor-col-resize z-10 transition-colors"
                style={{ left: `${beforeAfterSlider}%`, transform: 'translateX(-50%)' }}
              >
                <div className="absolute top-1/2 left-1/2 w-[40px] h-[40px] bg-white rounded-full border-2 border-[color:var(--color-jz-accent)] transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-col-resize hover:ring-2 hover:ring-[color:var(--color-jz-accent)]/60">
                  <div className="w-[6px] h-[6px] bg-[color:var(--color-jz-accent)] rounded-full"></div>
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
                onClick={isDemoResult ? () => alert('デモモードでは実際の保存はできません。') : handleSave}
                state={isLoading ? 'loading' : 'default'}
                disabled={isDemoResult}
              >
                {isDemoResult ? 'デモ保存（無効）' : '保存'}
              </JZButton>

              <div className="grid grid-cols-2 gap-[var(--space-12)]">
                <JZButton
                  tone="secondary"
                  onClick={handleRegenerate}
                  className="flex flex-col gap-[var(--space-4)] h-[56px]"
                >
                  <span>やり直し</span>
                </JZButton>

                <JZButton
                  tone="destructive"
                  onClick={handleReport}
                >
                  通報
                </JZButton>
              </div>
            </div>
          </JZCardContent>
        </JZCard>

        {/* 額縁も一緒に購入（Amazon/Rakuten） */}
        <FrameCard
          sizeKey={''}
          page="result"
          amazonUrl={(import.meta as any)?.env?.VITE_FRAME_URL_AMAZON}
          rakutenUrl={(import.meta as any)?.env?.VITE_FRAME_URL_RAKUTEN}
        />

        {/* おすすめの額縁 CTA */}
        <JZCard>
          <JZCardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="jz-text-title font-bold mb-1">おすすめの額縁</div>
                <div className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">生成した写真に合う額縁をチェック</div>
              </div>
              <a
                href={(import.meta as any)?.env?.VITE_FRAME_SHOP_URL || 'https://example.com/frames'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-white text-black font-semibold border border-[color:var(--color-jz-border)] hover:bg-white/90"
              >
                額縁を見る
              </a>
            </div>
          </JZCardContent>
        </JZCard>
      </div>
    </div>
  );
};
