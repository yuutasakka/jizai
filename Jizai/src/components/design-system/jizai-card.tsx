import React from 'react';
import { cn } from '../ui/utils';

export interface JZCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'selected' | 'elevated';
}

export const JZCard = React.forwardRef<HTMLDivElement, JZCardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: "bg-[color:var(--color-jz-card)] border border-[color:var(--color-jz-border)]",
      selected: "bg-[color:var(--color-jz-card)] border-2 border-[color:var(--color-jz-accent)] ring-1 ring-[color:var(--color-jz-accent)]/20",
      elevated: "bg-[color:var(--color-jz-card)] border border-[color:var(--color-jz-border)] jz-shadow-card"
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[--radius-jz-card] transition-all duration-200",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

JZCard.displayName = "JZCard";

export interface JZCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const JZCardHeader = React.forwardRef<HTMLDivElement, JZCardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-[var(--space-8)] p-[var(--space-20)] pb-[var(--space-16)]",
        className
      )}
      {...props}
    />
  )
);

JZCardHeader.displayName = "JZCardHeader";

export interface JZCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const JZCardTitle = React.forwardRef<HTMLParagraphElement, JZCardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  )
);

JZCardTitle.displayName = "JZCardTitle";

export interface JZCardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const JZCardDescription = React.forwardRef<HTMLParagraphElement, JZCardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        "jz-text-body text-[color:var(--color-jz-text-secondary)]",
        className
      )}
      {...props}
    />
  )
);

JZCardDescription.displayName = "JZCardDescription";

export interface JZCardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const JZCardContent = React.forwardRef<HTMLDivElement, JZCardContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("p-[var(--space-20)] pt-0", className)}
      {...props}
    />
  )
);

JZCardContent.displayName = "JZCardContent";

export interface JZCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const JZCardFooter = React.forwardRef<HTMLDivElement, JZCardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center p-[var(--space-20)] pt-0",
        className
      )}
      {...props}
    />
  )
);

JZCardFooter.displayName = "JZCardFooter";