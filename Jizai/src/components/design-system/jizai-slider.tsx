// import React, { useState } from 'react';
import { cn } from '../ui/utils';

export interface JZSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export const JZSlider = React.forwardRef<HTMLDivElement, JZSliderProps>(
  ({ value, onChange, min = 0, max = 100, step = 1, label, className, disabled = false }, ref) => {
    const [isDragging, setIsDragging] = useState(false);
    
    const percentage = ((value - min) / (max - min)) * 100;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    };

    return (
      <div ref={ref} className={cn("w-full", className)}>
        {label && (
          <div className="flex items-center justify-between mb-[var(--space-16)]">
            <label className="jz-text-body text-[color:var(--color-jz-text-primary)] jz-font-body font-medium">
              {label}
            </label>
            {/* 右上に値ラベル表示 - Strong Control */}
            <div className="bg-[color:var(--color-jz-accent)] text-white px-[var(--space-12)] py-[var(--space-8)] rounded-[8px] jz-text-caption font-semibold min-w-[56px] text-center">
              {value}
            </div>
          </div>
        )}
        
        <div className="relative py-[var(--space-16)]">
          {/* Track */}
          <div className="w-full h-[8px] bg-[color:var(--color-jz-border)] rounded-full overflow-hidden">
            {/* Progress */}
            <div 
              className="h-full jz-gradient-primary transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
          
          {/* Thumb - 32pt (大きめ) */}
          <div 
            className="absolute top-1/2 w-[32px] h-[32px] transform -translate-y-1/2 -translate-x-1/2 transition-all duration-200"
            style={{ left: `${percentage}%` }}
          >
            <div className={cn(
              "w-full h-full bg-white rounded-full border-4 border-[color:var(--color-jz-accent)] transition-all duration-200 shadow-lg",
              isDragging && "scale-110 shadow-xl",
              disabled && "opacity-50 cursor-not-allowed",
              "hover:shadow-xl"
            )}>
              {/* Inner indicator for better Strong Control feeling */}
              <div className="w-full h-full rounded-full bg-[color:var(--color-jz-accent)] scale-50 transition-transform duration-200" />
            </div>
          </div>
          
          {/* Input */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
        </div>

        {/* Intensity description for Strong Control */}
        <div className="flex justify-between items-center mt-[var(--space-8)]">
          <span className="jz-text-caption text-[color:var(--color-jz-text-tertiary)]">軽微</span>
          <span className="jz-text-caption text-[color:var(--color-jz-text-secondary)] font-medium">
            編集の強度をコントロール
          </span>
          <span className="jz-text-caption text-[color:var(--color-jz-text-tertiary)]">大幅</span>
        </div>
      </div>
    );
  }
);

JZSlider.displayName = "JZSlider";