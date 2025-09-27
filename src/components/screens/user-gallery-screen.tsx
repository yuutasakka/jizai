import React, { useMemo, useRef, useState } from 'react';
import { JZButton } from '../design-system/jizai-button';
import { JZCard, JZCardHeader, JZCardContent } from '../design-system/jizai-card';
import { JZChip } from '../design-system/jizai-chip';
import {
  JZArrowLeftIcon,
  JZDownloadIcon,
  JZShareIcon,
  JZTrashIcon,
  JZCalendarIcon
} from '../design-system/jizai-icons';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import api from '../../api/client';
import { navigate } from '../../router';
import { Cloud, Plus, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface GeneratedImage {
  id: string;
  originalImage: string;
  generatedImage: string;
  prompt: string;
  createdAt: Date;
  expiresAt: Date;
  title: string;
}

export const UserGalleryScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [filter, setFilter] = useState<'all' | 'recent' | 'expiring'>('all');
  const [loading, setLoading] = useState(true);
  const [serverItems, setServerItems] = useState<Array<{ id: string; url: string; title: string; uploadedAt: string; mimeType?: string; size?: number }>>([]);
  const [hasMore, setHasMore] = useState(false);
  const [limit] = useState(24);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState<Record<string, { w: number; h: number }>>({});
  const [openResize, setOpenResize] = useState<string | null>(null);
  const [resizing, setResizing] = useState(false);

  const formatSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
  };

  const mimeToExt = (mime?: string) =>
    mime === 'image/jpeg' ? 'jpg' : mime === 'image/png' ? 'png' : 'img';

  // ローカル保存データの読み込み（なければモック）
  const stored: GeneratedImage[] = (() => {
    try {
      const raw = localStorage.getItem('jizai_gallery');
      if (!raw) {
        // 初回シード（サンプル）: public/examples からモックデータを投入
        const now = Date.now();
        const samples: GeneratedImage[] = [
          {
            id: 'ex_human_01',
            originalImage: '/examples/human_01_before.png',
            generatedImage: '/examples/human_01_after.png',
            prompt: '肌トーン調整と背景の自然な補正',
            createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
            expiresAt: new Date(now + 90 * 24 * 60 * 60 * 1000),
            title: '人物（サンプル）'
          },
          {
            id: 'ex_pet_01',
            originalImage: '/examples/pet_01_before.png',
            generatedImage: '/examples/pet_01_after.png',
            prompt: '明るさ/コントラストの最適化と背景ぼかし',
            createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
            expiresAt: new Date(now + 90 * 24 * 60 * 60 * 1000),
            title: 'ペット（サンプル）'
          },
          {
            id: 'ex_photo_01',
            originalImage: '/examples/photo_01_before.png',
            generatedImage: '/examples/photo_01_after.png',
            prompt: '背景除去と高画質化',
            createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000),
            expiresAt: new Date(now + 90 * 24 * 60 * 60 * 1000),
            title: '写真（サンプル）'
          }
        ];
        try {
          localStorage.setItem('jizai_gallery', JSON.stringify(samples.map(s => ({
            id: s.id,
            originalImage: s.originalImage,
            generatedImage: s.generatedImage,
            prompt: s.prompt,
            createdAt: s.createdAt.toISOString(),
            expiresAt: s.expiresAt.toISOString(),
            title: s.title
          }))));
        } catch {}
        return samples as any;
      }
      const arr = JSON.parse(raw) as any[];
      return arr.map((x) => ({
        id: x.id,
        originalImage: x.originalImage,
        generatedImage: x.generatedImage,
        prompt: x.prompt,
        createdAt: new Date(x.createdAt),
        expiresAt: new Date(x.expiresAt || Date.now() + 90*24*60*60*1000),
        title: x.title || '生成結果'
      }));
    } catch {
      return [] as any;
    }
  })();

  // 取得関数
  const fetchMemories = React.useCallback(async () => {
    try {
      setLoading(true);
      const page = await api.listMemoriesPaged(limit, 0);
      setServerItems(page.items.map(i => ({ id: i.id, url: i.url, title: i.title, uploadedAt: i.uploadedAt, mimeType: i.mimeType, size: i.size })));
      setOffset(page.pagination.limit);
      setHasMore(page.pagination.hasMore);
    } catch {
      // サーバー未設定やネットワーク不可の場合はローカルのみ表示
    } finally {
      setLoading(false);
    }
  }, []);

  // サーバーからユーザー毎の生成物を取得 + 可視化切替/通知で再取得
  React.useEffect(() => {
    let cancelled = false;
    fetchMemories();
    const onVisibility = () => { if (!document.hidden) fetchMemories(); };
    const onUpdate = () => fetchMemories();
    window.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('jizai:memories:updated', onUpdate as EventListener);
    return () => {
      cancelled = true;
      window.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('jizai:memories:updated', onUpdate as EventListener);
    };
  }, [fetchMemories]);

  const loadMore = async () => {
    try {
      if (loadingMore || !hasMore) return;
      setLoadingMore(true);
      const page = await api.listMemoriesPaged(limit, offset);
      setServerItems(prev => [...prev, ...page.items.map(i => ({ id: i.id, url: i.url, title: i.title, uploadedAt: i.uploadedAt, mimeType: i.mimeType, size: i.size }))]);
      setOffset(offset + page.pagination.limit);
      setHasMore(page.pagination.hasMore);
    } catch {
      // noop
    } finally {
      setLoadingMore(false);
    }
  };

  // Infinite scroll via IntersectionObserver
  React.useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        loadMore();
      }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [sentinelRef.current, hasMore, offset, loadingMore]);

  const handleImgLoad = (id: string, ev: React.SyntheticEvent<HTMLImageElement>) => {
    try {
      const img = ev.currentTarget;
      if (img && img.naturalWidth && img.naturalHeight) {
        setDimensions(prev => ({ ...prev, [id]: { w: img.naturalWidth, h: img.naturalHeight } }));
      }
    } catch {}
  };

  const handleDownloadServer = async (item: { id: string; url: string; title: string; mimeType?: string; }) => {
    try {
      let headers: Record<string,string> = {};
      try {
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          if (token) headers['Authorization'] = `Bearer ${token}`;
        }
      } catch {}
      try { const devId = localStorage.getItem('jizai-device-id'); if (devId) headers['x-device-id'] = devId; } catch {}
      const resp = await fetch(`/v1/memories/${item.id}/signed-download`, { headers });
      const data = await resp.json().catch(() => ({}));
      const url = resp.ok && data?.url ? data.url : item.url;
      const a = document.createElement('a');
      a.href = url;
      const ext = mimeToExt(item.mimeType);
      const safeTitle = (item.title || 'image').replace(/[^\w\-]+/g, '_').slice(0, 40);
      a.download = `${safeTitle}_${item.id}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {}
  };

  // ローカルのみ（モックは使わない）
  const sourceImages = stored;
  const filteredImages = sourceImages.filter(image => {
    switch (filter) {
      case 'recent':
        return Date.now() - image.createdAt.getTime() <= 7 * 24 * 60 * 60 * 1000; // 7日以内
      case 'expiring':
        return image.expiresAt.getTime() - Date.now() <= 14 * 24 * 60 * 60 * 1000; // 14日以内に期限切れ
      default:
        return true;
    }
  });

  const filters = useMemo(() => [
  ] as const, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getDaysUntilExpiry = (expiresAt: Date) => {
    const days = Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    return days;
  };

  const handleDownload = (image: GeneratedImage) => {
    try {
      // If a high-quality (upscaled) URL exists, prefer it
      const mapRaw = localStorage.getItem('jizai_upscaled_map');
      let upUrl: string | null = null;
      if (mapRaw) {
        const map = JSON.parse(mapRaw) as Record<string, { url?: string; path?: string; ts?: number }>;
        const key = (() => { try { const u = new URL(image.generatedImage); return `${u.origin}${u.pathname}`; } catch { return image.generatedImage; } })();
        if (map[key]?.url) upUrl = map[key].url as string;
      }
      const a = document.createElement('a');
      a.href = upUrl || image.generatedImage;
      const safeTitle = (image.title || 'image').replace(/[^\w\-]+/g, '_').slice(0, 40);
      a.download = `${safeTitle}_${image.id}${upUrl ? '_hq' : ''}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      alert(`${image.title} をダウンロードできませんでした`);
    }
  };


  const resizeAndDownload = async (image: GeneratedImage, targetWidth: number) => {
    try {
      setResizing(true);
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.crossOrigin = 'anonymous';
        i.onload = () => resolve(i);
        i.onerror = reject as any;
        i.src = image.generatedImage;
      });
      const scale = targetWidth / img.naturalWidth;
      const w = Math.max(1, Math.round(targetWidth));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');
      ctx.drawImage(img, 0, 0, w, h);
      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png', 0.92);
      });
      const a = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const safeTitle = (image.title || 'image').replace(/[^\w\-]+/g, '_').slice(0, 40);
      a.href = url;
      a.download = `${safeTitle}_${image.id}_${w}x${h}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('サイズ変更に失敗しました');
    } finally {
      setResizing(false);
      setOpenResize(null);
    }
  };

  const handleShare = (image: GeneratedImage) => {
    // モック：実際の実装では共有機能
    if (navigator.share) {
      navigator.share({
        title: `JIZAI - ${image.title}`,
        text: '写真、思いのままに。',
        url: window.location.href
      });
    } else {
      alert('共有機能はこのブラウザではサポートされていません');
    }
  };

  const handleDeleteLocal = (image: GeneratedImage) => {
    if (confirm(`「${image.title}」を削除しますか？この操作は取り消せません。`)) {
      alert(`${image.title} を削除しました`);
    }
  };

  const handleDeleteServer = async (id: string, title: string) => {
    if (!confirm(`「${title || '画像'}」を削除しますか？この操作は取り消せません。`)) return;
    try {
      await api.deleteMemory(id);
      setServerItems(prev => prev.filter(i => i.id !== id));
      try { window.dispatchEvent(new CustomEvent('jizai:memories:updated')); } catch {}
    } catch (e) {
      alert('削除に失敗しました');
    }
  };

  // Empty state - 一貫したヘッダーデザインを使用
  if (!loading && sourceImages.length === 0) {
    return (
      <div className="min-h-screen bg-[color:var(--color-jz-surface)]">
        {/* Header - content stateと一致 */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="jz-glass-effect border-b border-[color:var(--color-jz-border)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
              {/* Title row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h1 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)]">マイファイル</h1>
                </div>
                <div className="flex items-center gap-4 text-[color:var(--color-jz-text-secondary)]">
                  <button
                    onClick={() => onNavigate('storage')}
                    className="hover:text-[color:var(--color-jz-text-primary)] transition-colors"
                    aria-label="ストレージ"
                  >
                    <Cloud className="h-5 w-5" />
                  </button>
                </div>
              </div>
              {/* Filter chips */}
              <div className="mt-4 flex items-center gap-3 overflow-x-auto">
                {filters.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`shrink-0 rounded-full px-4 py-2 text-[15px] ring-1 transition ${
                      filter === f.id
                        ? 'bg-[color:var(--color-jz-text-primary)] text-[color:var(--color-jz-surface)] ring-[color:var(--color-jz-text-primary)]'
                        : 'bg-[color:var(--color-jz-card)] text-[color:var(--color-jz-text-primary)] ring-[color:var(--color-jz-border)]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Empty state content */}
        <div className="pt-[140px] pb-[160px] px-[var(--space-16)] min-h-screen flex items-center justify-center">
          <div className="max-w-[600px] w-full">
            <div className="flex items-center justify-center">
              <div className="text-center max-w-sm mx-auto">
                <div className="mx-auto mb-[var(--space-24)] grid h-16 w-16 place-items-center rounded-full ring-1 ring-[color:var(--color-jz-border)] bg-[color:var(--color-jz-card)]">
                  <ImageIcon className="h-8 w-8 text-[color:var(--color-jz-text-secondary)]" />
                </div>
                <h2 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)] mb-[var(--space-16)]">
                  最初に何を作成しますか？
                </h2>
                <p className="jz-text-body text-[color:var(--color-jz-text-secondary)] leading-relaxed mb-[var(--space-24)]">
                  はじめての一枚を作成して、ここに保存しましょう。
                </p>
                <div className="flex justify-center">
                  <JZButton
                    tone="primary"
                    size="lg"
                    onClick={() => onNavigate('create')}
                    className="flex items-center justify-center"
                  >
                    最初の一枚を作成
                  </JZButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-jz-surface)]">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="jz-glass-effect border-b border-[color:var(--color-jz-border)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            {/* Title row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <h1 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)] mb-0">マイファイル</h1>
              </div>
              <div className="flex items-center gap-4 text-[color:var(--color-jz-text-secondary)]">
                <button
                  onClick={() => onNavigate('storage')}
                  className="hover:text-[color:var(--color-jz-text-primary)] transition-colors"
                  aria-label="ストレージ"
                >
                  <Cloud className="h-5 w-5" />
                </button>
                <button
                  onClick={() => fetchMemories()}
                  className="hover:text-[color:var(--color-jz-text-primary)] transition-colors"
                  aria-label="更新"
                  title="更新"
                >
                  ↻
                </button>
              </div>
            </div>
            {/* Filter chips */}
            <div className="mt-6 flex items-center gap-3 overflow-x-auto pb-2">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-[15px] ring-1 transition font-medium ${
                    filter === f.id
                      ? 'bg-[color:var(--color-jz-text-primary)] text-[color:var(--color-jz-surface)] ring-[color:var(--color-jz-text-primary)]'
                      : 'bg-[color:var(--color-jz-card)] text-[color:var(--color-jz-text-primary)] ring-[color:var(--color-jz-border)] hover:bg-[color:var(--color-jz-surface)]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-[120px] sm:pt-[140px] pb-[100px] sm:pb-[120px] px-[var(--space-12)] sm:px-[var(--space-20)] min-h-screen flex items-center justify-center">
        <div className="max-w-[1200px] w-full">
          {/* Gallery Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--space-16)] sm:gap-[var(--space-24)] animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-[color:var(--color-jz-card)] border border-[color:var(--color-jz-border)] rounded-[var(--radius-jz-card)] overflow-hidden w-full sm:max-w-[400px]">
                  <div className="h-[240px] bg-[color:var(--color-jz-border)]" />
                  <div className="p-[var(--space-20)] space-y-[var(--space-8)]">
                    <div className="h-5 w-2/3 bg-[color:var(--color-jz-border)] rounded" />
                    <div className="h-4 w-1/2 bg-[color:var(--color-jz-border)] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : serverItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--space-16)] sm:gap-[var(--space-24)] justify-items-center">
              {serverItems.map(item => (
                <JZCard key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200 w-full max-w-[400px]">
                  <JZCardContent className="p-0">
                    <div className="relative h-[240px] bg-[color:var(--color-jz-border)]">
                      <img src={item.url} alt={item.title} loading="lazy" className="w-full h-full object-cover" onLoad={(e) => handleImgLoad(item.id, e)} />
                    </div>
                    <div className="p-[var(--space-20)]">
                      <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-[var(--space-8)]">{item.title}</h3>
                      <p className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">{formatDate(new Date(item.uploadedAt as any))} に作成</p>
                      <div className="jz-text-caption text-[color:var(--color-jz-text-tertiary)] mt-[var(--space-8)] flex items-center gap-2">
                        <span>{item.mimeType?.split('/')?.pop()?.toUpperCase() || 'IMG'}</span>
                        <span>·</span>
                        <span>{formatSize(item.size)}</span>
                        {dimensions[item.id] && (
                          <>
                            <span>·</span>
                            <span>{dimensions[item.id].w}×{dimensions[item.id].h}</span>
                          </>
                        )}
                        <button
                          className="ml-auto underline hover:text-[color:var(--color-jz-text-secondary)]"
                          onClick={async () => { try { await navigator.clipboard.writeText(item.url); } catch {} }}
                          title="URLをコピー"
                        >
                          URLをコピー
                        </button>
                        <button
                          className="underline hover:text-[color:var(--color-jz-text-secondary)]"
                          onClick={() => handleDownloadServer(item)}
                          title="ダウンロード"
                        >
                          ダウンロード
                        </button>
                        <button
                          className="underline hover:text-[color:var(--color-jz-text-secondary)]"
                          onClick={() => navigate(`/tools/resize?src=${encodeURIComponent(item.url)}&title=${encodeURIComponent(item.title || '')}&memoryId=${encodeURIComponent(item.id)}`)}
                          title="サイズ変更"
                        >
                          サイズ変更
                        </button>
                        <button
                          className="underline hover:text-[color:var(--color-jz-text-secondary)]"
                          onClick={() => handleDeleteServer(item.id, item.title)}
                          title="削除"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </JZCardContent>
                </JZCard>
              ))}
              {/* Sentinel for infinite scroll */}
              {hasMore && (
                <div ref={sentinelRef} className="col-span-full h-8" />
              )}
            </div>
          ) : filteredImages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--space-16)] sm:gap-[var(--space-24)] justify-items-center">
              {filteredImages.map((image) => {
                const daysLeft = getDaysUntilExpiry(image.expiresAt);
                const isExpiringSoon = daysLeft <= 14;

                return (
                  <JZCard key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200 w-full max-w-[400px]">
                    <JZCardContent className="p-0">
                      {/* Generated Image Only (BEFORE not shown) */}
                      <div className="relative h-[240px] bg-[color:var(--color-jz-border)]">
                        <div className="absolute inset-0">
                          <ImageWithFallback
                            src={image.generatedImage}
                            alt="Generated"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      
                        {/* Expiry Warning */}
                        {isExpiringSoon && (
                          <div className="absolute top-[var(--space-8)] right-[var(--space-8)]">
                            <JZChip
                              size="sm"
                              variant="default"
                              className="bg-[color:var(--color-jz-warning)] text-white border-none shadow-md"
                            >
                              あと{daysLeft}日
                            </JZChip>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-[var(--space-20)]">
                        <div className="mb-[var(--space-16)]">
                          <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-[var(--space-8)]">
                            {image.title}
                          </h3>
                          <p className="jz-text-caption text-[color:var(--color-jz-text-secondary)] mb-[var(--space-12)]">
                            {formatDate(image.createdAt)} に作成
                          </p>
                          <div className="p-[var(--space-12)] bg-[color:var(--color-jz-surface)] rounded-[var(--radius-jz-button)] border border-[color:var(--color-jz-border)]">
                            <p className="jz-text-caption text-[color:var(--color-jz-text-tertiary)] leading-relaxed">
                              {image.prompt}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-[var(--space-12)] items-center relative">
                          <JZButton
                            tone="primary"
                            size="md"
                            onClick={() => handleDownload(image)}
                            className="flex items-center gap-[var(--space-8)] flex-1"
                          >
                            保存
                          </JZButton>
                          <JZButton
                            tone="secondary"
                            size="md"
                            onClick={() => navigate(`/tools/resize?src=${encodeURIComponent(image.generatedImage)}&title=${encodeURIComponent(image.title || '')}`)}
                            className="flex items-center gap-[var(--space-8)]"
                          >
                            サイズ変更
                          </JZButton>
                          <JZButton
                            tone="secondary"
                            size="md"
                            onClick={() => handleShare(image)}
                            className="flex items-center justify-center gap-[var(--space-8)]"
                            aria-label={`共有: ${image.title}`}
                          >
                            <JZShareIcon size={16} />
                          </JZButton>
                          <JZButton
                            tone="secondary"
                            size="md"
                            onClick={() => handleDeleteLocal(image)}
                            className="flex items-center gap-[var(--space-8)] text-red-500 hover:text-red-600 font-medium"
                            aria-label={`削除: ${image.title}`}
                          >
                            削除
                          </JZButton>
                        </div>
                      </div>
                    </JZCardContent>
                  </JZCard>
                );
              })}
            </div>
          ) : (
            // Empty State - フィルター結果が空の場合
            <div className="col-span-full flex items-center justify-center min-h-[400px] px-6">
              <div className="text-center max-w-md mx-auto">
                <div className="mx-auto mb-8 grid h-16 w-16 place-items-center rounded-full ring-1 ring-[color:var(--color-jz-border)] bg-[color:var(--color-jz-card)]">
                  <ImageIcon className="h-8 w-8 text-[color:var(--color-jz-text-secondary)]" />
                </div>
                <h3 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)] mb-4 leading-tight">
                  {filter === 'recent' ? '最近の作品がありません' :
                   filter === 'expiring' ? '期限間近の作品がありません' :
                   '最初の一枚を作成しましょう'}
                </h3>
                <p className="jz-text-body text-[color:var(--color-jz-text-secondary)] mb-8 leading-relaxed px-4">
                  {filter === 'all'
                    ? '編集した写真がこちらに保存されます。はじめての一枚を作成してみましょう。'
                    : '他のフィルターを選択するか、新しい作品を作成してください。'
                  }
                </p>
                <div className="flex justify-center">
                  <JZButton
                    tone="primary"
                    size="lg"
                    onClick={() => onNavigate('create')}
                    className="flex items-center justify-center px-6 py-3"
                  >
                    {filter === 'all' ? '最初の一枚を作成' : '新しい作品を作成'}
                  </JZButton>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
