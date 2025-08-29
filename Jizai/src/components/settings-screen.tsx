import React from 'react';
import { IOSButton } from './ios-button';
import { IOSCard, IOSCardContent } from './ios-card';
import { GearIcon } from './ios-icons';

export const SettingsScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const menuItems = [
    {
      title: '利用規約',
      subtitle: 'サービスの利用について',
      href: '#terms',
      action: () => alert('利用規約ページを開きます')
    },
    {
      title: 'プライバシーポリシー',
      subtitle: '個人情報の取り扱いについて',
      href: '#privacy',
      action: () => alert('プライバシーポリシーページを開きます')
    },
    {
      title: '特定商取引法に基づく表記',
      subtitle: '販売に関する法的事項',
      href: '#commerce',
      action: () => alert('特定商取引法のページを開きます')
    },
    {
      title: 'お問い合わせ',
      subtitle: 'サポートにご連絡',
      href: '#contact',
      action: () => alert('お問い合わせフォームを開きます')
    }
  ];

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
        <h1 className="text-lg font-medium">設定</h1>
        <div className="w-16"></div>
      </div>

      {/* App Info */}
      <IOSCard className="mb-6">
        <IOSCardContent className="text-center py-6">
          <div className="w-20 h-20 bg-gradient-to-br from-[color:var(--color-ios-blue)] to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GearIcon size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-medium mb-1">画像編集AI</h2>
          <p className="text-[color:var(--color-ios-gray-1)] mb-2">Version 1.0.0</p>
          <p className="text-sm text-[color:var(--color-ios-gray-1)]">
            AIを活用した高品質な画像編集アプリ
          </p>
        </IOSCardContent>
      </IOSCard>

      {/* Menu Items */}
      <div className="space-y-1">
        {menuItems.map((item, index) => (
          <IOSCard key={index} className="mb-1">
            <IOSCardContent className="p-0">
              <button
                onClick={item.action}
                className="w-full p-4 text-left hover:bg-[color:var(--color-ios-gray-6)] transition-colors rounded-xl flex items-center justify-between"
              >
                <div>
                  <h3 className="font-medium mb-1">{item.title}</h3>
                  <p className="text-sm text-[color:var(--color-ios-gray-1)]">{item.subtitle}</p>
                </div>
                <div className="text-[color:var(--color-ios-gray-2)]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>
            </IOSCardContent>
          </IOSCard>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-sm text-[color:var(--color-ios-gray-1)] mb-4">
          © 2025 画像編集AI. All rights reserved.
        </p>
        <IOSButton
          variant="ghost"
          size="sm"
          onClick={() => alert('デバッグ情報: iOS 18.0, iPhone 15 Pro Max')}
        >
          アプリ情報
        </IOSButton>
      </div>
    </div>
  );
};