import Script from 'next/script';
import { CREDIT_PLANS, STAFF_PLAN, formatYen } from '../../src/config/pricing';
import { getABVariant } from '../../src/lib/ab';

export default function PricingCredits() {
  const plans = [...CREDIT_PLANS, STAFF_PLAN];
  const ab = typeof window !== 'undefined' ? getABVariant() : 'a';
  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://{your-domain}';
  const offerCatalog = {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: 'JIZAI クレジットプラン',
    url: `${SITE}/#pricing`,
    itemListElement: plans
      .filter((p) => !p.isStaff)
      .map((p) => ({
        '@type': 'Offer',
        name: `${p.units}枚クレジット`,
        sku: `credits-${p.id}`,
        price: String(p.salePrice),
        priceCurrency: 'JPY',
      })),
  } as const;

  const staffOffer = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'スタッフ仕上げ',
    provider: { '@type': 'Organization', name: 'JIZAI' },
    offers: {
      '@type': 'Offer',
      name: 'スタッフにおまかせ（1件）',
      price: String(STAFF_PLAN.salePrice),
      priceCurrency: 'JPY',
      sku: 'staff-assist-1',
    },
  } as const;
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {(ab === 'b' ? [...plans].sort((a, b) => {
          const ra = (a as any).recommended ? 0 : 1;
          const rb = (b as any).recommended ? 0 : 1;
          if (ra !== rb) return ra - rb;
          return a.salePrice - b.salePrice;
        }) : plans).map((p) => {
          const isTwoPack = p.id === '2';
          const title = p.isStaff ? 'スタッフにおまかせ' : `${p.units}枚（回数の目安）`;
          return (
            <div key={p.id} className="relative border rounded-md p-4 bg-[color:var(--color-jz-card)]">
              {!p.isStaff && isTwoPack && (
                <div className="absolute -top-2 right-3 text-xs px-2 py-1 rounded bg-[color:var(--color-jz-secondary)] text-white">今だけ</div>
              )}
              {!p.isStaff && p.recommended && ab === 'b' && (
                <div className="absolute -top-2 left-3 text-xs px-2 py-1 rounded bg-[color:var(--color-jz-accent)] text-white">おすすめ</div>
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
      {/* Structured Data for pricing */}
      <Script id="jsonld-offer-catalog" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(offerCatalog) }} />
      <Script id="jsonld-staff-offer" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(staffOffer) }} />
    </>
  );
}
