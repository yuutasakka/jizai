import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import { JZButton } from '../design-system/jizai-button';
import { ArrowLeft, User, HardDrive, Cloud, Trash2, Download, Upload, Zap, Crown, Star } from 'lucide-react';

interface StorageDetails {
  quota: number;
  used: number;
  available: number;
  percentage: number;
  breakdown?: {
    byVault?: Record<string, any>;
    byType?: Record<string, number>;
  };
}

export const StorageScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const { user } = useAuth();
  const [data, setData] = useState<StorageDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tier, setTier] = useState<string>('Free');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const details = await api.getStorageDetails();
        if (!cancelled) setData(details);
        // Fetch subscription tier (optional)
        try {
          const status = await api.getSubscriptionStatus();
          const t = (status?.subscription?.tier as any) || 'free';
          if (!cancelled) setTier((t || 'free').toString());
        } catch {}
      } catch (e: any) {
        if (!cancelled) {
          // デフォルトデータを設定
          setData({
            quota: 1024 * 1024 * 1024, // 1GB
            used: 0,
            available: 1024 * 1024 * 1024,
            percentage: 0
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    const onUpdate = async () => {
      try {
        const details = await api.getStorageDetails();
        if (!cancelled) setData(details);
      } catch {}
    };
    window.addEventListener('jizai:memories:updated', onUpdate);
    return () => { cancelled = true; window.removeEventListener('jizai:memories:updated', onUpdate); };
  }, []);

  const formatStorage = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    const mb = bytes / (1024 * 1024);

    if (gb >= 1) {
      return `${gb.toFixed(1)} GB`;
    } else if (mb >= 1) {
      return `${mb.toFixed(0)} MB`;
    }
    return `${bytes} バイト`;
  };

  const percent = Math.min(100, Math.max(0, data?.percentage ?? 0));

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Dynamic Multi-Layer Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/40 via-blue-400/40 to-purple-400/40 animate-pulse" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.4),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.3),transparent_50%)]" />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Status Bar removed on storage screen */}

      {/* Header */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center gap-4">
        <button
          onClick={() => onNavigate('profile')}
          className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 border border-white/20"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white drop-shadow-2xl">ストレージ管理</h1>
          <p className="text-white/80 text-sm mt-1">データとファイルを効率的に管理</p>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 pt-12 px-5 pb-32 space-y-8">
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 animate-pulse">
                <div className="h-6 w-1/3 bg-white/20 rounded-lg mb-4" />
                <div className="h-4 w-full bg-white/10 rounded-lg mb-2" />
                <div className="h-4 w-4/5 bg-white/10 rounded-lg" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-500/20 backdrop-blur-xl rounded-3xl p-6 border border-red-300/30 text-center">
            <div className="text-red-100 text-lg font-medium">{error}</div>
          </div>
        ) : (
          <>
            {/* Storage Overview Card */}
            <div className="group relative overflow-hidden">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
              <div className="relative bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-white/60 hover:shadow-[0_35px_60px_-12px_rgba(0,0,0,0.25)] transition-all duration-500 hover:scale-[1.02] hover:bg-white/98">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-lg opacity-60" />
                      <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 hover:rotate-12">
                        <HardDrive className="w-10 h-10 text-white drop-shadow-lg" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">ストレージ使用量</h2>
                      <p className="text-gray-600 text-base">
                        {formatStorage(data?.quota || 0)}中 <span className="font-bold text-blue-600">{formatStorage(data?.used || 0)}</span> を使用
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{percent}%</div>
                      <div className="text-gray-500 text-sm font-semibold">使用率</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-700 font-semibold">
                      <span>使用容量</span>
                      <span>{formatStorage(data?.available || 0)} 残り</span>
                    </div>
                    <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000 ease-out shadow-lg relative"
                        style={{ width: `${percent}%` }}
                      >
                        <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse" />
                      </div>
                    </div>
                  </div>

                  {/* Storage Breakdown */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <Cloud className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-xs text-gray-500">クラウド</div>
                      <div className="text-sm font-bold text-gray-900">{formatStorage(data?.used || 0)}</div>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <Download className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-xs text-gray-500">ダウンロード</div>
                      <div className="text-sm font-bold text-gray-900">0 MB</div>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <Upload className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-xs text-gray-500">アップロード</div>
                      <div className="text-sm font-bold text-gray-900">{formatStorage(data?.used || 0)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Plan Card */}
            <div className="group relative overflow-hidden">
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
              <div className="relative bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-white/60 hover:shadow-[0_35px_60px_-12px_rgba(0,0,0,0.25)] transition-all duration-500 hover:scale-[1.02] hover:bg-white/98">
                <div className="flex items-center gap-3 sm:gap-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl blur-lg opacity-60" />
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 hover:rotate-12">
                      {tier === 'Pro' ? <Crown className="w-7 h-7 sm:w-10 sm:h-10 text-white drop-shadow-lg" /> :
                       tier === 'Premium' ? <Star className="w-7 h-7 sm:w-10 sm:h-10 text-white drop-shadow-lg" /> :
                       <Zap className="w-7 h-7 sm:w-10 sm:h-10 text-white drop-shadow-lg" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">現在のプラン</h3>
                    <div className="text-gray-600 text-sm sm:text-base mb-1 break-all">{(user?.email || user?.name || user?.id || 'guest').toString()}</div>
                    <div className="inline-flex items-center px-2 sm:px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
                      <span className="text-purple-700 font-bold text-xs sm:text-sm">{tier} プラン</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg sm:text-2xl font-bold text-gray-900 break-all">{formatStorage(data?.quota || 0)}</div>
                    <div className="text-gray-500 text-xs sm:text-sm">容量上限</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => onNavigate('pricing')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 border-2 border-white/30 min-h-[44px]"
              >
                <div className="flex items-center justify-center">
                  <span className="text-sm sm:text-base">アップグレード</span>
                </div>
              </button>
              <button
                onClick={() => onNavigate('user-gallery')}
                className="bg-white/20 backdrop-blur-xl hover:bg-white/30 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 border-2 border-white/30 min-h-[44px]"
              >
                <div className="flex items-center justify-center">
                  <span className="text-sm sm:text-base">ファイル管理</span>
                </div>
              </button>
            </div>

            {/* Storage Tips */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/20">
              <h3 className="text-white text-base sm:text-lg font-bold mb-3 sm:mb-4">
                ストレージのコツ
              </h3>
              <div className="space-y-2 sm:space-y-3 text-white/90 text-xs sm:text-sm">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mt-1 sm:mt-2 flex-shrink-0" />
                  <span>不要なファイルを定期的に削除してスペースを確保</span>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-1 sm:mt-2 flex-shrink-0" />
                  <span>プレミアムプランで無制限容量を利用</span>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-1 sm:mt-2 flex-shrink-0" />
                  <span>自動バックアップで大切なデータを保護</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
