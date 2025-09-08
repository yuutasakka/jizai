import { useEffect, useState } from 'react';
import { track } from '../../lib/analytics';

interface JizaiSplashScreenProps {
  onComplete: () => void;
}

export const JizaiSplashScreen: React.FC<JizaiSplashScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const [imageElements, setImageElements] = useState<Array<{id: number, x: number, y: number, scale: number, rotation: number, color: string}>>([]);
  const [transformationProgress, setTransformationProgress] = useState(0);

  useEffect(() => {
    track('splash_screen_shown');

    // 散らばった画像要素を生成
    const elements = Array.from({length: 8}, (_, i) => ({
      id: i,
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
      scale: 0.3 + Math.random() * 0.4,
      rotation: Math.random() * 360,
      color: ['#60a5fa', '#a78bfa', '#f472b6', '#fbbf24', '#34d399', '#f87171', '#fb7185', '#a855f7'][i]
    }));
    setImageElements(elements);

    // 変形プログレスタイマー
    const progressTimer = setInterval(() => {
      setTransformationProgress(prev => Math.min(prev + 2, 200));
    }, 30);

    // フェーズ進行タイマー
    const phaseTimers = [
      setTimeout(() => setPhase(1), 200),   // 散らばった要素登場
      setTimeout(() => setPhase(2), 600),   // 要素が集まり始める
      setTimeout(() => setPhase(3), 1200),  // 変形・統合
      setTimeout(() => setPhase(4), 1800),  // 完璧な統一体へ
      setTimeout(() => setPhase(5), 2400),  // 最終的な美しさ
      setTimeout(() => {
        track('splash_screen_completed');
        onComplete();
      }, 3000)
    ];

    return () => {
      clearInterval(progressTimer);
      phaseTimers.forEach(timer => clearTimeout(timer));
    };
  }, [onComplete]);

  const pulseIntensity = Math.sin(transformationProgress * 0.1) * 0.5 + 0.5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* 変化する背景パーティクル */}
      <div className="absolute inset-0">
        {phase >= 1 && (
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full opacity-40"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* メイン変形シーケンス */}
      <div className="relative z-10 flex items-center justify-center">
        
        {/* 散らばった画像要素たち */}
        {phase >= 1 && (
          <div className="relative w-96 h-96">
            {imageElements.map((element, index) => (
              <div
                key={element.id}
                className="absolute transition-all duration-1000 ease-out"
                style={{
                  left: phase >= 2 ? '50%' : `${element.x}%`,
                  top: phase >= 2 ? '50%' : `${element.y}%`,
                  transform: `
                    translate(-50%, -50%) 
                    scale(${phase >= 2 ? 1 + pulseIntensity * 0.1 : element.scale})
                    rotate(${phase >= 2 ? 0 : element.rotation}deg)
                  `,
                  transitionDelay: `${index * 100}ms`
                }}
              >
                {/* 画像フレーム表現 */}
                <div 
                  className="w-16 h-16 border-2 border-white rounded-lg shadow-lg backdrop-blur-sm"
                  style={{
                    backgroundColor: `${element.color}20`,
                    borderColor: element.color,
                    boxShadow: `0 0 20px ${element.color}40`
                  }}
                >
                  {/* 画像内容の抽象表現 */}
                  <div className="w-full h-full p-2">
                    <div 
                      className="w-full h-2 rounded-full mb-1"
                      style={{ backgroundColor: element.color, opacity: 0.6 }}
                    />
                    <div 
                      className="w-3/4 h-2 rounded-full mb-1"
                      style={{ backgroundColor: element.color, opacity: 0.4 }}
                    />
                    <div 
                      className="w-full h-6 rounded"
                      style={{ backgroundColor: element.color, opacity: 0.3 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 統合された美しい結果 */}
        {phase >= 3 && (
          <div 
            className="absolute w-32 h-32 transition-all duration-1000"
            style={{
              transform: `scale(${phase >= 4 ? 1.2 + pulseIntensity * 0.1 : 0.8})`,
              opacity: phase >= 4 ? 1 : 0.3
            }}
          >
            {/* 完璧に統合された画像 */}
            <div 
              className="w-full h-full border-4 border-white rounded-xl shadow-2xl backdrop-blur-sm relative overflow-hidden"
              style={{
                background: `conic-gradient(from ${transformationProgress * 2}deg, 
                  #60a5fa, #a78bfa, #f472b6, #fbbf24, #34d399, #f87171, #60a5fa)`,
                boxShadow: `0 0 40px rgba(96, 165, 250, ${0.6 + pulseIntensity * 0.4})`
              }}
            >
              {/* 内側の光る効果 */}
              <div className="absolute inset-2 bg-white bg-opacity-95 rounded-lg flex items-center justify-center">
                <svg 
                  className="w-16 h-16 text-slate-700" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{
                    filter: `drop-shadow(0 0 10px rgba(96, 165, 250, 0.5))`
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>

              {/* 変形の軌跡 */}
              <div className="absolute inset-0">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-300 rounded-full opacity-70"
                    style={{
                      top: `${50 + 30 * Math.sin((transformationProgress + i * 60) * Math.PI / 180)}%`,
                      left: `${50 + 30 * Math.cos((transformationProgress + i * 60) * Math.PI / 180)}%`,
                      transform: 'translate(-50%, -50%)',
                      boxShadow: '0 0 8px rgba(253, 224, 71, 0.8)'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 創造の波紋効果 */}
        {phase >= 4 && (
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute border border-blue-300 rounded-full opacity-20"
                style={{
                  width: `${200 + i * 100}px`,
                  height: `${200 + i * 100}px`,
                  animation: `expand ${3 + i}s ease-out infinite`,
                  animationDelay: `${i * 0.5}s`
                }}
              />
            ))}
          </div>
        )}

        {/* 最終的な輝き */}
        {phase >= 5 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="w-96 h-96 rounded-full opacity-20"
              style={{
                background: `radial-gradient(circle, 
                  rgba(96, 165, 250, ${0.3 + pulseIntensity * 0.2}) 0%, 
                  transparent 70%)`,
                animation: 'pulse 2s ease-in-out infinite'
              }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        @keyframes expand {
          0% { transform: scale(0); opacity: 0.4; }
          50% { opacity: 0.2; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};