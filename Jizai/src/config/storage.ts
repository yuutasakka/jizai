export type StorageThresholds = {
  warn: number;   // 例: 70 (%) 以上で警告色
  danger: number; // 例: 90 (%) 以上で危険色
};

const env = (import.meta as any)?.env || {};

export const STORAGE_THRESHOLDS: StorageThresholds = {
  warn: Number(env.VITE_STORAGE_WARN_PERCENT ?? 70),
  danger: Number(env.VITE_STORAGE_DANGER_PERCENT ?? 90),
};

export function pickBarClass(usedBytes: number, quotaBytes: number) {
  const p = toPercent(usedBytes, quotaBytes);
  if (p >= STORAGE_THRESHOLDS.danger) return 'bg-red-500';
  if (p >= STORAGE_THRESHOLDS.warn) return 'bg-yellow-500';
  return 'bg-green-500';
}

export function toPercent(usedBytes: number, quotaBytes: number) {
  if (!quotaBytes || quotaBytes <= 0) return 0;
  return Math.min(100, Math.round((usedBytes / quotaBytes) * 100));
}

