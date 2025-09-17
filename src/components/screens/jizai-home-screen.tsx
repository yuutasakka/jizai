import React, { useState } from 'react';
import { track } from '../../lib/analytics';

interface JizaiHomeScreenProps {
  onNavigate: (screen: string) => void;
}

export const JizaiHomeScreen = ({ onNavigate }: JizaiHomeScreenProps) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setSelectedImage(event.target.files[0]);
      track('image_selected');
      onNavigate('progress');
    }
  };

  // 初回の軽いスケルトン（実装時はAPIロードに置き換え）
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const editingOptions = [
    {
      id: 'brighten',
      title: '明るくする',
      icon: '☀️',
      description: '暗い写真を明るく自然に調整'
    },
    {
      id: 'background',
      title: '背景を変える',
      icon: '🖼️',
      description: '背景を美しい風景に変更'
    },
    {
      id: 'enhance',
      title: '美しく仕上げる',
      icon: '✨',
      description: '全体的な品質を向上させる'
    },
    {
      id: 'color',
      title: '色を調整する',
      icon: '🎨',
      description: '色合いや彩度を最適化'
    },
    {
      id: 'smooth',
      title: 'なめらかにする',
      icon: '🌟',
      description: 'ノイズを除去してクリアに'
    },
    {
      id: 'formal',
      title: 'フォーマルに',
      icon: '👔',
      description: '正式な場面にふさわしく調整'
    },
    {
      id: 'gentle',
      title: '優しい印象に',
      icon: '🌸',
      description: 'やわらかで温かみのある仕上がり'
    },
    {
      id: 'classic',
      title: 'クラシック調',
      icon: '🎭',
      description: '伝統的で上品な雰囲気に'
    }
  ];

  return (
    <div className="min-h-screen bg-[color:var(--color-jz-surface)]">
      {/* Header */}
      <div className="bg-[color:var(--color-jz-surface)] border-b border-[color:var(--color-jz-border)] px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)]">JIZAI</h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate('settings')}
              className="p-2 text-[color:var(--color-jz-text-secondary)] hover:text-[color:var(--color-jz-text-primary)] transition-colors"
              aria-label="設定を開く"
            >
              ⚙️
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8">
        {/* Title Section */}
        <div className="text-center mb-12">
          {loading ? (
            <div className="animate-pulse space-y-3 max-w-md mx-auto">
              <div className="h-7 bg-[color:var(--color-jz-border)] rounded" />
              <div className="h-4 bg-[color:var(--color-jz-border)] rounded w-2/3 mx-auto" />
            </div>
          ) : (
            <>
              <h2 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)] mb-4">
                思い出の写真を美しく
              </h2>
              <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
                AIが自然で美しい仕上がりにします
              </p>
            </>
          )}
        </div>

        {/* Image Upload Section */}
        <div className="mb-12">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-32 bg-[color:var(--color-jz-card)] border-2 border-dashed border-[color:var(--color-jz-border)] rounded-[var(--radius-jz-card)]" />
            </div>
          ) : (
            <div 
              onClick={() => document.getElementById('photo-input')?.click()}
              className="relative bg-[color:var(--color-jz-card)] border-2 border-dashed border-[color:var(--color-jz-border)] rounded-[var(--radius-jz-card)] p-12 text-center cursor-pointer hover:bg-[color:var(--color-jz-card)]/80 transition-colors"
            >
              <div className="mb-4">
                <div className="w-16 h-16 bg-[color:var(--color-jz-accent)]/15 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📷</span>
                </div>
                <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-2">
                  写真を選択してください
                </h3>
                <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
                  クリックまたはドラッグ&ドロップで写真をアップロード
                </p>
              </div>
            </div>
          )}
          <input
            id="photo-input"
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        {/* Editing Options */}
        <div className="mb-12">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-5 w-40 bg-[color:var(--color-jz-border)] rounded mx-auto" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-24 bg-[color:var(--color-jz-card)] border border-[color:var(--color-jz-border)] rounded-[var(--radius-jz-card)]" />
                ))}
              </div>
            </div>
          ) : (
            <>
              <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-6 text-center">
                編集の種類を選択
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {editingOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => {
                      track('editing_option_selected', { option: option.id });
                      onNavigate('progress');
                    }}
                    className="bg-[color:var(--color-jz-card)] border border-[color:var(--color-jz-border)] rounded-[var(--radius-jz-card)] p-6 text-center cursor-pointer hover:shadow-lg hover:border-[color:var(--color-jz-accent)]/30 transition-all"
                  >
                    <div className="text-3xl mb-3">{option.icon}</div>
                    <h4 className="font-medium text-[color:var(--color-jz-text-primary)] mb-2">{option.title}</h4>
                    <p className="text-sm text-[color:var(--color-jz-text-secondary)]">{option.description}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <button
            onClick={() => onNavigate('login')}
            className="bg-[color:var(--color-jz-accent)] text-white px-8 py-3 rounded-[var(--radius-jz-button)] font-medium hover:brightness-110 transition-colors jz-shadow-button"
          >
            今すぐ始める
          </button>
          <p className="text-sm text-[color:var(--color-jz-text-secondary)] mt-3">
            登録不要で今すぐ使えます
          </p>
        </div>
      </div>
    </div>
  );
};
