// import React from 'react';
import { JZButton } from '../design-system/jizai-button';
import { JZCard, JZCardHeader, JZCardContent } from '../design-system/jizai-card';
import { JZChip } from '../design-system/jizai-chip';
import { JZSlider } from '../design-system/jizai-slider';
import { 
  JZPhotoIcon, 
  JZMagicWandIcon, 
  JZBoltIcon,
  JZSliderIcon,
  JZDownloadIcon,
  JZCreditCardIcon,
  JZCheckIcon
} from '../design-system/jizai-icons';
import { cn } from '../ui/utils';

interface ScreenshotProps {
  screenSize: '6.7' | '5.5';
  type: 'before-after' | 'text-replace' | 'sale-change' | 'color-change' | 'object-removal' | 'purchase';
}

export const AppStoreScreenshot = ({ screenSize, type }: ScreenshotProps) => {
  const isLarge = screenSize === '6.7';
  const containerClass = isLarge 
    ? 'w-[428px] h-[926px]' // iPhone 6.7"
    : 'w-[375px] h-[812px]'; // iPhone 5.5"

  const spacing = isLarge ? 'var(--space-20)' : 'var(--space-16)';
  const headerPadding = isLarge ? 'pt-[48px]' : 'pt-[44px]';

  const getScreenContent = () => {
    switch (type) {
      case 'before-after':
        return <BeforeAfterContent isLarge={isLarge} />;
      case 'text-replace':
        return <TextReplaceContent isLarge={isLarge} />;
      case 'sale-change':
        return <SaleChangeContent isLarge={isLarge} />;
      case 'color-change':
        return <ColorChangeContent isLarge={isLarge} />;
      case 'object-removal':
        return <ObjectRemovalContent isLarge={isLarge} />;
      case 'purchase':
        return <PurchaseContent isLarge={isLarge} />;
      default:
        return <BeforeAfterContent isLarge={isLarge} />;
    }
  };

  return (
    <div className={cn(
      "relative bg-[color:var(--color-jz-surface)] overflow-hidden",
      containerClass
    )}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50">
        <div className="jz-glass-effect border-b border-[color:var(--color-jz-border)]">
          <div className={cn("flex justify-between items-center pb-[var(--space-16)]", headerPadding)} 
               style={{ paddingLeft: spacing, paddingRight: spacing }}>
            <div>
              <h1 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)]">JIZAI</h1>
              <p className="jz-text-caption text-[color:var(--color-jz-text-secondary)] mt-[2px]">写真、思いのままに。</p>
            </div>
            <JZButton
              tone="secondary"
              size="md"
              className="bg-[color:var(--color-jz-accent)]/20 border-[color:var(--color-jz-accent)]/30 text-[color:var(--color-jz-accent)]"
            >
              あと20回
            </JZButton>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-[140px] pb-[40px] h-full overflow-hidden" style={{ paddingLeft: spacing, paddingRight: spacing }}>
        {getScreenContent()}
      </div>
    </div>
  );
};

// Before/After Content
const BeforeAfterContent = ({ isLarge }: { isLarge: boolean }) => {
  const [beforeAfterSlider, setBeforeAfterSlider] = React.useState(70);
  
  return (
    <div className="space-y-[var(--space-20)] h-full">
      {/* Hero */}
      <div className="text-center py-[var(--space-16)]">
        <h2 className="jz-font-display jz-text-display-large text-[color:var(--color-jz-text-primary)] mb-[var(--space-12)]">
          写真、思いのままに。
        </h2>
        <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
          変えたいところだけ、意図どおりに。
        </p>
      </div>

      {/* Before/After Preview */}
      <JZCard>
        <JZCardContent className="p-0">
          <div className="relative aspect-square rounded-[--radius-jz-preview] overflow-hidden border border-[color:var(--color-jz-border)]">
            {/* Before Image - Store Front */}
            <div 
              className="absolute inset-0"
              style={{
                clipPath: `polygon(0 0, ${beforeAfterSlider}% 0, ${beforeAfterSlider}% 100%, 0 100%)`
              }}
            >
              <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-white text-6xl font-bold mb-4">OPEN</div>
                  <div className="text-white text-lg">営業中</div>
                </div>
              </div>
              <div className="absolute top-[var(--space-12)] left-[var(--space-12)]">
                <span className="bg-black/60 text-white px-[var(--space-12)] py-[var(--space-8)] rounded-[8px] jz-text-caption">
                  変更前
                </span>
              </div>
            </div>

            {/* After Image - Store Front */}
            <div 
              className="absolute inset-0"
              style={{
                clipPath: `polygon(${beforeAfterSlider}% 0, 100% 0, 100% 100%, ${beforeAfterSlider}% 100%)`
              }}
            >
              <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-white text-6xl font-bold mb-4">CLOSED</div>
                  <div className="text-white text-lg">閉店中</div>
                </div>
              </div>
              <div className="absolute top-[var(--space-12)] right-[var(--space-12)]">
                <span className="bg-[color:var(--color-jz-accent)] text-white px-[var(--space-12)] py-[var(--space-8)] rounded-[8px] jz-text-caption">
                  変更後
                </span>
              </div>
            </div>

            {/* Slider Handle */}
            <div 
              className="absolute top-0 bottom-0 w-[4px] bg-white shadow-lg cursor-col-resize z-10"
              style={{ left: `${beforeAfterSlider}%`, transform: 'translateX(-50%)' }}
            >
              <div className="absolute top-1/2 left-1/2 w-[32px] h-[32px] bg-white rounded-full border-2 border-[color:var(--color-jz-accent)] transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                <JZSliderIcon size={16} className="text-[color:var(--color-jz-accent)]" />
              </div>
            </div>
          </div>
        </JZCardContent>
      </JZCard>

      {/* CTA */}
      <div className="text-center">
        <JZButton tone="primary" size="lg" className="px-[var(--space-48)]">
          写真を変える
        </JZButton>
      </div>
    </div>
  );
};

// Text Replace Content
const TextReplaceContent = ({ isLarge }: { isLarge: boolean }) => (
  <div className="space-y-[var(--space-20)] h-full">
    <div className="text-center py-[var(--space-16)]">
      <h2 className="jz-font-display jz-text-display-large text-[color:var(--color-jz-text-primary)] mb-[var(--space-12)]">
        文字もフォント維持で
      </h2>
      <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
        既存のデザインを崩さずに変更
      </p>
    </div>

    <JZCard>
      <JZCardContent className="p-0">
        <div className="aspect-square rounded-[--radius-jz-preview] overflow-hidden border border-[color:var(--color-jz-border)] bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
          <div className="text-center">
            <div className="text-white text-5xl font-bold mb-4">CLOSED</div>
            <div className="text-white text-lg">営業時間外</div>
            <div className="absolute top-[var(--space-12)] right-[var(--space-12)]">
              <span className="bg-[color:var(--color-jz-success)] text-white px-[var(--space-12)] py-[var(--space-8)] rounded-[8px] jz-text-caption">
                フォント維持
              </span>
            </div>
          </div>
        </div>
      </JZCardContent>
    </JZCard>

    <JZCard>
      <JZCardContent>
        <div className="text-center">
          <JZChip variant="selected" className="mb-[var(--space-16)]">
            <span className="text-[16px]">文</span>
            文字
          </JZChip>
          <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
            「OPENをCLOSEDに」
          </p>
        </div>
      </JZCardContent>
    </JZCard>
  </div>
);

// Sale Change Content
const SaleChangeContent = ({ isLarge }: { isLarge: boolean }) => (
  <div className="space-y-[var(--space-20)] h-full">
    <div className="text-center py-[var(--space-16)]">
      <h2 className="jz-font-display jz-text-display-large text-[color:var(--color-jz-text-primary)] mb-[var(--space-12)]">
        セール価格も自在に
      </h2>
      <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
        数字だけピンポイント変更
      </p>
    </div>

    <JZCard>
      <JZCardContent className="p-0">
        <div className="aspect-square rounded-[--radius-jz-preview] overflow-hidden border border-[color:var(--color-jz-border)] bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-2xl font-bold mb-2">BIG SALE</div>
            <div className="text-6xl font-bold mb-2">30%</div>
            <div className="text-xl">OFF</div>
            <div className="absolute top-[var(--space-12)] right-[var(--space-12)]">
              <span className="bg-[color:var(--color-jz-warning)] text-white px-[var(--space-12)] py-[var(--space-8)] rounded-[8px] jz-text-caption">
                20%→30%
              </span>
            </div>
          </div>
        </div>
      </JZCardContent>
    </JZCard>

    <JZCard>
      <JZCardContent>
        <div className="text-center">
          <JZChip variant="selected" className="mb-[var(--space-16)]">
            <span className="text-[16px]">数</span>
            数値変更
          </JZChip>
          <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
            「SALE20%→30%」
          </p>
        </div>
      </JZCardContent>
    </JZCard>
  </div>
);

// Color Change Content
const ColorChangeContent = ({ isLarge }: { isLarge: boolean }) => (
  <div className="space-y-[var(--space-20)] h-full">
    <div className="text-center py-[var(--space-16)]">
      <h2 className="jz-font-display jz-text-display-large text-[color:var(--color-jz-text-primary)] mb-[var(--space-12)]">
        質感はそのまま色替え
      </h2>
      <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
        材質感を保持した自然な仕上がり
      </p>
    </div>

    <JZCard>
      <JZCardContent className="p-0">
        <div className="aspect-square rounded-[--radius-jz-preview] overflow-hidden border border-[color:var(--color-jz-border)] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <div className="w-32 h-32 bg-gradient-to-br from-emerald-300 to-emerald-600 rounded-full shadow-2xl">
            <div className="absolute top-[var(--space-12)] right-[var(--space-12)]">
              <span className="bg-[color:var(--color-jz-success)] text-white px-[var(--space-12)] py-[var(--space-8)] rounded-[8px] jz-text-caption">
                質感維持
              </span>
            </div>
          </div>
        </div>
      </JZCardContent>
    </JZCard>

    <JZCard>
      <JZCardContent>
        <div className="text-center">
          <JZChip variant="selected" className="mb-[var(--space-16)]">
            <span className="text-[16px]">色</span>
            色
          </JZChip>
          <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
            「青を緑に変更」
          </p>
        </div>
      </JZCardContent>
    </JZCard>
  </div>
);

// Object Removal Content
const ObjectRemovalContent = ({ isLarge }: { isLarge: boolean }) => (
  <div className="space-y-[var(--space-20)] h-full">
    <div className="text-center py-[var(--space-16)]">
      <h2 className="jz-font-display jz-text-display-large text-[color:var(--color-jz-text-primary)] mb-[var(--space-12)]">
        不要な物だけ削除
      </h2>
      <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
        背景も自然に復元
      </p>
    </div>

    <JZCard>
      <JZCardContent className="p-0">
        <div className="aspect-square rounded-[--radius-jz-preview] overflow-hidden border border-[color:var(--color-jz-border)] bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-b from-sky-300 to-blue-500"></div>
          <div className="relative z-10 text-center text-white">
            <div className="text-4xl mb-4 text-yellow-300">☀</div>
            <div className="text-lg font-medium">綺麗な風景</div>
          </div>
          <div className="absolute top-[var(--space-12)] right-[var(--space-12)]">
            <span className="bg-[color:var(--color-jz-destructive)] text-white px-[var(--space-12)] py-[var(--space-8)] rounded-[8px] jz-text-caption">
              削除完了
            </span>
          </div>
        </div>
      </JZCardContent>
    </JZCard>

    <JZCard>
      <JZCardContent>
        <div className="text-center">
          <JZChip variant="selected" className="mb-[var(--space-16)]">
            <span className="text-[16px]">消</span>
            削除
          </JZChip>
          <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
            「電線を削除」
          </p>
        </div>
      </JZCardContent>
    </JZCard>
  </div>
);

// Purchase Content
const PurchaseContent = ({ isLarge }: { isLarge: boolean }) => (
  <div className="space-y-[var(--space-20)] h-full">
    <div className="text-center py-[var(--space-16)]">
      <h2 className="jz-font-display jz-text-display-large text-[color:var(--color-jz-text-primary)] mb-[var(--space-12)]">
        うまくいったときだけ
      </h2>
      <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
        通常100円/枚。いまだけセール中
      </p>
    </div>

    {/* Recommended Plan - 50枚（期間限定セール） */}
    <div className="relative">
      <div className="absolute -top-[8px] right-[var(--space-16)] z-10">
        <div className="bg-[color:var(--color-jz-secondary)] text-[color:var(--color-jz-surface)] px-[var(--space-12)] py-[var(--space-8)] rounded-[10px] jz-text-caption font-semibold">
          人気 No.1
        </div>
      </div>
      
      <JZCard variant="selected">
        <JZCardContent className="p-[var(--space-16)] space-y-[var(--space-12)]">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {/* タイトル */}
              <div className="mb-[var(--space-8)]">
                <span className="jz-font-display text-[22px] font-semibold text-[color:var(--color-jz-text-primary)]">
                  50枚（期間限定セール）
                </span>
              </div>
              
              {/* 価格 */}
              <div className="flex items-baseline gap-[var(--space-8)] mb-[var(--space-4)]">
                <span className="jz-font-display text-[22px] font-semibold text-[color:var(--color-jz-text-primary)]">¥2,750</span>
                <span className="jz-text-caption text-[color:var(--color-jz-text-tertiary)] line-through">¥5,000</span>
              </div>
              
              {/* 小ラベル */}
              <div className="mb-[var(--space-8)]">
                <span className="text-[14px] text-[color:var(--color-jz-text-secondary)]">1枚=¥55</span>
              </div>
              
              {/* お得感 */}
              <div className="mb-[var(--space-12)]">
                <span className="jz-text-caption text-[color:var(--color-jz-success)] font-medium">35%OFF</span>
              </div>
              
              {/* ベネフィット */}
              <div className="space-y-[var(--space-8)]">
                <div className="flex items-center gap-[var(--space-8)]">
                  <JZCheckIcon size={14} className="text-[color:var(--color-jz-success)] flex-shrink-0" />
                  <span className="text-[15px] text-[color:var(--color-jz-text-secondary)]">日本語で指示OK</span>
                </div>
                <div className="flex items-center gap-[var(--space-8)]">
                  <JZCheckIcon size={14} className="text-[color:var(--color-jz-success)] flex-shrink-0" />
                  <span className="text-[15px] text-[color:var(--color-jz-text-secondary)]">保存は自動。あとからダウンロード</span>
                </div>
                <div className="flex items-center gap-[var(--space-8)]">
                  <JZCheckIcon size={14} className="text-[color:var(--color-jz-success)] flex-shrink-0" />
                  <span className="text-[15px] text-[color:var(--color-jz-text-secondary)]">有効期限3ヶ月</span>
                </div>
              </div>
            </div>
            
            <div className="w-[24px] h-[24px] rounded-full border-2 border-[color:var(--color-jz-accent)] bg-[color:var(--color-jz-accent)] flex items-center justify-center ml-[var(--space-16)]">
              <JZCheckIcon size={12} className="text-white" />
            </div>
          </div>
        </JZCardContent>
      </JZCard>
    </div>

    <JZButton tone="primary" size="lg" fullWidth>
      ¥2,750 で買う
    </JZButton>
  </div>
);
