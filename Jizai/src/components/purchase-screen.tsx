// import React, { useState } from 'react';
import { IOSButton } from './ios-button';
import { IOSCard, IOSCardHeader, IOSCardContent, IOSCardFooter } from './ios-card';
import { CreditCardIcon, CheckIcon } from './ios-icons';

export const PurchaseScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  const plans = [
    {
      id: 'small',
      units: 20,
      price: '¥1,400', // 例: 20枚=¥70/枚（セール時）
      popular: false,
      description: '少量の編集に最適',
      perUnit: '1枚=¥70（通常¥100）'
    },
    {
      id: 'medium',
      units: 50,
      price: '¥3,250',
      popular: true,
      description: '定期利用におすすめ',
      perUnit: '1枚=¥65（通常¥100）'
    },
    {
      id: 'large',
      units: 100,
      price: '¥6,000',
      popular: false,
      description: '大量編集でお得',
      perUnit: '1枚=¥60（通常¥100）'
    }
  ];

  // Web版では購入操作は提供せず、アプリ内課金/Appleのサブスクリプション管理へ誘導します

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
        <h1 className="text-lg font-medium">マイプラン</h1>
        <div className="w-16"></div>
      </div>

      {/* Sale Notice */}
      <IOSCard className="mb-6 border-yellow-200 bg-yellow-50">
        <IOSCardContent className="text-center py-4 text-yellow-800">
          通常100円/枚。いまだけ<strong>期間限定セール</strong>中！
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
                    {plan.units} 枚
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
                  <div className="text-[color:var(--color-ios-gray-1)] text-xs">{plan.perUnit}</div>
                </div>
              </div>
            </IOSCardHeader>
          </IOSCard>
        ))}
      </div>

      {/* Web版の案内（購入はアプリから） */}
      <IOSCard className="mt-6">
        <IOSCardContent className="py-4">
          <h3 className="font-medium mb-2">購入・プラン変更について</h3>
          <div className="text-sm text-[color:var(--color-ios-gray-1)] space-y-1">
            <p>• iPhoneの「設定」→ Apple ID → サブスクリプション から変更できます</p>
            <p>• アプリの「マイプラン」からも同じ画面へ移動できます</p>
            <p>• Web版では購入操作はできません（誤操作防止）</p>
          </div>
        </IOSCardContent>
      </IOSCard>

      {/* Notice */}
      <IOSCard className="mt-6 border-orange-200 bg-orange-50">
        <IOSCardContent className="py-4">
          <h3 className="font-medium text-orange-800 mb-2">ご注意</h3>
          <div className="text-sm text-orange-700 space-y-1">
            <p>• 生成は1回ごとに料金がかかります（通常100円/枚。今だけセールあり）</p>
            <p>• 購入後の返金・キャンセルはできません</p>
            <p>• 生成に失敗した場合は料金が発生しないよう配慮しています</p>
          </div>
        </IOSCardContent>
      </IOSCard>
    </div>
  );
};
