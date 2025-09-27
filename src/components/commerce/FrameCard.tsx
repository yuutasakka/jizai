import React, { useEffect, useState } from 'react';
import { track } from '../../lib/analytics';

type Preview = { url: string; host: string; title: string; image: string | null; siteName: string };

async function fetchPreview(url: string): Promise<Preview | null> {
  try {
    const u = new URL('/v1/link/preview', window.location.origin);
    u.searchParams.set('url', url);
    const res = await fetch(u.toString());
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export function FrameCard({ amazonUrl, rakutenUrl, sizeKey, page }: { amazonUrl?: string; rakutenUrl?: string; sizeKey?: string; page: 'result' | 'resize-result' }) {
  const [amz, setAmz] = useState<Preview | null>(null);
  const [rkt, setRkt] = useState<Preview | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (amazonUrl) {
        const p = await fetchPreview(amazonUrl);
        if (!cancelled) setAmz(p);
      }
      if (rakutenUrl) {
        const p = await fetchPreview(rakutenUrl);
        if (!cancelled) setRkt(p);
      }
    })();
    return () => { cancelled = true; };
  }, [amazonUrl, rakutenUrl]);

  if (!amazonUrl && !rakutenUrl) return null;

  const onClick = (vendor: 'amazon' | 'rakuten') => {
    try { track('frame_cta_click', { vendor, size: sizeKey || '', page }); } catch {}
  };

  return (
    <div className="rounded-xl border border-[color:var(--color-jz-border)] bg-[color:var(--color-jz-card)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[color:var(--color-jz-text-primary)]">
          <div className="font-bold mb-1">額縁も一緒に購入</div>
          <div className="text-sm text-[color:var(--color-jz-text-secondary)]">生成した写真に合う額縁をチェック</div>
        </div>
        <div className="flex items-center gap-2">
          {amazonUrl && (
            <a href={amazonUrl} target="_blank" rel="noopener noreferrer" onClick={() => onClick('amazon')} className="px-3 py-2 rounded-lg bg-white text-black font-semibold border border-[color:var(--color-jz-border)] hover:bg-white/90">
              Amazonで購入
            </a>
          )}
          {rakutenUrl && (
            <a href={rakutenUrl} target="_blank" rel="noopener noreferrer" onClick={() => onClick('rakuten')} className="px-3 py-2 rounded-lg bg-white text-black font-semibold border border-[color:var(--color-jz-border)] hover:bg-white/90">
              楽天で購入
            </a>
          )}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {amz && (
          <div className="flex items-center gap-3 p-2 rounded border border-[color:var(--color-jz-border)] bg-[color:var(--color-jz-surface)]">
            {amz.image ? <img src={amz.image} alt={amz.title} className="w-12 h-12 object-cover rounded" /> : <div className="w-12 h-12 bg-[color:var(--color-jz-border)] rounded" />}
            <div className="min-w-0">
              <div className="jz-text-caption text-[color:var(--color-jz-text-primary)] truncate">{amz.title}</div>
              <div className="jz-text-caption text-[color:var(--color-jz-text-tertiary)]">Amazon</div>
            </div>
          </div>
        )}
        {rkt && (
          <div className="flex items-center gap-3 p-2 rounded border border-[color:var(--color-jz-border)] bg-[color:var(--color-jz-surface)]">
            {rkt.image ? <img src={rkt.image} alt={rkt.title} className="w-12 h-12 object-cover rounded" /> : <div className="w-12 h-12 bg-[color:var(--color-jz-border)] rounded" />}
            <div className="min-w-0">
              <div className="jz-text-caption text-[color:var(--color-jz-text-primary)] truncate">{rkt.title}</div>
              <div className="jz-text-caption text-[color:var(--color-jz-text-tertiary)]">楽天</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FrameCard;

