import React, { useState } from 'react';
import { JZButton } from '../design-system/jizai-button';
import { JZChip } from '../design-system/jizai-chip';
import { JZExampleCard } from '../design-system/jizai-example-card';
import { JZArrowLeftIcon } from '../design-system/jizai-icons';

interface ExampleData {
  title: string;
  promptEn: string;
  description: string;
  thumbnailImage?: string;
  beforeImage?: string;
  afterImage?: string;
}

interface TutorialExamplesScreenProps {
  onNavigate: (screen: string) => void;
  onExampleSelected: (example: ExampleData) => void;
}

type CategoryFilter = 'all' | 'modelA' | 'modelB' | 'text-replace' | 'number-percent' | 'color-change' | 'background' | 'object-removal' | 'angle-pose';

interface LocalExampleData {
  id: string;
  title: string;
  description: string;
  promptEn: string;
  category: CategoryFilter[];
  beforeImage?: string;
  afterImage?: string;
  thumbnailImage?: string;
}

// Model A Examples (fast and stable)
const modelAExamples: LocalExampleData[] = [
  {
    id: 'a-open-closed',
    title: 'OPEN → CLOSED',
    description: '看板の文字をOPENからCLOSEDに置き換え (モデルA)',
    promptEn: 'Replace the sign text from 『OPEN』 to 『CLOSED』. Keep the original font, size, color, kerning and layout unchanged.',
    category: ['text-replace'],
    beforeImage: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80',
    afterImage: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80&sat=-100'
  },
  {
    id: 'a-sale-percent',
    title: 'SALE 20% → 30%',
    description: '割引表示を20%から30%に変更 (モデルA)',
    promptEn: 'Replace the discount text from 『SALE 20%』 to 『SALE 30%』. Keep font family, weight, spacing and alignment unchanged.',
    category: ['number-percent', 'text-replace'],
    beforeImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80',
    afterImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80&hue=30'
  },
  {
    id: 'a-jacket-color',
    title: '色変更（上着→パステルピンク）',
    description: '上着の色をパステルピンクに変更 (モデルA)',
    promptEn: 'Change the jacket color to pastel pink while preserving fabric texture, shadows and lighting.',
    category: ['color-change'],
    beforeImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80',
    afterImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80&hue=300'
  }
];

// Model B Examples (high quality and detailed)
const modelBExamples: LocalExampleData[] = [
  {
    id: 'b-hair-removal',
    title: '不要物削除（前髪の乱れ）',
    description: '前髪の乱れを自然に除去 (モデルB)',
    promptEn: 'Remove stray hair around the forehead while keeping skin texture and lighting unchanged.',
    category: ['object-removal'],
    beforeImage: 'https://images.unsplash.com/photo-1494790108755-2616c056f0db?w=400&q=80',
    afterImage: 'https://images.unsplash.com/photo-1494790108755-2616c056f0db?w=400&q=80&blur=1'
  },
  {
    id: 'b-background-night',
    title: '背景変更（室内→夜景）',
    description: '背景を室内から夜景に変更 (モデルB)',
    promptEn: 'Replace the background with a night cityscape. Keep the subject edges clean and lighting consistent.',
    category: ['background'],
    beforeImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    afterImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&blend=40404040'
  },
  {
    id: 'b-mug-rotate',
    title: '角度変更（マグカップ）',
    description: 'マグカップを90度回転させる (モデルB)',
    promptEn: 'Rotate the mug by 90 degrees so the handle faces left. Keep shadows and reflections consistent.',
    category: ['angle-pose'],
    beforeImage: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80',
    afterImage: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80&flip=h'
  }
];

const exampleData: LocalExampleData[] = [...modelAExamples, ...modelBExamples];

const categoryFilters: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'すべて' },
  { id: 'modelA', label: 'モデルA例' },
  { id: 'modelB', label: 'モデルB例' },
  { id: 'text-replace', label: '文字置換' },
  { id: 'number-percent', label: '数字・%' },
  { id: 'color-change', label: '色変更' },
  { id: 'background', label: '背景' },
  { id: 'object-removal', label: '不要物' },
  { id: 'angle-pose', label: '角度・姿勢' }
];

export const TutorialExamplesScreen = ({ onNavigate, onExampleSelected }: TutorialExamplesScreenProps) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');

  const filteredExamples = selectedCategory === 'all' 
    ? exampleData 
    : selectedCategory === 'modelA'
    ? modelAExamples
    : selectedCategory === 'modelB' 
    ? modelBExamples
    : exampleData.filter(example => example.category.includes(selectedCategory));

  const handleTryExample = (example: LocalExampleData) => {
    const exampleData: ExampleData = {
      title: example.title,
      promptEn: example.promptEn,
      description: example.description,
      thumbnailImage: example.thumbnailImage,
      beforeImage: example.beforeImage,
      afterImage: example.afterImage
    };
    
    onExampleSelected(exampleData);
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
              onClick={() => onNavigate('home')}
              className="mr-[var(--space-12)] flex items-center gap-[var(--space-8)]"
            >
              <JZArrowLeftIcon size={16} />
              ホーム
            </JZButton>
            <h1 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)]">
              実例ギャラリー
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-[140px] pb-[var(--space-24)] px-[var(--space-16)]">
        <div className="max-w-[800px] mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-[var(--space-32)]">
            <h2 
              className="mb-[var(--space-16)]"
              style={{
                fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                fontSize: '26px',
                fontWeight: '600',
                lineHeight: '1.2',
                color: '#ECECEC'
              }}
            >
              見て、真似して、1分で体験
            </h2>
            <p 
              style={{
                fontFamily: 'Noto Sans JP, -apple-system, BlinkMacSystemFont, sans-serif',
                fontSize: '15px',
                fontWeight: '400',
                lineHeight: '1.4',
                color: '#A1A1AA'
              }}
            >
              下の例を選ぶと、画像とプロンプトが自動でセットされます。
            </p>
          </div>

          {/* Category Filters */}
          <div className="mb-[var(--space-32)]">
            <div className="flex flex-wrap gap-[var(--space-8)]">
              {categoryFilters.map((filter) => (
                <JZChip
                  key={filter.id}
                  size="md"
                  variant={selectedCategory === filter.id ? 'selected' : 'default'}
                  onClick={() => setSelectedCategory(filter.id)}
                  className={`cursor-pointer transition-all ${
                    selectedCategory === filter.id
                      ? 'bg-[color:var(--color-jz-accent)] text-white'
                      : 'bg-[color:var(--color-jz-card)] text-[color:var(--color-jz-text-secondary)] hover:bg-[color:var(--color-jz-accent)]/20 hover:text-[color:var(--color-jz-accent)]'
                  }`}
                >
                  {filter.label}
                </JZChip>
              ))}
            </div>
          </div>

          {/* Examples Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-16)]">
            {filteredExamples.map((example) => (
              <JZExampleCard
                key={example.id}
                title={example.title}
                description={example.description}
                promptEn={example.promptEn}
                beforeImage={example.beforeImage}
                afterImage={example.afterImage}
                thumbnailImage={example.thumbnailImage}
                onTryExample={() => handleTryExample(example)}
              />
            ))}
          </div>

          {/* Empty State */}
          {filteredExamples.length === 0 && (
            <div className="text-center py-[var(--space-48)]">
              <div className="w-[64px] h-[64px] rounded-full bg-[color:var(--color-jz-border)] flex items-center justify-center mb-[var(--space-16)] mx-auto">
                <span className="text-[color:var(--color-jz-text-tertiary)] text-2xl">🔍</span>
              </div>
              <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-[var(--space-8)]">
                該当する例が見つかりません
              </h3>
              <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
                別のカテゴリを試してみてください
              </p>
            </div>
          )}

          {/* Bottom Info */}
          <div className="mt-[var(--space-48)] p-[var(--space-20)] bg-[color:var(--color-jz-card)] rounded-[var(--radius-jz-card)] border border-[color:var(--color-jz-border)]">
            <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-[var(--space-12)]">
              💡 コツとヒント
            </h3>
            <ul className="space-y-[var(--space-8)] jz-text-body text-[color:var(--color-jz-text-secondary)]">
              <li>• <strong>具体的に指示：</strong>「青い服を赤に」より「ジャケットを赤に」</li>
              <li>• <strong>元の質感を保持：</strong>「テクスチャはそのまま」を追加</li>
              <li>• <strong>日本語文字：</strong>英語プロンプトの日本語部分を調整</li>
              <li>• <strong>保存は自動：</strong>あとからダウンロードできます</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
