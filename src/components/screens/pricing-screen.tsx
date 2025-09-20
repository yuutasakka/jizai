import React, { useState } from 'react';
import { ArrowLeft, Check, Star, Zap, Crown, Sparkles } from 'lucide-react';

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

const plans: PricingPlan[] = [
  {
    id: 'trial',
    name: 'お試し',
    credits: 2,
    price: 120,
    unitPrice: 60,
    icon: <Sparkles className="w-6 h-6" />,
    gradient: 'from-blue-400 to-blue-600',
    features: ['基本的な画像生成', '2回分のクレジット', '24時間サポート']
  },
  {
    id: 'basic',
    name: 'ベーシック',
    credits: 10,
    price: 600,
    unitPrice: 60,
    icon: <Zap className="w-6 h-6" />,
    gradient: 'from-green-400 to-green-600',
    features: ['高品質画像生成', '10回分のクレジット', '優先サポート', 'HD画質対応']
  },
  {
    id: 'standard',
    name: 'スタンダード',
    credits: 20,
    price: 1200,
    unitPrice: 60,
    icon: <Star className="w-6 h-6" />,
    gradient: 'from-purple-400 to-purple-600',
    features: ['プレミアム画像生成', '20回分のクレジット', '24時間優先サポート', '4K画質対応', '高速処理']
  },
  {
    id: 'popular',
    name: '人気No.1',
    credits: 50,
    price: 2750,
    unitPrice: 55,
    popular: true,
    icon: <Crown className="w-6 h-6" />,
    gradient: 'from-orange-400 to-red-500',
    features: ['最高品質画像生成', '50回分のクレジット', '専属サポート', '8K画質対応', '超高速処理', 'プライオリティキュー']
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
    features: ['無制限品質画像生成', '100回分のクレジット', 'VIPサポート', '16K画質対応', '瞬間処理', 'API アクセス', '商用利用可能']
  }
];

export const PricingScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('popular');

  const handlePurchase = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    alert(`${plan?.name}プランの購入処理を開始します`);
    // 実際の購入処理をここに実装
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

      {/* Status Bar */}
      <div className="relative z-10 pt-3 px-5 flex items-start justify-between">
        <div className="text-[17px] font-semibold text-white/95 drop-shadow-lg">
          {new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="flex items-center gap-1 text-white/95">
          <div className="flex gap-1">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-1 h-4 bg-white/90 rounded-full animate-pulse"
                style={{animationDelay: `${i * 0.1}s`}}
              />
            ))}
          </div>
          <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.24 0 1 1 0 01-1.415-1.414 5 5 0 017.07 0 1 1 0 01-1.415 1.414zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          <div className="w-6 h-3 border border-white/70 rounded-sm relative ml-1">
            <div className="absolute right-0 top-0 w-1 h-2 bg-green-400 rounded-r-sm shadow-lg shadow-green-400/60" />
            <div className="absolute inset-0.5 bg-green-400 rounded-sm shadow-lg shadow-green-400/60" />
          </div>
        </div>
      </div>

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
        <div className="space-y-4">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative group transition-all duration-500 ${
                selectedPlan === plan.id ? 'scale-105' : 'hover:scale-102'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                  <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg border-2 border-white">
                    ⭐ 人気No.1
                  </div>
                </div>
              )}

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
                onClick={() => setSelectedPlan(plan.id)}
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

                  {/* Purchase Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePurchase(plan.id);
                    }}
                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                      selectedPlan === plan.id
                        ? `bg-gradient-to-r ${plan.gradient} text-white border-2 border-transparent`
                        : 'bg-white/20 backdrop-blur text-white border-2 border-white/30 hover:bg-white/30'
                    }`}
                  >
                    {selectedPlan === plan.id ? '選択中のプラン' : 'このプランを選択'}
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
              onClick={() => handlePurchase('trial')}
              className="bg-gradient-to-r from-blue-400 to-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              お試しプランで始める
            </button>
          </div>
        </div>
      </div>

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