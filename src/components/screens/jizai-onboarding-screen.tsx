import React, { useState, useEffect } from 'react';

interface OnboardingScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const JizaiOnboardingScreen = ({ onComplete, onSkip }: OnboardingScreenProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // スワイプ関連の状態
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // 各スライドの表示時間（ミリ秒）
  const SLIDE_DURATION = 4000; // 4秒

  useEffect(() => {
    setAnimationPhase(0);
    const timer = setTimeout(() => setAnimationPhase(1), 500);
    return () => clearTimeout(timer);
  }, [currentSlide]);

  // 自動進行とプログレスバー
  useEffect(() => {
    if (isPaused) return;

    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          return 100;
        }
        return prev + (100 / (SLIDE_DURATION / 50)); // 50msごとに更新
      });
    }, 50);

    const autoAdvanceTimer = setTimeout(() => {
      handleNext();
    }, SLIDE_DURATION);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(autoAdvanceTimer);
    };
  }, [currentSlide, isPaused]);

  const slides = [
    {
      id: 'step1',
      content: (
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-3xl font-light text-white text-center mb-16">
            写真を選びます
          </h1>

          <div 
            className="transition-all duration-1000"
            style={{
              opacity: animationPhase >= 1 ? 1 : 0,
              transform: animationPhase >= 1 ? 'scale(1)' : 'scale(0.9)'
            }}
          >
            <div className="w-72 h-48 bg-gray-500 rounded-xl shadow-xl relative">
              <div className="absolute inset-6 bg-gray-400 rounded-lg"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-lg bg-black/40 px-4 py-2 rounded">
                  あなたの写真
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'step2',
      content: (
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-3xl font-light text-white text-center mb-16">
            やりたいことを書きます
          </h1>

          <div 
            className="transition-all duration-1000"
            style={{
              opacity: animationPhase >= 1 ? 1 : 0,
              transform: animationPhase >= 1 ? 'translateY(0)' : 'translateY(20px)'
            }}
          >
            <div className="w-80 bg-blue-500 rounded-2xl p-6 shadow-xl">
              <div className="text-white text-xl text-center leading-relaxed">
                背景を青い空にしてください
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'step3',
      content: (
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-3xl font-light text-white text-center mb-16">
            美しい写真の完成！
          </h1>

          <div 
            className="transition-all duration-1000"
            style={{
              opacity: animationPhase >= 1 ? 1 : 0,
              transform: animationPhase >= 1 ? 'scale(1)' : 'scale(0.9)'
            }}
          >
            <div className="w-72 h-48 bg-gradient-to-br from-blue-200 via-blue-400 to-blue-600 rounded-xl shadow-xl relative">
              <div className="absolute inset-6 bg-gradient-to-br from-blue-100 via-blue-300 to-blue-500 rounded-lg"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-lg bg-black/40 px-4 py-2 rounded">
                  青空の写真
                </div>
              </div>
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-xl"></div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'pricing',
      content: (
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-3xl font-light text-white text-center mb-16">
            今だけ特別価格
          </h1>

          <div 
            className="text-center transition-all duration-1000"
            style={{
              opacity: animationPhase >= 1 ? 1 : 0,
              transform: animationPhase >= 1 ? 'scale(1)' : 'scale(0.9)'
            }}
          >
            <div className="relative inline-block mb-8">
              <div className="text-8xl font-light text-white mb-2">¥50</div>
              <div className="text-2xl text-gray-400 line-through">¥100</div>
              <div className="absolute -top-6 -right-10 bg-red-500 text-white text-lg px-4 py-2 rounded-full font-medium">
                半額
              </div>
            </div>
            <p className="text-white/70 text-xl">最初の1枚</p>
          </div>
        </div>
      )
    }
  ];

  // スワイプの最小距離（ピクセル）
  const minSwipeDistance = 50;

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  // タッチイベントハンドラー
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // 左スワイプ = 次へ
      handleNext();
    } else if (isRightSwipe) {
      // 右スワイプ = 前へ
      handlePrev();
    }
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col relative overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      
      {/* Skip */}
      <div className="absolute top-12 right-6 z-50">
        <button
          onClick={onSkip}
          className="text-white/50 hover:text-white/70 transition-colors text-sm"
        >
          スキップ
        </button>
      </div>

      {/* Progress */}
      <div className="absolute top-16 left-0 right-0 flex justify-center gap-2 z-40">
        {slides.map((_, index) => (
          <div
            key={index}
            className="relative h-1 w-8 bg-white/20 rounded-full overflow-hidden"
          >
            <div
              className={`h-full bg-white rounded-full transition-all duration-100 ${
                index === currentSlide ? '' : index < currentSlide ? 'w-full' : 'w-0'
              }`}
              style={{
                width: index === currentSlide ? `${progress}%` : index < currentSlide ? '100%' : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md h-full">
          {slides[currentSlide].content}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-sm">
        <div className="p-6 flex items-center gap-4">
          {/* Pause/Play Button */}
          <button
            onClick={handlePause}
            className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            {isPaused ? (
              <div className="text-white text-lg">▶</div>
            ) : (
              <div className="text-white text-lg">⏸</div>
            )}
          </button>

          {/* Manual Next Button */}
          <button
            onClick={handleNext}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium py-4 rounded-xl text-lg shadow-lg"
          >
            {currentSlide === slides.length - 1 ? '始める' : '次へ'}
          </button>
        </div>

        {/* Back button for manual navigation */}
        {currentSlide > 0 && (
          <div className="px-6 pb-4">
            <button
              onClick={handlePrev}
              className="w-full text-white/50 hover:text-white/70 transition-colors text-sm py-2"
            >
              戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
};