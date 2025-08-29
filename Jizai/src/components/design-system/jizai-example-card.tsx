import React, { useState } from 'react';
import { JZButton } from './jizai-button';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface ExampleCardProps {
  title: string;
  description: string;
  promptEn: string;
  notice?: string;
  beforeImage?: string;
  afterImage?: string;
  thumbnailImage?: string;
  onTryExample: () => void;
  variant?: 'default' | 'hover' | 'pressed';
  className?: string;
}

export const JZExampleCard = ({
  title,
  description,
  promptEn,
  notice = "※プレビューは英語です。画像に日本語の文字を入れる場合は、その部分を日本語に置き換えてから生成してください。",
  beforeImage,
  afterImage,
  thumbnailImage,
  onTryExample,
  variant = 'default',
  className = ''
}: ExampleCardProps) => {
  const [isSliderActive, setIsSliderActive] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);

  const getVariantClasses = () => {
    switch (variant) {
      case 'hover':
        return 'border-[color:var(--color-jz-accent)]/50 bg-[color:var(--color-jz-card)] shadow-lg transform scale-[1.02]';
      case 'pressed':
        return 'border-[color:var(--color-jz-accent)] bg-[color:var(--color-jz-accent)]/10 shadow-lg transform scale-[0.98]';
      default:
        return 'border-[color:var(--color-jz-border)] bg-[color:var(--color-jz-card)] hover:border-[color:var(--color-jz-accent)]/50 hover:shadow-lg hover:transform hover:scale-[1.02]';
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
  };

  const renderImageSection = () => {
    if (beforeImage && afterImage) {
      // Before/After Slider
      return (
        <div 
          className="relative w-full h-[160px] rounded-[var(--radius-jz-card)] border border-[color:var(--color-jz-border)] overflow-hidden cursor-pointer"
          onMouseEnter={() => setIsSliderActive(true)}
          onMouseLeave={() => setIsSliderActive(false)}
        >
          {/* Before Image */}
          <div className="absolute inset-0">
            <ImageWithFallback
              src={beforeImage}
              alt="Before"
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* After Image with Clip */}
          <div 
            className="absolute inset-0"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <ImageWithFallback
              src={afterImage}
              alt="After"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Slider Control */}
          <div 
            className={`absolute top-0 bottom-0 w-[2px] bg-white shadow-lg transition-opacity ${
              isSliderActive ? 'opacity-100' : 'opacity-70'
            }`}
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[20px] h-[20px] bg-white rounded-full shadow-lg flex items-center justify-center">
              <div className="w-[8px] h-[8px] bg-[color:var(--color-jz-accent)] rounded-full"></div>
            </div>
          </div>

          {/* Hidden Range Input */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPosition}
            onChange={handleSliderChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          {/* Labels */}
          <div className="absolute bottom-[var(--space-8)] left-[var(--space-8)] px-[var(--space-8)] py-[var(--space-4)] bg-black/50 backdrop-blur-sm rounded-[var(--radius-jz-button)]">
            <span className="jz-text-caption text-white font-medium">BEFORE</span>
          </div>
          <div className="absolute bottom-[var(--space-8)] right-[var(--space-8)] px-[var(--space-8)] py-[var(--space-4)] bg-black/50 backdrop-blur-sm rounded-[var(--radius-jz-button)]">
            <span className="jz-text-caption text-white font-medium">AFTER</span>
          </div>
        </div>
      );
    } else if (thumbnailImage) {
      // Single Thumbnail
      return (
        <div className="w-full h-[160px] rounded-[var(--radius-jz-card)] border border-[color:var(--color-jz-border)] overflow-hidden">
          <ImageWithFallback
            src={thumbnailImage}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      );
    } else {
      // Placeholder
      return (
        <div className="w-full h-[160px] rounded-[var(--radius-jz-card)] border border-[color:var(--color-jz-border)] bg-[color:var(--color-jz-surface)] flex items-center justify-center">
          <div className="text-center">
            <div className="w-[48px] h-[48px] rounded-full bg-[color:var(--color-jz-border)] flex items-center justify-center mb-[var(--space-8)] mx-auto">
              <span className="text-[color:var(--color-jz-text-tertiary)]">📷</span>
            </div>
            <p className="jz-text-caption text-[color:var(--color-jz-text-tertiary)]">画像プレビュー</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div 
      className={`
        p-[var(--space-16)] rounded-[var(--radius-jz-card)] border transition-all duration-200
        ${getVariantClasses()} ${className}
      `}
    >
      {/* Image Section */}
      <div className="mb-[var(--space-12)]">
        {renderImageSection()}
      </div>

      {/* Content */}
      <div className="space-y-[var(--space-12)]">
        {/* Title */}
        <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)]">
          {title}
        </h3>

        {/* Description */}
        <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
          {description}
        </p>

        {/* Prompt Section */}
        <div className="space-y-[var(--space-8)]">
          <h4 className="jz-text-caption font-medium text-[color:var(--color-jz-text-primary)]">
            Prompt (EN)
          </h4>
          <div className="p-[var(--space-12)] bg-[color:var(--color-jz-surface)] rounded-[var(--radius-jz-button)] border border-[color:var(--color-jz-border)]">
            <p 
              className="jz-text-caption text-[color:var(--color-jz-text-secondary)] font-mono leading-relaxed"
              style={{ 
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {promptEn}
            </p>
          </div>
        </div>

        {/* Notice */}
        {notice && (
          <p className="jz-text-caption text-[color:var(--color-jz-text-tertiary)] leading-relaxed">
            {notice}
          </p>
        )}

        {/* CTA Button */}
        <JZButton
          tone="primary"
          size="md"
          fullWidth
          onClick={onTryExample}
          className="jz-gradient-primary text-white"
          style={{
            background: 'linear-gradient(135deg, var(--color-jz-accent), var(--color-jz-secondary))',
            borderRadius: 'var(--radius-jz-button)'
          }}
        >
          この例で試す
        </JZButton>
      </div>
    </div>
  );
};