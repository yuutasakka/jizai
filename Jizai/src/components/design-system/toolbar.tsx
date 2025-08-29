import React from 'react';
import { cn } from '../ui/utils';

export interface DSToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: 'top' | 'bottom';
  transparent?: boolean;
}

export const DSToolbar = React.forwardRef<HTMLDivElement, DSToolbarProps>(
  ({ className, position = 'top', transparent = false, children, ...props }, ref) => {
    const baseClasses = "fixed left-0 right-0 z-50 px-[16px] py-[12px]";
    
    const positions = {
      top: "top-0 safe-area-top",
      bottom: "bottom-0 safe-area-bottom"
    };

    const backgroundClasses = transparent 
      ? "glass-effect" 
      : "bg-[color:var(--color-surface)] border-b border-[color:var(--color-border)]";

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          positions[position],
          backgroundClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DSToolbar.displayName = "DSToolbar";