import React, { useEffect, useRef, useState } from 'react';
import { JZPlusIcon, JZMagicWandIcon, JZMemorialPhotoIcon, JZUserIcon, JZPhotoIcon } from '../design-system/jizai-icons';
import { JZCard, JZCardContent } from '../design-system/jizai-card';
import { JZButton } from '../design-system/jizai-button';
import api from '../../api/client';

export const CreateImageScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const [value, setValue] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [selectedDemoImage, setSelectedDemoImage] = useState<string | null>(null);

  // デモ用のサンプル画像データ
  const demoImages = [
    {
      id: 'portrait1',
      name: 'ポートレート写真 1',
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEyMCIgcj0iNDAiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTEwMCAyMDBIMjAwQzIwMCAxNzUgMTc1IDE1MCAxNTAgMTUwQzEyNSAxNTAgMTAwIDE3NSAxMDAgMjAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8dGV4dCB4PSIxNTAiIHk9IjI1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZCNzI4MCIgZm9udC1zaXplPSIxNCIgZm9udC1mYW1pbHk9IkFyaWFsIj7jgrXjg7Pjg5fjg6vjgqbjg47jg7zjg4M8L3RleHQ+Cjwvc3ZnPgo=',
      description: 'ポートレート写真のサンプル'
    },
    {
      id: 'landscape1',
      name: '風景写真 1',
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjQTdGM0Q0Ii8+CjxwYXRoIGQ9Ik0wIDIwMEg3MEM4MCAyMDAgOTAgMTkwIDEwMCAxODBDMTEwIDE3MCAxMzAgMTYwIDE1MCAxNTBDMTcwIDE0MCAyMDAgMTMwIDIzMCAxMDBDMjYwIDcwIDI4MCA4MCAzMDAgOTBWMzAwSDBWMjAwWiIgZmlsbD0iIzZCN0I4NSIvPgo8Y2lyY2xlIGN4PSI2MCIgY3k9IjYwIiByPSIyMCIgZmlsbD0iI0ZCQkYyNCIvPgo8dGV4dCB4PSIxNTAiIHk9IjI1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzM3NDE0QiIgZm9udC1zaXplPSIxNCIgZm9udC1mYW1pbHk9IkFyaWFsIj7jg4Ljg7Pjg4bjg7Djg7zjgo/jg6njg6k8L3RleHQ+Cjwvc3ZnPgo=',
      description: '山の風景写真のサンプル'
    },
    {
      id: 'object1',
      name: '商品写真 1',
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRkZGIi8+CjxyZWN0IHg9IjEwMCIgeT0iMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjEwIiBmaWxsPSIjM0I4MkY2Ii8+CjxyZWN0IHg9IjEyMCIgeT0iMTIwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHJ4PSI1IiBmaWxsPSIjMTk0M0FBIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMjUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNkI3MjgwIiBmb250LXNpemU9IjE0IiBmb250LWZhbWlseT0iQXJpYWwiPuWVhOWTgOWGmeecn+OCteODs+ODl+ODqzwvdGV4dD4KPC9zdmc+Cg==',
      description: '商品写真のサンプル'
    }
  ];

  // Use template option key if passed from examples/search (no prompt text on client)
  const [templateOptionId, setTemplateOptionId] = useState<string | null>(null);
  useEffect(() => {
    try {
      const key = sessionStorage.getItem('desired-template-key');
      if (key && typeof key === 'string') {
        setTemplateOptionId(key);
      }
    } catch {}
  }, []);

  const clearTemplate = () => {
    setTemplateOptionId(null);
    try { sessionStorage.removeItem('desired-template-key'); } catch {}
  };

  // デモモード用の関数
  const handleDemoImageSelect = (demoImage: typeof demoImages[0]) => {
    setSelectedDemoImage(demoImage.url);
    setUploadedImage(demoImage.url);
    setUploadedFileName(demoImage.name);
    setSelectedFile(null); // デモモードでは実際のファイルはnull
    try {
      sessionStorage.setItem('create_image_file', demoImage.url);
      sessionStorage.setItem('demo_mode', 'true');
    } catch {}
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    setSelectedDemoImage(null);
    setUploadedImage(null);
    setUploadedFileName('');
    setSelectedFile(null);
    try {
      sessionStorage.removeItem('create_image_file');
      sessionStorage.removeItem('demo_mode');
    } catch {}
  };

  const handleSubmit = () => {
    const v = value.trim();
    if (!selectedFile && !selectedDemoImage) return;
    if (!templateOptionId && !v) return;
    // Do not persist prompt content in storage for privacy
    setShowConfirm(true);
  };

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // DataURL として保存し、遷移先で復元
    const toDataUrl = (f: File) => new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.readAsDataURL(f);
    });

    const dataUrl = await toDataUrl(file);
    try {
      sessionStorage.setItem('create_image_file', dataUrl);
    } catch {}

    // プレビューとして表示
    setUploadedImage(dataUrl);
    setUploadedFileName(file.name);
    setSelectedFile(file);
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setUploadedFileName('');
    try {
      sessionStorage.removeItem('create_image_file');
    } catch {}
  };

  // Optional: quick history (recent prompts)
  const [popular, setPopular] = useState<Array<{ key: string; exampleKey?: string | null; uses: number }>>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pop = await api.listPopularPrompts(5, 0);
        if (!cancelled) setPopular((pop.items || []).map(p => ({ key: p.key, exampleKey: (p as any).example_key, uses: p.uses })));
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-[color:var(--color-jz-surface)] text-[color:var(--color-jz-text-primary)]">
      {/* Header with navigation */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="jz-glass-effect border-b border-[color:var(--color-jz-border)]">
          <div className="flex items-center justify-between pt-[44px] px-[var(--space-16)] pb-[var(--space-16)]">
            <button
              onClick={() => onNavigate('home')}
              className="text-[color:var(--color-jz-text-secondary)] hover:text-[color:var(--color-jz-text-primary)] transition-colors"
              aria-label="戻る"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)]">
              新規作成
            </h1>
            <div className="w-6" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-[100px] sm:pt-[120px] pb-[100px] sm:pb-[160px] px-[var(--space-12)] sm:px-[var(--space-16)]">
        <div className="max-w-full sm:max-w-[720px] mx-auto">

          {/* Welcome Message */}
          <div className="text-center mb-[var(--space-32)]">
            <h2 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)] mb-[var(--space-16)]">
              写真を編集
            </h2>
            <p className="jz-text-body text-[color:var(--color-jz-text-secondary)] leading-relaxed">
              写真をアップロードして、<br/>
              自然言語で編集内容を指定してください
            </p>
          </div>

          {/* Demo Mode Toggle */}
          <div className="mb-[var(--space-24)]">
            <div className="bg-[color:var(--color-jz-accent)]/10 border border-[color:var(--color-jz-accent)]/30 rounded-[var(--radius-jz-card)] p-[var(--space-16)]">
              <div className="flex items-center justify-between mb-[var(--space-12)]">
                <div>
                  <h3 className="jz-font-display jz-text-body font-semibold text-[color:var(--color-jz-text-primary)] mb-[var(--space-4)]">
                    🎭 デモモード
                  </h3>
                  <p className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
                    サンプル画像で生成を体験できます
                  </p>
                </div>
                <button
                  onClick={() => setIsDemoMode(!isDemoMode)}
                  className={`px-[var(--space-16)] py-[var(--space-8)] rounded-[var(--radius-jz-button)] text-sm font-medium transition-colors ${
                    isDemoMode
                      ? 'bg-[color:var(--color-jz-accent)] text-white'
                      : 'bg-[color:var(--color-jz-surface)] text-[color:var(--color-jz-text-primary)] border border-[color:var(--color-jz-border)]'
                  }`}
                >
                  {isDemoMode ? 'オン' : 'オフ'}
                </button>
              </div>
              {isDemoMode && (
                <div className="border-t border-[color:var(--color-jz-accent)]/20 pt-[var(--space-12)]">
                  <p className="jz-text-caption text-[color:var(--color-jz-accent)] mb-[var(--space-12)]">
                    サンプル画像を選択してください：
                  </p>
                  <div className="grid grid-cols-3 gap-[var(--space-8)]">
                    {demoImages.map((demo) => (
                      <button
                        key={demo.id}
                        onClick={() => handleDemoImageSelect(demo)}
                        className={`relative aspect-square rounded-[var(--radius-jz-button)] border-2 overflow-hidden transition-all ${
                          selectedDemoImage === demo.url
                            ? 'border-[color:var(--color-jz-accent)] ring-2 ring-[color:var(--color-jz-accent)]/30'
                            : 'border-[color:var(--color-jz-border)] hover:border-[color:var(--color-jz-accent)]/50'
                        }`}
                      >
                        <img
                          src={demo.url}
                          alt={demo.description}
                          className="w-full h-full object-cover"
                        />
                        {selectedDemoImage === demo.url && (
                          <div className="absolute inset-0 bg-[color:var(--color-jz-accent)]/20 flex items-center justify-center">
                            <div className="w-6 h-6 bg-[color:var(--color-jz-accent)] rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-1">
                          <p className="text-xs text-center truncate">{demo.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  {selectedDemoImage && (
                    <div className="mt-[var(--space-12)] flex justify-end">
                      <button
                        onClick={exitDemoMode}
                        className="text-[color:var(--color-jz-text-secondary)] hover:text-[color:var(--color-jz-text-primary)] text-sm underline"
                      >
                        デモモードを終了
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Main Action Cards */}
          <div className="space-y-[var(--space-16)] mb-[var(--space-32)]">

            {/* Upload Photo Card */}
            <div className="bg-[color:var(--color-jz-card)] border border-[color:var(--color-jz-border)] rounded-[var(--radius-jz-card)] p-[var(--space-16)] sm:p-[var(--space-24)]">
              <div className="flex flex-col sm:flex-row items-start gap-[var(--space-12)] sm:gap-[var(--space-16)]">
                <div className="flex-1">
                  <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-[var(--space-8)]">
                    ①　写真を{isDemoMode ? 'サンプルから選択または' : ''}アップロード
                  </h3>
                  <p className="jz-text-body text-[color:var(--color-jz-text-secondary)] mb-[var(--space-16)]">
                    {isDemoMode
                      ? 'デモモードでサンプル画像を選択するか、ギャラリーから選択してください'
                      : '編集したい写真をギャラリーから選択してください'
                    }
                  </p>

                  {/* Image Preview */}
                  {uploadedImage ? (
                    <div className="mb-[var(--space-16)]">
                      <div className="relative">
                        <img
                          src={uploadedImage}
                          alt="アップロードされた写真"
                          className="w-full h-32 sm:h-48 object-cover rounded-[var(--radius-jz-button)] border border-[color:var(--color-jz-border)]"
                        />
                        <button
                          onClick={selectedDemoImage ? exitDemoMode : handleRemoveImage}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                          aria-label="写真を削除"
                        >
                          ×
                        </button>
                        {selectedDemoImage && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-[color:var(--color-jz-accent)] text-white text-xs rounded">
                            デモ
                          </div>
                        )}
                      </div>
                      <p className="jz-text-caption text-[color:var(--color-jz-text-secondary)] mt-[var(--space-8)] truncate">
                        {uploadedFileName} {selectedDemoImage && '(デモ画像)'}
                      </p>
                    </div>
                  ) : null}

                  <button
                    onClick={handlePickImage}
                    className="w-full bg-[color:var(--color-jz-accent)] hover:bg-[color:var(--color-jz-accent)]/90 text-white rounded-[var(--radius-jz-button)] py-[var(--space-12)] px-[var(--space-16)] flex items-center justify-center gap-[var(--space-8)] transition-colors"
                  >
                    <JZPhotoIcon size={20} />
                    {uploadedImage ? '別の写真を選択' : '写真を選択'}
                  </button>
                </div>
              </div>
            </div>

            {/* Text Prompt Card */}
            <div className="bg-[color:var(--color-jz-card)] border border-[color:var(--color-jz-border)] rounded-[var(--radius-jz-card)] p-[var(--space-16)] sm:p-[var(--space-24)]">
              <div className="flex flex-col sm:flex-row items-start gap-[var(--space-12)] sm:gap-[var(--space-16)]">
                <div className="flex-1">
                  {!templateOptionId ? (
                    <>
                      <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-[var(--space-8)]">②　編集内容を入力</h3>
                      <p className="jz-text-body text-[color:var(--color-jz-text-secondary)] mb-[var(--space-16)]">どのような編集をしたいか、自然な日本語で説明してください</p>
                      <div className="mb-[var(--space-16)]">
                        <textarea
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          placeholder="例：背景を削除して透明にしてください"
                          className="w-full bg-[color:var(--color-jz-surface)] border border-[color:var(--color-jz-border)] rounded-[var(--radius-jz-button)] py-[var(--space-12)] px-[var(--space-16)] text-[color:var(--color-jz-text-primary)] placeholder-[color:var(--color-jz-text-tertiary)] resize-none h-[80px] focus:outline-none focus:border-[color:var(--color-jz-accent)]"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="mb-[var(--space-16)] flex items-center justify-between">
                      <div className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
                        テンプレートが選択されています（内容は非表示）
                      </div>
                      <button
                        onClick={clearTemplate}
                        className="jz-text-caption underline text-[color:var(--color-jz-text-secondary)] hover:text-[color:var(--color-jz-text-primary)]"
                      >
                        テンプレートを解除
                      </button>
                    </div>
                  )}

                  {/* Recent prompts (quick apply) */}
                  {/* Popular template prompts */}
                  {popular.length > 0 && (
                    <div className="mb-[var(--space-16)]">
                      <div className="jz-text-caption text-[color:var(--color-jz-text-tertiary)] mb-[var(--space-8)]">人気のテンプレート</div>
                      <div className="flex flex-wrap gap-[var(--space-8)]">
                        {popular.map((p, idx) => (
                          <button
                            key={p.key || String(idx)}
                            onClick={() => setTemplateOptionId(p.exampleKey || p.key)}
                            className="px-[var(--space-12)] py-[var(--space-6)] rounded-full border border-[color:var(--color-jz-border)] bg-[color:var(--color-jz-surface)] hover:bg-[color:var(--color-jz-card)] jz-text-caption text-[color:var(--color-jz-text-primary)]"
                            title={`人気テンプレート（${p.uses}回）`}
                          >
                            人気テンプレート
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={(!templateOptionId && !value.trim()) || (!uploadedImage && !selectedDemoImage)}
                    className="w-full bg-[color:var(--color-jz-accent)] hover:bg-[color:var(--color-jz-accent)]/90 disabled:bg-[color:var(--color-jz-text-tertiary)] disabled:cursor-not-allowed text-white rounded-[var(--radius-jz-button)] py-[var(--space-12)] px-[var(--space-16)] flex items-center justify-center gap-[var(--space-8)] transition-colors"
                  >
                    <JZMagicWandIcon size={20} />
                    {selectedDemoImage ? 'デモ生成を開始する' : '生成を開始する'}
                  </button>
                  {((!uploadedImage && !selectedDemoImage) || (!templateOptionId && !value.trim())) && (
                    <p className="jz-text-caption text-[color:var(--color-jz-text-secondary)] mt-[var(--space-8)] text-center">
                      {(!uploadedImage && !selectedDemoImage) ? '写真をアップロードまたはデモ画像を選択してください' : 'テンプレート選択またはプロンプトを入力してください'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <JZCard className="max-w-md w-[92%] p-6">
            <div className="mb-4">
              <h2 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-2">
                {selectedDemoImage ? 'デモ生成を開始しますか？' : '生成を開始しますか？'}
              </h2>
              <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
                {selectedDemoImage
                  ? 'デモモードで画像生成のシミュレーションを実行します。実際のクレジットは消費されません。'
                  : 'この操作でクレジットが消費され、画像の生成が開始されます。内容をご確認の上、よろしければ「生成を開始」を押してください。'
                }
              </p>
            </div>
            {uploadedImage && (
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-[var(--radius-jz-card)] overflow-hidden border border-[color:var(--color-jz-border)]">
                  <img src={uploadedImage} alt="確認プレビュー" loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="jz-text-caption text-[color:var(--color-jz-text-tertiary)] mb-1">実行内容</div>
                  <div className="text-sm text-[color:var(--color-jz-text-secondary)] break-words">
                    {templateOptionId ? 'テンプレートのプロンプトで出力されます（内容は非表示）' : '入力したプロンプトで出力されます（内容は非表示）'}
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <JZButton tone="secondary" onClick={() => setShowConfirm(false)} disabled={isGenerating}>キャンセル</JZButton>
              <JZButton
                tone="primary"
                state={isGenerating ? 'loading' : 'enabled'}
                onClick={async () => {
                  if (!selectedFile && !selectedDemoImage) return;
                  setIsGenerating(true);
                  try {
                    if (selectedDemoImage) {
                      // デモモードの場合：シミュレーション生成
                      await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒待機

                      // デモ用の結果画像を生成（元画像と同じものを使用）
                      const demoResultUrl = selectedDemoImage;

                      try {
                        sessionStorage.setItem('generated-image-url', demoResultUrl);
                        sessionStorage.setItem('original-image-url', selectedDemoImage);
                        sessionStorage.setItem('used-prompt', templateOptionId || value.trim());
                        sessionStorage.setItem('demo_mode_result', 'true');
                      } catch {}
                    } else {
                      // 通常モード：実際のAPI呼び出し
                      const res = templateOptionId
                        ? await api.editImageByOption(selectedFile, templateOptionId, 'standard')
                        : await api.editImage(selectedFile, value.trim(), 'standard');
                      const genUrl = URL.createObjectURL(res.blob);
                      try {
                        sessionStorage.setItem('generated-image-url', genUrl);
                        if (uploadedImage) sessionStorage.setItem('original-image-url', uploadedImage);
                        sessionStorage.setItem('used-prompt', templateOptionId || value.trim());
                        // Do not store prompt content on client
                      } catch {}
                    }
                    setShowConfirm(false);
                    onNavigate('results');
                  } catch (e) {
                    alert('生成に失敗しました。しばらくしてからお試しください。');
                  } finally {
                    setIsGenerating(false);
                  }
                }}
              >
                {selectedDemoImage ? 'デモ生成を開始' : '生成を開始'}
              </JZButton>
            </div>
          </JZCard>
        </div>
      )}
    </div>
  );
};
