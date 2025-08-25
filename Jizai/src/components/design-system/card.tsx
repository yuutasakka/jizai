import React from 'react';
import { cn } from '../ui/utils';

export interface DSCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'selected' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const DSCard = React.forwardRef<HTMLDivElement, DSCardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const baseClasses = "rounded-[--radius-card] border transition-all duration-200";
    
    const variants = {
      default: "bg-[color:var(--color-card)] border-[color:var(--color-border)]",
      selected: "bg-[color:var(--color-card)] border-[color:var(--color-accent)] border-2 shadow-lg",
      glass: "glass-effect border-[color:var(--color-border)]"
    };

    const paddings = {
      none: "",
      sm: "p-[12px]",
      md: "p-[16px]",
      lg: "p-[24px]"
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DSCard.displayName = "DSCard";

export const DSCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("mb-[16px]", className)} {...props} />
  )
);
DSCardHeader.displayName = "DSCardHeader";

export const DSCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("", className)} {...props} />
  )
);
DSCardContent.displayName = "DSCardContent";

export const DSCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("mt-[16px]", className)} {...props} />
  )
);
DSCardFooter.displayName = "DSCardFooter";