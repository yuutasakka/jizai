import React, { useState } from 'react';
import { JZButton } from '../design-system/jizai-button';
import { JZPhotoIcon, JZMagicWandIcon, JZBoltIcon } from '../design-system/jizai-icons';

interface OnboardingScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const JizaiOnboardingScreen = ({ onComplete, onSkip }: OnboardingScreenProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 'hero',
      title: '写真、思いのままに。',
      subtitle: '1枚=¥60。やり直し2回無料。',
      content: null,
      ctaText: 'チュートリアルを見る',
      icon: <JZPhotoIcon size={80} className="text-[color:var(--color-jz-accent)] mx-auto mb-[var(--space-32)]" />
    },
    {
      id: 'steps',
      title: 'やることは3つだけ',
      subtitle: null,
      content: (
        <div className="space-y-[var(--space-24)]">
          <div className="flex items-start gap-[var(--space-16)]">
            <div className="w-[32px] h-[32px] rounded-full bg-[color:var(--color-jz-accent)] flex items-center justify-center text-white font-semibold shrink-0">
              1
            </div>
            <div>
              <h4 className="jz-text-body font-medium text-[color:var(--color-jz-text-primary)] mb-[var(--space-8)]">
                写真を選ぶ
              </h4>
              <p className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
                編集したい写真をアップロード
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-[var(--space-16)]">
            <div className="w-[32px] h-[32px] rounded-full bg-[color:var(--color-jz-accent)] flex items-center justify-center text-white font-semibold shrink-0">
              2
            </div>
            <div>
              <h4 className="jz-text-body font-medium text-[color:var(--color-jz-text-primary)] mb-[var(--space-8)]">
                指示を書く（日本語OK）
              </h4>
              <p className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
                変更したい内容を自然な言葉で
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-[var(--space-16)]">
            <div className="w-[32px] h-[32px] rounded-full bg-[color:var(--color-jz-accent)] flex items-center justify-center text-white font-semibold shrink-0">
              3
            </div>
            <div>
              <h4 className="jz-text-body font-medium text-[color:var(--color-jz-text-primary)] mb-[var(--space-8)]">
                生成
              </h4>
              <p className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
                AI が思い通りに写真を編集
              </p>
            </div>
          </div>
          
          <div className="p-[var(--space-16)] bg-[color:var(--color-jz-card)] rounded-[var(--radius-jz-card)] border border-[color:var(--color-jz-border)] mt-[var(--space-24)]">
            <p className="jz-text-caption text-[color:var(--color-jz-text-tertiary)] text-center">
              この操作で 1クレジット（¥60）消費
            </p>
          </div>
        </div>
      ),
      ctaText: '次へ',
      icon: <JZMagicWandIcon size={64} className="text-[color:var(--color-jz-secondary)] mx-auto mb-[var(--space-24)]" />
    },
    {
      id: 'preview',
      title: '英語プレビューで高精度',
      subtitle: null,
      content: (
        <div className="space-y-[var(--space-20)]">
          <p className="jz-text-body text-[color:var(--color-jz-text-secondary)] leading-relaxed">
            画像に日本語の文字を入れる場合は、その部分を日本語に置き換えてから生成してください。
          </p>
          
          <div className="p-[var(--space-16)] bg-[color:var(--color-jz-card)] rounded-[var(--radius-jz-card)] border border-[color:var(--color-jz-border)]">
            <div className="space-y-[var(--space-12)]">
              <div>
                <p className="jz-text-caption text-[color:var(--color-jz-text-primary)] font-medium mb-[var(--space-8)]">
                  例：日本語入力
                </p>
                <p className="jz-text-caption text-[color:var(--color-jz-text-secondary)] font-mono bg-[color:var(--color-jz-surface)] p-[var(--space-12)] rounded-[var(--radius-jz-button)]">
                  看板の「営業中」を「準備中」に変えて
                </p>
              </div>
              
              <div>
                <p className="jz-text-caption text-[color:var(--color-jz-text-primary)] font-medium mb-[var(--space-8)]">
                  英語プレビュー
                </p>
                <p className="jz-text-caption text-[color:var(--color-jz-accent)] font-mono bg-[color:var(--color-jz-surface)] p-[var(--space-12)] rounded-[var(--radius-jz-button)]">
                  Change "営業中" to "準備中" on the sign
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      ctaText: 'はじめる',
      icon: <JZBoltIcon size={64} className="text-[color:var(--color-jz-warning)] mx-auto mb-[var(--space-24)]" />
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="min-h-screen bg-[color:var(--color-jz-surface)] flex flex-col">
      {/* Skip Button - Fixed Top Right */}
      <div className="fixed top-[44px] right-[var(--space-24)] z-50">
        <button
          onClick={onSkip}
          className="jz-text-body text-[color:var(--color-jz-text-tertiary)] hover:text-[color:var(--color-jz-text-secondary)] transition-colors"
        >
          スキップ
        </button>
      </div>

      {/* Progress Indicators */}
      <div className="pt-[80px] px-[var(--space-24)]">
        <div className="flex justify-center gap-[var(--space-8)] mb-[var(--space-48)]">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-[4px] rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-[32px] bg-[color:var(--color-jz-accent)]'
                  : 'w-[8px] bg-[color:var(--color-jz-border)]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-[var(--space-24)] pb-[120px]">
        <div className="max-w-[375px] mx-auto">
          {/* Icon */}
          <div className="text-center mb-[var(--space-32)]">
            {currentSlideData.icon}
          </div>

          {/* Title */}
          <h1 
            className="text-center mb-[var(--space-16)]"
            style={{
              fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
              fontSize: '26px',
              fontWeight: '600',
              lineHeight: '1.2',
              color: '#ECECEC'
            }}
          >
            {currentSlideData.title}
          </h1>

          {/* Subtitle */}
          {currentSlideData.subtitle && (
            <p 
              className="text-center mb-[var(--space-32)]"
              style={{
                fontFamily: 'Noto Sans JP, -apple-system, BlinkMacSystemFont, sans-serif',
                fontSize: '15px',
                fontWeight: '400',
                lineHeight: '1.4',
                color: '#A1A1AA'
              }}
            >
              {currentSlideData.subtitle}
            </p>
          )}

          {/* Content */}
          {currentSlideData.content && (
            <div className="mb-[var(--space-48)]">
              {currentSlideData.content}
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-[color:var(--color-jz-surface)] border-t border-[color:var(--color-jz-border)]">
        <div className="p-[var(--space-24)]">
          <JZButton
            tone="primary"
            size="lg"
            fullWidth
            onClick={handleNext}
            className="jz-gradient-primary text-white"
            style={{
              background: 'linear-gradient(135deg, var(--color-jz-accent), var(--color-jz-secondary))',
              borderRadius: '12px'
            }}
          >
            {currentSlideData.ctaText}
          </JZButton>

          {/* Back Button for slides 2+ */}
          {currentSlide > 0 && (
            <JZButton
              tone="tertiary"
              size="md"
              fullWidth
              onClick={() => setCurrentSlide(currentSlide - 1)}
              className="mt-[var(--space-16)] text-[color:var(--color-jz-text-secondary)]"
            >
              戻る
            </JZButton>
          )}
        </div>
      </div>
    </div>
  );
};