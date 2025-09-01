import React, { useState } from 'react';
import { IOSButton } from './ios-button';
import { IOSCard, IOSCardContent, IOSCardFooter } from './ios-card';
import { EyeIcon, DownloadIcon, ExclamationBubbleIcon, ArrowPathIcon } from './ios-icons';
import { ImageWithFallback } from './figma/ImageWithFallback';

export const ResultsScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const [showBefore, setShowBefore] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  // Mock image URLs
  const originalImage = "https://images.unsplash.com/photo-1494790108755-2616c27da422?w=400&h=400&fit=crop";
  const editedImage = "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop";

  const handleSave = async () => {
    setIsDownloading(true);
    // Mock download delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsDownloading(false);
    alert('画像を保存しました');
  };

  const handleReport = async () => {
    if (confirm('この画像に問題があるとして通報しますか？')) {
      setIsReporting(true);
      // Mock report delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsReporting(false);
      alert('通報を受け付けました。ご報告ありがとうございます。');
    }
  };

  const handleRegenerate = () => {
    if (confirm('同じ設定で再生成しますか？')) {
      onNavigate('generating');
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-ios-gray-6)] p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pt-12">
        <IOSButton
          variant="ghost"
          onClick={() => onNavigate('home')}
        >
          ← ホーム
        </IOSButton>
        <h1 className="text-lg font-medium">結果</h1>
        <div className="w-16"></div>
      </div>

      {/* Image Display */}
      <IOSCard className="mb-6">
        <IOSCardContent className="p-0">
          <div className="relative aspect-square">
            <ImageWithFallback
              src={showBefore ? originalImage : editedImage}
              alt={showBefore ? "変更前の画像" : "変更後の画像"}
              className="w-full h-full object-cover rounded-t-xl"
            />
            
            {/* Toggle Button */}
            <div className="absolute top-4 left-4">
              <IOSButton
                variant="secondary"
                size="sm"
                onClick={() => setShowBefore(!showBefore)}
                className="flex items-center gap-2 bg-white/90 backdrop-blur"
              >
                <EyeIcon size={16} />
                {showBefore ? 'After' : 'Before'}
              </IOSButton>
            </div>

            {/* Status Badge */}
            <div className="absolute top-4 right-4">
              <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                完了
              </div>
            </div>
          </div>
        </IOSCardContent>
        <IOSCardFooter>
          <div className="text-center text-sm text-[color:var(--color-ios-gray-1)]">
            {showBefore ? '元の画像' : '生成された画像'}
          </div>
        </IOSCardFooter>
      </IOSCard>

      {/* Action Buttons */}
      <div className="space-y-3">
        <IOSButton
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleSave}
          state={isDownloading ? 'loading' : 'enabled'}
          className="flex items-center justify-center gap-2"
        >
          <DownloadIcon size={20} />
          {isDownloading ? '保存中...' : '保存'}
        </IOSButton>

        <div className="grid grid-cols-2 gap-3">
          <IOSButton
            variant="secondary"
            onClick={handleRegenerate}
            className="flex items-center justify-center gap-2"
          >
            <ArrowPathIcon size={16} />
            再生成
          </IOSButton>
          
          <IOSButton
            variant="ghost"
            onClick={handleReport}
            state={isReporting ? 'loading' : 'enabled'}
            className="flex items-center justify-center gap-2 text-red-500"
          >
            <ExclamationBubbleIcon size={16} />
            {isReporting ? '通報中...' : '通報'}
          </IOSButton>
        </div>
      </div>

      {/* Info Card */}
      <IOSCard className="mt-6 border-[color:var(--color-ios-blue)] bg-blue-50">
        <IOSCardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[color:var(--color-ios-blue)] flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">i</span>
            </div>
            <div className="text-sm">
              <p className="font-medium text-[color:var(--color-ios-blue)] mb-1">生成完了</p>
              <p className="text-[color:var(--color-ios-blue)]">
                高品質な画像が生成されました。保存して写真アプリでご利用いただけます。
              </p>
            </div>
          </div>
        </IOSCardContent>
      </IOSCard>
    </div>
  );
};
