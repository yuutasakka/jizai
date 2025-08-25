import React, { useState } from 'react';
import { IOSButton } from './ios-button';
import { IOSCard, IOSCardHeader, IOSCardContent, IOSCardFooter } from './ios-card';
import { CreditCardIcon, CheckIcon } from './ios-icons';

export const PurchaseScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const plans = [
    {
      id: 'small',
      credits: 20,
      price: '¥480',
      popular: false,
      description: '少量の編集に最適',
      perCredit: '¥24/クレジット'
    },
    {
      id: 'medium',
      credits: 100,
      price: '¥1,980',
      popular: true,
      description: '定期利用におすすめ',
      perCredit: '¥19.8/クレジット'
    },
    {
      id: 'large',
      credits: 300,
      price: '¥4,800',
      popular: false,
      description: '大量編集でお得',
      perCredit: '¥16/クレジット'
    }
  ];

  const handlePurchase = async () => {
    if (!selectedPlan) {
      alert('プランを選択してください');
      return;
    }

    setIsPurchasing(true);
    // Mock purchase delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsPurchasing(false);
    alert('購入が完了しました！クレジットが追加されました。');
    onNavigate('home');
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-ios-gray-6)] p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pt-12">
        <IOSButton
          variant="ghost"
          onClick={() => onNavigate('home')}
        >
          ← 戻る
        </IOSButton>
        <h1 className="text-lg font-medium">クレジット購入</h1>
        <div className="w-16"></div>
      </div>

      {/* Current Balance */}
      <IOSCard className="mb-6">
        <IOSCardContent className="text-center py-6">
          <div className="w-16 h-16 bg-[color:var(--color-ios-blue)] rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl font-medium">150</span>
          </div>
          <h2 className="text-lg font-medium mb-1">現在の残高</h2>
          <p className="text-[color:var(--color-ios-gray-1)]">150 クレジット</p>
        </IOSCardContent>
      </IOSCard>

      {/* Plans */}
      <div className="space-y-4 mb-6">
        {plans.map((plan) => (
          <IOSCard
            key={plan.id}
            variant={selectedPlan === plan.id ? "outlined" : "default"}
            className={`cursor-pointer transition-all ${
              selectedPlan === plan.id
                ? "border-[color:var(--color-ios-blue)] border-2 bg-blue-50"
                : "hover:shadow-md"
            } ${plan.popular ? "ring-2 ring-[color:var(--color-ios-blue)] ring-opacity-20" : ""}`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.popular && (
              <div className="bg-[color:var(--color-ios-blue)] text-white text-center py-2 rounded-t-xl text-sm font-medium">
                人気No.1
              </div>
            )}
            <IOSCardHeader className={plan.popular ? "pb-2" : ""}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    {plan.credits} クレジット
                    {selectedPlan === plan.id && (
                      <div className="w-5 h-5 bg-[color:var(--color-ios-blue)] rounded-full flex items-center justify-center">
                        <CheckIcon size={12} className="text-white" />
                      </div>
                    )}
                  </h3>
                  <p className="text-[color:var(--color-ios-gray-1)] text-sm">{plan.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-medium">{plan.price}</div>
                  <div className="text-[color:var(--color-ios-gray-1)] text-xs">{plan.perCredit}</div>
                </div>
              </div>
            </IOSCardHeader>
          </IOSCard>
        ))}
      </div>

      {/* Purchase Button */}
      <div className="sticky bottom-4">
        <IOSButton
          variant="primary"
          size="lg"
          fullWidth
          onClick={handlePurchase}
          state={!selectedPlan ? 'disabled' : (isPurchasing ? 'loading' : 'enabled')}
          className="flex items-center justify-center gap-2"
        >
          <CreditCardIcon size={20} />
          {isPurchasing ? '処理中...' : '購入する'}
        </IOSButton>
      </div>

      {/* Notice */}
      <IOSCard className="mt-6 border-orange-200 bg-orange-50">
        <IOSCardContent className="py-4">
          <h3 className="font-medium text-orange-800 mb-2">ご注意</h3>
          <div className="text-sm text-orange-700 space-y-1">
            <p>• クレジットは消費型です（使用すると減少します）</p>
            <p>• 購入後の返金・キャンセルはできません</p>
            <p>• 生成に失敗した場合、クレジットは返還されます</p>
            <p>• アプリを削除してもクレジットは保持されます</p>
          </div>
        </IOSCardContent>
      </IOSCard>
    </div>
  );
};