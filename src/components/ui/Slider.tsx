import React, { useState, useCallback } from 'react';

interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  onChangeComplete?: (value: number) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
}

export function Slider({
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue = min,
  onChange,
  onChangeComplete,
  disabled = false,
  className = '',
  label,
  showValue = true,
  formatValue = (val) => val.toString()
}: SliderProps) {
  const [internalValue, setInternalValue] = useState(value ?? defaultValue);
  const currentValue = value ?? internalValue;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  }, [value, onChange]);

  const handleMouseUp = useCallback(() => {
    onChangeComplete?.(currentValue);
  }, [currentValue, onChangeComplete]);

  const percentage = ((currentValue - min) / (max - min)) * 100;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-[color:var(--color-jz-text-primary)]">
            {label}
          </label>
          {showValue && (
            <span className="text-sm text-[color:var(--color-jz-text-secondary)]">
              {formatValue(currentValue)}
            </span>
          )}
        </div>
      )}

      <div className="relative">
        {/* Track */}
        <div className="relative h-2 bg-[color:var(--color-jz-border)] rounded-full overflow-hidden">
          {/* Progress */}
          <div
            className="absolute left-0 top-0 h-full bg-[color:var(--color-jz-accent)] rounded-full transition-all duration-150 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleChange}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        {/* Thumb */}
        <div
          className={`absolute top-1/2 w-5 h-5 bg-white border-2 border-[color:var(--color-jz-accent)] rounded-full shadow-lg transform -translate-y-1/2 -translate-x-1/2 transition-all duration-150 ease-out ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-95'
          }`}
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Range Slider (双方向スライダー)
interface RangeSliderProps {
  min?: number;
  max?: number;
  step?: number;
  value?: [number, number];
  defaultValue?: [number, number];
  onChange?: (value: [number, number]) => void;
  onChangeComplete?: (value: [number, number]) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  showValues?: boolean;
  formatValue?: (value: number) => string;
}

export function RangeSlider({
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue = [min, max],
  onChange,
  onChangeComplete,
  disabled = false,
  className = '',
  label,
  showValues = true,
  formatValue = (val) => val.toString()
}: RangeSliderProps) {
  const [internalValue, setInternalValue] = useState<[number, number]>(value ?? defaultValue);
  const currentValue = value ?? internalValue;
  const [minVal, maxVal] = currentValue;

  const handleMinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), maxVal - step);
    const newValue: [number, number] = [newMin, maxVal];
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  }, [value, maxVal, step, onChange]);

  const handleMaxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), minVal + step);
    const newValue: [number, number] = [minVal, newMax];
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  }, [value, minVal, step, onChange]);

  const handleMouseUp = useCallback(() => {
    onChangeComplete?.(currentValue);
  }, [currentValue, onChangeComplete]);

  const minPercentage = ((minVal - min) / (max - min)) * 100;
  const maxPercentage = ((maxVal - min) / (max - min)) * 100;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-[color:var(--color-jz-text-primary)]">
            {label}
          </label>
          {showValues && (
            <span className="text-sm text-[color:var(--color-jz-text-secondary)]">
              {formatValue(minVal)} - {formatValue(maxVal)}
            </span>
          )}
        </div>
      )}

      <div className="relative">
        {/* Track */}
        <div className="relative h-2 bg-[color:var(--color-jz-border)] rounded-full overflow-hidden">
          {/* Progress */}
          <div
            className="absolute top-0 h-full bg-[color:var(--color-jz-accent)] rounded-full transition-all duration-150 ease-out"
            style={{
              left: `${minPercentage}%`,
              width: `${maxPercentage - minPercentage}%`
            }}
          />
        </div>

        {/* Min Input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={handleMinChange}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed pointer-events-auto"
        />

        {/* Max Input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={handleMaxChange}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed pointer-events-auto"
        />

        {/* Min Thumb */}
        <div
          className={`absolute top-1/2 w-5 h-5 bg-white border-2 border-[color:var(--color-jz-accent)] rounded-full shadow-lg transform -translate-y-1/2 -translate-x-1/2 transition-all duration-150 ease-out z-10 ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-95'
          }`}
          style={{ left: `${minPercentage}%` }}
        />

        {/* Max Thumb */}
        <div
          className={`absolute top-1/2 w-5 h-5 bg-white border-2 border-[color:var(--color-jz-accent)] rounded-full shadow-lg transform -translate-y-1/2 -translate-x-1/2 transition-all duration-150 ease-out z-10 ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-95'
          }`}
          style={{ left: `${maxPercentage}%` }}
        />
      </div>
    </div>
  );
}