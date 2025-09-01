export type Plan = {
  id: string;
  units: number; // 何枚分
  regularPrice: number; // 通常価格（円）
  salePrice: number; // 販売価格（円）
  recommended?: boolean;
  isStaff?: boolean; // スタッフアシストプランかどうか
  unitLabel?: string; // UI表示用（1枚あたりなど）
  compareAtLabel?: string; // 取り消し線の文言（例：通常¥200）
};

export const SALE_ENABLED = true;
export const SALE_END_AT = '';

// 新クレジットプラン（2025Q3）
export const CREDIT_PLANS: Plan[] = [
  { id: '2',   units: 2,   regularPrice: 200,  salePrice: 160, unitLabel: '1枚=¥80（通常¥100）', compareAtLabel: '通常¥200' },
  { id: '10',  units: 10,  regularPrice: 700,  salePrice: 700, unitLabel: '1枚=¥70' },
  { id: '20',  units: 20,  regularPrice: 1400, salePrice: 1400, unitLabel: '1枚=¥70' },
  { id: '50',  units: 50,  regularPrice: 3250, salePrice: 3250, unitLabel: '1枚=¥65', recommended: true },
  { id: '100', units: 100, regularPrice: 6000, salePrice: 6000, unitLabel: '1枚=¥60' },
];

export const STAFF_PLAN: Plan = {
  id: 'staff',
  units: 0,
  regularPrice: 4980,
  salePrice: 4980,
  isStaff: true,
  unitLabel: '有人仕上げ / 1件',
};

export function getPlans(): Plan[] {
  return [...CREDIT_PLANS, STAFF_PLAN];
}

export function percentOff(regular: number, sale: number): number {
  if (!regular || regular <= 0 || sale >= regular) return 0;
  return Math.round((1 - sale / regular) * 100);
}

export function formatYen(n: number): string {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(n);
}
