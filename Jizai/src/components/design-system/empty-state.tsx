import React from 'react';
import { cn } from '../ui/utils';
import { DSButton } from './button';

export interface DSEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const DSEmptyState = React.forwardRef<HTMLDivElement, DSEmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center text-center py-[48px] px-[24px]",
          className
        )}
        {...props}
      >
        {icon && (
          <div className="mb-[24px] text-[color:var(--color-text-tertiary)]">
            {icon}
          </div>
        )}
        
        <h3 className="font-display text-display-small text-[color:var(--color-text-primary)] mb-[8px]">
          {title}
        </h3>
        
        {description && (
          <p className="text-body text-[color:var(--color-text-secondary)] mb-[24px] max-w-[280px]">
            {description}
          </p>
        )}
        
        {action && (
          <DSButton
            variant="secondary"
            onClick={action.onClick}
          >
            {action.label}
          </DSButton>
        )}
      </div>
    );
  }
);

DSEmptyState.displayName = "DSEmptyState";