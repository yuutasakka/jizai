// import React, { useState } from 'react';
import { JZButton } from '../design-system/jizai-button';
import { JZCard, JZCardHeader, JZCardContent } from '../design-system/jizai-card';
import { JZChip } from '../design-system/jizai-chip';
import { 
  JZChevronRightIcon,
  JZBellIcon,
  JZShieldIcon,
  JZInfoIcon,
  JZHelpIcon,
  JZExternalLinkIcon,
  JZTrashIcon,
  JZPhotographIcon,
  JZMagicWandIcon
} from '../design-system/jizai-icons';

export const SettingsScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const [notifications, setNotifications] = useState(true);

  const settingsSections = [
    {
      title: 'アプリの設定',
      items: [
        {
          icon: <JZBellIcon size={20} className="text-[color:var(--color-jz-accent)]" />,
          title: 'お知らせ',
          subtitle: '写真ができたときにお知らせ',
          action: 'toggle',
          value: notifications,
          onChange: setNotifications
        },
        {
          icon: <JZPhotographIcon size={20} className="text-[color:var(--color-jz-accent)]" />,
          title: 'マイギャラリー',
          subtitle: '生成した写真を見る（90日保存）',
          action: 'navigate',
          onClick: () => onNavigate('user-gallery')
        }
      ]
    },
    {
      title: 'あなたのデータ',
      items: [
        {
          icon: <JZShieldIcon size={20} className="text-[color:var(--color-jz-warning)]" />,
          title: 'プライバシー',
          subtitle: 'あなたの情報について',
          action: 'navigate',
          onClick: () => alert('プライバシーについて表示')
        },
        {
          icon: <JZTrashIcon size={20} className="text-[color:var(--color-jz-destructive)]" />,
          title: 'データを消す',
          subtitle: '履歴とアカウントを削除',
          action: 'navigate',
          onClick: () => alert('データ削除の確認')
        }
      ]
    },
    {
      title: 'ヘルプ',
      items: [
        {
          icon: <JZHelpIcon size={20} className="text-[color:var(--color-jz-accent)]" />,
          title: '使い方',
          subtitle: 'よくある質問と答え',
          action: 'navigate',
          onClick: () => onNavigate('tutorial-examples')
        },
        {
          icon: <JZMagicWandIcon size={20} className="text-[color:var(--color-jz-secondary)]" />,
          title: 'チュートリアルを見る',
          subtitle: '初回説明をもう一度見る',
          action: 'navigate',
          onClick: () => onNavigate('onboarding')
        },
        {
          icon: <JZInfoIcon size={20} className="text-[color:var(--color-jz-text-secondary)]" />,
          title: 'アプリについて',
          subtitle: 'バージョン 1.0.0',
          action: 'navigate',
          onClick: () => alert('アプリ情報を表示')
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[color:var(--color-jz-surface)]">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="jz-glass-effect border-b border-[color:var(--color-jz-border)]">
          <div className="flex items-center pt-[44px] px-[var(--space-16)] pb-[var(--space-16)]">
            <JZButton
              tone="tertiary"
              size="md"
              onClick={() => onNavigate('home')}
              className="mr-[var(--space-12)]"
            >
              ← ホーム
            </JZButton>
            <h1 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)]">
              設定
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-[140px] pb-[var(--space-24)] px-[var(--space-16)] jz-grid-8pt jz-spacing-20">
        {settingsSections.map((section, sectionIndex) => (
          <JZCard key={sectionIndex}>
            <JZCardHeader>
              <h2 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)]">
                {section.title}
              </h2>
            </JZCardHeader>
            <JZCardContent>
              <div className="space-y-[var(--space-16)]">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex}>
                    {item.action === 'toggle' ? (
                      <div className="flex items-center justify-between py-[var(--space-8)]">
                        <div className="flex items-center gap-[var(--space-16)] flex-1">
                          <div className="w-[40px] h-[40px] rounded-full bg-[color:var(--color-jz-border)] flex items-center justify-center flex-shrink-0">
                            {item.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="jz-font-display jz-text-body font-medium text-[color:var(--color-jz-text-primary)] mb-[var(--space-4)]">
                              {item.title}
                            </h3>
                            <p className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => item.onChange && item.onChange(!item.value)}
                          className={`relative w-[52px] h-[32px] rounded-full transition-colors ${
                            item.value 
                              ? 'bg-[color:var(--color-jz-accent)]' 
                              : 'bg-[color:var(--color-jz-border)]'
                          }`}
                        >
                          <div
                            className={`absolute top-[2px] w-[28px] h-[28px] bg-white rounded-full transition-transform ${
                              item.value ? 'translate-x-[22px]' : 'translate-x-[2px]'
                            }`}
                          />
                        </button>
                      </div>
                    ) : item.action === 'display' ? (
                      <div className="flex items-center gap-[var(--space-16)] py-[var(--space-8)]">
                        <div className="w-[40px] h-[40px] rounded-full bg-[color:var(--color-jz-border)] flex items-center justify-center flex-shrink-0">
                          {item.icon}
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="jz-font-display jz-text-body font-medium text-[color:var(--color-jz-text-primary)] mb-[var(--space-4)]">
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-[var(--space-8)]">
                            <p className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
                              {item.subtitle}
                            </p>

                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={item.onClick}
                        className="w-full flex items-center gap-[var(--space-16)] py-[var(--space-8)] hover:bg-[color:var(--color-jz-border)]/30 rounded-[--radius-jz-button] transition-colors"
                      >
                        <div className="w-[40px] h-[40px] rounded-full bg-[color:var(--color-jz-border)] flex items-center justify-center flex-shrink-0">
                          {item.icon}
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="jz-font-display jz-text-body font-medium text-[color:var(--color-jz-text-primary)] mb-[var(--space-4)]">
                            {item.title}
                          </h3>
                          <p className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
                            {item.subtitle}
                          </p>
                        </div>
                        <JZChevronRightIcon size={16} className="text-[color:var(--color-jz-text-tertiary)]" />
                      </button>
                    )}
                    
                    {itemIndex < section.items.length - 1 && (
                      <div className="border-t border-[color:var(--color-jz-border)] mt-[var(--space-16)]" />
                    )}
                  </div>
                ))}
              </div>
            </JZCardContent>
          </JZCard>
        ))}
        
        {/* App Info */}
        <div className="text-center py-[var(--space-20)]">
          <h2 className="jz-font-display jz-text-display-large text-[color:var(--color-jz-text-primary)] mb-[var(--space-8)]">
            JIZAI
          </h2>
          <p className="jz-text-caption text-[color:var(--color-jz-text-tertiary)]">
            写真、思いのままに。
          </p>
          <p className="jz-text-caption text-[color:var(--color-jz-text-tertiary)] mt-[var(--space-8)]">
            Version 1.0.0 © 2024
          </p>
        </div>
      </div>
    </div>
  );
};