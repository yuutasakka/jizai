import React from 'react';
import { JZButton } from '../components/design-system/jizai-button';
import { JZCard, JZCardContent, JZCardHeader } from '../components/design-system/jizai-card';
import { JZChip } from '../components/design-system/jizai-chip';

type QA = { q: string; a: string };
type Preset = { id: string; label: string; recommended?: boolean };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="max-w-4xl mx-auto mb-[var(--space-24)] px-[var(--space-16)]">
      <h2 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)] mb-[var(--space-12)]">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function Hero({ h1, desc }: { h1: string; desc: string }) {
  return (
    <div className="text-center py-[var(--space-24)] px-[var(--space-16)]">
      <h1 className="jz-font-display jz-text-display-large text-[color:var(--color-jz-text-primary)] mb-[var(--space-12)]">{h1}</h1>
      <p className="jz-text-body text-[color:var(--color-jz-text-secondary)] max-w-[560px] mx-auto mb-[var(--space-16)]">{desc}</p>
      <JZButton
        tone="primary"
        size="lg"
        onClick={() => {
          // ホームへ遷移して写真選択を促す
          window.location.href = '/';
          sessionStorage.setItem('memorial-cta', '1');
        }}
      >
        この用途で作成する
      </JZButton>
    </div>
  );
}

function Steps({ items }: { items: string[] }) {
  return (
    <JZCard>
      <JZCardContent>
        <ol className="grid gap-[var(--space-16)] md:grid-cols-3 list-decimal list-inside">
          {items.map((t, i) => (
            <li key={i} className="jz-text-body text-[color:var(--color-jz-text-secondary)]">{t}</li>
          ))}
        </ol>
      </JZCardContent>
    </JZCard>
  );
}

function Presets({ items }: { items: Preset[] }) {
  return (
    <JZCard>
      <JZCardContent>
        <div className="flex flex-wrap gap-[var(--space-8)]">
          {items.map((p) => (
            <JZChip key={p.id} size="md" variant={p.recommended ? 'selected' : 'default'}>
              {p.label}{p.recommended ? '（推奨）' : ''}
            </JZChip>
          ))}
        </div>
      </JZCardContent>
    </JZCard>
  );
}

function Sizes() {
  return (
    <JZCard>
      <JZCardContent>
        <ul className="jz-text-body text-[color:var(--color-jz-text-secondary)] space-y-[var(--space-8)]">
          <li>対応サイズ：四つ切 / A4 / L判 / 小キャビネ / 2L</li>
          <li>解像度：300 / 350 dpi</li>
          <li>塗り足し：3mm（各辺）</li>
        </ul>
      </JZCardContent>
    </JZCard>
  );
}

function Examples({ items }: { items: { before: string; after: string; label?: string }[] }) {
  return (
    <div className="grid gap-[var(--space-16)] md:grid-cols-3">
      {items.map((ex, i) => (
        <JZCard key={i}>
          <JZCardHeader>
            <div className="jz-text-caption text-[color:var(--color-jz-text-secondary)]">{ex.label || 'Before / After'}</div>
          </JZCardHeader>
          <JZCardContent>
            <div className="grid grid-cols-2 gap-[var(--space-8)]">
              <img src={ex.before} alt="before" className="rounded-[--radius-jz-card] object-cover aspect-square w-full" />
              <img src={ex.after} alt="after" className="rounded-[--radius-jz-card] object-cover aspect-square w-full" />
            </div>
          </JZCardContent>
        </JZCard>
      ))}
    </div>
  );
}

function FAQ({ items }: { items: QA[] }) {
  return (
    <JZCard>
      <JZCardContent>
        <div className="space-y-[var(--space-12)]">
          {items.map((qa, i) => (
            <div key={i}>
              <p className="jz-text-body font-medium text-[color:var(--color-jz-text-primary)]">Q. {qa.q}</p>
              <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">A. {qa.a}</p>
            </div>
          ))}
        </div>
      </JZCardContent>
    </JZCard>
  );
}

function Pricing() {
  return (
    <div className="grid md:grid-cols-3 gap-[var(--space-16)]">
      {[{
        title: 'セルフ',
        price: '¥1,500',
        desc: '基本の整えを自分で指定'
      }, {
        title: 'おまかせ',
        price: '¥3,500',
        desc: '全体の整えをおまかせ'
      }, {
        title: '高度修復',
        price: '¥8,000',
        desc: '大幅な補正や修復'
      }].map((p) => (
        <JZCard key={p.title}>
          <JZCardHeader>
            <h3 className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)]">{p.title}</h3>
          </JZCardHeader>
          <JZCardContent>
            <p className="jz-font-display text-2xl text-[color:var(--color-jz-text-primary)] mb-[var(--space-8)]">{p.price}</p>
            <p className="jz-text-body text-[color:var(--color-jz-text-secondary)] mb-[var(--space-12)]">{p.desc}</p>
            <JZButton tone="secondary" fullWidth onClick={() => (window.location.href = '/')}>このプランで進む</JZButton>
          </JZCardContent>
        </JZCard>
      ))}
    </div>
  );
}

function LegalLinks() {
  return (
    <div className="text-center jz-text-caption text-[color:var(--color-jz-text-tertiary)] py-[var(--space-24)]">
      <a href="#terms" className="underline mr-[var(--space-12)]">利用規約</a>
      <a href="#privacy" className="underline mr-[var(--space-12)]">プライバシーポリシー</a>
      <a href="#commerce" className="underline">特定商取引法に基づく表記</a>
    </div>
  );
}

function BaseMemorialPage({ h1, desc, steps, presets, examples, faq }: {
  h1: string;
  desc: string;
  steps: string[];
  presets: Preset[];
  examples: { before: string; after: string; label?: string }[];
  faq: QA[];
}) {
  const [navOpen, setNavOpen] = React.useState(false);
  return (
    <div className="min-h-screen bg-[color:var(--color-jz-surface)]">
      <header className="sticky top-0 z-40 jz-glass-effect border-b border-[color:var(--color-jz-border)]">
        <div className="max-w-5xl mx-auto px-[var(--space-16)] py-[var(--space-16)] flex items-center justify-between">
          <a href="/" className="jz-font-display jz-text-display-small text-[color:var(--color-jz-text-primary)]">JIZAI</a>
          <div className="flex items-center gap-[var(--space-8)] relative">
            <div className="relative">
              <button
                onClick={() => setNavOpen(!navOpen)}
                className="px-[var(--space-12)] py-[var(--space-8)] rounded-[--radius-jz-button] border border-[color:var(--color-jz-border)] text-[color:var(--color-jz-text-primary)] hover:bg-[color:var(--color-jz-card)]"
              >
                用途別 ▾
              </button>
              {navOpen && (
                <div className="absolute right-0 mt-[var(--space-8)] w-[240px] bg-[color:var(--color-jz-card)] border border-[color:var(--color-jz-border)] rounded-[--radius-jz-card] shadow-lg z-50">
                  <a href="/memorial/human" className="block px-[12px] py-[10px] hover:bg-[color:var(--color-jz-surface)]">遺影写真（人）</a>
                  <a href="/memorial/pet" className="block px-[12px] py-[10px] hover:bg-[color:var(--color-jz-surface)]">ペット遺影</a>
                  <a href="/memorial/seizen" className="block px-[12px] py-[10px] hover:bg-[color:var(--color-jz-surface)]">生前撮影</a>
                  <a href="/memorial/photo" className="block px-[12px] py-[10px] hover:bg-[color:var(--color-jz-surface)]">メモリアルフォト</a>
                </div>
              )}
            </div>
            <a href="#support" className="px-[var(--space-12)] py-[var(--space-8)] rounded-[--radius-jz-button] bg-[color:var(--color-jz-accent)] text-white">24時間サポート</a>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto pb-[var(--space-24)]">
        <Hero h1={h1} desc={desc} />
        <Section title="使い方3ステップ"><Steps items={steps} /></Section>
        <Section title="用途別プリセット"><Presets items={presets} /></Section>
        <Section title="サイズ / 印刷"><Sizes /></Section>
        <Section title="実例"><Examples items={examples} /></Section>
        <Section title="FAQ"><FAQ items={faq} /></Section>
        <Section title="料金"><Pricing /></Section>
        <LegalLinks />
      </main>
    </div>
  );
}

// 画像はフリーのプレースホルダ
const PH_BEFORE = 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=60';
const PH_AFTER  = 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=60&sat=-100';

export function MemorialHumanPage() {
  return (
    <BaseMemorialPage
      h1="遺影写真の編集と仕上げ"
      desc="四つ切・A4・L判対応。服装・背景・肌/髪の整え。やり直し2回無料、当日仕上げ可。"
      steps={[
        '写真を選ぶ（スキャンやスマホ写真でも可）',
        '整えたい点を選択（服・背景・肌や髪など）',
        '仕上がりを確認して保存（当日仕上げOK）',
      ]}
      presets={[
        { id: 'bg-plain', label: '背景無地化', recommended: true },
        { id: 'skin-hair', label: '肌・髪の整え' },
        { id: 'attire', label: '服装の整え' },
      ]}
      examples={[
        { before: PH_BEFORE, after: PH_AFTER, label: '背景無地化' },
        { before: PH_BEFORE, after: PH_AFTER, label: '色味補正' },
      ]}
      faq={[
        { q: '昔の写真でも大丈夫ですか？', a: 'スマホ撮影の写真でも対応可能です。できるだけ明るく撮影してください。' },
        { q: '服装の差し替えは可能ですか？', a: '自然な印象を損なわない範囲で整えます。' },
      ]}
    />
  );
}

export function MemorialPetPage() {
  return (
    <BaseMemorialPage
      h1="ペット遺影の編集と仕上げ"
      desc="毛並みの整え・背景無地化・色味補正。四つ切/A4/L判、当日対応。"
      steps={[
        'お手持ちの写真を選択',
        '毛並み・背景・色味の整えを選ぶ',
        '仕上がりを確認して保存',
      ]}
      presets={[
        { id: 'fur', label: '毛並みの整え', recommended: true },
        { id: 'bg-plain', label: '背景無地化' },
        { id: 'tone', label: '色味補正' },
      ]}
      examples={[
        { before: PH_BEFORE, after: PH_AFTER, label: '毛並みの整え' },
        { before: PH_BEFORE, after: PH_AFTER, label: '背景無地化' },
      ]}
      faq={[
        { q: '動いている写真でも大丈夫？', a: 'ブレが少ない写真を推奨しますが、軽微なブレは整え可能です。' },
        { q: '小物を消せますか？', a: '自然な範囲で不要物の削除に対応します。' },
      ]}
    />
  );
}

export function MemorialSeizenPage() {
  return (
    <BaseMemorialPage
      h1="生前撮影のレタッチと最適仕上げ"
      desc="終活ポートレートの整えとサイズ書き出し。自然な仕上がりで。"
      steps={[
        '写真を選ぶ（スタジオ/ご自宅どちらでも）',
        '明るさ・肌の整え・背景の最適化を選ぶ',
        'サイズ書き出し（四つ切/A4/L判）',
      ]}
      presets={[
        { id: 'natural-retouch', label: '自然なレタッチ', recommended: true },
        { id: 'light-balance', label: '明るさの最適化' },
        { id: 'bg-opt', label: '背景最適化' },
      ]}
      examples={[
        { before: PH_BEFORE, after: PH_AFTER, label: '自然なレタッチ' },
        { before: PH_BEFORE, after: PH_AFTER, label: '明るさ調整' },
      ]}
      faq={[
        { q: '派手になりすぎませんか？', a: '自然な印象を重視したレタッチを行います。' },
        { q: '服のシワは整えられますか？', a: '目立つシワは目立ちにくく調整可能です。' },
      ]}
    />
  );
}

export function MemorialPhotoPage() {
  return (
    <BaseMemorialPage
      h1="メモリアルフォトの編集"
      desc="法要・命日の写真整えと印刷最適化。四つ切/A4/L判。"
      steps={[
        '行事のお写真を選ぶ',
        '不要物の除去やトリミングを指定',
        '印刷に最適なサイズで書き出し',
      ]}
      presets={[
        { id: 'remove-objects', label: '不要物の除去', recommended: true },
        { id: 'tone', label: '色味・明るさ' },
        { id: 'crop', label: 'トリミング' },
      ]}
      examples={[
        { before: PH_BEFORE, after: PH_AFTER, label: '不要物除去' },
        { before: PH_BEFORE, after: PH_AFTER, label: '色味調整' },
      ]}
      faq={[
        { q: '人物の追加・削除はできますか？', a: '大きな構図変更は要相談ですが、軽微な調整は可能です。' },
        { q: 'アルバム用にまとめて依頼可能ですか？', a: '複数枚にも対応しています。まずはご相談ください。' },
      ]}
    />
  );
}
