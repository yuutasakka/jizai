"use client";
import React from "react";

export type EngineProfile = "standard" | "high";

export function EngineSelector({
  value,
  onChange,
}: { value: EngineProfile; onChange: (v: EngineProfile) => void }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-[color:var(--color-jz-text-primary)]">編集エンジン</legend>
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="engine"
            value="standard"
            checked={value === "standard"}
            onChange={() => onChange("standard")}
          />
          <span className="text-[color:var(--color-jz-text-secondary)]">標準（自然さ優先）</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="engine"
            value="high"
            checked={value === "high"}
            onChange={() => onChange("high")}
          />
          <span className="text-[color:var(--color-jz-text-secondary)]">高精細（仕上がり重視 / 時間+）</span>
        </label>
      </div>
      <p className="text-xs text-[color:var(--color-jz-text-tertiary)]">※ 高精細は生成に時間がかかる場合があります。</p>
    </fieldset>
  );
}

