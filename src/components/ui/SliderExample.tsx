import React, { useState } from 'react';
import { Slider, RangeSlider } from './Slider';

export function SliderExample() {
  const [singleValue, setSingleValue] = useState(50);
  const [rangeValue, setRangeValue] = useState<[number, number]>([25, 75]);
  const [brightness, setBrightness] = useState(100);
  const [volume, setVolume] = useState(80);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h2 className="text-2xl font-bold text-[color:var(--color-jz-text-primary)] mb-6">
        スライダーコンポーネント例
      </h2>

      {/* 基本的なスライダー */}
      <div>
        <h3 className="text-lg font-semibold text-[color:var(--color-jz-text-primary)] mb-4">
          基本スライダー
        </h3>
        <Slider
          label="値"
          value={singleValue}
          onChange={setSingleValue}
          min={0}
          max={100}
          step={1}
        />
      </div>

      {/* 範囲スライダー */}
      <div>
        <h3 className="text-lg font-semibold text-[color:var(--color-jz-text-primary)] mb-4">
          範囲スライダー
        </h3>
        <RangeSlider
          label="範囲"
          value={rangeValue}
          onChange={setRangeValue}
          min={0}
          max={100}
          step={5}
        />
      </div>

      {/* 明度調整 */}
      <div>
        <h3 className="text-lg font-semibold text-[color:var(--color-jz-text-primary)] mb-4">
          明度調整
        </h3>
        <Slider
          label="明度"
          value={brightness}
          onChange={setBrightness}
          min={0}
          max={200}
          step={1}
          formatValue={(val) => `${val}%`}
        />
      </div>

      {/* 音量調整 */}
      <div>
        <h3 className="text-lg font-semibold text-[color:var(--color-jz-text-primary)] mb-4">
          音量
        </h3>
        <Slider
          label="音量"
          value={volume}
          onChange={setVolume}
          min={0}
          max={100}
          step={1}
          formatValue={(val) => `${val}%`}
        />
      </div>

      {/* 横1列のコンパクト表示 */}
      <div>
        <h3 className="text-lg font-semibold text-[color:var(--color-jz-text-primary)] mb-4">
          横1列コンパクト表示
        </h3>
        <div className="flex items-center justify-between gap-4 px-2 py-1">
          <span className="text-sm font-medium text-[color:var(--color-jz-text-primary)] min-w-0 flex-shrink-0">
            サイズ
          </span>
          <div className="flex-1 min-w-0">
            <Slider
              value={singleValue}
              onChange={setSingleValue}
              min={0}
              max={100}
              step={1}
              showValue={false}
              className="w-full"
            />
          </div>
          <span className="text-sm text-[color:var(--color-jz-text-secondary)] min-w-0 flex-shrink-0">
            {singleValue}%
          </span>
        </div>
      </div>

      {/* 複数のスライダーを横1列で */}
      <div>
        <h3 className="text-lg font-semibold text-[color:var(--color-jz-text-primary)] mb-4">
          複数スライダー（横1列）
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 px-2 py-1">
            <span className="text-sm font-medium text-[color:var(--color-jz-text-primary)] w-16 flex-shrink-0">
              明度
            </span>
            <div className="flex-1">
              <Slider
                value={brightness}
                onChange={setBrightness}
                min={0}
                max={200}
                step={1}
                showValue={false}
              />
            </div>
            <span className="text-sm text-[color:var(--color-jz-text-secondary)] w-12 text-right flex-shrink-0">
              {brightness}%
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 px-2 py-1">
            <span className="text-sm font-medium text-[color:var(--color-jz-text-primary)] w-16 flex-shrink-0">
              音量
            </span>
            <div className="flex-1">
              <Slider
                value={volume}
                onChange={setVolume}
                min={0}
                max={100}
                step={1}
                showValue={false}
              />
            </div>
            <span className="text-sm text-[color:var(--color-jz-text-secondary)] w-12 text-right flex-shrink-0">
              {volume}%
            </span>
          </div>
        </div>
      </div>

      {/* 現在の値表示 */}
      <div className="mt-8 p-4 bg-[color:var(--color-jz-card)] rounded-lg">
        <h4 className="text-lg font-semibold text-[color:var(--color-jz-text-primary)] mb-2">
          現在の値
        </h4>
        <div className="text-sm text-[color:var(--color-jz-text-secondary)] space-y-1">
          <p>単一値: {singleValue}</p>
          <p>範囲: {rangeValue[0]} - {rangeValue[1]}</p>
          <p>明度: {brightness}%</p>
          <p>音量: {volume}%</p>
        </div>
      </div>
    </div>
  );
}