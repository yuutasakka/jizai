import React, { useState, useEffect } from 'react';
import { JZButton } from '../design-system/jizai-button';
import { JZCard, JZCardHeader, JZCardContent } from '../design-system/jizai-card';
import { JZChevronRightIcon, JZCheckIcon, JZBoltIcon } from '../design-system/jizai-icons';
import { cn } from '../ui/utils';
import { apiClient } from '../../api/client';
import { getPlans, percentOff, SALE_ENABLED, formatYen } from '../../config/pricing';
import { pickBarClass, toPercent } from '../../config/storage';

export const PurchaseScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const [selectedPlan, setSelectedPlan] = useState('50');
  const [tier, setTier] = useState('free');
  const [storage, setStorage] = useState<{quota: number; used: number}>({ quota: 0, used: 0 });
  // Web版: 購入操作は提供しない
  const [error, setError] = useState<string | null>(null);

  // 現在のプラン・保存容量を取得
  useEffect(() => {
    const loadBalance = async () => {
      try {
        const balance = await apiClient.getBalance();
        if (balance.subscription?.tier) setTier(balance.subscription.tier);
        if (balance.storage) setStorage(balance.storage);
      } catch (error) {
        console.error('Failed to load balance:', error);
      }
    };
    
    loadBalance();
  }, []);

  const planData = getPlans();

  const benefits = [
    {
      icon: <JZCheckIcon size={16} className="text-[color:var(--color-jz-success)]" />,
      text: "日本語で指示OK"
    },
    {
      icon: <JZCheckIcon size={16} className="text-[color:var(--color-jz-success)]" />,
      text: "保存は自動。あとからダウンロード"
    },
    {
      icon: <JZCheckIcon size={16} className="text-[color:var(--color-jz-success)]" />,
      text: "プランで容量アップ"
    }
  ];

  const staffBenefits = [
    {
      icon: <JZCheckIcon size={16} className="text-[color:var(--color-jz-success)]" />,
      text: "日本語OK"
    },
    {
      icon: <JZCheckIcon size={16} className="text-[color:var(--color-jz-success)]" />,
      text: "保存は手動。"
    },
    {
      icon: <JZCheckIcon size={16} className="text-[color:var(--color-jz-success)]" />,
      text: "作成データをチャットで送信"
    }
  ];

  // Web版: 購入操作は提供しない

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
              マイプラン
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-[140px] pb-[var(--space-24)] px-[var(--space-16)] jz-grid-8pt jz-spacing-20">
        {SALE_ENABLED && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm text-center">
              通常価格は 1枚あたり<strong>100円</strong>。いまだけ<strong>期間限定セール</strong>で下記の価格です。
            </p>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Current Plan */}
        <JZCard>
          <JZCardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="jz-font-display jz-text-body-large text-[color:var(--color-jz-text-primary)]">
                  あなたのプラン
                </h3>
                <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
                  保存できる容量
                </p>
              </div>
              <div className="flex items-center gap-2">
                <JZBoltIcon size={20} className="text-[color:var(--color-jz-accent)]" />
                <span className="jz-font-display jz-text-display-small text-[color:var(--color-jz-accent)] uppercase">
                  {tier}
                </span>
              </div>
            </div>
            <div className="mt-3 text-[color:var(--color-jz-text-secondary)]">
              保存: {formatStorage(storage.used)} / {formatStorage(storage.quota)}
            </div>
            <div className="mt-2">
              <div className="w-full h-2 rounded-full bg-[color:var(--color-jz-border)] overflow-hidden">
                <div
                  className={pickBarClass(storage.used, storage.quota)}
                  style={{ width: `${toPercent(storage.used, storage.quota)}%`, height: '100%' }}
                />
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
            プランについて（参考情報）
          </h2>
          
          {planData.map((p) => {
            const sale = p.salePrice;
            const regular = p.regularPrice;
            const off = percentOff(regular, sale);
            const pricePer = p.isStaff ? 0 : Math.round((sale / p.units));
            const isRecommended = !!p.recommended;
            const isStaff = !!p.isStaff;
            return (
            <div key={p.id} className="relative">
              {/* バッジ */}
              {isStaff ? (
                <div className="absolute -top-[8px] right-[var(--space-16)] z-10">
                  <div className="bg-gradient-to-r from-[color:var(--color-jz-warning)] to-[color:var(--color-jz-secondary)] text-white px-[var(--space-12)] py-[var(--space-8)] rounded-[10px] jz-text-caption font-semibold">
                    スタッフおまかせ
                  </div>
                </div>
              ) : off > 0 && (
                <div className="absolute -top-[8px] right-[var(--space-16)] z-10">
                  <div className="bg-[color:var(--color-jz-secondary)] text-[color:var(--color-jz-surface)] px-[var(--space-12)] py-[var(--space-8)] rounded-[10px] jz-text-caption font-semibold">
                    {off}%OFF
                  </div>
                </div>
              )}
              
              <JZCard 
                variant={selectedPlan === p.id ? 'selected' : 'default'}
                className="cursor-pointer transition-all duration-200"
                onClick={() => setSelectedPlan(p.id)}
              >
                <JZCardContent className="p-[var(--space-16)] space-y-[var(--space-12)]">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {/* タイトル */}
                      <div className="mb-[var(--space-8)]">
                        <span className="jz-font-display text-[22px] font-semibold text-[color:var(--color-jz-text-primary)]">
                          {isStaff ? 'スタッフにおまかせ' : `${p.units}枚（回数の目安）`}
                        </span>
                      </div>
                      
                      {/* 価格 */}
                      <div className="flex items-baseline gap-[var(--space-8)] mb-[var(--space-4)]">
                        <span className="jz-font-display text-[22px] font-semibold text-[color:var(--color-jz-text-primary)]">
                          {formatYen(sale)}
                        </span>
                        {!isStaff && off > 0 && (
                          <span className="jz-text-caption text-[color:var(--color-jz-text-tertiary)] line-through">
                            {formatYen(regular)}
                          </span>
                        )}
                      </div>
                      
                      {/* 小ラベル */}
                      <div className="mb-[var(--space-12)]">
                        <span className="text-[14px] text-[color:var(--color-jz-text-secondary)]">
                          {isStaff ? '人手チェック付き' : `1枚=¥${pricePer}（通常¥100）`}
                        </span>
                      </div>
                      
                      {/* お得感 */}
                      {off > 0 && (
                        <div className="mb-[var(--space-12)]">
                          <span className="jz-text-caption text-[color:var(--color-jz-success)] font-medium">
                            期間限定セール
                          </span>
                        </div>
                      )}
                      
                      {/* ベネフィット */}
                      <div className="space-y-[var(--space-8)]">
                        {(isStaff ? staffBenefits : benefits).map((benefit, index) => (
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
                        selectedPlan === p.id 
                          ? "border-[color:var(--color-jz-accent)] bg-[color:var(--color-jz-accent)]"
                          : "border-[color:var(--color-jz-border)]"
                      )}>
                        {selectedPlan === p.id && (
                          <JZCheckIcon size={12} className="text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                </JZCardContent>
              </JZCard>
            </div>
          );})}
        </div>

        {/* お急ぎ便オプション */}
        <JZCard>
          <JZCardHeader>
            <h2 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)]">
              お急ぎ便オプション
            </h2>
          </JZCardHeader>
          <JZCardContent>
            <div className="bg-gradient-to-r from-[color:var(--color-jz-warning)] to-[color:var(--color-jz-secondary)] rounded-[--radius-jz-button] p-[var(--space-16)] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-[var(--space-4)]">特急1,980円</h3>
                  <p className="text-sm opacity-90 mb-[var(--space-8)]">60分以内に返信</p>
                  <div className="space-y-[var(--space-4)]">
                    <div className="flex items-center gap-[var(--space-8)]">
                      <JZCheckIcon size={14} className="text-white flex-shrink-0" />
                      <span className="text-sm">チャットサポート</span>
                    </div>
                    <div className="flex items-center gap-[var(--space-8)]">
                      <JZCheckIcon size={14} className="text-white flex-shrink-0" />
                      <span className="text-sm">優先対応</span>
                    </div>
                    <div className="flex items-center gap-[var(--space-8)]">
                      <JZCheckIcon size={14} className="text-white flex-shrink-0" />
                      <span className="text-sm">品質保証</span>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-[var(--space-8)]">⚡</div>
                  <JZButton
                    tone="secondary"
                    size="md"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  >
                    チャット開始
                  </JZButton>
                </div>
              </div>
            </div>
          </JZCardContent>
        </JZCard>

        {/* Purchase Button */}
        <JZCard>
          <JZCardContent className="p-[var(--space-16)]">
            <div className="text-center text-[color:var(--color-jz-text-secondary)]">
              プランの変更はアプリ内課金またはApp Storeで行えます。
            </div>
          </JZCardContent>
        </JZCard>
      </div>
    </div>
  );
};

function formatStorage(bytes: number) {
  if (!bytes || bytes <= 0) return '0B';
  const k = 1024;
  const sizes = ['B','KB','MB','GB','TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = (bytes / Math.pow(k, i)).toFixed(1);
  return `${value}${sizes[i]}`;
}

// バーの色と割合は src/config/storage.ts の設定値を使用
