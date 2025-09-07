import React, { useState } from 'react';
import { track } from '../../lib/analytics';
import { JZButton } from '../design-system/jizai-button';
import { JZCard, JZCardHeader, JZCardContent } from '../design-system/jizai-card';
import { JZChip } from '../design-system/jizai-chip';
import { JZErrorCard } from '../design-system/jizai-error-card';
import { 
  JZPhotoIcon, 
  JZPlusIcon, 
  JZRefreshIcon,
  JZCopyIcon
} from '../design-system/jizai-icons';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface ExampleData {
  title: string;
  promptEn: string;
  description: string;
  thumbnailImage?: string;
  beforeImage?: string;
  afterImage?: string;
}

interface JizaiHomeScreenProps {
  onNavigate: (screen: string) => void;
  selectedExample: ExampleData | null;
  onClearExample: () => void;
}

export const JizaiHomeScreen = ({ onNavigate, selectedExample, onClearExample }: JizaiHomeScreenProps) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [japaneseInput, setJapaneseInput] = useState('');
  const [englishPreview, setEnglishPreview] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [isExampleLoaded, setIsExampleLoaded] = useState(false);
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(true);
  const [navOpen, setNavOpen] = useState(false);

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setError(null);
      setIsLoading(true);
      
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSelectedImage(event.target.files[0]);
        track('begin_edit');
      } catch (err) {
        setError('写真が読み込めませんでした。別の写真を選んでください。');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGenerate = () => {
    if (!selectedImage && !selectedExample) {
      setError('写真を選択してください');
      return;
    }
    if (!customPrompt && !japaneseInput.trim() && !englishPreview.trim()) {
      setError('プロンプトを入力するか、日本語で指示を入力してください');
      return;
    }
    setError(null);
    onNavigate('progress');
  };

  const handleTranslateToEnglish = async () => {
    if (!japaneseInput.trim()) return;
    
    setIsTranslating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockTranslation = japaneseInput.includes('営業中') && japaneseInput.includes('準備中')
        ? "Change the text '営業中' (Open) on the sign to '準備中' (Preparing), while maintaining the original font, spacing, and layout exactly as they are."
        : `Please ${japaneseInput.toLowerCase().replace('てください', '').replace('して', '')}, maintaining the original design elements and composition.`;
      
      setEnglishPreview(mockTranslation);
    } catch (err) {
      setError('翻訳に失敗しました。日本語のまま送信されます。');
      setEnglishPreview(japaneseInput);
    } finally {
      setIsTranslating(false);
    }
  };

  React.useEffect(() => {
    if (selectedExample && !isExampleLoaded) {
      setTimeout(() => {
        setEnglishPreview(selectedExample.promptEn);
        setJapaneseInput('');
        setIsExampleLoaded(true);
        setError(null);
      }, 200);
    }
  }, [selectedExample, isExampleLoaded]);

  React.useEffect(() => {
    if (japaneseInput.trim() && !selectedExample) {
      const delayedTranslation = setTimeout(() => {
        handleTranslateToEnglish();
      }, 500);
      
      return () => clearTimeout(delayedTranslation);
    } else if (!japaneseInput.trim() && !selectedExample) {
      setEnglishPreview('');
    }
  }, [japaneseInput, selectedExample]);

  const handleCopyToClipboard = async () => {
    if (!englishPreview) return;
    
    setCopyError(false);
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(englishPreview);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
      
      const textArea = document.createElement('textarea');
      textArea.value = englishPreview;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error('execCommand failed');
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
      
      const textArea = document.createElement('textarea');
      textArea.value = englishPreview;
      textArea.style.position = 'fixed';
      textArea.style.left = '50%';
      textArea.style.top = '50%';
      textArea.style.transform = 'translate(-50%, -50%)';
      textArea.style.width = '80%';
      textArea.style.height = '200px';
      textArea.style.zIndex = '9999';
      textArea.style.backgroundColor = 'var(--color-jz-card)';
      textArea.style.color = 'var(--color-jz-text-primary)';
      textArea.style.border = '2px solid var(--color-jz-accent)';
      textArea.style.borderRadius = '12px';
      textArea.style.padding = '16px';
      textArea.style.fontSize = '14px';
      textArea.style.fontFamily = 'monospace';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      setTimeout(() => {
        if (document.body.contains(textArea)) {
          document.body.removeChild(textArea);
        }
      }, 3000);
    }
  };

  const handleRetry = () => {
    setError(null);
  };

  const handleClearExampleData = () => {
    setIsExampleLoaded(false);
    setEnglishPreview('');
    setJapaneseInput('');
    onClearExample();
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-jz-surface)]">
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="jz-glass-effect border-b border-[color:var(--color-jz-border)]">
          <div className="flex justify-between items-center pt-[44px] px-[var(--space-16)] pb-[var(--space-16)]">
            <div>
              <h1 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)]">JIZAI</h1>
              <p className="jz-text-caption text-[color:var(--color-jz-text-secondary)] mt-[2px]">写真、思いのままに。</p>
            </div>
            <div className="flex items-center gap-[var(--space-8)] relative">
              <div className="relative">
                <button
                  onClick={() => setNavOpen(!navOpen)}
                  className="px-[var(--space-12)] py-[var(--space-8)] rounded-[--radius-jz-button] border border-[color:var(--color-jz-border)] text-[color:var(--color-jz-text-primary)] hover:bg-[color:var(--color-jz-card)]"
                >
                  用途別 ▾
                </button>
                {navOpen && (
                  <div className="absolute right-0 mt-[var(--space-8)] w-[280px] bg-[color:var(--color-jz-card)] border border-[color:var(--color-jz-border)] rounded-[--radius-jz-card] shadow-lg z-50">
                    <button 
                      onClick={() => {
                        onNavigate('memorial-photo');
                        setNavOpen(false);
                      }} 
                      className="block w-full text-left px-[12px] py-[10px] hover:bg-[color:var(--color-jz-surface)] border-b border-[color:var(--color-jz-border)] font-semibold text-[color:var(--color-jz-accent)]"
                    >
                      ✨ 魔法的遺影作成（NEW）
                    </button>
                    <button 
                      onClick={() => {
                        onNavigate('long-term-engagement');
                        setNavOpen(false);
                      }} 
                      className="block w-full text-left px-[12px] py-[10px] hover:bg-[color:var(--color-jz-surface)] border-b border-[color:var(--color-jz-border)] font-semibold text-purple-600"
                    >
                      💖 愛用者システム（愛用特典）
                    </button>
                    <button onClick={() => onNavigate('memorial/human')} className="block w-full text-left px-[12px] py-[10px] hover:bg-[color:var(--color-jz-surface)]">遺影写真（人）</button>
                    <button onClick={() => onNavigate('memorial/pet')} className="block w-full text-left px-[12px] py-[10px] hover:bg-[color:var(--color-jz-surface)]">ペット遺影</button>
                    <button onClick={() => onNavigate('memorial/seizen')} className="block w-full text-left px-[12px] py-[10px] hover:bg-[color:var(--color-jz-surface)]">生前撮影</button>
                    <button onClick={() => onNavigate('memorial/photo')} className="block w-full text-left px-[12px] py-[10px] hover:bg-[color:var(--color-jz-surface)]">メモリアルフォト</button>
                  </div>
                )}
              </div>
              <a
                href="#support"
                onClick={() => track('cta_emergency')}
                className="px-[var(--space-12)] py-[var(--space-8)] rounded-[--radius-jz-button] bg-[color:var(--color-jz-accent)] text-white font-semibold border border-[color:var(--color-jz-accent)]/20 shadow-sm hover:opacity-90 transition"
              >
                24時間サポート（電話/チャット）
              </a>
              <JZButton
                tone="secondary"
                size="md"
                onClick={() => onNavigate('purchase')}
                className="bg-[color:var(--color-jz-accent)]/10 border-[color:var(--color-jz-accent)]/30 text-[color:var(--color-jz-accent)]"
              >
                マイプラン
              </JZButton>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-[140px] pb-[var(--space-24)] px-[var(--space-16)] jz-grid-8pt jz-spacing-16">
        <div className="text-center py-[var(--space-24)]">
          <h1 className="jz-font-display jz-text-display-large text-[color:var(--color-jz-text-primary)] mb-[var(--space-12)]">
            遺影写真の編集と仕上げ、すぐに。
          </h1>
          <p className="jz-text-body text-[color:var(--color-jz-text-secondary)] max-w-[360px] mx-auto leading-relaxed mb-[var(--space-16)]">
            四つ切・A4・L判対応／1件〜当日仕上げ／やり直し2回無料
          </p>
          <div className="flex items-center justify-center gap-[var(--space-12)]">
            <JZButton
              tone="primary"
              size="lg"
              onClick={() => {
                const el = document.getElementById('photo-input') as HTMLInputElement | null;
                el?.click();
              }}
            >
              遺影を作成する
            </JZButton>
            <a
              href="#support"
              className="px-[var(--space-16)] py-[10px] rounded-[--radius-jz-button] border border-[color:var(--color-jz-border)] text-[color:var(--color-jz-text-primary)] hover:bg-[color:var(--color-jz-card)] transition"
            >
              お急ぎの方（今すぐ相談）
            </a>
          </div>
        </div>

        <div className="mb-[var(--space-24)]">
          <h2 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] text-center mb-[var(--space-16)]">用途別で選ぶ</h2>
          <div className="grid gap-[var(--space-16)] grid-cols-1 md:grid-cols-2">
            {/* 新しい魔法的体験カード */}
            <JZCard className="border-2 border-[color:var(--color-jz-accent)]/30 bg-gradient-to-br from-[color:var(--color-jz-accent)]/10 to-[color:var(--color-jz-secondary)]/10 relative overflow-hidden">
              <div className="absolute top-2 right-2 bg-[color:var(--color-jz-accent)] text-white text-xs px-2 py-1 rounded-full font-bold">NEW</div>
              <JZCardHeader>
                <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] flex items-center gap-2">
                  ✨ 魔法的遺影作成
                </h3>
              </JZCardHeader>
              <JZCardContent>
                <p className="jz-text-body text-[color:var(--color-jz-text-secondary)] mb-[var(--space-12)]">ワンタップで自動処理。3秒で3つの美しい候補を表示。呼吸リズム同期で心地よい体験。</p>
                <JZButton tone="primary" onClick={() => onNavigate('memorial-photo')} className="w-full">魔法をかける ✨</JZButton>
              </JZCardContent>
            </JZCard>
            
            {/* Long-term Engagement System Card */}
            <JZCard className="border-2 border-purple-300/30 bg-gradient-to-br from-purple-100/50 to-indigo-100/50 relative overflow-hidden">
              <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold">愛用</div>
              <JZCardHeader>
                <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] flex items-center gap-2">
                  💖 愛用者システム
                </h3>
              </JZCardHeader>
              <JZCardContent>
                <p className="jz-text-body text-[color:var(--color-jz-text-secondary)] mb-[var(--space-12)]">成長追跡・家族絆・記念日インテリジェンス。使うほど「あなたらしく」進化します。</p>
                <JZButton tone="primary" onClick={() => onNavigate('long-term-engagement')} className="w-full">愛用者特典を見る 💖</JZButton>
              </JZCardContent>
            </JZCard>
            
            <JZCard>
              <JZCardHeader>
                <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)]">遺影写真（人）</h3>
              </JZCardHeader>
              <JZCardContent>
                <p className="jz-text-body text-[color:var(--color-jz-text-secondary)] mb-[var(--space-12)]">服装・背景・肌/髪の整え。四つ切/A4/L判対応。</p>
                <JZButton tone="secondary" onClick={() => onNavigate('memorial/human')}>この用途で作成する</JZButton>
              </JZCardContent>
            </JZCard>
            <JZCard>
              <JZCardHeader>
                <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)]">ペット遺影</h3>
              </JZCardHeader>
              <JZCardContent>
                <p className="jz-text-body text-[color:var(--color-jz-text-secondary)] mb-[var(--space-12)]">毛並みの整え・背景無地化・色味補正。</p>
                <JZButton tone="secondary" onClick={() => onNavigate('memorial/pet')}>この用途で作成する</JZButton>
              </JZCardContent>
            </JZCard>
            <JZCard>
              <JZCardHeader>
                <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)]">生前撮影</h3>
              </JZCardHeader>
              <JZCardContent>
                <p className="jz-text-body text-[color:var(--color-jz-text-secondary)] mb-[var(--space-12)]">自然なレタッチとサイズ書き出し。</p>
                <JZButton tone="secondary" onClick={() => onNavigate('memorial/seizen')}>この用途で作成する</JZButton>
              </JZCardContent>
            </JZCard>
            <JZCard>
              <JZCardHeader>
                <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)]">メモリアルフォト</h3>
              </JZCardHeader>
              <JZCardContent>
                <p className="jz-text-body text-[color:var(--color-jz-text-secondary)] mb-[var(--space-12)]">法要・命日の写真整えと印刷最適化。</p>
                <JZButton tone="secondary" onClick={() => onNavigate('memorial/photo')}>この用途で作成する</JZButton>
              </JZCardContent>
            </JZCard>
          </div>
        </div>

        {error && (
          <JZErrorCard
            message={error}
            onRetry={handleRetry}
            retryLabel="やり直す"
          />
        )}

        <JZCard>
          <JZCardHeader>
            <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)]">写真を選択</h3>
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
                <div className="relative aspect-square rounded-[--radius-jz-preview] overflow-hidden border border-[color:var(--color-jz-border)]">
                  <img
                    src={URL.createObjectURL(selectedImage)}
                    alt="選択された画像"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <JZButton tone="secondary" size="md" className="bg-white/20 border-white/30 text-white">
                      <JZPhotoIcon size={16} />
                      変更
                    </JZButton>
                  </div>
                </div>
              ) : selectedExample ? (
                <div className="aspect-square rounded-[--radius-jz-preview] bg-[color:var(--color-jz-card)] flex items-center justify-center border border-[color:var(--color-jz-accent)]/50 transition-all duration-500 animate-fade-in">
                  <div className="text-center">
                    <div className="w-[64px] h-[64px] rounded-full bg-[color:var(--color-jz-accent)]/20 flex items-center justify-center mb-[var(--space-16)] mx-auto animate-pulse">
                      <span className="text-[color:var(--color-jz-accent)] text-2xl">✨</span>
                    </div>
                    <h4 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-[var(--space-8)]">例画像がセットされました</h4>
                    <p className="jz-text-body text-[color:var(--color-jz-text-secondary)] mb-[var(--space-12)]">{selectedExample.title}</p>
                    <JZButton 
                      tone="tertiary" 
                      size="sm" 
                      onClick={handleClearExampleData}
                      className="text-[color:var(--color-jz-accent)] hover:text-[color:var(--color-jz-accent)]"
                    >
                      例をクリア
                    </JZButton>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="aspect-square rounded-[--radius-jz-preview] bg-[color:var(--color-jz-border)] flex items-center justify-center border border-[color:var(--color-jz-border)]">
                  <div className="text-center">
                    <div className="w-[48px] h-[48px] border-2 border-[color:var(--color-jz-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-[var(--space-16)]" />
                    <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">読み込み中...</p>
                  </div>
                </div>
              ) : (
                <div className="aspect-square rounded-[--radius-jz-preview] bg-[color:var(--color-jz-border)] flex items-center justify-center border-2 border-dashed border-[color:var(--color-jz-text-tertiary)]">
                  <div className="text-center">
                    <JZPlusIcon size={48} className="text-[color:var(--color-jz-text-tertiary)] mx-auto mb-[var(--space-16)]" />
                    <h4 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-[var(--space-8)]">写真を選択</h4>
                    <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">編集したい写真をタップして選択</p>
                  </div>
                </div>
              )}
            </div>
          </JZCardContent>
        </JZCard>

        <JZCard>
          <JZCardHeader>
            <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)]">指示を日本語で入力してください</h3>
          </JZCardHeader>
          <JZCardContent className="space-y-[var(--space-16)]">
            <div>
              <textarea
                value={japaneseInput}
                onChange={(e) => {
                  setJapaneseInput(e.target.value);
                  setError(null);
                }}
                placeholder="看板の『営業中』という文字を『準備中』に変えて、フォントや字間、配置はそのままにしてください。"
                className="w-full h-[120px] p-[var(--space-16)] bg-[color:var(--color-jz-surface)] border border-[color:var(--color-jz-border)] rounded-[--radius-jz-button] resize-none focus:outline-none focus:ring-2 focus:ring-[color:var(--color-jz-accent)] focus:border-transparent jz-text-body text-[color:var(--color-jz-text-primary)] placeholder:text-[color:var(--color-jz-text-tertiary)]"
                rows={4}
              />
            </div>
            
            <div className="space-y-[var(--space-8)]">
              <div className="flex items-center justify-between">
                <JZButton
                  tone="tertiary"
                  size="sm"
                  onClick={() => setIsPreviewCollapsed(!isPreviewCollapsed)}
                  className="flex items-center gap-[var(--space-8)] text-[color:var(--color-jz-text-primary)]"
                >
                  <span className={`transform transition-transform ${isPreviewCollapsed ? '' : 'rotate-90'}`}>▶</span>
                  送信内容プレビュー
                </JZButton>
                <div className="flex items-center gap-[var(--space-8)]">
                  {englishPreview && !isPreviewCollapsed && (
                    <JZButton
                      tone="tertiary"
                      size="sm"
                      onClick={handleCopyToClipboard}
                      className={`flex items-center gap-[var(--space-8)] ${
                        copyError ? 'text-[color:var(--color-jz-warning)]' : ''
                      }`}
                    >
                      <JZCopyIcon size={14} />
                      {copied ? 'コピー済み' : copyError ? '手動選択' : 'コピー'}
                    </JZButton>
                  )}
                  <JZButton
                    tone="tertiary"
                    size="sm"
                    onClick={handleTranslateToEnglish}
                    state={isTranslating ? 'disabled' : 'default'}
                    className="flex items-center gap-[var(--space-8)]"
                  >
                    <JZRefreshIcon size={14} className={isTranslating ? 'animate-spin' : ''} />
                    プロンプトに変換
                  </JZButton>
                </div>
              </div>
              
              {!isPreviewCollapsed && (
                <div className="p-[var(--space-16)] bg-[color:var(--color-jz-surface)] rounded-[--radius-jz-button] border border-[color:var(--color-jz-border)] min-h-[80px]">
                  {isTranslating ? (
                    <div className="flex items-center gap-[var(--space-12)]">
                      <div className="w-[16px] h-[16px] border-2 border-[color:var(--color-jz-accent)] border-t-transparent rounded-full animate-spin" />
                      <span className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">変換中...</span>
                    </div>
                  ) : englishPreview ? (
                    <div>
                      <div className="jz-text-caption text-[color:var(--color-jz-text-secondary)] font-mono leading-relaxed mb-[var(--space-12)]">
                        {englishPreview}
                      </div>
                      {selectedExample && (
                        <div className="p-[var(--space-12)] bg-[color:var(--color-jz-accent)]/10 rounded-[--radius-jz-button] border border-[color:var(--color-jz-accent)]/20">
                          <p className="jz-text-caption text-[color:var(--color-jz-accent)] flex items-center gap-[var(--space-8)]">
                            <span>✨</span>
                            例から自動設定されました
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="jz-text-caption text-[color:var(--color-jz-text-tertiary)]">
                      日本語で指示を入力すると、内容が自動で整形されます
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-[var(--space-12)] bg-[color:var(--color-jz-card)] rounded-[--radius-jz-button] border border-[color:var(--color-jz-border)]">
              <p className="jz-text-caption text-[#A1A1AA]">
                ※プレビューは送信内容の表示です。<strong>画像内の日本語文字は、そのままの表記で生成</strong>してください。<br/>
                ※生成された画像は自動でクラウドに保存されます。
              </p>
            </div>
          </JZCardContent>
        </JZCard>

        <JZCard>
          <JZCardHeader>
            <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)]">プロンプトを入力する</h3>
          </JZCardHeader>
          <JZCardContent>
            <textarea
              value={customPrompt}
              onChange={(e) => {
                setCustomPrompt(e.target.value);
                setError(null);
              }}
              placeholder="例：看板の『営業中』という文字を『準備中』に変えてください"
              className="w-full h-[100px] p-[var(--space-16)] bg-[color:var(--color-jz-surface)] border border-[color:var(--color-jz-border)] rounded-[--radius-jz-button] resize-none focus:outline-none focus:ring-2 focus:ring-[color:var(--color-jz-accent)] focus:border-transparent jz-text-body text-[color:var(--color-jz-text-primary)] placeholder:text-[color:var(--color-jz-text-tertiary)]"
              rows={3}
            />
          </JZCardContent>
        </JZCard>

        <JZCard>
          <JZCardContent className="p-[var(--space-16)] space-y-[var(--space-12)]">
            <div className="text-center">
              <p className="jz-text-caption text-[color:var(--color-jz-text-tertiary)]">
                生成は1回ごとに料金がかかります（通常100円/枚。今だけセールあり）
              </p>
            </div>
            
            <JZButton
              tone="primary"
              size="lg"
              fullWidth
              onClick={handleGenerate}
              state={(!selectedImage && !selectedExample) || (!customPrompt && !japaneseInput.trim() && !englishPreview.trim()) ? 'disabled' : 'default'}
            >
              写真を変える
            </JZButton>
          </JZCardContent>
        </JZCard>
      </div>
    </div>
  );
};