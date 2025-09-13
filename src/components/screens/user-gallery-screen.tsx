import React, { useState } from 'react';
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

  // モックデータ（90日保存）
  const mockImages: GeneratedImage[] = [
    {
      id: '1',
      originalImage: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
      generatedImage: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&sat=-100',
      prompt: 'Change OPEN to CLOSED while maintaining the original font',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2日前
      expiresAt: new Date(Date.now() + 88 * 24 * 60 * 60 * 1000), // 88日後
      title: 'OPEN → CLOSED'
    },
    {
      id: '2',
      originalImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
      generatedImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&hue=30',
      prompt: 'Change SALE 20% to SALE 30%',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5日前
      expiresAt: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000), // 85日後
      title: 'SALE 20% → 30%'
    },
    {
      id: '3',
      originalImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
      generatedImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&hue=300',
      prompt: 'Change jacket color to pastel pink',
      createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000), // 80日前
      expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10日後（期限間近）
      title: '上着の色変更'
    }
  ];

  const filteredImages = mockImages.filter(image => {
    switch (filter) {
      case 'recent':
        return Date.now() - image.createdAt.getTime() <= 7 * 24 * 60 * 60 * 1000; // 7日以内
      case 'expiring':
        return image.expiresAt.getTime() - Date.now() <= 14 * 24 * 60 * 60 * 1000; // 14日以内に期限切れ
      default:
        return true;
    }
  });

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
    // モック：実際の実装では画像をダウンロード
    alert(`${image.title} をダウンロードしました`);
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

  const handleDelete = (image: GeneratedImage) => {
    if (confirm(`「${image.title}」を削除しますか？この操作は取り消せません。`)) {
      alert(`${image.title} を削除しました`);
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-jz-surface)]">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="jz-glass-effect border-b border-[color:var(--color-jz-border)]">
          <div className="flex items-center pt-[44px] px-[var(--space-16)] pb-[var(--space-16)]">
            <JZButton
              tone="tertiary"
              size="md"
              onClick={() => onNavigate('settings')}
              className="mr-[var(--space-12)] flex items-center gap-[var(--space-8)]"
            >
              <JZArrowLeftIcon size={16} />
              設定
            </JZButton>
            <h1 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)]">
              マイギャラリー
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-[140px] pb-[var(--space-24)] px-[var(--space-16)]">
        <div className="max-w-[800px] mx-auto">
          {/* Info Banner */}
          <div className="mb-[var(--space-24)] p-[var(--space-16)] bg-[color:var(--color-jz-accent)]/10 rounded-[var(--radius-jz-card)] border border-[color:var(--color-jz-accent)]/30">
            <div className="flex items-start gap-[var(--space-12)]">
              <JZCalendarIcon size={20} className="text-[color:var(--color-jz-accent)] flex-shrink-0 mt-[2px]" />
              <div>
                <h3 className="jz-font-display jz-text-body font-medium text-[color:var(--color-jz-accent)] mb-[var(--space-4)]">
                  自動保存について
                </h3>
                <p className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
                  生成された写真は90日間自動保存されます。期限が近づくとお知らせします。
                </p>
              </div>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="mb-[var(--space-24)]">
            <div className="flex gap-[var(--space-8)]">
              <JZChip
                size="md"
                variant={filter === 'all' ? 'selected' : 'default'}
                onClick={() => setFilter('all')}
                className={filter === 'all' 
                  ? 'bg-[color:var(--color-jz-accent)] text-white' 
                  : 'bg-[color:var(--color-jz-card)] text-[color:var(--color-jz-text-secondary)] hover:bg-[color:var(--color-jz-accent)]/20'
                }
              >
                すべて ({mockImages.length})
              </JZChip>
              <JZChip
                size="md"
                variant={filter === 'recent' ? 'selected' : 'default'}
                onClick={() => setFilter('recent')}
                className={filter === 'recent' 
                  ? 'bg-[color:var(--color-jz-accent)] text-white' 
                  : 'bg-[color:var(--color-jz-card)] text-[color:var(--color-jz-text-secondary)] hover:bg-[color:var(--color-jz-accent)]/20'
                }
              >
                最近 (7日以内)
              </JZChip>
              <JZChip
                size="md"
                variant={filter === 'expiring' ? 'selected' : 'default'}
                onClick={() => setFilter('expiring')}
                className={filter === 'expiring' 
                  ? 'bg-[color:var(--color-jz-warning)] text-white' 
                  : 'bg-[color:var(--color-jz-card)] text-[color:var(--color-jz-text-secondary)] hover:bg-[color:var(--color-jz-warning)]/20'
                }
              >
                期限間近 (14日以内)
              </JZChip>
            </div>
          </div>

          {/* Gallery Grid */}
          {filteredImages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-16)]">
              {filteredImages.map((image) => {
                const daysLeft = getDaysUntilExpiry(image.expiresAt);
                const isExpiringSoon = daysLeft <= 14;
                
                return (
                  <JZCard key={image.id} className="overflow-hidden">
                    <JZCardContent className="p-0">
                      {/* Before/After Image Display */}
                      <div className="relative h-[200px] bg-[color:var(--color-jz-border)]">
                        <div className="absolute inset-0 grid grid-cols-2">
                          {/* Before */}
                          <div className="relative border-r border-[color:var(--color-jz-border)]">
                            <ImageWithFallback
                              src={image.originalImage}
                              alt="Original"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-[var(--space-8)] left-[var(--space-8)] px-[var(--space-8)] py-[var(--space-4)] bg-black/50 backdrop-blur-sm rounded-[var(--radius-jz-button)]">
                              <span className="jz-text-caption text-white font-medium">BEFORE</span>
                            </div>
                          </div>
                          
                          {/* After */}
                          <div className="relative">
                            <ImageWithFallback
                              src={image.generatedImage}
                              alt="Generated"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-[var(--space-8)] right-[var(--space-8)] px-[var(--space-8)] py-[var(--space-4)] bg-black/50 backdrop-blur-sm rounded-[var(--radius-jz-button)]">
                              <span className="jz-text-caption text-white font-medium">AFTER</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Expiry Warning */}
                        {isExpiringSoon && (
                          <div className="absolute top-[var(--space-8)] right-[var(--space-8)]">
                            <JZChip
                              size="sm"
                              variant="default"
                              className="bg-[color:var(--color-jz-warning)]/90 text-white border-[color:var(--color-jz-warning)]"
                            >
                              あと{daysLeft}日
                            </JZChip>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-[var(--space-16)]">
                        <div className="mb-[var(--space-12)]">
                          <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-[var(--space-4)]">
                            {image.title}
                          </h3>
                          <p className="jz-text-caption text-[color:var(--color-jz-text-secondary)] mb-[var(--space-8)]">
                            {formatDate(image.createdAt)} に作成
                          </p>
                          <div className="p-[var(--space-8)] bg-[color:var(--color-jz-surface)] rounded-[var(--radius-jz-button)] border border-[color:var(--color-jz-border)]">
                            <p className="jz-text-caption text-[color:var(--color-jz-text-tertiary)] font-mono leading-relaxed">
                              {image.prompt}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-[var(--space-8)]">
                          <JZButton
                            tone="primary"
                            size="sm"
                            onClick={() => handleDownload(image)}
                            className="flex items-center gap-[var(--space-8)] flex-1"
                          >
                            <JZDownloadIcon size={14} />
                            保存
                          </JZButton>
                          <JZButton
                            tone="secondary"
                            size="sm"
                            onClick={() => handleShare(image)}
                            className="flex items-center gap-[var(--space-8)]"
                          >
                            <JZShareIcon size={14} />
                          </JZButton>
                          <JZButton
                            tone="secondary"
                            size="sm"
                            onClick={() => handleDelete(image)}
                            className="flex items-center gap-[var(--space-8)] text-[color:var(--color-jz-destructive)] hover:text-[color:var(--color-jz-destructive)]"
                          >
                            <JZTrashIcon size={14} />
                          </JZButton>
                        </div>
                      </div>
                    </JZCardContent>
                  </JZCard>
                );
              })}
            </div>
          ) : (
            // Empty State
            <div className="text-center py-[var(--space-48)]">
              <div className="w-[80px] h-[80px] rounded-full bg-[color:var(--color-jz-border)] flex items-center justify-center mb-[var(--space-20)] mx-auto">
                <span className="text-[color:var(--color-jz-text-tertiary)] text-3xl">📸</span>
              </div>
              <h3 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)] mb-[var(--space-12)]">
                {filter === 'all' ? 'まだ写真がありません' : 'この条件の写真がありません'}
              </h3>
              <p className="jz-text-body text-[color:var(--color-jz-text-secondary)] mb-[var(--space-20)] max-w-[280px] mx-auto">
                写真を編集すると、ここに90日間保存されます。
              </p>
              <JZButton
                tone="primary"
                size="md"
                onClick={() => onNavigate('home')}
              >
                写真を編集する
              </JZButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};