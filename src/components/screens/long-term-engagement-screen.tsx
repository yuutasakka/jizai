import React, { useState, useEffect } from 'react';
import { JZButton } from '../design-system/jizai-button';
import { JZCard } from '../design-system/jizai-card';
import { 
  JZSparklesIcon, 
  JZHeartIcon, 
  JZSettingsIcon, 
  JZPhotoIcon,
  JZMemorialPhotoIcon,
  JZUsersIcon,
  JZTrendingUpIcon,
  JZCalendarIcon,
  JZStarIcon,
  JZAwardIcon
} from '../design-system/jizai-icons';

// Import the engagement contexts
import { useMemorialIntelligence } from '../../contexts/MemorialIntelligenceContext';
import { useGrowthAchievement } from '../../contexts/GrowthAchievementContext';
import { useFamilyBonding } from '../../contexts/FamilyBondingContext';
import { usePersonalization } from '../../contexts/PersonalizationContext';
import { SeasonalAudioVisual, AudioVisualControls } from '../enhancement/SeasonalAudioVisual';
import { DelightLayers } from '../zen/DelightLayers';

interface LongTermEngagementScreenProps {
  onNavigate: (screen: string) => void;
}

export const LongTermEngagementScreen: React.FC<LongTermEngagementScreenProps> = ({ onNavigate }) => {
  // Context hooks
  const memorialIntelligence = useMemorialIntelligence();
  const growthAchievement = useGrowthAchievement();
  const familyBonding = useFamilyBonding();
  const personalization = usePersonalization();

  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'growth' | 'family' | 'insights' | 'settings'>('overview');
  const [showCelebration, setShowCelebration] = useState(false);

  // Initialize systems
  useEffect(() => {
    // Generate fresh insights and suggestions
    memorialIntelligence.generateIntelligentSuggestions();
    growthAchievement.generateInsights();
    familyBonding.generateFamilyInsights();
    personalization.generateUsageInsights();
  }, []);

  // Overview Tab Component
  const OverviewTab = () => {
    const recentAchievements = Array.from(growthAchievement.unlockedAchievements)
      .slice(-3)
      .map(id => growthAchievement.achievements.find(a => a.id === id))
      .filter(Boolean);

    const upcomingReminders = memorialIntelligence.upcomingReminders.slice(0, 2);
    const activeSuggestions = memorialIntelligence.activeSuggestions.slice(0, 3);
    const familyActivities = familyBonding.getFamilyActivityFeed(3);

    return (
      <div className="space-y-6">
        {/* Welcome Message */}
        <JZCard className="text-center p-6 bg-gradient-to-br from-[color:var(--color-jz-accent)]/10 to-[color:var(--color-jz-surface)]">
          <div className="flex justify-center mb-4">
            <JZHeartIcon size={32} className="text-[color:var(--color-jz-accent)]" />
          </div>
          <h2 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)] mb-2">
            あなたらしいJIZAI
          </h2>
          <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
            継続してご利用いただき、ありがとうございます。あなたの成長と想いを大切に育んでいます。
          </p>
        </JZCard>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <JZCard className="text-center p-4">
            <JZPhotoIcon size={24} className="mx-auto mb-2 text-[color:var(--color-jz-accent)]" />
            <div className="jz-text-display-small font-medium text-[color:var(--color-jz-text-primary)]">
              {growthAchievement.creationSessions.length}
            </div>
            <div className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
              作品数
            </div>
          </JZCard>

          <JZCard className="text-center p-4">
            <JZTrendingUpIcon size={24} className="mx-auto mb-2 text-[color:var(--color-jz-accent)]" />
            <div className="jz-text-display-small font-medium text-[color:var(--color-jz-text-primary)]">
              {Math.round(Array.from(growthAchievement.skillMetrics.values())
                .reduce((sum, skill) => sum + skill.currentLevel, 0) / 
                growthAchievement.skillMetrics.size)}%
            </div>
            <div className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
              平均スキル
            </div>
          </JZCard>

          <JZCard className="text-center p-4">
            <JZUsersIcon size={24} className="mx-auto mb-2 text-[color:var(--color-jz-accent)]" />
            <div className="jz-text-display-small font-medium text-[color:var(--color-jz-text-primary)]">
              {familyBonding.familyMembers.length}
            </div>
            <div className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
              家族
            </div>
          </JZCard>

          <JZCard className="text-center p-4">
            <JZAwardIcon size={24} className="mx-auto mb-2 text-[color:var(--color-jz-accent)]" />
            <div className="jz-text-display-small font-medium text-[color:var(--color-jz-text-primary)]">
              {growthAchievement.unlockedAchievements.size}
            </div>
            <div className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
              達成
            </div>
          </JZCard>
        </div>

        {/* Recent Achievements */}
        {recentAchievements.length > 0 && (
          <div>
            <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-3 flex items-center">
              <JZStarIcon size={20} className="mr-2 text-[color:var(--color-jz-accent)]" />
              最近の達成
            </h3>
            <div className="space-y-2">
              {recentAchievements.map((achievement) => (
                <JZCard key={achievement!.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{achievement!.icon}</span>
                    <div className="flex-1">
                      <div className="jz-text-body font-medium text-[color:var(--color-jz-text-primary)]">
                        {achievement!.title}
                      </div>
                      <div className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
                        {achievement!.description}
                      </div>
                    </div>
                    <div className="px-2 py-1 bg-[color:var(--color-jz-accent)]/10 rounded text-[color:var(--color-jz-accent)] text-xs">
                      {achievement!.rarity === 'legendary' ? '伝説' : achievement!.rarity === 'rare' ? '稀少' : '一般'}
                    </div>
                  </div>
                </JZCard>
              ))}
            </div>
          </div>
        )}

        {/* Memorial Intelligence Suggestions */}
        {activeSuggestions.length > 0 && (
          <div>
            <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-3 flex items-center">
              <JZSparklesIcon size={20} className="mr-2 text-[color:var(--color-jz-accent)]" />
              おすすめ
            </h3>
            <div className="space-y-2">
              {activeSuggestions.map((suggestion) => (
                <JZCard key={suggestion.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="jz-text-body font-medium text-[color:var(--color-jz-text-primary)] mb-1">
                        {suggestion.title}
                      </div>
                      <div className="jz-text-caption text-[color:var(--color-jz-text-secondary)] mb-3">
                        {suggestion.description}
                      </div>
                      <div className="flex gap-2">
                        <JZButton
                          size="sm"
                          tone="primary"
                          onClick={() => memorialIntelligence.actOnSuggestion(suggestion.id)}
                        >
                          {suggestion.actionText}
                        </JZButton>
                        <JZButton
                          size="sm"
                          tone="tertiary"
                          onClick={() => memorialIntelligence.dismissSuggestion(suggestion.id)}
                        >
                          後で
                        </JZButton>
                      </div>
                    </div>
                  </div>
                </JZCard>
              ))}
            </div>
          </div>
        )}

        {/* Family Activities */}
        {familyActivities.length > 0 && (
          <div>
            <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-3 flex items-center">
              <JZUsersIcon size={20} className="mr-2 text-[color:var(--color-jz-accent)]" />
              家族の活動
            </h3>
            <div className="space-y-2">
              {familyActivities.map((activity) => (
                <JZCard key={activity.id} className="p-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-[color:var(--color-jz-accent)] rounded-full mr-3" />
                    <div className="flex-1">
                      <div className="jz-text-body text-[color:var(--color-jz-text-primary)]">
                        {activity.title}
                      </div>
                      <div className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
                        {activity.timestamp.toLocaleDateString('ja-JP')} • {activity.description}
                      </div>
                    </div>
                  </div>
                </JZCard>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Growth Tab Component
  const GrowthTab = () => {
    const skillMetrics = Array.from(growthAchievement.skillMetrics.entries());
    const recentSessions = growthAchievement.creationSessions.slice(-5);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)] mb-2">
            成長の軌跡
          </h2>
          <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
            あなたの技術向上を可視化します
          </p>
        </div>

        {/* Skill Progress */}
        <div>
          <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-4">
            スキル進歩
          </h3>
          <div className="space-y-4">
            {skillMetrics.map(([skillType, metric]) => (
              <JZCard key={skillType} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="jz-text-body font-medium text-[color:var(--color-jz-text-primary)]">
                    {skillType === 'editing_speed' ? '編集速度' :
                     skillType === 'composition_quality' ? '構図品質' :
                     skillType === 'color_harmony' ? '色彩調和' :
                     skillType === 'emotional_expression' ? '感情表現' :
                     skillType === 'technical_precision' ? '技術精度' : skillType}
                  </span>
                  <span className="jz-text-caption text-[color:var(--color-jz-accent)] font-medium">
                    {Math.round(metric.currentLevel)}%
                  </span>
                </div>
                <div className="w-full bg-[color:var(--color-jz-border)] rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-[color:var(--color-jz-accent)] to-[color:var(--color-jz-accent)]/80 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${metric.currentLevel}%` }}
                  />
                </div>
                {metric.improvementRate > 0 && (
                  <div className="mt-2 flex items-center text-green-600">
                    <JZTrendingUpIcon size={16} className="mr-1" />
                    <span className="jz-text-caption">
                      +{Math.round(metric.improvementRate)}% 向上
                    </span>
                  </div>
                )}
              </JZCard>
            ))}
          </div>
        </div>

        {/* Recent Sessions */}
        <div>
          <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-4">
            最近のセッション
          </h3>
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <JZCard key={session.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="jz-text-body font-medium text-[color:var(--color-jz-text-primary)]">
                      {session.startTime.toLocaleDateString('ja-JP')}
                    </div>
                    <div className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
                      品質スコア: {Math.round(session.qualityScore)}点 • 
                      作業時間: {Math.round(session.duration / 60000)}分
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {session.qualityScore > 80 && (
                      <JZStarIcon size={16} className="text-[color:var(--color-jz-accent)]" />
                    )}
                    <div className={`w-3 h-3 rounded-full ${
                      session.qualityScore > 80 ? 'bg-green-500' :
                      session.qualityScore > 60 ? 'bg-yellow-500' :
                      'bg-gray-400'
                    }`} />
                  </div>
                </div>
              </JZCard>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Family Tab Component
  const FamilyTab = () => {
    const sharedPhotos = familyBonding.sharedPhotos.slice(0, 5);
    const familyInsights = familyBonding.familyInsights;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)] mb-2">
            家族との絆
          </h2>
          <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
            思い出を分かち合い、絆を深めています
          </p>
        </div>

        {/* Family Members */}
        <div>
          <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-4">
            家族メンバー
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {familyBonding.familyMembers.map((member) => (
              <JZCard key={member.id} className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-[color:var(--color-jz-accent)]/20 rounded-full flex items-center justify-center mr-3">
                    <span className="text-[color:var(--color-jz-accent)] font-medium">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="jz-text-body font-medium text-[color:var(--color-jz-text-primary)]">
                      {member.name}
                    </div>
                    <div className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
                      {member.preferences.culturalRole} • {member.isActive ? 'アクティブ' : '非アクティブ'}
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${member.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                </div>
              </JZCard>
            ))}
          </div>
        </div>

        {/* Shared Photos */}
        {sharedPhotos.length > 0 && (
          <div>
            <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-4">
              共有された思い出
            </h3>
            <div className="space-y-3">
              {sharedPhotos.map((photo) => (
                <JZCard key={photo.id} className="p-4">
                  <div className="flex items-center">
                    <JZMemorialPhotoIcon size={24} className="mr-3 text-[color:var(--color-jz-accent)]" />
                    <div className="flex-1">
                      <div className="jz-text-body font-medium text-[color:var(--color-jz-text-primary)]">
                        {photo.title}
                      </div>
                      <div className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
                        {photo.createdDate.toLocaleDateString('ja-JP')} • 
                        {photo.reactions.length}個のリアクション • 
                        {photo.comments.length}件のコメント
                      </div>
                    </div>
                  </div>
                </JZCard>
              ))}
            </div>
          </div>
        )}

        {/* Family Invite */}
        <JZCard className="p-6 text-center bg-[color:var(--color-jz-accent)]/5">
          <JZUsersIcon size={32} className="mx-auto mb-3 text-[color:var(--color-jz-accent)]" />
          <h4 className="jz-text-body font-medium text-[color:var(--color-jz-text-primary)] mb-2">
            家族を招待する
          </h4>
          <p className="jz-text-caption text-[color:var(--color-jz-text-secondary)] mb-4">
            思い出を家族と一緒に大切にしませんか？
          </p>
          <JZButton
            tone="primary"
            onClick={() => {
              // Simulate invitation
              const inviteCode = Math.random().toString(36).substr(2, 8).toUpperCase();
              alert(`招待コード: ${inviteCode}\nこのコードを家族の方に共有してください。`);
            }}
          >
            招待する
          </JZButton>
        </JZCard>
      </div>
    );
  };

  // Settings Tab Component
  const SettingsTab = () => {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)] mb-2">
            パーソナライズ設定
          </h2>
          <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
            あなたらしいJIZAI体験を調整します
          </p>
        </div>

        {/* Personalization Settings */}
        <div className="space-y-4">
          <JZCard className="p-4">
            <h3 className="jz-text-body font-medium text-[color:var(--color-jz-text-primary)] mb-3">
              個人化レベル
            </h3>
            <div className="space-y-2">
              {(['off', 'minimal', 'moderate', 'maximum'] as const).map((level) => (
                <label key={level} className="flex items-center">
                  <input 
                    type="radio" 
                    name="personalization" 
                    value={level}
                    className="mr-2"
                    onChange={() => personalization.setPersonalizationLevel(level)}
                  />
                  <span className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
                    {level === 'off' ? 'オフ' : 
                     level === 'minimal' ? '最小限' : 
                     level === 'moderate' ? '適度' : '最大限'}
                  </span>
                </label>
              ))}
            </div>
          </JZCard>

          <JZCard className="p-4">
            <h3 className="jz-text-body font-medium text-[color:var(--color-jz-text-primary)] mb-3">
              通知設定
            </h3>
            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <span className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
                  記念日リマインダー
                </span>
                <input type="checkbox" defaultChecked />
              </label>
              <label className="flex items-center justify-between">
                <span className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
                  達成通知
                </span>
                <input type="checkbox" defaultChecked />
              </label>
              <label className="flex items-center justify-between">
                <span className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
                  家族活動通知
                </span>
                <input type="checkbox" defaultChecked />
              </label>
              <label className="flex items-center justify-between">
                <span className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
                  季節のおすすめ
                </span>
                <input type="checkbox" defaultChecked />
              </label>
            </div>
          </JZCard>

          <JZCard className="p-4">
            <h3 className="jz-text-body font-medium text-[color:var(--color-jz-text-primary)] mb-3">
              文化的設定
            </h3>
            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <span className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
                  日本の暦を観察
                </span>
                <input type="checkbox" defaultChecked />
              </label>
              <label className="flex items-center justify-between">
                <span className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
                  季節テーマの自動変更
                </span>
                <input type="checkbox" defaultChecked />
              </label>
              <label className="flex items-center justify-between">
                <span className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
                  文化的用語を使用
                </span>
                <input type="checkbox" defaultChecked />
              </label>
            </div>
          </JZCard>

          <JZCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="jz-text-body font-medium text-[color:var(--color-jz-text-primary)]">
                  データのエクスポート
                </h3>
                <p className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">
                  個人化データをバックアップ
                </p>
              </div>
              <JZButton
                size="sm"
                tone="secondary"
                onClick={() => {
                  const data = personalization.exportPersonalizationData();
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'jizai-personalization.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                エクスポート
              </JZButton>
            </div>
          </JZCard>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-jz-surface)] relative">
      {/* Seasonal Audio-Visual Enhancement */}
      <SeasonalAudioVisual 
        contextualMode="default"
        onEffectChange={(effectId, active) => {
          console.log(`Effect ${effectId} is ${active ? 'active' : 'inactive'}`);
        }}
      />
      
      {/* Audio-Visual Controls */}
      <AudioVisualControls />
      
      {/* Delight Layers for achievements */}
      <DelightLayers />

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="jz-glass-effect border-b border-[color:var(--color-jz-border)]">
          <div className="flex items-center justify-between pt-[44px] px-[var(--space-16)] pb-[var(--space-16)]">
            <div className="flex items-center">
              <JZButton
                tone="tertiary"
                size="md"
                onClick={() => onNavigate('home')}
                className="mr-[var(--space-12)]"
              >
                ← 戻る
              </JZButton>
              <h1 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)]">
                長期利用システム
              </h1>
            </div>
            <JZButton
              tone="tertiary"
              onClick={() => setShowCelebration(!showCelebration)}
            >
              <JZSparklesIcon size={20} />
            </JZButton>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex overflow-x-auto px-[var(--space-16)] -mb-px">
            {[
              { id: 'overview', label: '概要', icon: JZHeartIcon },
              { id: 'growth', label: '成長', icon: JZTrendingUpIcon },
              { id: 'family', label: '家族', icon: JZUsersIcon },
              { id: 'settings', label: '設定', icon: JZSettingsIcon }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[color:var(--color-jz-accent)] text-[color:var(--color-jz-accent)]'
                    : 'border-transparent text-[color:var(--color-jz-text-secondary)] hover:text-[color:var(--color-jz-text-primary)]'
                }`}
              >
                <tab.icon size={16} />
                <span className="jz-text-body font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-[180px] pb-[140px] px-[var(--space-16)]">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'growth' && <GrowthTab />}
          {activeTab === 'family' && <FamilyTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </div>

      {/* Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <JZCard className="max-w-md mx-4 p-6 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)] mb-2">
              おめでとうございます！
            </h2>
            <p className="jz-text-body text-[color:var(--color-jz-text-secondary)] mb-6">
              JIZAIをご愛用いただき、心より感謝申し上げます。あなたの継続的な利用が、素晴らしい作品と思い出を生み出しています。
            </p>
            <JZButton
              tone="primary"
              onClick={() => setShowCelebration(false)}
            >
              ありがとうございます
            </JZButton>
          </JZCard>
        </div>
      )}
    </div>
  );
};