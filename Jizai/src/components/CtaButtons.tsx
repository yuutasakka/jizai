"use client";
import { track } from "../lib/analytics";
import { getABVariant } from "../lib/ab";

export function CtaButtons({ usecase = '' }: { usecase?: string }) {
  const ab = typeof window !== 'undefined' ? getABVariant() : 'a';
  const startNow = () => {
    track('cta_edit_now', { usecase, ab });
    window.location.href = '/?engine=standard' + (usecase ? `&usecase=${encodeURIComponent(usecase)}` : '');
  };
  const tryExample = () => {
    track('cta_try_example', { usecase, ab });
    window.location.href = '/?engine=standard' + (usecase ? `&usecase=${encodeURIComponent(usecase)}` : '');
  };
  return (
    <div className="mt-4 flex gap-3 justify-center">
      <button onClick={startNow} className="px-5 py-3 rounded-md bg-[color:var(--color-jz-accent)] text-white">{ab === 'b' ? '今すぐはじめる' : '今すぐ編集'}</button>
      <button onClick={tryExample} className="px-5 py-3 rounded-md border bg-[color:var(--color-jz-card)]">この例で試す</button>
    </div>
  );
}
