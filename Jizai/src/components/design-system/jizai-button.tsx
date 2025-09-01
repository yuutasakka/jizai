// import React from 'react';
import { cn } from '../ui/utils';

export interface JZButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: 'primary' | 'secondary' | 'tertiary' | 'destructive';
  size?: 'md' | 'lg';
  state?: 'default' | 'pressed' | 'disabled' | 'loading';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const JZButton = React.forwardRef<HTMLButtonElement, JZButtonProps>(
  ({ 
    className, 
    tone = 'primary', 
    size = 'md', 
    state = 'default', 
    fullWidth = false,
    icon,
    iconPosition = 'left',
    children, 
    ...props 
  }, ref) => {
    // アクセシビリティ：44pt以上のタップ領域確保
    const baseClasses = "inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-jz-accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--color-jz-surface)] disabled:cursor-not-allowed";
    
    const tones = {
      primary: {
        default: "jz-gradient-primary text-white hover:opacity-90 active:opacity-80 active:scale-[0.98] jz-shadow-button",
        disabled: "bg-[color:var(--color-jz-text-disabled)] text-[color:var(--color-jz-text-tertiary)] cursor-not-allowed",
        pressed: "jz-gradient-primary text-white opacity-80 scale-[0.98]",
        loading: "jz-gradient-primary text-white opacity-70 cursor-not-allowed"
      },
      secondary: {
        default: "bg-[color:var(--color-jz-card)] text-[color:var(--color-jz-text-primary)] border border-[color:var(--color-jz-border)] hover:bg-[color:var(--color-jz-border)] active:bg-[color:var(--color-jz-border)] active:scale-[0.98]",
        disabled: "bg-[color:var(--color-jz-card)] text-[color:var(--color-jz-text-disabled)] border border-[color:var(--color-jz-text-disabled)] cursor-not-allowed",
        pressed: "bg-[color:var(--color-jz-border)] text-[color:var(--color-jz-text-primary)] border border-[color:var(--color-jz-border)] scale-[0.98]",
        loading: "bg-[color:var(--color-jz-card)] text-[color:var(--color-jz-text-primary)] border border-[color:var(--color-jz-border)] opacity-70 cursor-not-allowed"
      },
      tertiary: {
        default: "text-[color:var(--color-jz-accent)] hover:bg-[color:var(--color-jz-accent)]/10 active:bg-[color:var(--color-jz-accent)]/20 active:scale-[0.98]",
        disabled: "text-[color:var(--color-jz-text-disabled)] cursor-not-allowed",
        pressed: "text-[color:var(--color-jz-accent)] bg-[color:var(--color-jz-accent)]/20 scale-[0.98]",
        loading: "text-[color:var(--color-jz-accent)] opacity-70 cursor-not-allowed"
      },
      destructive: {
        default: "bg-[color:var(--color-jz-destructive)] text-white hover:opacity-90 active:opacity-80 active:scale-[0.98] jz-shadow-button",
        disabled: "bg-[color:var(--color-jz-text-disabled)] text-[color:var(--color-jz-text-tertiary)] cursor-not-allowed",
        pressed: "bg-[color:var(--color-jz-destructive)] text-white opacity-80 scale-[0.98]",
        loading: "bg-[color:var(--color-jz-destructive)] text-white opacity-70 cursor-not-allowed"
      }
    };

    // 44pt以上のタップ領域確保
    const sizes = {
      md: "min-h-[44px] px-[var(--space-16)] py-[var(--space-12)] rounded-[--radius-jz-button] jz-text-button",
      lg: "min-h-[56px] px-[var(--space-24)] py-[var(--space-16)] rounded-[--radius-jz-button] jz-text-button"
    };

    return (
      <button
        className={cn(
          baseClasses,
          tones[tone][state],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        ref={ref}
        disabled={state === 'disabled' || state === 'loading'}
        {...props}
      >
        {state === 'loading' ? (
          <div className="flex items-center gap-[var(--space-8)]">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span className="truncate jz-font-body font-semibold">{children}</span>
          </div>
        ) : (
          <div className="flex items-center gap-[var(--space-8)]">
            {icon && iconPosition === 'left' && (
              <span className="flex-shrink-0">{icon}</span>
            )}
            <span className="truncate jz-font-body font-semibold">{children}</span>
            {icon && iconPosition === 'right' && (
              <span className="flex-shrink-0">{icon}</span>
            )}
          </div>
        )}
      </button>
    );
  }
);

JZButton.displayName = "JZButton";