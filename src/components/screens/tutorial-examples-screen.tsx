import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Bell, Sparkles, Zap, Crown, Star } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface InspirationExample {
  id: string;
  beforeImage: string;
  afterImage: string;
  prompt: string;
  promptKey?: string;
  title: string;
  // UI tab category (not the content category)
  category: 'inspire' | 'search' | 'following' | 'ai-generated';
  // Content category from DB (e.g., people/pet/photo)
  contentCategory?: string;
  createdAt?: string;
}

interface TutorialExamplesScreenProps {
  onNavigate: (screen: string) => void;
  onExampleSelected: (example: any) => void;
}

// Remote inspiration examples from Supabase
const FALLBACK_EXAMPLES: InspirationExample[] = [];

import '../../styles/inspiration.css';

export const TutorialExamplesScreen = ({ onNavigate, onExampleSelected }: TutorialExamplesScreenProps) => {
  const [activeTab, setActiveTab] = useState<'inspire' | 'search' | 'following' | 'ai-generated'>('inspire');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'recommend' | 'newest' | 'title'>('recommend');

  // Inspiration examples (fetched)
  const [inspireExamples, setInspireExamples] = useState<InspirationExample[]>(FALLBACK_EXAMPLES);

  // Inspire categories
  const inspireCategories: Array<{ key: string; label: string }> = [
    { key: 'all', label: 'すべて' },
    { key: 'people', label: '人物' },
    { key: 'pet', label: 'ペット' },
    { key: 'photo', label: '写真' },
  ];
  const [selectedInspireCategory, setSelectedInspireCategory] = useState<string>(inspireCategories[0].key);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number>(0);

  // Load inspiration examples from Supabase
  useEffect(() => {
    let cancelled = false;
    async function loadInspire() {
      if (!supabase) return;
      if (activeTab !== 'inspire') return;
      try {
        let query = supabase
          .from('inspiration_examples')
          .select('id, before_path, after_path, before_url, after_url, title, prompt, prompt_key, category, popularity, display_order, created_at');

        if (selectedInspireCategory !== 'all') {
          query = query.eq('category', selectedInspireCategory);
        }

        if (sortBy === 'newest') {
          query = query.order('created_at', { ascending: false });
        } else if (sortBy === 'title') {
          query = query.order('title', { ascending: true });
        } else {
          // recommend: display_order asc, popularity desc, created_at desc
          query = query.order('display_order', { ascending: true, nullsFirst: true })
                       .order('popularity', { ascending: false })
                       .order('created_at', { ascending: false });
        }

        const { data, error } = await query.limit(50);
        if (error) throw error;
        if (!cancelled && Array.isArray(data)) {
          const mapped = data.map((r: any) => ({
            id: String(r.id),
            beforeImage: r.before_path || r.before_url || '',
            afterImage: r.after_path || r.after_url || r.before_path || r.before_url || '',
            prompt: r.prompt || '',
            promptKey: r.prompt_key || undefined,
            title: r.title || '',
            category: 'inspire' as const,
            contentCategory: r.category || undefined,
            createdAt: r.created_at || undefined,
          }));
          setInspireExamples(mapped);
        }
      } catch {
        if (!cancelled) setInspireExamples(FALLBACK_EXAMPLES);
      }
    }
    loadInspire();
    return () => { cancelled = true; };
  }, [activeTab, sortBy, selectedInspireCategory]);

  // Apply sorting
  const sortedExamples = React.useMemo(() => {
    let base = activeTab === 'inspire' ? inspireExamples : [];
    // local filter as safety for fallback data
    if (activeTab === 'inspire' && selectedInspireCategory !== 'all') {
      base = base.filter(ex => ex.contentCategory === selectedInspireCategory);
    }
    const arr = [...base];
    switch (sortBy) {
      case 'newest':
        return arr.sort((a, b) => (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime()));
      case 'title':
        return arr.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      case 'recommend':
      default:
        return arr; // default uses server ordering
    }
  }, [inspireExamples, sortBy, activeTab, selectedInspireCategory]);

  // 検索タブは未対応のため検索結果取得は削除

  const tabs = [
    { id: 'inspire' as const, label: 'インスピ', icon: <Sparkles className="w-4 h-4" />, color: 'from-blue-400 to-purple-500' },
  ];

  const handleTryPrompt = (example: InspirationExample) => {
    // Store only opaque template key (no prompt text)
    try {
      const key = example.promptKey ? example.promptKey : `example_${example.id}`;
      sessionStorage.setItem('desired-template-key', key);
    } catch {}
    onNavigate('create');
  };

  // Enhanced Image card component with professional design
  const ImageCard = ({ example }: { example: InspirationExample }) => {
    const [showAfter, setShowAfter] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
      const interval = setInterval(() => {
        setShowAfter(prev => !prev);
      }, 3000); // 3秒間隔で切り替え

      return () => clearInterval(interval);
    }, []);

    return (
      <div
        className="group relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-slate-200/60 hover:border-slate-300 overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image container */}
        <div className="relative h-48 sm:h-56 overflow-hidden bg-slate-100">
          <ImageWithFallback
            src={showAfter ? example.afterImage : example.beforeImage}
            alt={showAfter ? 'After' : 'Before'}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
          />

          {/* Subtle overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Before/After indicator */}
          <div className="absolute top-3 right-3 px-2.5 py-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-sm border border-white/50">
            <span className="text-slate-700 text-xs font-semibold flex items-center gap-1.5">
              {showAfter ? (
                <>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  After
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  Before
                </>
              )}
            </span>
          </div>

          {/* Prompt preview on hover */}
          {isHovered && (
            <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg p-3 border border-white/50 shadow-sm transition-all duration-300">
              <p className="text-slate-700 text-xs font-medium line-clamp-2" title={example.prompt}>
                {example.prompt || '説明なし'}
              </p>
            </div>
          )}
        </div>

        {/* Action section */}
        <div className="p-4">
          <div className="mb-3">
            <h3 className="text-black font-bold text-sm line-clamp-1">
              {example.title || '無題'}
            </h3>
          </div>
          <button
            onClick={() => handleTryPrompt(example)}
            className="insp-button insp-use-prompt w-full bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white text-sm font-bold py-2.5 px-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            data-label=""
          >
            <span className="insp-button-text">このプロンプトを使う</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="insp-root min-h-screen bg-gray-50 relative overflow-hidden" data-part="root">
      {/* Purple gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 opacity-60" />

      {/* Animated background pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-20 h-20 bg-purple-200/20 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-32 right-20 w-16 h-16 bg-blue-200/20 rounded-full blur-lg animate-pulse delay-1000" />
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-indigo-200/20 rounded-full blur-xl animate-pulse delay-2000" />
        <div className="absolute bottom-40 right-1/3 w-18 h-18 bg-purple-300/20 rounded-full blur-lg animate-pulse delay-3000" />
      </div>

      {/* Clean Header with Navigation */}
      <div className="insp-header sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200/50" data-part="header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 sm:py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                発見
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('pricing')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                PRO
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* インスピレーション: カテゴリ + 並び替え */}
      {activeTab === 'inspire' && (
        <div className="insp-toolbar bg-white/70 backdrop-blur-sm border-b border-slate-200/60" data-part="toolbar">
          <div className="horizontal-container-root-0-1-24 search-header-root-0-1-171" data-testid="search-header-root">
          <div className="insp-toolbar-inner flex flex-col gap-4 px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="insp-categories flex items-center gap-4 px-[15px] py-[11.25px]" data-part="categories">
              <span className="text-sm font-medium text-black min-w-0 flex-shrink-0">
                カテゴリ
              </span>
              <div className="flex-1 overflow-x-auto">
                <div className="insp-category-list flex gap-2 min-w-max px-1" data-part="category-list">
                  {inspireCategories.map((cat, index) => {
                    const active = selectedInspireCategory === cat.key;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => {
                          setSelectedInspireCategory(cat.key);
                          setSelectedCategoryIndex(index);
                        }}
                        className={`insp-button insp-category h-8 px-4 py-1 rounded-full border transition-all duration-200 flex-shrink-0 flex items-center justify-center text-sm font-medium ${
                          active
                            ? 'bg-black text-white border-white'
                            : 'bg-black text-white border-white opacity-80 hover:opacity-100'
                        }`}
                        data-label=""
                        aria-pressed={active}
                      >
                        <span className="insp-button-text">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="insp-sort flex items-center justify-end gap-2" data-part="sort">
              <label htmlFor="inspire-sort" className="text-slate-600 text-sm font-medium">並び替え</label>
              <select
                id="inspire-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-300 text-slate-800 text-base font-medium rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <option value="recommend">おすすめ</option>
                <option value="newest">新着順</option>
                <option value="title">タイトル順</option>
              </select>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* 検索・フォロー中・AI Generated は削除 */}


      {/* Main Content */}
      <div className="relative z-10">
        <div className="container-responsive max-w-screen-2xl px-4 sm:px-6 py-6 pb-24">
        {sortedExamples.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {sortedExamples.map((example, index) => (
              <div
                key={example.id}
                className="animate-fadeInUp"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ImageCard example={example} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center max-w-md">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-950 mb-3">
                参考事例が見つかりません
              </h3>
              <p className="text-slate-500 text-sm">
                別のカテゴリを選択するか、しばらくお待ちください
              </p>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 mt-12">
        <div className="container-responsive max-w-screen-2xl px-4 sm:px-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 text-center shadow-sm">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-slate-950 font-bold text-lg">アイディアの宝庫</h3>
          </div>
          <p className="text-slate-600 text-sm mb-4 max-w-md mx-auto">
            プロが作った作品から新しい発想を得て、あなただけのアートを作りましょう
          </p>
          <div className="flex items-center justify-center gap-6 text-slate-500 text-xs">
            <div className="flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-500" />
              <span className="font-medium">プロ品質</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-500" />
              <span className="font-medium">高速処理</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-indigo-500" />
              <span className="font-medium">無限の可能性</span>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Bottom navigation removed - using App.tsx common navigation */}
    </div>
  );
};
