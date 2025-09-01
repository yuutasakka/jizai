import { JZCard, JZCardContent } from './jizai-card';
import { JZButton } from './jizai-button';
import { JZExclamationBubbleIcon } from './jizai-icons';
import { cn } from '../ui/utils';

export interface JZErrorCardProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  type?: 'general' | 'generation-failed' | 'network-error';
}

export const JZErrorCard = ({ 
  title, 
  message, 
  onRetry, 
  retryLabel = "再試行",
  className,
  type = 'general'
}: JZErrorCardProps) => {
  // 文言最終化：統一されたエラーメッセージ
  const getErrorContent = () => {
    switch (type) {
      case 'generation-failed':
        return {
          title: title || "写真を変えられませんでした",
          message: message || "うまくいきませんでした。もう少し詳しく書いてみてください。"
        };
      case 'network-error':
        return {
          title: title || "つながりません",
          message: message || "インターネットにつながっているか確認してください。"
        };
      default:
        return {
          title: title || "何かエラーが起きました",
          message: message || "うまくいきませんでした。もう少し詳しく書いてみてください。"
        };
    }
  };

  const errorContent = getErrorContent();

  return (
    <JZCard className={cn("border-[color:var(--color-jz-destructive)]/30 bg-[color:var(--color-jz-destructive)]/10", className)}>
      <JZCardContent className="py-[var(--space-20)]">
        <div className="flex items-start gap-[var(--space-16)]">
          <div className="w-[32px] h-[32px] rounded-full bg-[color:var(--color-jz-destructive)] flex items-center justify-center flex-shrink-0">
            <JZExclamationBubbleIcon size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="jz-font-display jz-text-body font-semibold text-[color:var(--color-jz-destructive)] mb-[var(--space-8)]">
              {errorContent.title}
            </h3>
            <p className="jz-text-body text-[color:var(--color-jz-text-secondary)] mb-[var(--space-20)] leading-relaxed">
              {errorContent.message}
            </p>
            {onRetry && (
              <JZButton
                tone="destructive"
                size="md"
                onClick={onRetry}
                className="min-w-[100px]"
              >
                {retryLabel}
              </JZButton>
            )}
          </div>
        </div>
      </JZCardContent>
    </JZCard>
  );
};

// プリセットされたエラーコンポーネント
export const JZGenerationFailedCard = ({ onRetry }: { onRetry?: () => void }) => (
  <JZErrorCard
    type="generation-failed"
    onRetry={onRetry}
    retryLabel="やり直す"
  />
);

export const JZNetworkErrorCard = ({ onRetry }: { onRetry?: () => void }) => (
  <JZErrorCard
    type="network-error"
    onRetry={onRetry}
    retryLabel="再接続"
  />
);