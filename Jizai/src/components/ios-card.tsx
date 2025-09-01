import React from 'react';
import { cn } from './ui/utils';

export interface IOSCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
}

export const IOSCard = React.forwardRef<HTMLDivElement, IOSCardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: "bg-white border border-[color:var(--color-ios-gray-4)] rounded-xl",
      elevated: "bg-white shadow-lg rounded-xl border-0",
      outlined: "bg-white border-2 border-[color:var(--color-ios-gray-3)] rounded-xl"
    };

    return (
      <div
        ref={ref}
        className={cn(variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

IOSCard.displayName = "IOSCard";

export const IOSCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-4 pb-2", className)} {...props} />
  )
);
IOSCardHeader.displayName = "IOSCardHeader";

export const IOSCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-4", className)} {...props} />
  )
);
IOSCardContent.displayName = "IOSCardContent";

export const IOSCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-4 pt-2", className)} {...props} />
  )
);
IOSCardFooter.displayName = "IOSCardFooter";