import React, { useState, createContext, useContext } from 'react';
import { cn } from './utils';

interface CollapsibleContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

const useCollapsible = () => {
  const context = useContext(CollapsibleContext);
  if (!context) {
    throw new Error('useCollapsible must be used within a Collapsible');
  }
  return context;
};

export interface CollapsibleProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ open: controlledOpen, onOpenChange, children, className }, ref) => {
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;

    const handleOpenChange = (newOpen: boolean) => {
      if (isControlled) {
        onOpenChange?.(newOpen);
      } else {
        setInternalOpen(newOpen);
      }
    };

    return (
      <CollapsibleContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
        <div ref={ref} className={className}>
          {children}
        </div>
      </CollapsibleContext.Provider>
    );
  }
);

Collapsible.displayName = "Collapsible";

export interface CollapsibleTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  CollapsibleTriggerProps
>(({ asChild = false, children, className, onClick }, ref) => {
  const { open, onOpenChange } = useCollapsible();

  const handleClick = () => {
    onOpenChange(!open);
    onClick?.();
  };

  if (asChild) {
    // When asChild is true, clone the child element and add the onClick handler
    return React.cloneElement(children as React.ReactElement, {
      onClick: handleClick,
    });
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full items-center justify-between rounded-lg border border-[color:var(--color-jz-border)] bg-[color:var(--color-jz-card)] p-4 text-left hover:bg-[color:var(--color-jz-card)]/80 transition-colors",
        className
      )}
    >
      {children}
    </button>
  );
});

CollapsibleTrigger.displayName = "CollapsibleTrigger";

export interface CollapsibleContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  CollapsibleContentProps
>(({ children, className }, ref) => {
  const { open } = useCollapsible();

  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden transition-all duration-200 ease-in-out",
        open ? "animate-collapsible-down" : "animate-collapsible-up hidden",
        className
      )}
      style={{
        display: open ? 'block' : 'none'
      }}
    >
      {children}
    </div>
  );
});

CollapsibleContent.displayName = "CollapsibleContent";