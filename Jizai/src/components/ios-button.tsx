// import React from 'react';
import { cn } from './ui/utils';

export interface IOSButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  state?: 'enabled' | 'disabled' | 'pressed' | 'loading';
  fullWidth?: boolean;
}

export const IOSButton = React.forwardRef<HTMLButtonElement, IOSButtonProps>(
  ({ className, variant = 'primary', size = 'md', state = 'enabled', fullWidth = false, children, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ios-blue)] focus:ring-offset-2 disabled:cursor-not-allowed";
    
    const variants = {
      primary: {
        enabled: "bg-[color:var(--color-ios-blue)] text-white hover:bg-[color:var(--color-ios-blue-dark)] active:bg-[color:var(--color-ios-blue-dark)] active:scale-95",
        disabled: "bg-[color:var(--color-ios-gray-4)] text-[color:var(--color-ios-gray-1)] cursor-not-allowed",
        pressed: "bg-[color:var(--color-ios-blue-dark)] text-white scale-95",
        loading: "bg-[color:var(--color-ios-blue)] text-white opacity-70 cursor-not-allowed"
      },
      secondary: {
        enabled: "bg-[color:var(--color-ios-gray-6)] text-[color:var(--color-ios-blue)] hover:bg-[color:var(--color-ios-gray-5)] active:bg-[color:var(--color-ios-gray-4)] active:scale-95",
        disabled: "bg-[color:var(--color-ios-gray-6)] text-[color:var(--color-ios-gray-2)] cursor-not-allowed",
        pressed: "bg-[color:var(--color-ios-gray-4)] text-[color:var(--color-ios-blue)] scale-95",
        loading: "bg-[color:var(--color-ios-gray-6)] text-[color:var(--color-ios-blue)] opacity-70 cursor-not-allowed"
      },
      destructive: {
        enabled: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 active:scale-95",
        disabled: "bg-[color:var(--color-ios-gray-4)] text-[color:var(--color-ios-gray-1)] cursor-not-allowed",
        pressed: "bg-red-700 text-white scale-95",
        loading: "bg-red-500 text-white opacity-70 cursor-not-allowed"
      },
      ghost: {
        enabled: "text-[color:var(--color-ios-blue)] hover:bg-[color:var(--color-ios-gray-6)] active:bg-[color:var(--color-ios-gray-5)] active:scale-95",
        disabled: "text-[color:var(--color-ios-gray-2)] cursor-not-allowed",
        pressed: "text-[color:var(--color-ios-blue)] bg-[color:var(--color-ios-gray-5)] scale-95",
        loading: "text-[color:var(--color-ios-blue)] opacity-70 cursor-not-allowed"
      }
    };

    const sizes = {
      sm: "min-h-[44px] px-4 py-2 text-sm",
      md: "min-h-[44px] px-6 py-3 text-base",
      lg: "min-h-[50px] px-8 py-4 text-lg"
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
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </div>
        ) : (
          children
        )}
      </button>
    );
  }
);

IOSButton.displayName = "IOSButton";