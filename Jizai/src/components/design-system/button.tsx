import React from 'react';
import { cn } from '../ui/utils';

export interface DSButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  state?: 'enabled' | 'disabled' | 'pressed' | 'loading';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const DSButton = React.forwardRef<HTMLButtonElement, DSButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    state = 'enabled', 
    fullWidth = false,
    icon,
    iconPosition = 'left',
    children, 
    ...props 
  }, ref) => {
    const baseClasses = "inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--color-surface)] disabled:cursor-not-allowed text-button";
    
    const variants = {
      primary: {
        enabled: "gradient-accent text-white hover:opacity-90 active:opacity-80 active:scale-[0.98] shadow-lg",
        disabled: "bg-[color:var(--color-text-disabled)] text-[color:var(--color-text-tertiary)] cursor-not-allowed",
        pressed: "gradient-accent text-white opacity-80 scale-[0.98]",
        loading: "gradient-accent text-white opacity-70 cursor-not-allowed"
      },
      secondary: {
        enabled: "bg-[color:var(--color-card)] text-[color:var(--color-text-primary)] border border-[color:var(--color-border)] hover:bg-[color:var(--color-border)] active:bg-[color:var(--color-border)] active:scale-[0.98]",
        disabled: "bg-[color:var(--color-card)] text-[color:var(--color-text-disabled)] border border-[color:var(--color-text-disabled)] cursor-not-allowed",
        pressed: "bg-[color:var(--color-border)] text-[color:var(--color-text-primary)] border border-[color:var(--color-border)] scale-[0.98]",
        loading: "bg-[color:var(--color-card)] text-[color:var(--color-text-primary)] border border-[color:var(--color-border)] opacity-70 cursor-not-allowed"
      },
      tertiary: {
        enabled: "text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/10 active:bg-[color:var(--color-accent)]/20 active:scale-[0.98]",
        disabled: "text-[color:var(--color-text-disabled)] cursor-not-allowed",
        pressed: "text-[color:var(--color-accent)] bg-[color:var(--color-accent)]/20 scale-[0.98]",
        loading: "text-[color:var(--color-accent)] opacity-70 cursor-not-allowed"
      },
      destructive: {
        enabled: "bg-[color:var(--color-destructive)] text-white hover:opacity-90 active:opacity-80 active:scale-[0.98]",
        disabled: "bg-[color:var(--color-text-disabled)] text-[color:var(--color-text-tertiary)] cursor-not-allowed",
        pressed: "bg-[color:var(--color-destructive)] text-white opacity-80 scale-[0.98]",
        loading: "bg-[color:var(--color-destructive)] text-white opacity-70 cursor-not-allowed"
      }
    };

    const sizes = {
      sm: "min-h-[40px] px-[16px] py-[8px] rounded-[--radius-button]",
      md: "min-h-[48px] px-[24px] py-[12px] rounded-[--radius-button]",
      lg: "min-h-[56px] px-[32px] py-[16px] rounded-[--radius-button]"
    };

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant][state],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        ref={ref}
        disabled={state === 'disabled' || state === 'loading'}
        {...props}
      >
        {state === 'loading' ? (
          <div className="flex items-center gap-[8px]">
            <div className="w-[16px] h-[16px] border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </div>
        ) : (
          <div className="flex items-center gap-[8px]">
            {icon && iconPosition === 'left' && icon}
            {children}
            {icon && iconPosition === 'right' && icon}
          </div>
        )}
      </button>
    );
  }
);

DSButton.displayName = "DSButton";