import React, { useState } from 'react';
import { track } from '../../lib/analytics';
import { JZBellIcon } from '../design-system/jizai-icons';
import { JZCard } from '../design-system/jizai-card';
import { JZButton } from '../design-system/jizai-button';
import api from '../../api/client';

interface JizaiHomeScreenProps {
  onNavigate: (screen: string) => void;
}

export const JizaiHomeScreen = ({ onNavigate }: JizaiHomeScreenProps) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // 既存URLがあれば解放
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      track('image_selected');
    }
  };

  // コンポーネントアンマウント時にオブジェクトURLを解放
  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // 初回の軽いスケルトン（実装時はAPIロードに置き換え）
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const editingOptions = [
    {
      id: 'bg_remove',
      title: '1. 背景の変更・除去',
      icon: '🖼️',
      description: '他の人物や物体が全て除去されます。'
    },
    {
      id: 'skin_tone',
      title: '2. 顔色の補正・血色改善',
      icon: '😊',
      description: '顔色が健康的で温かみのある自然な肌色に。'
    },
    {
      id: 'attire_suit',
      title: '3-A. 服装の変更・合成（ダークスーツ）',
      icon: '👔',
      description: 'ダークスーツに白シャツを着用した姿になります。'
    },
    {
      id: 'attire_dress',
      title: '3-B. 服装の変更（ダークドレス）',
      icon: '👗',
      description: 'ダークカラーのフォーマルドレスを着用した姿になります。'
    },
    {
      id: 'enhance_quality',
      title: '4. 画質向上・鮮明化処理',
      icon: '🔍',
      description: '全体的に高解像度の写真になります。'
    },
    {
      id: 'smile_adjust',
      title: '5. 笑顔への表情変更',
      icon: '🙂',
      description: '自然で温かみのある優しい笑顔になります。'
    },
    {
      id: 'wrinkle_spot_reduce',
      title: '6. しわ・シミの軽減',
      icon: '🧴',
      description: '深いしわが薄くなり、シミや肌の色むらが目立たなくなります。'
    },
    {
      id: 'hair_fix',
      title: '7. 髪の毛の修正',
      icon: '💇‍♂️',
      description: '薄毛部分が自然に補われ、白髪が黒髪になり、整った髪型になります。'
    },
    {
      id: 'glasses_reflection',
      title: '8. メガネの反射除去・調整',
      icon: '👓',
      description: 'メガネの反射や光の映り込みが消えます。'
    }
  ];

  return (
    <div className="min-h-screen bg-[color:var(--color-jz-surface)]">
      {/* Header */}
      <div className="bg-[color:var(--color-jz-surface)] border-b border-[color:var(--color-jz-border)] px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <h1 className="jz-font-display jz-text-display-small sm:jz-text-display-medium text-[color:var(--color-jz-text-primary)]">JIZAI</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => onNavigate('notifications')}
              className="p-2 text-[color:var(--color-jz-text-secondary)] hover:text-[color:var(--color-jz-text-primary)] transition-colors min-h-[44px] w-11 h-11 flex items-center justify-center"
              aria-label="通知を開く"
            >
              <JZBellIcon size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 py-6 sm:py-8">
        {/* Title Section */}
        <div className="text-center mb-8 sm:mb-12">
          {loading ? (
            <div className="animate-pulse space-y-3 max-w-md mx-auto">
              <div className="h-7 bg-[color:var(--color-jz-border)] rounded" />
              <div className="h-4 bg-[color:var(--color-jz-border)] rounded w-2/3 mx-auto" />
            </div>
          ) : (
            <>
              <h2 className="jz-font-display jz-text-display-small sm:jz-text-display-medium text-[color:var(--color-jz-text-primary)] mb-3 sm:mb-4">
                思い出の写真を美しく
              </h2>
              <p className="jz-text-body text-[color:var(--color-jz-text-secondary)] text-sm sm:text-base">
                AIが自然で美しい仕上がりにします
              </p>
            </>
          )}
        </div>

        {/* Image Upload Section */}
        <div className="mb-8 sm:mb-12">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-32 bg-[color:var(--color-jz-card)] border-2 border-dashed border-[color:var(--color-jz-border)] rounded-[var(--radius-jz-card)]" />
            </div>
          ) : (
            <>
              {!previewUrl ? (
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
              ) : (
                <div className="bg-[color:var(--color-jz-card)] border border-[color:var(--color-jz-border)] rounded-[var(--radius-jz-card)] p-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-64 h-64 rounded-[var(--radius-jz-card)] overflow-hidden shadow">
                      <img src={previewUrl} alt="アップロードした写真のプレビュー" className="w-full h-full object-cover" />
                    </div>
                    <p className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">下の「編集の種類」から選択してください</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setSelectedImage(null);
                          if (previewUrl) URL.revokeObjectURL(previewUrl);
                          setPreviewUrl(null);
                          setSelectedOptionId(null);
                          const input = document.getElementById('photo-input') as HTMLInputElement | null;
                          if (input) input.value = '';
                        }}
                        className="bg-[color:var(--color-jz-card)] border border-[color:var(--color-jz-border)] text-[color:var(--color-jz-text-primary)] px-6 py-3 rounded-[var(--radius-jz-button)] hover:bg-[color:var(--color-jz-card)]/80"
                      >
                        写真を選び直す
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
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
              <h3 className="jz-font-display jz-text-caption sm:jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-4 sm:mb-6 text-center">
                編集の種類を選択
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {editingOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => {
                      setSelectedOptionId(option.id);
                      track('editing_option_selected', { option: option.id });
                    }}
                    className={`bg-[color:var(--color-jz-card)] rounded-[var(--radius-jz-card)] p-4 sm:p-6 text-center cursor-pointer transition-all border min-h-[120px] sm:min-h-[140px] flex flex-col justify-center ${
                      selectedOptionId === option.id
                        ? 'border-[color:var(--color-jz-accent)] ring-2 ring-[color:var(--color-jz-accent)]/50 scale-[1.02]'
                        : 'border-[color:var(--color-jz-border)] hover:shadow-lg hover:border-[color:var(--color-jz-accent)]/30'
                    }`}
                  >
                    <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">{option.icon}</div>
                    <h4 className="font-medium text-[color:var(--color-jz-text-primary)] mb-1 sm:mb-2 text-xs sm:text-sm">{option.title}</h4>
                    <p className="text-xs sm:text-sm text-[color:var(--color-jz-text-secondary)] leading-tight">{option.description}</p>
                  </div>
                ))}
              </div>

              {previewUrl && selectedOptionId && (
                <div className="mt-6">
                  {/* 生成前プレビュー（画像 + 変更内容の確認） */}
                  {(() => {
                    const selected = editingOptions.find(o => o.id === selectedOptionId);
                    return (
                      <div className="bg-[color:var(--color-jz-card)] border border-[color:var(--color-jz-border)] rounded-[var(--radius-jz-card)] p-4 mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-24 h-24 rounded-[var(--radius-jz-card)] overflow-hidden border border-[color:var(--color-jz-border)]">
                            <img src={previewUrl} alt="生成前の確認用プレビュー" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <div className="jz-text-caption text-[color:var(--color-jz-text-tertiary)] mb-1">加える変更</div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg" aria-hidden>{selected?.icon}</span>
                              <span className="font-medium text-[color:var(--color-jz-text-primary)]">{selected?.title}</span>
                            </div>
                            <div className="text-sm text-[color:var(--color-jz-text-secondary)]">{selected?.description}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="text-center">
                    <button
                      onClick={() => {
                        try { sessionStorage.setItem('selected-editing-option', selectedOptionId); } catch {}
                        setShowConfirm(true);
                      }}
                      className="bg-[color:var(--color-jz-accent)] text-white px-6 sm:px-8 py-3 rounded-[var(--radius-jz-button)] font-medium hover:brightness-110 transition-colors jz-shadow-button text-sm sm:text-base min-h-[44px]"
                    >
                      選択した編集で生成を開始
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom CTA removed: registration required, no guest start */}
    </div>
    
    {/* Confirm Consumption Modal */}
    {showConfirm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <JZCard className="max-w-sm sm:max-w-md w-[95%] sm:w-[92%] p-4 sm:p-6">
          <div className="mb-4">
            <h2 className="jz-font-display jz-text-caption sm:jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-2">
              生成を開始しますか？
            </h2>
            <p className="jz-text-body text-[color:var(--color-jz-text-secondary)] text-sm sm:text-base">
              この操作でクレジットが消費され、画像の生成が開始されます。内容をご確認の上、よろしければ「生成を開始」を押してください。
            </p>
          </div>
          {previewUrl && selectedOptionId && (
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-[var(--radius-jz-card)] overflow-hidden border border-[color:var(--color-jz-border)]">
                <img src={previewUrl} alt="確認プレビュー" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                {(() => {
                  const selected = editingOptions.find(o => o.id === selectedOptionId);
                  return (
                    <>
                      <div className="jz-text-caption text-[color:var(--color-jz-text-tertiary)] mb-1">加える変更</div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg" aria-hidden>{selected?.icon}</span>
                        <span className="font-medium text-[color:var(--color-jz-text-primary)]">{selected?.title}</span>
                      </div>
                      <div className="text-sm text-[color:var(--color-jz-text-secondary)]">{selected?.description}</div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <JZButton tone="secondary" onClick={() => setShowConfirm(false)} disabled={isGenerating}>キャンセル</JZButton>
            <JZButton 
              tone="primary" 
              state={isGenerating ? 'loading' : 'enabled'}
              onClick={async () => {
                if (!selectedImage || !selectedOptionId) return;
                setIsGenerating(true);
                try {
                  const res = await api.editImageByOption(selectedImage, selectedOptionId);
                  const genUrl = URL.createObjectURL(res.blob);
                  try {
                    sessionStorage.setItem('generated-image-url', genUrl);
                    if (previewUrl) sessionStorage.setItem('original-image-url', previewUrl);
                    sessionStorage.setItem('used-prompt', selectedOptionId);
                  } catch {}
                  setShowConfirm(false);
                  onNavigate('results');
                } catch (e) {
                  alert('生成に失敗しました。しばらくしてからお試しください。');
                } finally {
                  setIsGenerating(false);
                }
              }}
            >
              生成を開始
            </JZButton>
          </div>
        </JZCard>
      </div>
    )}
  </div>
  );
};
