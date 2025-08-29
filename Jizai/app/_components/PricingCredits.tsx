import { CREDIT_PLANS, STAFF_PLAN, formatYen } from '../../src/config/pricing';

export default function PricingCredits() {
  const plans = [...CREDIT_PLANS, STAFF_PLAN];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {plans.map((p) => {
        const isTwoPack = p.id === '2';
        const title = p.isStaff ? 'スタッフにおまかせ' : `${p.units}枚（回数の目安）`;
        return (
          <div key={p.id} className="relative border rounded-md p-4 bg-[color:var(--color-jz-card)]">
            {!p.isStaff && isTwoPack && (
              <div className="absolute -top-2 right-3 text-xs px-2 py-1 rounded bg-[color:var(--color-jz-secondary)] text-white">今だけ</div>
            )}
            <div className="mb-2 text-[color:var(--color-jz-text-primary)] font-semibold">{title}</div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xl font-semibold text-[color:var(--color-jz-text-primary)]">{formatYen(p.salePrice)}</span>
              {isTwoPack && p.compareAtLabel && (
                <span className="text-xs text-[color:var(--color-jz-text-tertiary)] line-through">{p.compareAtLabel}</span>
              )}
            </div>
            <div className="text-sm text-[color:var(--color-jz-text-secondary)] mb-3">{p.unitLabel || ''}</div>
            <button className="text-sm underline">{p.isStaff ? '購入' : 'このプランを選ぶ'}</button>
          </div>
        );
      })}
    </div>
  );
}

