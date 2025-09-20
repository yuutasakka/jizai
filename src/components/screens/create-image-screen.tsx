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

  const handleSubmit = () => {
    const v = value.trim();
    if (!selectedFile) return;
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
      <div className="pt-[120px] pb-[160px] px-[var(--space-16)]">
        <div className="max-w-[720px] mx-auto">

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

          {/* Main Action Cards */}
          <div className="space-y-[var(--space-16)] mb-[var(--space-32)]">

            {/* Upload Photo Card */}
            <div className="bg-[color:var(--color-jz-card)] border border-[color:var(--color-jz-border)] rounded-[var(--radius-jz-card)] p-[var(--space-24)]">
              <div className="flex items-start gap-[var(--space-16)]">
                <div className="flex-shrink-0 w-12 h-12 bg-[color:var(--color-jz-accent)]/10 rounded-[var(--radius-jz-button)] flex items-center justify-center">
                  <JZPhotoIcon size={24} className="text-[color:var(--color-jz-accent)]" />
                </div>
                <div className="flex-1">
                  <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-[var(--space-8)]">
                    ①　写真をアップロード
                  </h3>
                  <p className="jz-text-body text-[color:var(--color-jz-text-secondary)] mb-[var(--space-16)]">
                    編集したい写真をギャラリーから選択してください
                  </p>

                  {/* Image Preview */}
                  {uploadedImage ? (
                    <div className="mb-[var(--space-16)]">
                      <div className="relative">
                        <img
                          src={uploadedImage}
                          alt="アップロードされた写真"
                          className="w-full h-48 object-cover rounded-[var(--radius-jz-button)] border border-[color:var(--color-jz-border)]"
                        />
                        <button
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                          aria-label="写真を削除"
                        >
                          ×
                        </button>
                      </div>
                      <p className="jz-text-caption text-[color:var(--color-jz-text-secondary)] mt-[var(--space-8)] truncate">
                        {uploadedFileName}
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
            <div className="bg-[color:var(--color-jz-card)] border border-[color:var(--color-jz-border)] rounded-[var(--radius-jz-card)] p-[var(--space-24)]">
              <div className="flex items-start gap-[var(--space-16)]">
                <div className="flex-shrink-0 w-12 h-12 bg-[color:var(--color-jz-accent)]/10 rounded-[var(--radius-jz-button)] flex items-center justify-center">
                  <JZMagicWandIcon size={24} className="text-[color:var(--color-jz-accent)]" />
                </div>
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
                    disabled={(!templateOptionId && !value.trim()) || !uploadedImage}
                    className="w-full bg-[color:var(--color-jz-accent)] hover:bg-[color:var(--color-jz-accent)]/90 disabled:bg-[color:var(--color-jz-text-tertiary)] disabled:cursor-not-allowed text-white rounded-[var(--radius-jz-button)] py-[var(--space-12)] px-[var(--space-16)] flex items-center justify-center gap-[var(--space-8)] transition-colors"
                  >
                    <JZMagicWandIcon size={20} />
                    生成を開始する
                  </button>
                  {(!uploadedImage || (!templateOptionId && !value.trim())) && (
                    <p className="jz-text-caption text-[color:var(--color-jz-text-secondary)] mt-[var(--space-8)] text-center">
                      {!uploadedImage ? '写真をアップロードしてください' : 'テンプレート選択またはプロンプトを入力してください'}
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
              <h2 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-2">生成を開始しますか？</h2>
              <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">この操作でクレジットが消費され、画像の生成が開始されます。内容をご確認の上、よろしければ「生成を開始」を押してください。</p>
            </div>
            {uploadedImage && (
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-[var(--radius-jz-card)] overflow-hidden border border-[color:var(--color-jz-border)]">
                  <img src={uploadedImage} alt="確認プレビュー" className="w-full h-full object-cover" />
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
                  if (!selectedFile) return;
                  setIsGenerating(true);
                  try {
                    const res = templateOptionId
                      ? await api.editImageByOption(selectedFile, templateOptionId, 'standard')
                      : await api.editImage(selectedFile, value.trim(), 'standard');
                    const genUrl = URL.createObjectURL(res.blob);
                    try {
                      sessionStorage.setItem('generated-image-url', genUrl);
                      if (uploadedImage) sessionStorage.setItem('original-image-url', uploadedImage);
                      // Do not store prompt content on client
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
