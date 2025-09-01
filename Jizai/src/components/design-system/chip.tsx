// import React from 'react';
import { cn } from '../ui/utils';

export interface DSChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'selected';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const DSChip = React.forwardRef<HTMLButtonElement, DSChipProps>(
  ({ className, variant = 'default', size = 'md', icon, children, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--color-surface)] font-body rounded-[--radius-chip] border";
    
    const variants = {
      default: "bg-[color:var(--color-card)] text-[color:var(--color-text-secondary)] border-[color:var(--color-border)] hover:bg-[color:var(--color-border)] active:scale-[0.95]",
      selected: "gradient-accent text-white border-transparent shadow-lg"
    };

    const sizes = {
      sm: "h-[32px] px-[12px] text-caption",
      md: "h-[40px] px-[16px] text-body"
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
        <div className="flex items-center gap-[6px]">
          {icon && icon}
          {children}
        </div>
      </button>
    );
  }
);

DSChip.displayName = "DSChip";