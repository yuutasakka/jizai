import React, { useState, useEffect } from 'react';
import { IOSButton } from './ios-button';
import { IOSCard, IOSCardContent } from './ios-card';
import { XIcon } from './ios-icons';
import { Progress } from './ui/progress';

export const GeneratingScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const [progress, setProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          // Auto-navigate to results after completion
          setTimeout(() => onNavigate('results'), 1000);
          return 100;
        }
        return prev + Math.random() * 5;
      });
    }, 500);

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

  return (
    <div className="min-h-screen bg-[color:var(--color-ios-gray-6)] p-4 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pt-12">
        <h1 className="text-2xl font-semibold text-gray-900">生成中</h1>
        <IOSButton
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="p-2"
        >
          <XIcon size={20} />
        </IOSButton>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center items-center">
        <IOSCard className="w-full max-w-sm">
          <IOSCardContent className="text-center py-8">
            {/* Animation placeholder */}
            <div className="w-32 h-32 mx-auto mb-6 rounded-xl bg-gradient-to-br from-[color:var(--color-ios-blue)] to-purple-500 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>

            <h2 className="text-xl font-medium mb-2">画像を生成しています</h2>
            <p className="text-[color:var(--color-ios-gray-1)] mb-6">
              高品質な結果をお届けするため、少々お待ちください
            </p>

            {/* Progress */}
            <div className="mb-4">
              <Progress value={progress} className="w-full h-2" />
            </div>
            <div className="flex justify-between text-sm text-[color:var(--color-ios-gray-1)] mb-6">
              <span>{Math.round(progress)}%</span>
              <span>{formatTime(timeElapsed)}</span>
            </div>

            {/* Status */}
            <div className="text-sm text-[color:var(--color-ios-gray-1)]">
              {progress < 30 && "画像を解析中..."}
              {progress >= 30 && progress < 70 && "画像を生成中..."}
              {progress >= 70 && progress < 100 && "最終調整を実行中..."}
              {progress >= 100 && "完了しました！"}
            </div>
          </IOSCardContent>
        </IOSCard>

        {/* Warning */}
        <IOSCard variant="outlined" className="mt-6 border-orange-200 bg-orange-50">
          <IOSCardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">!</span>
              </div>
              <div className="text-sm">
                <p className="font-medium text-orange-800 mb-1">通信について</p>
                <p className="text-orange-700">
                  生成中は通信が発生します。Wi-Fi環境での利用を推奨します。
                </p>
              </div>
            </div>
          </IOSCardContent>
        </IOSCard>

        {/* Cancel Button */}
        <div className="mt-8">
          <IOSButton
            variant="destructive"
            onClick={handleCancel}
          >
            キャンセル
          </IOSButton>
        </div>
      </div>
    </div>
  );
};
