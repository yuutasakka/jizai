import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Star, Zap, Crown, Sparkles, AlertTriangle, Calendar, CreditCard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';

interface PricingPlan {
  id: string;
  name: string;
  credits: number;
  price: number;
  unitPrice: number;
  popular?: boolean;
  premium?: boolean;
  icon: React.ReactNode;
  gradient: string;
  features: string[];
}

interface UserSubscription {
  planId: string;
  planName: string;
  credits: number;
  expiresAt: string;
  nextBillingDate?: string;
  status: 'active' | 'expired' | 'cancelled';
}

const plans: PricingPlan[] = [
  {
    id: 'trial',
    name: 'お試し',
    credits: 2,
    price: 120,
    unitPrice: 60,
    icon: <Sparkles className="w-6 h-6" />,
    gradient: 'from-blue-400 to-blue-600',
    features: ['通常画質の画像生成', '2回分のクレジット']
  },
  {
    id: 'basic',
    name: 'ベーシック',
    credits: 10,
    price: 600,
    unitPrice: 60,
    icon: <Zap className="w-6 h-6" />,
    gradient: 'from-green-400 to-green-600',
    features: ['高画質ダウンロード対応', '10回分のクレジット', '画像生成（高品質）']
  },
  {
    id: 'standard',
    name: 'スタンダード',
    credits: 20,
    price: 1200,
    unitPrice: 60,
    icon: <Star className="w-6 h-6" />,
    gradient: 'from-purple-400 to-purple-600',
    features: ['高画質ダウンロード対応', '20回分のクレジット', '画像生成（高品質）']
  },
  {
    id: 'popular',
    name: 'セミプロ',
    credits: 50,
    price: 2750,
    unitPrice: 55,
    popular: true,
    icon: <Crown className="w-6 h-6" />,
    gradient: 'from-orange-400 to-red-500',
    features: ['最高画質ダウンロード対応', '高画質ダウンロード対応', '50回分のクレジット', '画像生成（高品質）']
  },
  {
    id: 'pro',
    name: 'プロ',
    credits: 100,
    price: 5000,
    unitPrice: 50,
    premium: true,
    icon: <Star className="w-6 h-6" />,
    gradient: 'from-pink-400 via-purple-500 to-indigo-500',
    features: ['最高画質ダウンロード対応', '高画質ダウンロード対応', '100回分のクレジット', '画像生成（高品質）']
  }
];

export const PricingScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>('popular');
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [pendingPlanChange, setPendingPlanChange] = useState<string | null>(null);
  // Add-on: 初月無料のデータ保管プラン（デフォルトON）
  const [includeStorageAddon, setIncludeStorageAddon] = useState<boolean>(true);

  // 現在の契約情報を取得
  useEffect(() => {
    let cancelled = false;
    const fetchSubscription = async () => {
      try {
        const subscription = await api.getSubscriptionStatus();
        if (!cancelled && subscription?.subscription) {
          const sub = subscription.subscription;
          setCurrentSubscription({
            planId: sub.plan_id || 'trial',
            planName: sub.plan_name || 'お試し',
            credits: sub.remaining_credits || 0,
            expiresAt: sub.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            nextBillingDate: sub.next_billing_date,
            status: sub.status || 'active'
          });
          setSelectedPlan(sub.plan_id || 'trial');
        } else {
          // デフォルト: トライアルプラン
          setCurrentSubscription({
            planId: 'trial',
            planName: 'お試し',
            credits: 2,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          });
          setSelectedPlan('trial');
        }
      } catch {
        if (!cancelled) {
          // エラー時もデフォルト設定
          setCurrentSubscription({
            planId: 'trial',
            planName: 'お試し',
            credits: 2,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          });
          setSelectedPlan('trial');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSubscription();
    return () => { cancelled = true; };
  }, []);

  // プラン変更の種類を判定
  const getPlanChangeType = (newPlanId: string): 'upgrade' | 'downgrade' | 'same' => {
    if (!currentSubscription) return 'upgrade';
    const currentPlan = plans.find(p => p.id === currentSubscription.planId);
    const newPlan = plans.find(p => p.id === newPlanId);

    if (!currentPlan || !newPlan) return 'upgrade';
    if (currentPlan.price === newPlan.price) return 'same';
    return newPlan.price > currentPlan.price ? 'upgrade' : 'downgrade';
  };

  // ダウングレード確認モーダル
  const DowngradeModal = () => {
    if (!showDowngradeModal || !pendingPlanChange) return null;

    const newPlan = plans.find(p => p.id === pendingPlanChange);
    const currentPlan = plans.find(p => p.id === currentSubscription?.planId);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">プランのダウングレード</h3>
              <p className="text-sm text-gray-500">本当にダウングレードしますか？</p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-sm text-orange-800">
              <div className="font-semibold mb-2">ダウングレード時の注意事項：</div>
              <ul className="space-y-1 text-xs">
                <li>• 現在のクレジット残高は引き継がれます</li>
                <li>• 一部の高品質機能が制限される場合があります</li>
                <li>• 次回請求日から新料金が適用されます</li>
                <li>• いつでも再度アップグレード可能です</li>
              </ul>
            </div>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-700">
              <div className="flex justify-between mb-1">
                <span>現在のプラン:</span>
                <span className="font-semibold">{currentPlan?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>新しいプラン:</span>
                <span className="font-semibold text-orange-600">{newPlan?.name}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowDowngradeModal(false);
                setPendingPlanChange(null);
              }}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={() => {
                handlePurchase(pendingPlanChange!);
                setShowDowngradeModal(false);
                setPendingPlanChange(null);
              }}
              className="flex-1 py-3 px-4 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
            >
              ダウングレード
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handlePlanSelection = (planId: string) => {
    if (!currentSubscription) return;

    const changeType = getPlanChangeType(planId);

    if (changeType === 'same') {
      // 同じプランの場合は何もしない
      return;
    } else if (changeType === 'downgrade') {
      // ダウングレードの場合は確認モーダルを表示
      setPendingPlanChange(planId);
      setShowDowngradeModal(true);
    } else {
      // アップグレードの場合は直接処理
      handlePurchase(planId);
    }
  };

  const handlePurchase = async (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    const changeType = getPlanChangeType(planId);

    try {
      sessionStorage.setItem('include-storage-addon', includeStorageAddon ? '1' : '0');
    } catch {}

    const addonMsg = includeStorageAddon ? '\n追加: 初月無料のデータ保管プラン（¥99/月・1GB）' : '';
    const actionText = changeType === 'upgrade' ? 'アップグレード' : changeType === 'downgrade' ? 'ダウングレード' : '変更';

    try {
      // ここで実際のAPI呼び出しを行う
      // const result = await api.changePlan(planId, { includeStorage: includeStorageAddon });

      alert(`${plan?.name}プランへの${actionText}処理を開始します${addonMsg}\n\n処理が完了しました。`);

      // 契約情報を更新
      if (currentSubscription) {
        setCurrentSubscription({
          ...currentSubscription,
          planId,
          planName: plan?.name || planId,
          credits: plan?.credits || 0
        });
      }

      setSelectedPlan(planId);

    } catch (error) {
      alert('プラン変更に失敗しました。しばらくしてからお試しください。');
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(120,119,198,0.3),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.3),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgba(155,135,245,0.2),transparent_50%)]" />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
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

      {/* Status Bar removed on pricing screen */}

      {/* Header */}
      <div className="relative z-10 pt-8 px-5 flex items-center gap-4">
        <button
          onClick={() => onNavigate('profile')}
          className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 border border-white/20"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white drop-shadow-2xl">プランを選択</h1>
          <p className="text-white/80 text-sm mt-1">最適なプランで創造力を解放しよう</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-5 pt-8 pb-32">
        {/* 現在の契約情報 */}
        {currentSubscription && (
          <div className="mb-6 bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold">現在の契約状況</h3>
                <p className="text-white/70 text-sm">アクティブなプラン情報</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-sm opacity-80 mb-1">現在のプラン</div>
                <div className="text-xl font-bold">{currentSubscription.planName}</div>
                <div className="text-sm opacity-70 mt-1">
                  残りクレジット: {currentSubscription.credits}回
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm opacity-80 mb-1">
                  <Calendar className="w-4 h-4" />
                  {currentSubscription.nextBillingDate ? '次回請求日' : '有効期限'}
                </div>
                <div className="text-lg font-bold">
                  {new Date(
                    currentSubscription.nextBillingDate || currentSubscription.expiresAt
                  ).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric'
                  })}
                </div>
                <div className="text-sm opacity-70 mt-1">
                  ステータス: {currentSubscription.status === 'active' ? 'アクティブ' : '期限切れ'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* プラン変更の確認 */}
        {(() => {
          const sel = plans.find(p => p.id === selectedPlan);
          if (!sel || !currentSubscription) return null;

          const changeType = getPlanChangeType(selectedPlan);
          const initialTotal = sel.price;

          if (changeType === 'same') return null;

          return (
            <div className="mb-6 bg-white/10 backdrop-blur-xl rounded-3xl p-4 border border-white/20 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm opacity-80">
                    {changeType === 'upgrade' ? 'アップグレード先' : 'ダウングレード先'}
                  </div>
                  <div className="text-lg font-bold">{sel.name} · ¥{sel.price.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-80">変更後料金</div>
                  <div className="text-lg font-bold">¥{initialTotal.toLocaleString()}</div>
                </div>
              </div>
              <div className="mt-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>データ保管プラン（初月無料）</span>
                  <span className="font-semibold">{includeStorageAddon ? '追加（¥0）' : '未追加'}</span>
                </div>
                {includeStorageAddon && (
                  <div className="mt-1 text-xs opacity-80">
                    翌月以降: ¥99/月（1GB・高画質約150枚/通常約450枚）
                  </div>
                )}
              </div>
            </div>
          );
        })()}
        <div className="space-y-4">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative group transition-all duration-500 ${
                selectedPlan === plan.id ? 'scale-105' : 'hover:scale-102'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Current Plan Badge */}
              {currentSubscription?.planId === plan.id ? (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                  <div className="bg-gradient-to-r from-emerald-400 to-green-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg border-2 border-white">
                    ✓ 現在のプラン
                  </div>
                </div>
              ) : plan.popular ? (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                  <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg border-2 border-white">
                    ⭐ 人気No.1
                  </div>
                </div>
              ) : null}

              {/* Premium Badge */}
              {plan.premium && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                  <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg border-2 border-white">
                    👑 プレミアム
                  </div>
                </div>
              )}

              {/* Card */}
              <div
                className={`relative overflow-hidden rounded-3xl p-6 border-2 transition-all duration-500 ${
                  selectedPlan === plan.id
                    ? 'border-white bg-white/95 shadow-2xl shadow-purple-500/25'
                    : 'border-white/30 bg-white/10 backdrop-blur-xl hover:bg-white/20'
                } group-hover:shadow-2xl`}
                onClick={() => {
                  if (currentSubscription?.planId !== plan.id) {
                    setSelectedPlan(plan.id);
                  }
                }}
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-r ${plan.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />

                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    {/* Plan Info */}
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${plan.gradient} flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                        {plan.icon}
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${selectedPlan === plan.id ? 'text-gray-900' : 'text-white'} mb-1`}>
                          {plan.name}
                        </h3>
                        <p className={`${selectedPlan === plan.id ? 'text-gray-600' : 'text-white/80'} text-sm`}>
                          {plan.credits}回分のクレジット
                        </p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <div className={`text-xl font-bold ${selectedPlan === plan.id ? 'text-gray-900' : 'text-white'} mb-1`}>
                        ¥{plan.price.toLocaleString()}
                      </div>
                      <div className={`text-sm ${selectedPlan === plan.id ? 'text-gray-500' : 'text-white/60'}`}>
                        単価 ¥{plan.unitPrice}/回
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${plan.gradient} flex items-center justify-center shadow-md`}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className={`text-sm ${selectedPlan === plan.id ? 'text-gray-700' : 'text-white/90'}`}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Add-on: 初月無料のデータ保管プラン（全プランで初期ON） */}
                  <div className={`mb-6 rounded-2xl border ${selectedPlan === plan.id ? 'border-gray-300 bg-white' : 'border-white/30 bg-white/10'} p-4 transition-all`}>
                    <label className="flex items-start gap-3 cursor-pointer select-none" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="mt-1 w-5 h-5 accent-emerald-600"
                        checked={includeStorageAddon}
                        onChange={(e) => setIncludeStorageAddon(e.target.checked)}
                      />
                      <div>
                        <div className={`text-sm font-bold ${selectedPlan === plan.id ? 'text-gray-900' : 'text-white'}`}>
                          初月無料のデータ保管プラン（オプション）
                        </div>
                        <div className={`${selectedPlan === plan.id ? 'text-gray-700' : 'text-white/80'} text-xs mt-1`}>
                          月額¥99で1GBまで保存可能。高画質写真約150枚・通常写真約450枚目安。
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Purchase Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlanSelection(plan.id);
                    }}
                    disabled={currentSubscription?.planId === plan.id}
                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg ${
                      currentSubscription?.planId === plan.id
                        ? 'bg-gray-400 text-white border-2 border-transparent'
                        : selectedPlan === plan.id
                        ? `bg-gradient-to-r ${plan.gradient} text-white border-2 border-transparent`
                        : 'bg-white/20 backdrop-blur text-white border-2 border-white/30 hover:bg-white/30'
                    }`}
                  >
                    {currentSubscription?.planId === plan.id
                      ? '現在のプラン'
                      : selectedPlan === plan.id
                      ? (
                          getPlanChangeType(plan.id) === 'upgrade'
                            ? 'アップグレード'
                            : getPlanChangeType(plan.id) === 'downgrade'
                            ? 'ダウングレード'
                            : 'このプランを選択'
                        )
                      : 'このプランを選択'
                    }
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
            <h3 className="text-white text-lg font-bold mb-2">🎯 最適なプランがわからない？</h3>
            <p className="text-white/80 text-sm mb-4">
              お試しプランから始めて、必要に応じてアップグレードできます
            </p>
            <button
              onClick={() => handlePlanSelection('trial')}
              disabled={currentSubscription?.planId === 'trial'}
              className="bg-gradient-to-r from-blue-400 to-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {currentSubscription?.planId === 'trial' ? '現在お試しプラン中' : 'お試しプランで始める'}
            </button>
          </div>
        </div>
      </div>

      {/* Downgrade Confirmation Modal */}
      <DowngradeModal />

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
