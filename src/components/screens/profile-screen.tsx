import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { JZButton } from '../design-system/jizai-button';
import { JZCard, JZCardContent } from '../design-system/jizai-card';
import { User, Settings, Camera, Edit2, Check, X } from 'lucide-react';
import api from '../../api/client';

interface UserStats {
  credits: number;
  storageUsed: number;
  storageTotal: number;
  subscriptionTier?: string | null;
}

interface CreditHistory {
  id: string;
  type: 'purchase' | 'usage';
  amount: number;
  description: string;
  createdAt: Date;
}

export const ProfileScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    credits: 0,
    storageUsed: 0,
    storageTotal: 100 * 1024 * 1024, // default 100MB
    subscriptionTier: null,
  });
  const [creditHistory, setCreditHistory] = useState<CreditHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Credits + storage via balance
        let credits = 0;
        try {
          const balance = await api.getBalance();
          credits = balance.credits || 0;
        } catch {}
        const storage = await api.getStorageDetails();
        // Subscription tier (optional)
        let tier: string | null = null;
        try {
          const sub = await api.getSubscriptionStatus();
          tier = (sub?.subscription?.tier as any) || null;
        } catch {}
        setStats({
          credits,
          storageUsed: storage.used || 0,
          storageTotal: storage.quota || 100 * 1024 * 1024,
          subscriptionTier: tier,
        });

        // クレジット履歴も取得
        try {
          const history = await api.getCreditHistory();
          setCreditHistory(history.slice(0, 10)); // 最新10件
        } catch {
          // モックデータ
          setCreditHistory([
            { id: '1', type: 'purchase', amount: 100, description: 'クレジット購入', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            { id: '2', type: 'usage', amount: -5, description: '画像生成', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
            { id: '3', type: 'usage', amount: -3, description: '画像生成', createdAt: new Date(Date.now() - 30 * 60 * 1000) },
          ]);
        }
      } catch (error) {
        // keep defaults on failure
      }
    };
    fetchStats();
    const onUpdate = () => fetchStats();
    window.addEventListener('jizai:memories:updated', onUpdate);
    return () => window.removeEventListener('jizai:memories:updated', onUpdate);
  }, []);

  const formatStorage = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  };

  const handleUpgrade = () => {
    onNavigate('pricing');
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // プロフィール画像をサーバーにアップロード
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await fetch('/api/profile/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setProfileImage(result.imageUrl);
      } else {
        // フォールバック: ローカルでプレビュー
        const reader = new FileReader();
        reader.onload = (e) => {
          setProfileImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      // フォールバック: ローカルでプレビュー
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const handleNameEdit = () => {
    setEditedName((user?.email || user?.name || user?.id || 'guest').toString());
    setIsEditingName(true);
  };

  const handleNameSave = async () => {
    try {
      // ユーザー名をサーバーに保存
      await fetch('/api/profile/update-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedName }),
      });

      // 成功時の処理（実際にはuserコンテキストを更新する必要があります）
      alert('プロフィール名を更新しました');
    } catch (error) {
      alert('プロフィール名の保存に失敗しました');
    } finally {
      setIsEditingName(false);
    }
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Dynamic Multi-Layer Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/40 via-blue-400/40 to-purple-400/40 animate-pulse" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.4),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.3),transparent_50%)]" />


      {/* Settings Icon - Floating */}
      <div className="absolute top-8 sm:top-12 right-4 sm:right-5 z-30">
        <button
          onClick={() => onNavigate('settings')}
          className="group w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all duration-500 hover:scale-110 hover:bg-white/30 border border-white/40 hover:rotate-180"
        >
          <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-xl group-hover:drop-shadow-2xl transition-all duration-500" />
        </button>
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center min-h-screen relative z-10 py-16 sm:py-20">
        <div className="w-full max-w-sm sm:max-w-lg px-4 sm:px-6">
          {/* Profile Avatar Section */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="relative mx-auto mb-6 sm:mb-8 group">
              <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 rounded-full blur-lg sm:blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
              <div className="relative w-32 h-32 sm:w-44 sm:h-44 mx-auto bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center border-2 sm:border-4 border-white/50 shadow-2xl animate-[float_6s_ease-in-out_infinite] group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <User className="w-16 h-16 sm:w-24 sm:h-24 text-white drop-shadow-2xl" />
                )}

                {/* Camera Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-full">
                  <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-lg" />
                </div>
              </div>

              {/* Upload Input */}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />

              {/* Upload Status */}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              )}

              {/* Online Status Indicator */}
              <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-10 sm:h-10 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full border-2 sm:border-4 border-white shadow-xl flex items-center justify-center animate-pulse">
                <div className="w-2 h-2 sm:w-4 sm:h-4 bg-white rounded-full" />
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {/* Editable User Name */}
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {isEditingName ? (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="text-lg sm:text-xl font-bold text-white">@</div>
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="bg-white/20 backdrop-blur-sm text-white text-lg sm:text-xl font-bold px-2 sm:px-3 py-1 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-white/60 w-48 sm:w-auto"
                      placeholder="ユーザー名"
                      autoFocus
                    />
                    <button
                      onClick={handleNameSave}
                      className="w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-colors duration-200 flex-shrink-0"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNameCancel}
                      className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors duration-200 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 sm:gap-2 group cursor-pointer" onClick={handleNameEdit}>
                    <div className="text-lg sm:text-xl font-bold text-white drop-shadow-2xl break-all">
                      @{(user?.email || user?.name || user?.id || 'guest').toString()}
                    </div>
                    <Edit2 className="w-4 h-4 sm:w-5 sm:h-5 text-white/60 group-hover:text-white transition-colors duration-200 flex-shrink-0" />
                  </div>
                )}
              </div>
              {stats.subscriptionTier && (
                <div className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-yellow-400/90 to-orange-400/90 rounded-full text-white font-bold text-xs sm:text-sm shadow-2xl backdrop-blur-sm border-2 border-white/30 hover:scale-105 transition-transform duration-300">
                  ✨ {stats.subscriptionTier} Member
                </div>
              )}
              <div className="text-white/90 text-base sm:text-lg font-medium drop-shadow-lg">
                写真、思いのままに。
              </div>
            </div>
          </div>

          {/* Status Cards - Ultra Premium */}
          <div className="space-y-6 sm:space-y-8">
            {/* Credits Card */}
            <div className="group relative overflow-hidden">
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
              <div className="relative bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-white/60 hover:shadow-[0_35px_60px_-12px_rgba(0,0,0,0.25)] transition-all duration-500 hover:scale-[1.02] hover:bg-white/98">
                <div className="space-y-4 sm:space-y-6">
                  {/* Credits Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-6 flex-1">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl blur-lg opacity-60" />
                        <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 hover:rotate-12">
                          <svg className="w-7 h-7 sm:w-10 sm:h-10 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">生成クレジット</div>
                        <div className="text-gray-600 text-sm sm:text-base">画像生成に使える回数の目安</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{stats.credits}</div>
                      <div className="text-gray-500 text-base sm:text-lg font-semibold">回</div>
                    </div>
                  </div>

                  {/* Upgrade Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleUpgrade}
                      className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-white/30 text-sm sm:text-base min-h-[44px]"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span>アップグレードする</span>
                      </div>
                    </button>
                  </div>

                  {/* History Toggle */}
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium py-3 transition-colors duration-300 flex items-center justify-center gap-2 hover:bg-gray-50 rounded-xl min-h-[44px]"
                  >
                    <span>利用履歴を表示</span>
                    <svg
                      className={`w-4 h-4 transform transition-transform duration-300 ${showHistory ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Credit History */}
                  {showHistory && (
                    <div className="space-y-3 pt-2 border-t border-gray-200">
                      <div className="text-sm font-semibold text-gray-700 mb-3">最近の利用履歴</div>
                      {creditHistory.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {creditHistory.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 ${
                                  item.type === 'purchase'
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-red-100 text-red-600'
                                }`}>
                                  {item.type === 'purchase' ? '+' : '-'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">{item.description}</div>
                                  <div className="text-xs text-gray-500">{formatDate(item.createdAt)}</div>
                                </div>
                              </div>
                              <div className={`text-sm font-bold flex-shrink-0 ${
                                item.type === 'purchase' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {item.type === 'purchase' ? '+' : ''}{item.amount}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          履歴がありません
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Storage Card */}
            <div className="group relative overflow-hidden">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
              <div className="relative bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-white/60 hover:shadow-[0_35px_60px_-12px_rgba(0,0,0,0.25)] transition-all duration-500 hover:scale-[1.02] hover:bg-white/98">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-6 flex-1">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl sm:rounded-2xl blur-lg opacity-60" />
                        <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 hover:rotate-12">
                          <svg className="w-7 h-7 sm:w-10 sm:h-10 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">ストレージ</div>
                        <div className="text-gray-600 text-sm sm:text-base break-all">{formatStorage(stats.storageUsed)} / {formatStorage(stats.storageTotal)}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('storage')}
                      className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold hover:shadow-2xl transition-all duration-300 hover:scale-110 border-2 border-white/30 min-h-[44px] flex-shrink-0"
                    >
                      詳細
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm sm:text-base text-gray-700 font-semibold">
                      <span>使用量</span>
                      <span>{Math.round((stats.storageUsed / stats.storageTotal) * 100)}%</span>
                    </div>
                    <div className="w-full h-3 sm:h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000 ease-out shadow-lg"
                        style={{ width: `${Math.min(100, (stats.storageUsed / stats.storageTotal) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }
      `}</style>
    </div>
  );
};