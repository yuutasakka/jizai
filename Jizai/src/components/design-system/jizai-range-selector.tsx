// import React, { useState, useRef } from 'react';
import { cn } from '../ui/utils';

export interface JZRangeSelectorProps {
  isActive: boolean;
  onSelectionChange?: (selection: { x: number; y: number; width: number; height: number }) => void;
  className?: string;
}

export const JZRangeSelector = ({ isActive, onSelectionChange, className }: JZRangeSelectorProps) => {
  const [selection, setSelection] = useState({ x: 0.2, y: 0.2, width: 0.6, height: 0.6 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!isActive) return null;

  const handleMouseDown = (handle: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragHandle(handle);
  };

  const handleStyle = {
    position: 'absolute' as const,
    width: '12px',
    height: '12px',
    background: 'var(--color-jz-accent)',
    border: '2px solid white',
    borderRadius: '50%',
    cursor: 'grab',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    transform: 'translate(-50%, -50%)'
  };

  return (
    <div 
      ref={containerRef}
      className={cn("absolute inset-0 z-50", className)}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Selection area */}
      <div 
        className="absolute border-2 border-dashed border-[color:var(--color-jz-accent)] bg-transparent"
        style={{
          left: `${selection.x * 100}%`,
          top: `${selection.y * 100}%`,
          width: `${selection.width * 100}%`,
          height: `${selection.height * 100}%`,
          borderColor: 'var(--color-jz-accent)',
          boxShadow: '0 0 0 1px rgba(10, 132, 255, 0.3)'
        }}
      >
        {/* Handles - 8 points for precise control */}
        {/* Top-left */}
        <div 
          style={{ ...handleStyle, left: '0%', top: '0%' }}
          onMouseDown={handleMouseDown('tl')}
        />
        {/* Top-center */}
        <div 
          style={{ ...handleStyle, left: '50%', top: '0%' }}
          onMouseDown={handleMouseDown('tc')}
        />
        {/* Top-right */}
        <div 
          style={{ ...handleStyle, left: '100%', top: '0%' }}
          onMouseDown={handleMouseDown('tr')}
        />
        {/* Middle-left */}
        <div 
          style={{ ...handleStyle, left: '0%', top: '50%' }}
          onMouseDown={handleMouseDown('ml')}
        />
        {/* Middle-right */}
        <div 
          style={{ ...handleStyle, left: '100%', top: '50%' }}
          onMouseDown={handleMouseDown('mr')}
        />
        {/* Bottom-left */}
        <div 
          style={{ ...handleStyle, left: '0%', top: '100%' }}
          onMouseDown={handleMouseDown('bl')}
        />
        {/* Bottom-center */}
        <div 
          style={{ ...handleStyle, left: '50%', top: '100%' }}
          onMouseDown={handleMouseDown('bc')}
        />
        {/* Bottom-right */}
        <div 
          style={{ ...handleStyle, left: '100%', top: '100%' }}
          onMouseDown={handleMouseDown('br')}
        />
      </div>

      {/* Instructions */}
      <div className="absolute bottom-[var(--space-24)] left-1/2 transform -translate-x-1/2">
        <div className="bg-[color:var(--color-jz-card)] border border-[color:var(--color-jz-border)] px-[var(--space-16)] py-[var(--space-12)] rounded-[--radius-jz-button] jz-glass-effect">
          <p className="jz-text-caption text-[color:var(--color-jz-text-primary)] text-center">
            編集範囲をドラッグして調整
          </p>
        </div>
      </div>
    </div>
  );
};