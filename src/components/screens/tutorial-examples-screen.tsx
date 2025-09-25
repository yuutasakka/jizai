import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Bell, Sparkles, Zap, Star, Crown, Filter, Wand2 } from 'lucide-react';
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

export const TutorialExamplesScreen = ({ onNavigate, onExampleSelected }: TutorialExamplesScreenProps) => {
  const [activeTab, setActiveTab] = useState<'inspire' | 'search' | 'following' | 'ai-generated'>('inspire');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchCategories: Array<{ key: string; label: string; icon: string; description: string }> = [
    { key: 'expression', label: '表情', icon: '😊', description: '表情の変更' },
    { key: 'background', label: '背景', icon: '🏞️', description: '背景の編集' },
    { key: 'attire', label: '着せ替え', icon: '👔', description: '服装の変更' },
    { key: 'pose', label: '姿勢', icon: '🧘', description: 'ポーズの調整' },
    { key: 'quality', label: '画質', icon: '✨', description: '画質の向上' },
    { key: 'size', label: 'サイズ', icon: '📐', description: 'サイズ変更' },
  ];
  const [selectedCategory, setSelectedCategory] = useState<string>(searchCategories[0].key);
  const [sortBy, setSortBy] = useState<'recommend' | 'newest' | 'title'>('recommend');
  const [searchResults, setSearchResults] = useState<Array<{ key: string; title: string; cover_url?: string | null; created_at?: string | null; popularity?: number | null }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Inspiration examples (fetched)
  const [inspireExamples, setInspireExamples] = useState<InspirationExample[]>(FALLBACK_EXAMPLES);

  // Inspire categories with icons
  const inspireCategories: Array<{ key: string; label: string; icon: string; description: string }> = [
    { key: 'all', label: 'すべて', icon: '🎨', description: 'すべての作品' },
    { key: 'people', label: '人物', icon: '👤', description: '人物の編集' },
    { key: 'pet', label: 'ペット', icon: '🐾', description: 'ペットの写真' },
    { key: 'photo', label: '写真', icon: '📷', description: '風景・物の写真' },
  ];
  const [selectedInspireCategory, setSelectedInspireCategory] = useState<string>(inspireCategories[0].key);

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

  // Fetch Supabase-backed search results
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!supabase) return; // Frontend may run without supabase configured
      if (activeTab !== 'search') return;
      setSearchLoading(true);
      setSearchError(null);
      try {
        let query = supabase
          .from('editing_prompts')
          .select('key, ja_title, cover_url, category, created_at, popularity')
          .eq('category', selectedCategory)
          .limit(50);

        if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
        else if (sortBy === 'title') query = query.order('ja_title', { ascending: true });
        else query = query.order('popularity', { ascending: false }).order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;
        if (!cancelled) {
          setSearchResults((data || []).map((r: any) => ({ key: r.key, title: r.ja_title || r.key, cover_url: r.cover_url, created_at: r.created_at, popularity: r.popularity })));
        }
      } catch (e: any) {
        if (!cancelled) setSearchError(e?.message || '読み込みに失敗しました');
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [activeTab, selectedCategory, sortBy]);

  const tabs = [
    { id: 'inspire' as const, label: 'インスピ', icon: <Sparkles className="w-4 h-4" />, color: 'from-blue-400 to-purple-500' },
    { id: 'search' as const, label: '検索する', icon: <Search className="w-4 h-4" />, color: 'from-green-400 to-blue-500' },
    { id: 'following' as const, label: 'フォロー中', icon: <Star className="w-4 h-4" />, color: 'from-purple-400 to-pink-500' },
    { id: 'ai-generated' as const, label: 'AI Generated', icon: <Wand2 className="w-4 h-4" />, color: 'from-orange-400 to-red-500' }
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
            <h3 className="text-slate-900 font-semibold text-sm line-clamp-1">
              {example.title || '無題'}
            </h3>
          </div>
          <button
            onClick={() => handleTryPrompt(example)}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            <Wand2 className="w-4 h-4" />
            このプロンプトを使う
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
      {/* Refined Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)`
        }} />
      </div>

      {/* Subtle Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 rounded-full animate-pulse opacity-20 ${
              i % 3 === 0 ? 'bg-indigo-400' : i % 3 === 1 ? 'bg-purple-400' : 'bg-pink-400'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>


      {/* Clean Header with Navigation */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('home')}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="戻る"
            >
              <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 leading-none">
                  発見
                </h1>
                <p className="text-slate-500 text-sm leading-none mt-0.5">お手本を見つけて参考にしよう</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('pricing')}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
            >
              PRO
            </button>
            <button className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center text-slate-600 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* インスピレーション: カテゴリ + 並び替え */}
      {activeTab === 'inspire' && (
        <div className="bg-white/70 backdrop-blur-sm border-b border-slate-200/60 px-4 sm:px-6 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
              {inspireCategories.map(cat => {
                const active = selectedInspireCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedInspireCategory(cat.key)}
                    className={`group flex items-center gap-2.5 px-5 py-3 rounded-xl transition-all duration-200 border-2 flex-shrink-0 ${
                      active
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-500 shadow-lg scale-105'
                        : 'bg-slate-700 text-white border-slate-600 hover:bg-slate-600 hover:border-indigo-400 hover:shadow-md'
                    }`}
                    aria-pressed={active}
                    title={cat.description}
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                    <div className="text-left">
                      <div className="font-semibold text-sm">{cat.label}</div>
                      <div className={`text-xs mt-0.5 ${active ? 'text-indigo-100' : 'text-slate-300'}`}>
                        {cat.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-2">
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
      )}

      {/* 検索カテゴリ + ソート（ヘッダー直下） */}
      {activeTab === 'search' && (
        <div className="bg-white/70 backdrop-blur-sm border-b border-slate-200/60 px-4 sm:px-6 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
              {searchCategories.map(cat => {
                const active = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`group flex items-center gap-2.5 px-5 py-3 rounded-xl transition-all duration-200 border-2 flex-shrink-0 ${
                      active
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-500 shadow-lg scale-105'
                        : 'bg-slate-700 text-white border-slate-600 hover:bg-slate-600 hover:border-indigo-400 hover:shadow-md'
                    }`}
                    aria-pressed={active}
                    title={cat.description}
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                    <div className="text-left">
                      <div className="font-semibold text-sm">{cat.label}</div>
                      <div className={`text-xs mt-0.5 ${active ? 'text-indigo-100' : 'text-slate-300'}`}>
                        {cat.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-2">
              <label htmlFor="search-sort" className="text-slate-600 text-sm font-medium">並び替え</label>
              <select
                id="search-sort"
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
      )}


      {/* Main Content */}
      <div className="relative z-10 px-4 sm:px-6 py-6 pb-24">
        {/* Search tab: Supabase results */}
        {activeTab === 'search' ? (
          searchLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">読み込み中...</p>
              </div>
            </div>
          ) : searchError ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-sm">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-red-900 mb-2">エラーが発生しました</h3>
                <p className="text-red-700 text-sm">{searchError}</p>
              </div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {searchResults.map((item, index) => (
                <div
                  key={item.key}
                  className="animate-fadeInUp"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-slate-200/60 hover:border-slate-300 overflow-hidden">
                    <div className="relative h-48 overflow-hidden bg-slate-100">
                      {item.cover_url ? (
                        <ImageWithFallback
                          src={item.cover_url}
                          alt={item.title}
                          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-50">
                          <div className="text-slate-400 text-center">
                            <Search className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">画像なし</p>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="p-4">
                      <h3 className="text-slate-900 font-semibold text-sm mb-3 line-clamp-2" title={item.title}>
                        {item.title}
                      </h3>
                      <button
                        onClick={() => { try { sessionStorage.setItem('desired-template-key', item.key); } catch {}; onNavigate('create'); }}
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        このテンプレートを使う
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center max-w-md">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">テンプレートが見つかりません</h3>
                <p className="text-slate-500 text-sm">別のカテゴリを選択してください</p>
              </div>
            </div>
          )
        ) : sortedExamples.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                参考事例が見つかりません
              </h3>
              <p className="text-slate-500 text-sm">
                別のカテゴリを選択するか、しばらくお待ちください
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="relative z-10 mt-12 px-4 sm:px-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 text-center shadow-sm">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-slate-900 font-bold text-lg">アイディアの宝庫</h3>
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

      {/* Bottom navigation removed - using App.tsx common navigation */}
    </div>
  );
};
