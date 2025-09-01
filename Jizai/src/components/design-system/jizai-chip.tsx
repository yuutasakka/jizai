import React from 'react';
import { cn } from '../ui/utils';

export interface JZChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'selected';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const JZChip = React.forwardRef<HTMLButtonElement, JZChipProps>(
  ({ className, variant = 'default', size = 'md', icon, children, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-jz-accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--color-jz-surface)] jz-font-body rounded-[--radius-jz-chip] border";
    
    const variants = {
      default: "bg-[color:var(--color-jz-card)] text-[color:var(--color-jz-text-secondary)] border-[color:var(--color-jz-border)] hover:bg-[color:var(--color-jz-border)] hover:text-[color:var(--color-jz-text-primary)] active:scale-[0.95]",
      selected: "jz-gradient-primary text-white border-transparent jz-shadow-button"
    };

    const sizes = {
      sm: "h-[32px] px-[var(--space-12)] jz-text-caption",
      md: "h-[40px] px-[var(--space-16)] jz-text-body"
    };

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      >
        <div className="flex items-center gap-[var(--space-8)]">
          {icon && icon}
          {children}
        </div>
      </button>
    );
  }
);

JZChip.displayName = "JZChip";