"use client";
import { track } from "../lib/analytics";

export function StickyCtaMobile({ usecase = '' }: { usecase?: string }) {
  const click = (kind: 'edit' | 'example') => {
    track('cta_sticky_mobile', { usecase, kind });
    const url = `/?engine=standard${usecase ? `&usecase=${encodeURIComponent(usecase)}` : ''}`;
    window.location.href = url;
  };
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="mx-auto max-w-5xl bg-[color:var(--color-jz-card)] border-t border-[color:var(--color-jz-border)] px-4 py-3 flex gap-3 justify-between">
        <button onClick={() => click('edit')} className="flex-1 px-4 py-2 rounded-md bg-[color:var(--color-jz-accent)] text-white text-sm font-semibold">今すぐ編集</button>
        <button onClick={() => click('example')} className="flex-1 px-4 py-2 rounded-md border bg-[color:var(--color-jz-surface)] text-sm">この例で試す</button>
      </div>
    </div>
  );
}

