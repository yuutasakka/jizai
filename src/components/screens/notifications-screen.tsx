import React from 'react';
import { JZButton } from '../design-system/jizai-button';
import { JZCard, JZCardContent } from '../design-system/jizai-card';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  unread?: boolean;
}

export const NotificationsScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const items: NotificationItem[] = [
    { id: 'n1', title: '生成が完了しました', message: '新しい画像がギャラリーに保存されました。', time: '2分前', unread: true },
    { id: 'n2', title: 'お知らせ', message: '新しいテンプレートが追加されました。', time: '昨日' },
  ];

  return (
    <div className="min-h-screen bg-[color:var(--color-jz-surface)]">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="jz-glass-effect border-b border-[color:var(--color-jz-border)]">
          <div className="flex items-center justify-between pt-[44px] px-[var(--space-16)] pb-[var(--space-16)]">
            <JZButton tone="tertiary" onClick={() => onNavigate('home')}>← ホーム</JZButton>
            <h1 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)]">通知</h1>
            <div className="w-[60px]" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-[140px] pb-[var(--space-24)] px-[var(--space-16)]">
        <div className="max-w-[720px] mx-auto space-y-[var(--space-12)]">
          {items.map((n) => (
            <JZCard key={n.id} className={`${n.unread ? 'border-[color:var(--color-jz-accent)]/40' : ''}`}>
              <JZCardContent>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="jz-text-body font-medium text-[color:var(--color-jz-text-primary)]">{n.title}</div>
                    <div className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">{n.message}</div>
                  </div>
                  <div className="jz-text-caption text-[color:var(--color-jz-text-tertiary)]">{n.time}</div>
                </div>
              </JZCardContent>
            </JZCard>
          ))}
        </div>
      </div>
    </div>
  );
};

