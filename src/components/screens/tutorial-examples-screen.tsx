import React, { useState, useEffect } from 'react';
import { Search, Bell, Sparkles, Zap, Star, Crown, Filter, Wand2 } from 'lucide-react';

interface InspirationExample {
  id: string;
  beforeImage: string;
  afterImage: string;
  prompt: string;
  title: string;
  category: 'inspire' | 'search' | 'following' | 'ai-generated';
}

interface TutorialExamplesScreenProps {
  onNavigate: (screen: string) => void;
  onExampleSelected: (example: any) => void;
}

// Inspiration gallery data - Picsart style examples
const inspirationExamples: InspirationExample[] = [
  {
    id: '1',
    beforeImage: 'https://images.unsplash.com/photo-1494790108755-2616c04c5cd3?w=400',
    afterImage: 'https://images.unsplash.com/photo-1494790108755-2616c04c5cd3?w=400&hue=220&sat=2',
    prompt: 'Transform into futuristic avatar style',
    title: 'アフター',
    category: 'inspire'
  },
  {
    id: '2',
    beforeImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    afterImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&hue=300&sat=2',
    prompt: 'Add romantic vintage film effect',
    title: 'アフター',
    category: 'inspire'
  },
  {
    id: '3',
    beforeImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    afterImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&hue=120&sat=2',
    prompt: 'Create food art collage style',
    title: 'アフター',
    category: 'inspire'
  },
  {
    id: '4',
    beforeImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
    afterImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&hue=60&sat=2',
    prompt: 'Add cosmic space background effect',
    title: 'アフター',
    category: 'inspire'
  },
  {
    id: '5',
    beforeImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    afterImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&hue=280&sat=2',
    prompt: 'Create artistic double exposure',
    title: 'アフター',
    category: 'inspire'
  },
  {
    id: '6',
    beforeImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    afterImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&hue=180&sat=2',
    prompt: 'Transform with dreamy aesthetic filter',
    title: 'アフター',
    category: 'inspire'
  }
];

export const TutorialExamplesScreen = ({ onNavigate, onExampleSelected }: TutorialExamplesScreenProps) => {
  const [activeTab, setActiveTab] = useState<'inspire' | 'search' | 'following' | 'ai-generated'>('inspire');
  const [loading, setLoading] = useState(false);

  // Filter examples by active tab
  const filteredExamples = inspirationExamples.filter(example => example.category === activeTab);

  const tabs = [
    { id: 'inspire' as const, label: 'インスピ', icon: <Sparkles className="w-4 h-4" />, color: 'from-blue-400 to-purple-500' },
    { id: 'search' as const, label: '検索する', icon: <Search className="w-4 h-4" />, color: 'from-green-400 to-blue-500' },
    { id: 'following' as const, label: 'フォロー中', icon: <Star className="w-4 h-4" />, color: 'from-purple-400 to-pink-500' },
    { id: 'ai-generated' as const, label: 'AI Generated', icon: <Wand2 className="w-4 h-4" />, color: 'from-orange-400 to-red-500' }
  ];

  const handleTryPrompt = (example: InspirationExample) => {
    // Store only opaque template key (no prompt text)
    try {
      sessionStorage.setItem('desired-template-key', `example_${example.id}`);
    } catch {}
    onNavigate('create');
  };

  // Premium Image card component with before/after animation
  const ImageCard = ({ example }: { example: InspirationExample }) => {
    const [showAfter, setShowAfter] = useState(false);

    useEffect(() => {
      const interval = setInterval(() => {
        setShowAfter(prev => !prev);
      }, 2000); // 2秒間隔で切り替え

      return () => clearInterval(interval);
    }, []);

    return (
      <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-lg border border-white/20 hover:bg-white/20 transition-all duration-300 group">
        {/* Image container */}
        <div className="relative h-[280px] overflow-hidden">
          <img
            src={showAfter ? example.afterImage : example.beforeImage}
            alt={showAfter ? 'After' : 'Before'}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

          {/* Before/After label */}
          <div className="absolute bottom-3 right-3 px-3 py-2 bg-black/80 backdrop-blur-md rounded-xl shadow-xl border border-white/20">
            <span className="text-white text-sm font-bold flex items-center gap-2">
              {showAfter ? (
                <>
                  <Zap className="w-4 h-4 text-green-400" />
                  アフター
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 text-blue-400" />
                  ビフォー
                </>
              )}
            </span>
          </div>

          {/* Floating prompt preview */}
          <div className="absolute top-3 left-3 right-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="text-white text-xs font-medium truncate">{example.prompt}</p>
            </div>
          </div>
        </div>

        {/* Premium Try button */}
        <div className="p-4">
          <button
            onClick={() => handleTryPrompt(example)}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-bold py-3 px-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-white/20"
          >
            <Wand2 className="w-4 h-4 inline mr-2" />
            同じプロンプトを使う
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(120,119,198,0.3),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.3),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgba(155,135,245,0.2),transparent_50%)]" />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full animate-pulse ${
              i % 3 === 0 ? 'bg-blue-400/30' : i % 3 === 1 ? 'bg-purple-400/30' : 'bg-pink-400/30'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>


      {/* Premium Header */}
      <div className="relative z-10 px-5 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white drop-shadow-2xl bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              jizai
            </h1>
            <p className="text-white/80 text-sm mt-1">インスピレーションを発見</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-bold py-2.5 px-5 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-white/20">
            <Crown className="w-4 h-4 inline mr-2" />
            Try PRO
          </button>
          <button className="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 border border-white/20">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </div>


      {/* Premium Content */}
      <div className="relative z-10 px-5 pb-[120px]">
        {filteredExamples.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {filteredExamples.map((example, index) => (
              <div
                key={example.id}
                className="transition-all duration-500"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ImageCard example={example} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <Search className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                コンテンツが見つかりません
              </h3>
              <p className="text-white/80 text-sm">
                別のカテゴリを選択してください
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Premium Footer Info */}
      <div className="relative z-10 mt-12 px-5">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-bold text-lg">インスピレーションの宝庫</h3>
          </div>
          <p className="text-white/80 text-sm mb-4">
            プロが作った作品からインスピレーションを得て、あなただけのアートを作りましょう
          </p>
          <div className="flex items-center justify-center gap-4 text-white/60 text-xs">
            <div className="flex items-center gap-1">
              <Crown className="w-3 h-3" />
              プロ品質
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              高速処理
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              無限の可能性
            </div>
          </div>
        </div>
      </div>

      {/* Bottom navigation removed - using App.tsx common navigation */}
    </div>
  );
};
