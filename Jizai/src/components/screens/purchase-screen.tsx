import React, { useState, useEffect } from 'react';
import { JZButton } from '../design-system/jizai-button';
import { JZCard, JZCardHeader, JZCardContent } from '../design-system/jizai-card';
import { JZChevronRightIcon, JZCheckIcon, JZBoltIcon } from '../design-system/jizai-icons';
import { cn } from '../ui/utils';
import { apiClient, PRODUCTS } from '../../api/client';

export const PurchaseScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const [selectedPlan, setSelectedPlan] = useState('50');
  const [currentCredits, setCurrentCredits] = useState(0);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 現在のクレジット残高を取得
  useEffect(() => {
    const loadBalance = async () => {
      try {
        const balance = await apiClient.getBalance();
        setCurrentCredits(balance.credits);
      } catch (error) {
        console.error('Failed to load balance:', error);
      }
    };
    
    loadBalance();
  }, []);

  const plans = [
    {
      id: '2',
      credits: 2,
      price: '¥120',
      originalPrice: null,
      isRecommended: false,
      pricePerCredit: '¥60'
    },
    {
      id: '10',
      credits: 10,
      price: '¥600',
      originalPrice: null,
      isRecommended: false,
      pricePerCredit: '¥60'
    },
    {
      id: '20',
      credits: 20,
      price: '¥1,200',
      originalPrice: null,
      isRecommended: false,
      pricePerCredit: '¥60'
    },
    {
      id: '50',
      credits: 50,
      price: '¥2,750',
      originalPrice: '¥3,000',
      isRecommended: true,
      savings: '¥250お得',
      badge: '人気 No.1',
      pricePerCredit: '¥55'
    },
    {
      id: '100',
      credits: 100,
      price: '¥5,000',
      originalPrice: '¥6,000',
      isRecommended: false,
      savings: '¥1,000お得',
      pricePerCredit: '¥50'
    }
  ];

  const benefits = [
    {
      icon: <JZCheckIcon size={16} className="text-[color:var(--color-jz-success)]" />,
      text: "生成時に消費"
    },
    {
      icon: <JZCheckIcon size={16} className="text-[color:var(--color-jz-success)]" />,
      text: "やり直し2回無料"
    },
    {
      icon: <JZCheckIcon size={16} className="text-[color:var(--color-jz-success)]" />,
      text: "有効期限3ヶ月"
    }
  ];

  const handlePurchase = async () => {
    if (isPurchasing) return;
    
    setIsPurchasing(true);
    setError(null);
    
    try {
      // Web版では実際のStoreKit統合が必要ないため、
      // デモ用のトランザクションIDを生成
      const transactionId = `web-demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // バックエンドAPIに課金処理を送信
      const result = await apiClient.purchase(selectedPlan, transactionId);
      
      if (result.success) {
        alert(`${result.added}クレジットを追加しました！\n残高: ${result.credits}クレジット`);
        onNavigate('home');
      } else {
        throw new Error('Purchase failed');
      }
      
    } catch (error: any) {
      console.error('Purchase failed:', error);
      
      if (error.message.includes('DUPLICATE_TRANSACTION')) {
        setError('この取引は既に処理されています。');
      } else if (error.message.includes('INVALID_PRODUCT')) {
        setError('無効な製品IDです。');
      } else {
        setError('購入処理に失敗しました。もう一度お試しください。');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-jz-surface)]">
      {/* Header with Glass Effect */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="jz-glass-effect border-b border-[color:var(--color-jz-border)]">
          <div className="flex items-center pt-[44px] px-[var(--space-16)] pb-[var(--space-16)]">
            <JZButton
              tone="tertiary"
              size="md"
              onClick={() => onNavigate('home')}
              className="mr-[var(--space-12)]"
            >
              ←
            </JZButton>
            <h1 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)]">
              回数券を買う
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-[140px] pb-[var(--space-24)] px-[var(--space-16)] jz-grid-8pt jz-spacing-20">
        
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Current Balance */}
        <JZCard>
          <JZCardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="jz-font-display jz-text-body-large text-[color:var(--color-jz-text-primary)]">
                  現在の残高
                </h3>
                <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
                  利用可能なクレジット
                </p>
              </div>
              <div className="flex items-center gap-2">
                <JZBoltIcon size={20} className="text-[color:var(--color-jz-accent)]" />
                <span className="jz-font-display jz-text-display-small text-[color:var(--color-jz-accent)]">
                  {currentCredits}
                </span>
              </div>
            </div>
          </JZCardContent>
        </JZCard>
        {/* Benefits Section */}
        <JZCard>
          <JZCardHeader>
            <h2 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)]">
              JIZAIの特徴
            </h2>
          </JZCardHeader>
          <JZCardContent>
            <div className="space-y-[var(--space-16)]">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-[var(--space-12)]">
                  <div className="w-[32px] h-[32px] rounded-full bg-[color:var(--color-jz-success)]/20 flex items-center justify-center flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <span className="jz-text-body text-[color:var(--color-jz-text-primary)] flex-1">
                    {benefit.text}
                  </span>
                </div>
              ))}
            </div>
          </JZCardContent>
        </JZCard>

        {/* Pricing Plans */}
        <div className="space-y-[var(--space-12)]">
          <h2 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] text-center mb-[var(--space-20)]">
            どれにしますか？
          </h2>
          
          {plans.map((plan) => (
            <div key={plan.id} className="relative">
              {/* バッジ - JZSecondaryのピル */}
              {plan.badge && (
                <div className="absolute -top-[8px] right-[var(--space-16)] z-10">
                  <div className="bg-[color:var(--color-jz-secondary)] text-[color:var(--color-jz-surface)] px-[var(--space-12)] py-[var(--space-8)] rounded-[10px] jz-text-caption font-semibold">
                    {plan.badge}
                  </div>
                </div>
              )}
              
              <JZCard 
                variant={selectedPlan === plan.id ? 'selected' : 'default'}
                className="cursor-pointer transition-all duration-200"
                onClick={() => setSelectedPlan(plan.id)}
              >
                <JZCardContent className="p-[var(--space-16)] space-y-[var(--space-12)]">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {/* タイトル */}
                      <div className="mb-[var(--space-8)]">
                        <span className="jz-font-display text-[22px] font-semibold text-[color:var(--color-jz-text-primary)]">
                          {plan.credits}クレジット
                        </span>
                      </div>
                      
                      {/* 価格 */}
                      <div className="flex items-baseline gap-[var(--space-8)] mb-[var(--space-4)]">
                        <span className="jz-font-display text-[22px] font-semibold text-[color:var(--color-jz-text-primary)]">
                          {plan.price}
                        </span>
                        {plan.originalPrice && (
                          <span className="jz-text-caption text-[color:var(--color-jz-text-tertiary)] line-through">
                            {plan.originalPrice}
                          </span>
                        )}
                      </div>
                      
                      {/* 小ラベル */}
                      <div className="mb-[var(--space-12)]">
                        <span className="text-[14px] text-[color:var(--color-jz-text-secondary)]">
                          1枚={plan.pricePerCredit}
                        </span>
                      </div>
                      
                      {/* お得感 */}
                      {plan.savings && (
                        <div className="mb-[var(--space-12)]">
                          <span className="jz-text-caption text-[color:var(--color-jz-success)] font-medium">
                            {plan.savings}
                          </span>
                        </div>
                      )}
                      
                      {/* ベネフィット */}
                      <div className="space-y-[var(--space-8)]">
                        {benefits.map((benefit, index) => (
                          <div key={index} className="flex items-center gap-[var(--space-8)]">
                            <JZCheckIcon size={14} className="text-[color:var(--color-jz-success)] flex-shrink-0" />
                            <span className="text-[15px] text-[color:var(--color-jz-text-secondary)]">
                              {benefit.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center ml-[var(--space-16)]">
                      <div className={cn(
                        "w-[24px] h-[24px] rounded-full border-2 flex items-center justify-center",
                        selectedPlan === plan.id 
                          ? "border-[color:var(--color-jz-accent)] bg-[color:var(--color-jz-accent)]"
                          : "border-[color:var(--color-jz-border)]"
                      )}>
                        {selectedPlan === plan.id && (
                          <JZCheckIcon size={12} className="text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                </JZCardContent>
              </JZCard>
            </div>
          ))}
        </div>

        {/* Purchase Button */}
        <JZCard>
          <JZCardContent className="p-[var(--space-16)]">
            <JZButton
              tone="primary"
              size="lg"
              fullWidth
              onClick={handlePurchase}
              disabled={isPurchasing}
            >
              {isPurchasing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  購入中...
                </div>
              ) : (
                `${plans.find(p => p.id === selectedPlan)?.price} で買う`
              )}
            </JZButton>
            
            <p className="jz-text-caption text-[color:var(--color-jz-text-tertiary)] text-center mt-[var(--space-12)]">
              買ったらすぐに使えます
            </p>
          </JZCardContent>
        </JZCard>
      </div>
    </div>
  );
};