"use client";
import { track } from "../lib/analytics";

export function StickyCta({ usecase = '' }: { usecase?: string }) {
  const handleClick = () => {
    track('cta_sticky_mobile', { usecase });
    window.location.href = '/?engine=standard' + (usecase ? `&usecase=${encodeURIComponent(usecase)}` : '');
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-[color:var(--color-jz-border)] shadow-lg">
      <button 
        onClick={handleClick}
        className="w-full py-3 px-4 bg-[color:var(--color-jz-accent)] text-white rounded-md font-medium hover:opacity-90 transition-opacity"
      >
        今すぐ編集を始める
      </button>
    </div>
  );
}