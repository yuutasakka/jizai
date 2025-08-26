export type Plan = {
  id: string;
  units: number; // 何枚分
  regularPrice: number; // 通常価格（円）
  salePrice: number;    // セール価格（円）
  recommended?: boolean;
  isStaff?: boolean; // スタッフアシストプランかどうか
};

export const SALE_ENABLED = (import.meta as any)?.env?.VITE_SALE_ENABLED !== 'false';
export const SALE_END_AT = (import.meta as any)?.env?.VITE_SALE_END_AT || '';

// 通常価格は 100円/枚
const REGULAR_PER_UNIT = 100;

// セール価格（ご要望の現状価格）
const SALE_TABLE: Record<string, number> = {
  '2': 160,
  '10': 700,
  '20': 1400,
  '50': 3250,
  '100': 6000,
  'staff': 1980,
};

export function getPlans(): Plan[] {
  const base: Array<{ id: string; units: number; recommended?: boolean; isStaff?: boolean }> = [
    { id: '2', units: 2 },
    { id: '10', units: 10 },
    { id: '20', units: 20 },
    { id: '50', units: 50, recommended: true },
    { id: '100', units: 100 },
    { id: 'staff', units: 1, isStaff: true },
  ];

  return base.map(({ id, units, recommended, isStaff }) => ({
    id,
    units,
    regularPrice: isStaff ? 1980 : units * REGULAR_PER_UNIT,
    salePrice: SALE_TABLE[id] ?? (isStaff ? 1980 : units * REGULAR_PER_UNIT),
    recommended,
    isStaff,
  }));
}

export function percentOff(regular: number, sale: number): number {
  if (!regular || regular <= 0 || sale >= regular) return 0;
  return Math.round((1 - sale / regular) * 100);
}

export function formatYen(n: number): string {
  return `¥${n.toLocaleString('ja-JP')}`;
}

