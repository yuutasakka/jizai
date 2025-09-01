// import React, { useState, useEffect } from 'react';
import { DSButton } from '../design-system/button';
import { DSCard, DSCardContent } from '../design-system/card';
import { DSToolbar } from '../design-system/toolbar';
import { XIcon, ExclamationBubbleIcon } from '../design-system/icons';
import { Progress } from '../ui/progress';

export const GeneratingScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
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
    if (confirm('生成を止めますか？')) {
      onNavigate('home');
    }
  };

  const getStatusText = () => {
    if (progress < 20) return "画像を解析中...";
    if (progress < 60) return "画像を生成中...";
    if (progress < 90) return "最終調整を実行中...";
    if (progress < 100) return "もうすぐ完了...";
    return "完了しました！";
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-surface)]">
      {/* Header */}
      <DSToolbar position="top" className="bg-[color:var(--color-surface)] border-b border-[color:var(--color-border)]">
        <div className="flex justify-between items-center pt-[44px]">
            <h1 className="font-display text-display-medium text-[color:var(--color-text-primary)]">生成中</h1>
          <DSButton
            variant="tertiary"
            size="sm"
            onClick={handleCancel}
          >
            <XIcon size={20} />
          </DSButton>
        </div>
      </DSToolbar>

      {/* Content */}
      <div className="pt-[120px] px-[16px] flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
        <DSCard className="w-full max-w-[320px] mb-[32px]">
          <DSCardContent className="text-center py-[48px]">
            {/* Animation */}
            <div className="w-[120px] h-[120px] mx-auto mb-[32px] rounded-[--radius-preview] gradient-accent flex items-center justify-center relative overflow-hidden">
              <div className="w-[80px] h-[80px] border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" 
                   style={{ 
                     animation: 'shimmer 2s infinite',
                     background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
                   }} />
            </div>

            <h2 className="font-display text-display-small text-[color:var(--color-text-primary)] mb-[8px]">
              画像を生成しています
            </h2>
            <p className="text-body text-[color:var(--color-text-secondary)] mb-[32px]">
              高品質な結果をお届けするため、少々お待ちください
            </p>

            {/* Progress */}
            <div className="mb-[16px]">
              <Progress 
                value={progress} 
                className="w-full h-[8px] bg-[color:var(--color-border)] [&>div]:bg-gradient-to-r [&>div]:from-[color:var(--color-accent-gradient-start)] [&>div]:to-[color:var(--color-accent-gradient-end)]" 
              />
            </div>
            
            <div className="flex justify-between text-caption text-[color:var(--color-text-tertiary)] mb-[24px]">
              <span>{Math.round(progress)}%</span>
              <span>{formatTime(timeElapsed)}</span>
            </div>

            <p className="text-body text-[color:var(--color-text-secondary)]">
              {getStatusText()}
            </p>
          </DSCardContent>
        </DSCard>

        {/* Warning Card */}
        <DSCard className="w-full max-w-[320px] border-orange-500/30 bg-orange-500/10 mb-[32px]">
          <DSCardContent className="py-[16px]">
            <div className="flex items-start gap-[12px]">
              <div className="w-[24px] h-[24px] rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-[2px]">
                <ExclamationBubbleIcon size={14} className="text-white" />
              </div>
              <div>
                <h3 className="font-body text-body font-medium text-orange-400 mb-[4px]">通信について</h3>
                <p className="text-caption text-orange-300">
                  生成中は通信が発生します。Wi-Fi環境での利用を推奨します。
                </p>
              </div>
            </div>
          </DSCardContent>
        </DSCard>

        {/* Cancel Button */}
        <DSButton
          variant="destructive"
          onClick={handleCancel}
        >
          キャンセル
        </DSButton>
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
