import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../../api/client';
import { JZButton } from '../design-system/jizai-button';

type SourceFilter = 'all' | 'user' | 'template';

export const PromptHistoryScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const [items, setItems] = useState<Array<{ id: string; source: 'user'|'template'; exampleKey?: string | null; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<SourceFilter>('all');
  const [limit] = useState(24);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchPage = useCallback(async (reset = false, currentFilter: SourceFilter = filter) => {
    try {
      if (reset) setLoading(true); else setLoadingMore(true);
      const source = currentFilter === 'all' ? undefined : currentFilter;
      const page = await api.listPromptsPaged({ limit, offset: reset ? 0 : offset, source: source as any });
      const mapped = (page.items || []).map(p => ({ id: (p as any).id, source: (p as any).source, exampleKey: (p as any).example_key, createdAt: (p as any).created_at }));
      if (reset) {
        setItems(mapped);
        setOffset(page.pagination.limit);
      } else {
        setItems(prev => [...prev, ...mapped]);
        setOffset(offset + page.pagination.limit);
      }
      setHasMore(page.pagination.hasMore);
    } catch {
      // noop
    } finally {
      if (reset) setLoading(false); else setLoadingMore(false);
    }
  }, [limit, offset, filter]);

  useEffect(() => { fetchPage(true); }, []);

  useEffect(() => {
    // Re-fetch on filter change
    fetchPage(true, filter);
  }, [filter]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e.isIntersecting && hasMore && !loadingMore) {
        fetchPage(false);
      }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [sentinelRef.current, hasMore, loadingMore, fetchPage]);

  const applyTemplate = (exampleKey?: string | null) => {
    if (!exampleKey) return;
    try { sessionStorage.setItem('desired-template-key', exampleKey); } catch {}
    onNavigate('create');
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-jz-surface)]">
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="jz-glass-effect border-b border-[color:var(--color-jz-border)]">
          <div className="pt-[44px] px-[var(--space-16)] pb-[var(--space-16)] flex items-center justify-between">
            <JZButton tone="tertiary" size="md" onClick={() => onNavigate('create')}>← 戻る</JZButton>
            <h1 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)]">プロンプト履歴</h1>
            <div className="w-[80px]" />
          </div>
          <div className="px-[var(--space-16)] pb-[var(--space-12)] flex gap-[var(--space-8)] overflow-x-auto">
            {[
              { id: 'all', label: 'すべて' },
              { id: 'user', label: 'ユーザー' },
              { id: 'template', label: 'テンプレート' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id as SourceFilter)}
                className={`shrink-0 rounded-full px-4 py-2 text-[15px] ring-1 transition ${
                  filter === t.id
                    ? 'bg-[color:var(--color-jz-text-primary)] text-[color:var(--color-jz-surface)] ring-[color:var(--color-jz-text-primary)]'
                    : 'bg-[color:var(--color-jz-card)] text-[color:var(--color-jz-text-primary)] ring-[color:var(--color-jz-border)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-[120px] pb-[120px] px-[var(--space-16)]">
        <div className="max-w-[840px] mx-auto">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-[color:var(--color-jz-card)] border border-[color:var(--color-jz-border)]" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center text-[color:var(--color-jz-text-secondary)]">履歴はまだありません</div>
          ) : (
            <div className="space-y-[var(--space-8)]">
              {items.map(p => (
                <div key={p.id} className="flex items-center gap-[var(--space-12)] p-[var(--space-12)] rounded-lg border border-[color:var(--color-jz-border)] bg-[color:var(--color-jz-card)]">
                  <div className="flex-1">
                    <div className="jz-text-body text-[color:var(--color-jz-text-primary)]">{p.source === 'user' ? 'ユーザーのプロンプト（非表示）' : 'テンプレート（匿名）'}</div>
                    <div className="jz-text-caption text-[color:var(--color-jz-text-tertiary)] mt-1">
                      {new Date(p.createdAt).toLocaleString('ja-JP')} · {p.source === 'user' ? 'ユーザー' : 'テンプレート'}
                    </div>
                  </div>
                  {p.source === 'template' && p.exampleKey ? (
                    <JZButton tone="primary" size="sm" onClick={() => applyTemplate(p.exampleKey)}>使う</JZButton>
                  ) : (
                    <JZButton tone="secondary" size="sm" disabled>使えません</JZButton>
                  )}
                </div>
              ))}

              {(hasMore || loadingMore) && (
                <div ref={sentinelRef} className="h-8 flex items-center justify-center text-[color:var(--color-jz-text-tertiary)]">
                  {loadingMore ? '読み込み中…' : ''}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
