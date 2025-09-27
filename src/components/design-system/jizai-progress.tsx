import React from 'react';
import { cn } from './utils';

export interface JZProgressProps {
  value: number;
  max?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
}

export const JZProgress = React.forwardRef<HTMLDivElement, JZProgressProps>(
  ({ value, max = 100, className, size = 'md', variant = 'default' }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    const sizeClasses = {
      sm: 'h-[4px]',
      md: 'h-[8px]',
      lg: 'h-[12px]'
    };

    const variantClasses = {
      default: 'jz-gradient-primary',
      accent: 'bg-[color:var(--color-jz-accent)]',
      success: 'bg-[color:var(--color-jz-success)]',
      warning: 'bg-[color:var(--color-jz-warning)]',
      danger: 'bg-[color:var(--color-jz-error)]'
    };

    return (
      <div
        ref={ref}
        className={cn(
          "w-full bg-[color:var(--color-jz-border)] rounded-full overflow-hidden",
          sizeClasses[size],
          className
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            "h-full transition-all duration-300 ease-out rounded-full",
            variantClasses[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  }
);

JZProgress.displayName = "JZProgress";

// Legacy export for compatibility
export const Progress = JZProgress;