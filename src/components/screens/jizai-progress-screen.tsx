import React, { useState, useEffect } from 'react';
import { JZButton } from '../design-system/jizai-button';
import { JZCard, JZCardContent } from '../design-system/jizai-card';
import { JZXIcon, JZExclamationBubbleIcon } from '../design-system/jizai-icons';
import { Progress } from '../design-system/jizai-progress';

export const JizaiProgressScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const [progress, setProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => onNavigate('results'), 1000);
          return 100;
        }
        return prev + Math.random() * 3 + 1;
      });
    }, 800);

    const timeInterval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(timeInterval);
    };
  }, [onNavigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCancel = () => {
    if (confirm('生成をキャンセルしますか？使用した枚数は返還されません。')) {
      onNavigate('home');
    }
  };

  const getStatusText = () => {
    if (progress < 20) return "画像を解析中...";
    if (progress < 60) return "編集中...";
    if (progress < 90) return "最終調整を実行中...";
    if (progress < 100) return "もうすぐ完了...";
    return "完了しました！";
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-jz-surface)]">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="jz-gradient-surface jz-glass-effect">
          <div className="flex justify-between items-center pt-[44px] px-[var(--space-16)] pb-[var(--space-12)]">
            <h1 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)]">生成中</h1>
            <JZButton
              tone="tertiary"
              size="sm"
              onClick={handleCancel}
            >
              <JZXIcon size={20} />
            </JZButton>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-[140px] px-[var(--space-16)] flex flex-col items-center justify-center min-h-[calc(100vh-140px)]">
        <JZCard className="w-full max-w-[320px] mb-[var(--space-32)]">
          <JZCardContent className="text-center py-[var(--space-48)]">
            {/* Animation with JIZAI Branding */}
            <div className="w-[120px] h-[120px] mx-auto mb-[var(--space-32)] rounded-[--radius-jz-preview] jz-gradient-primary flex items-center justify-center relative overflow-hidden">
              <div className="w-[80px] h-[80px] border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              
              {/* JIZAI logo in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="jz-font-display text-white text-[12px] font-bold">JIZAI</span>
              </div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" 
                   style={{ 
                     animation: 'shimmer 2s infinite',
                     background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
                   }} />
            </div>

            <h2 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-[var(--space-8)]">
              思いのままに生成中
            </h2>
            <p className="jz-text-body text-[color:var(--color-jz-text-secondary)] mb-[var(--space-32)]">
              高品質な結果をお届けするため、少々お待ちください
            </p>

            {/* Progress */}
            <div className="mb-[var(--space-16)]">
              <Progress 
                value={progress} 
                className="w-full h-[8px] bg-[color:var(--color-jz-border)] [&>div]:jz-gradient-primary" 
              />
            </div>
            
            <div className="flex justify-between jz-text-caption text-[color:var(--color-jz-text-tertiary)] mb-[var(--space-24)]">
              <span>{Math.round(progress)}%</span>
              <span>{formatTime(timeElapsed)}</span>
            </div>

            <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
              {getStatusText()}
            </p>
          </JZCardContent>
        </JZCard>

        {/* Info Card */}
        <JZCard className="w-full max-w-[320px] border-[color:var(--color-jz-warning)]/30 bg-[color:var(--color-jz-warning)]/10 mb-[var(--space-32)]">
          <JZCardContent className="py-[var(--space-16)]">
            <div className="flex items-start gap-[var(--space-12)]">
              <div className="w-[24px] h-[24px] rounded-full bg-[color:var(--color-jz-warning)] flex items-center justify-center flex-shrink-0 mt-[2px]">
                <JZExclamationBubbleIcon size={14} className="text-white" />
              </div>
              <div>
                <h3 className="jz-font-body jz-text-body font-medium text-[color:var(--color-jz-warning)] mb-[4px]">生成について</h3>
                <p className="jz-text-caption text-[color:var(--color-jz-warning)]">
                  生成には数秒かかります。Wi-Fi環境での利用を推奨します。
                </p>
              </div>
            </div>
          </JZCardContent>
        </JZCard>

        {/* Cancel Button */}
        <JZButton
          tone="destructive"
          onClick={handleCancel}
        >
          キャンセル
        </JZButton>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};
