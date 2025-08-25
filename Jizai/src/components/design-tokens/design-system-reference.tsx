import React from 'react';
import { JZCard, JZCardHeader, JZCardContent } from '../design-system/jizai-card';

export const DesignSystemReference = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8 bg-[color:var(--color-jz-surface)]">
      <div className="text-center mb-12">
        <h1 className="jz-font-display jz-text-display-large text-[color:var(--color-jz-text-primary)] mb-4">
          JIZAI Design System
        </h1>
        <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">
          iOS SwiftUI実装用デザイントークンとコンポーネント仕様
        </p>
      </div>

      {/* Colors */}
      <JZCard>
        <JZCardHeader>
          <h2 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)]">Colors</h2>
        </JZCardHeader>
        <JZCardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[color:var(--color-jz-border)]">
                  <th className="text-left py-3 px-2 jz-text-body font-semibold text-[color:var(--color-jz-text-primary)]">Token</th>
                  <th className="text-left py-3 px-2 jz-text-body font-semibold text-[color:var(--color-jz-text-primary)]">Hex</th>
                  <th className="text-left py-3 px-2 jz-text-body font-semibold text-[color:var(--color-jz-text-primary)]">Usage</th>
                  <th className="text-left py-3 px-2 jz-text-body font-semibold text-[color:var(--color-jz-text-primary)]">SwiftUI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-jz-border)]">
                <tr>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-primary)]">JZAccent</td>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-secondary)]">#0A84FF</td>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-secondary)]">Primary CTA, Selection</td>
                  <td className="py-3 px-2 jz-text-caption text-[color:var(--color-jz-text-tertiary)]">Color.accentColor</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-primary)]">JZSecondary</td>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-secondary)]">#7D5CFF</td>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-secondary)]">Gradient, Badge</td>
                  <td className="py-3 px-2 jz-text-caption text-[color:var(--color-jz-text-tertiary)]">Color("JZSecondary")</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-primary)]">JZSurface</td>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-secondary)]">#0B0B0C</td>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-secondary)]">Background</td>
                  <td className="py-3 px-2 jz-text-caption text-[color:var(--color-jz-text-tertiary)]">Color("JZSurface")</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-primary)]">JZCard</td>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-secondary)]">#111114</td>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-secondary)]">Card Background</td>
                  <td className="py-3 px-2 jz-text-caption text-[color:var(--color-jz-text-tertiary)]">Color("JZCard")</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-primary)]">JZBorder</td>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-secondary)]">#2A2A2E</td>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-secondary)]">Dividers, Borders</td>
                  <td className="py-3 px-2 jz-text-caption text-[color:var(--color-jz-text-tertiary)]">Color("JZBorder")</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-primary)]">JZTextPrimary</td>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-secondary)]">#ECECEC</td>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-secondary)]">Headings, Important Text</td>
                  <td className="py-3 px-2 jz-text-caption text-[color:var(--color-jz-text-tertiary)]">Color.primary</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-primary)]">JZTextSecondary</td>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-secondary)]">#A1A1AA</td>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-secondary)]">Body Text, Descriptions</td>
                  <td className="py-3 px-2 jz-text-caption text-[color:var(--color-jz-text-tertiary)]">Color.secondary</td>
                </tr>
              </tbody>
            </table>
          </div>
        </JZCardContent>
      </JZCard>

      {/* Spacing */}
      <JZCard>
        <JZCardHeader>
          <h2 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)]">Spacing (8pt Grid)</h2>
        </JZCardHeader>
        <JZCardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[color:var(--color-jz-border)]">
                  <th className="text-left py-3 px-2 jz-text-body font-semibold text-[color:var(--color-jz-text-primary)]">Token</th>
                  <th className="text-left py-3 px-2 jz-text-body font-semibold text-[color:var(--color-jz-text-primary)]">Value</th>
                  <th className="text-left py-3 px-2 jz-text-body font-semibold text-[color:var(--color-jz-text-primary)]">Usage</th>
                  <th className="text-left py-3 px-2 jz-text-body font-semibold text-[color:var(--color-jz-text-primary)]">SwiftUI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-jz-border)]">
                {[
                  { token: 'Space-4', value: '4px', usage: 'Micro spacing', swiftui: '.spacing(4)' },
                  { token: 'Space-8', value: '8px', usage: 'Small gaps', swiftui: '.spacing(8)' },
                  { token: 'Space-12', value: '12px', usage: 'Medium gaps', swiftui: '.spacing(12)' },
                  { token: 'Space-16', value: '16px', usage: 'Standard spacing', swiftui: '.spacing(16)' },
                  { token: 'Space-20', value: '20px', usage: 'Large gaps', swiftui: '.spacing(20)' },
                  { token: 'Space-24', value: '24px', usage: 'Section spacing', swiftui: '.spacing(24)' },
                  { token: 'Space-32', value: '32px', usage: 'Major sections', swiftui: '.spacing(32)' }
                ].map((item, index) => (
                  <tr key={index}>
                    <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-primary)]">{item.token}</td>
                    <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-secondary)]">{item.value}</td>
                    <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-secondary)]">{item.usage}</td>
                    <td className="py-3 px-2 jz-text-caption text-[color:var(--color-jz-text-tertiary)]">{item.swiftui}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </JZCardContent>
      </JZCard>

      {/* Border Radius */}
      <JZCard>
        <JZCardHeader>
          <h2 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)]">Border Radius</h2>
        </JZCardHeader>
        <JZCardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[color:var(--color-jz-border)]">
                  <th className="text-left py-3 px-2 jz-text-body font-semibold text-[color:var(--color-jz-text-primary)]">Token</th>
                  <th className="text-left py-3 px-2 jz-text-body font-semibold text-[color:var(--color-jz-text-primary)]">Value</th>
                  <th className="text-left py-3 px-2 jz-text-body font-semibold text-[color:var(--color-jz-text-primary)]">Usage</th>
                  <th className="text-left py-3 px-2 jz-text-body font-semibold text-[color:var(--color-jz-text-primary)]">SwiftUI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-jz-border)]">
                {[
                  { token: 'button', value: '12px', usage: 'Buttons, Chips', swiftui: '.cornerRadius(12)' },
                  { token: 'card', value: '12px', usage: 'Cards, Modals', swiftui: '.cornerRadius(12)' },
                  { token: 'preview', value: '20px', usage: 'Image Previews', swiftui: '.cornerRadius(20)' }
                ].map((item, index) => (
                  <tr key={index}>
                    <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-primary)]">{item.token}</td>
                    <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-secondary)]">{item.value}</td>
                    <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-secondary)]">{item.usage}</td>
                    <td className="py-3 px-2 jz-text-caption text-[color:var(--color-jz-text-tertiary)]">{item.swiftui}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </JZCardContent>
      </JZCard>

      {/* Shadow */}
      <JZCard>
        <JZCardHeader>
          <h2 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)]">Shadow</h2>
        </JZCardHeader>
        <JZCardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[color:var(--color-jz-border)]">
                  <th className="text-left py-3 px-2 jz-text-body font-semibold text-[color:var(--color-jz-text-primary)]">Type</th>
                  <th className="text-left py-3 px-2 jz-text-body font-semibold text-[color:var(--color-jz-text-primary)]">Values</th>
                  <th className="text-left py-3 px-2 jz-text-body font-semibold text-[color:var(--color-jz-text-primary)]">Usage</th>
                  <th className="text-left py-3 px-2 jz-text-body font-semibold text-[color:var(--color-jz-text-primary)]">SwiftUI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-jz-border)]">
                <tr>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-primary)]">Card</td>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-secondary)]">y=8, blur=24, opacity=12%</td>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-secondary)]">Cards, Modals</td>
                  <td className="py-3 px-2 jz-text-caption text-[color:var(--color-jz-text-tertiary)]">.shadow(color: .black.opacity(0.12), radius: 12, y: 4)</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-primary)]">Button</td>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-secondary)]">y=4, blur=12, opacity=15%</td>
                  <td className="py-3 px-2 jz-text-body text-[color:var(--color-jz-text-secondary)]">Primary Buttons</td>
                  <td className="py-3 px-2 jz-text-caption text-[color:var(--color-jz-text-tertiary)]">.shadow(color: .black.opacity(0.15), radius: 6, y: 2)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </JZCardContent>
      </JZCard>

      {/* Components */}
      <JZCard>
        <JZCardHeader>
          <h2 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)]">Components</h2>
        </JZCardHeader>
        <JZCardContent>
          <div className="space-y-6">
            {/* Button */}
            <div>
              <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-3">JZ/Button</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[color:var(--color-jz-border)]">
                      <th className="text-left py-2 px-2 jz-text-caption font-semibold text-[color:var(--color-jz-text-primary)]">Variant</th>
                      <th className="text-left py-2 px-2 jz-text-caption font-semibold text-[color:var(--color-jz-text-primary)]">States</th>
                      <th className="text-left py-2 px-2 jz-text-caption font-semibold text-[color:var(--color-jz-text-primary)]">SwiftUI Implementation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--color-jz-border)]">
                    <tr>
                      <td className="py-2 px-2 jz-text-caption text-[color:var(--color-jz-text-primary)]">Primary</td>
                      <td className="py-2 px-2 jz-text-caption text-[color:var(--color-jz-text-secondary)]">default, pressed, disabled, loading</td>
                      <td className="py-2 px-2 jz-text-caption text-[color:var(--color-jz-text-tertiary)]">ButtonStyle with LinearGradient</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 jz-text-caption text-[color:var(--color-jz-text-primary)]">Secondary</td>
                      <td className="py-2 px-2 jz-text-caption text-[color:var(--color-jz-text-secondary)]">default, pressed, disabled, loading</td>
                      <td className="py-2 px-2 jz-text-caption text-[color:var(--color-jz-text-tertiary)]">BorderedButtonStyle + custom colors</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Slider */}
            <div>
              <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-3">JZ/Slider (Strong Control)</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[color:var(--color-jz-border)]">
                      <th className="text-left py-2 px-2 jz-text-caption font-semibold text-[color:var(--color-jz-text-primary)]">Element</th>
                      <th className="text-left py-2 px-2 jz-text-caption font-semibold text-[color:var(--color-jz-text-primary)]">Specs</th>
                      <th className="text-left py-2 px-2 jz-text-caption font-semibold text-[color:var(--color-jz-text-primary)]">SwiftUI Implementation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--color-jz-border)]">
                    <tr>
                      <td className="py-2 px-2 jz-text-caption text-[color:var(--color-jz-text-primary)]">Thumb</td>
                      <td className="py-2 px-2 jz-text-caption text-[color:var(--color-jz-text-secondary)]">32pt, White + JZAccent border</td>
                      <td className="py-2 px-2 jz-text-caption text-[color:var(--color-jz-text-tertiary)]">Custom SliderStyle with .frame(width: 32, height: 32)</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 jz-text-caption text-[color:var(--color-jz-text-primary)]">Value Label</td>
                      <td className="py-2 px-2 jz-text-caption text-[color:var(--color-jz-text-secondary)]">Right-aligned, JZAccent background</td>
                      <td className="py-2 px-2 jz-text-caption text-[color:var(--color-jz-text-tertiary)]">HStack with Spacer() + Text().background()</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Before/After Slider */}
            <div>
              <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-3">Before/After Slider</h3>
              <div className="bg-[color:var(--color-jz-card)] p-4 rounded-[--radius-jz-card] border border-[color:var(--color-jz-border)]">
                <p className="jz-text-caption text-[color:var(--color-jz-text-secondary)] mb-2">SwiftUI実装のポイント：</p>
                <ul className="space-y-1 jz-text-caption text-[color:var(--color-jz-text-tertiary)]">
                  <li>• GeometryReader + DragGesture でスライダーハンドル制御</li>
                  <li>• .clipShape() で画像のマスク処理</li>
                  <li>• @State var sliderPosition: CGFloat = 0.5 で位置管理</li>
                  <li>• ハンドルは32pt、中央にSF Symbol配置</li>
                </ul>
              </div>
            </div>
          </div>
        </JZCardContent>
      </JZCard>

      {/* Final Notes */}
      <JZCard>
        <JZCardHeader>
          <h2 className="jz-font-display jz-text-display-medium text-[color:var(--color-jz-text-primary)]">実装ノート</h2>
        </JZCardHeader>
        <JZCardContent>
          <div className="space-y-4">
            <div>
              <h4 className="jz-text-body font-semibold text-[color:var(--color-jz-text-primary)] mb-2">アクセシビリティ</h4>
              <ul className="space-y-1 jz-text-body text-[color:var(--color-jz-text-secondary)]">
                <li>• 最小タップ領域: 44pt以上を維持</li>
                <li>• Dynamic Type対応: .font(.title2) 等でサイズ調整</li>
                <li>• VoiceOver: .accessibilityLabel() で適切な説明を付与</li>
              </ul>
            </div>
            
            <div>
              <h4 className="jz-text-body font-semibold text-[color:var(--color-jz-text-primary)] mb-2">文言統一</h4>
              <ul className="space-y-1 jz-text-body text-[color:var(--color-jz-text-secondary)]">
                <li>• CTA: 生成する / サンプルで試す / 保存 / 再生成 / 通報 / 購入</li>
                <li>• エラー: うまくいきませんでした。内容を少し具体的にして再試行してください。</li>
                <li>• 動詞始まりのボタン文言を徹底</li>
              </ul>
            </div>

            <div>
              <h4 className="jz-text-body font-semibold text-[color:var(--color-jz-text-primary)] mb-2">Strong Control表現</h4>
              <ul className="space-y-1 jz-text-body text-[color:var(--color-jz-text-secondary)]">
                <li>• 強度スライダーの32ptノブで「コントロール感」を演出</li>
                <li>• 範囲選択は8点ハンドルで精密操作をサポート</li>
                <li>• 値の可視化（右上ラベル）で設定内容を明確化</li>
              </ul>
            </div>
          </div>
        </JZCardContent>
      </JZCard>
    </div>
  );
};