export type ABVariant = 'a' | 'b';

export function getABVariant(): ABVariant {
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    const qp = url.searchParams.get('ab');
    if (qp === 'a' || qp === 'b') return qp;
  }
  const envVar = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_AB_VARIANT) || '';
  return envVar === 'b' ? 'b' : 'a';
}

