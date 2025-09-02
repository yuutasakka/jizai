import type { Metadata } from 'next';
import Script from 'next/script';
import { CtaButtons } from '../../src/components/CtaButtons';
import { StickyCta } from '../../src/components/StickyCta';
import { Testimonials } from '../../src/components/Testimonials';
import { ExampleGallery } from '../../src/components/ExampleGallery';

export const dynamic = 'force-static';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://{your-domain}';

export const generateMetadata = (): Metadata => ({
  title: '生前撮影 レタッチ｜終活 ポートレート 最適仕上げ – JIZAI',
  description: '生前撮影の編集・レタッチサービス。終活ポートレートの肌や色味を自然に整え、四つ切・A4・L判へ最適書き出し。断裁ガイド付きで失敗しません。',
  alternates: { canonical: `${SITE}/memorial/seizen` },
  openGraph: {
    title: '生前撮影（終活）のレタッチ・最適仕上げ – JIZAI',
    description: '生前撮影の肌や色味を自然に整え、四つ切・A4・L判へ書き出し。断裁ガイド付きで失敗しません。',
    url: `${SITE}/memorial/seizen`,
    type: 'website',
  },
});
export const revalidate = 86400;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: '生前撮影レタッチ',
  provider: { '@type': 'Organization', name: 'JIZAI' },
  areaServed: 'JP',
  offers: { '@type': 'AggregateOffer', lowPrice: '160', priceCurrency: 'JPY' },
};

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: '派手になりすぎませんか？', acceptedAnswer: { '@type': 'Answer', text: '自然な印象を重視したレタッチを行います。' }},
    { '@type': 'Question', name: '服のシワは整えられますか？', acceptedAnswer: { '@type': 'Answer', text: '目立つシワは目立ちにくく調整可能です。' }},
    { '@type': 'Question', name: 'サイズの指定は可能ですか？', acceptedAnswer: { '@type': 'Answer', text: '四つ切/A4/L判など、ご希望のサイズで書き出せます。' }},
  ],
};

export default function Page() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <nav className="text-sm mb-6 text-[color:var(--color-jz-text-secondary)]">
        <Link href="/" className="underline">Home</Link> <span>›</span> <Link href="/memorial/human" className="underline">用途別</Link> <span>›</span> <strong>生前撮影</strong>
      </nav>
      {/* 目次（TOC） */}
      <nav aria-label="目次" className="mb-6">
        <div className="hidden md:flex gap-4 jz-text-caption">
          <a href="#howto" className="underline">使い方</a>
          <a href="#preset" className="underline">用途別プリセット</a>
          <a href="#print" className="underline">サイズ・印刷</a>
          <a href="#examples" className="underline">仕上がり例</a>
          <a href="#pricing" className="underline">料金</a>
          <a href="#faq" className="underline">FAQ</a>
        </div>
        <details className="md:hidden">
          <summary className="jz-text-caption cursor-pointer">目次</summary>
          <div className="mt-2 flex flex-wrap gap-3 jz-text-caption">
            <a href="#howto" className="underline">使い方</a>
            <a href="#preset" className="underline">用途別プリセット</a>
            <a href="#print" className="underline">サイズ・印刷</a>
            <a href="#examples" className="underline">仕上がり例</a>
            <a href="#pricing" className="underline">料金</a>
            <a href="#faq" className="underline">FAQ</a>
          </div>
        </details>
      </nav>
      <section className="text-center mb-6">
        <h1 className="jz-font-display jz-text-display-large mb-3">生前撮影のレタッチと最適仕上げ</h1>
        <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">終活ポートレートの整えとサイズ書き出し。自然な仕上がりで。</p>
        <CtaButtons usecase="seizen" />
      </section>
      <Testimonials usecase="seizen" />
      {/* 仕上がり例（折り目の上に露出を上げる） */}
      <section id="examples" className="mb-12 space-y-3">
        <h2 className="jz-font-display jz-text-display-small mb-2">仕上がり例</h2>
        <ExampleGallery usecase="seizen" />
        <p className="text-xs text-[color:var(--color-jz-text-tertiary)]">※プレビューは英語表記です。画像に日本語の文字を入れる場合は、その部分を日本語に置き換えてから生成してください。</p>
      </section>
      <section id="howto" className="mb-12">
        <h2 className="jz-font-display jz-text-display-small mb-4">使い方（3ステップ）</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div><h3 className="font-medium mb-1">1. 写真を選ぶ</h3><p className="jz-text-body">スマホ撮影でもOK。反射を避け、正面・ピント・影の少ない写真が理想です。</p></div>
          <div><h3 className="font-medium mb-1">2. プリセットを選ぶ</h3><p className="jz-text-body">肌（しわ・くすみの軽い改善）/ 背景（無地化・やわらかグラデ）/ トーン（彩度・明度の微調整）を選択。</p></div>
          <div><h3 className="font-medium mb-1">3. サイズ・書き出し</h3><p className="jz-text-body">四つ切/A4/L判/小キャビネ/2L、<strong>300/350dpi</strong>、<strong>塗り足し3mm</strong>に対応。</p></div>
        </div>
      </section>
      <section id="preset" className="mb-12">
        <h2 className="jz-font-display jz-text-display-small mb-4">用途別プリセット（推奨）</h2>
        <ul className="jz-text-body space-y-1 mb-4">
          <li>• 肌：しわ・くすみの軽い改善（自然さ優先）</li>
          <li>• 背景：無地化 / やわらかグラデ</li>
          <li>• トーン：彩度・明度をわずかに整える</li>
        </ul>
        <a href="/?usecase=seizen&preset=natural-retouch" className="inline-block px-4 py-2 rounded-md border bg-[color:var(--color-jz-card)] hover:bg-[color:var(--color-jz-surface)]">この設定で作成する</a>
      </section>
      <section id="print" className="mb-12">
        <h2 className="jz-font-display jz-text-display-small mb-4">サイズ・印刷設定</h2>
        <ul className="jz-text-body space-y-1">
          <li>・対応サイズ：四つ切(254×305mm) / A4(210×297mm) / L判(89×127mm) / 小キャビネ(120×165mm) / 2L(127×178mm)</li>
          <li>・解像度：<strong>300/350dpi</strong>、色空間：<strong>sRGB</strong></li>
          <li>・断裁：<strong>塗り足し3mm</strong>、セーフマージン5mm</li>
          <li>・リサイズ：<strong>フィット（余白）</strong> / <strong>フィル（トリミング）</strong></li>
        </ul>
      </section>
      {/* examples section moved above */}
      <section id="pricing" className="mb-12">
        <h2 className="jz-font-display jz-text-display-small mb-4">料金</h2>
        {/* 新・クレジットプラン */}
        {/* @ts-expect-error Server Component import */}
        {require('../../_components/PricingCredits').default()}
      </section>
      <section id="faq" className="mb-12">
        <h2 className="jz-font-display jz-text-display-small mb-4">よくある質問</h2>
        <div className="space-y-3 jz-text-body">
          <div><h3 className="font-medium">Q. 肌のレタッチはどの程度まで？</h3><p>A. 自然さを損なわない軽微な改善にとどめます。</p></div>
        </div>
      </section>
      
      <section className="text-center jz-text-caption text-[color:var(--color-jz-text-tertiary)]">
        <a href="#terms" className="underline mr-3">利用規約</a>
        <a href="#privacy" className="underline mr-3">プライバシー</a>
        <a href="#commerce" className="underline">特定商取引法</a>
      </section>
      <footer className="mt-6 text-center">
        <div className="inline-flex flex-wrap gap-4 jz-text-caption">
          <a className="underline" href="/memorial/human">遺影写真（人）</a>
          <a className="underline" href="/memorial/pet">ペット遺影</a>
          <a className="underline" href="/memorial/seizen">生前撮影</a>
          <a className="underline" href="/memorial/photo">メモリアルフォト</a>
        </div>
      </footer>
      <Script id="jsonld-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: '用途別', item: `${SITE}/memorial/human` },
          { '@type': 'ListItem', position: 3, name: '生前撮影', item: `${SITE}/memorial/seizen` },
        ]
      }) }} />
      <Script id="jsonld-service" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Script id="jsonld-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        ...faqLd,
        mainEntity: [
          { '@type': 'Question', name: '肌のレタッチはどの程度まで？', acceptedAnswer: { '@type': 'Answer', text: '自然さを損なわない軽微な改善にとどめます。' }},
        ]
      }) }} />
      <Script id="jsonld-howto" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: '生前撮影レタッチの手順',
        step: [
          { '@type': 'HowToStep', name: '写真を選ぶ', text: 'スマホ撮影でもOK。反射を避け、正面・ピント良・影少なめの写真を選びます。' },
          { '@type': 'HowToStep', name: 'プリセットを選ぶ', text: '服装・背景・整えの項目から選びます。自由入力は上級者向け。' },
          { '@type': 'HowToStep', name: 'サイズ・書き出し', text: '四つ切/A4/L判/小キャビネ/2L・300/350dpi・塗り足し3mmで書き出します。' },
        ],
      }) }} />

      <aside id="links" className="mt-10 text-center">
        <h2 className="jz-font-display jz-text-display-small mb-3">関連リンク（用途横断）</h2>
        <div className="inline-flex flex-wrap gap-4 jz-text-body">
          <Link className="underline" href="/memorial/human">遺影写真（人）の整えを見る</Link>
          <Link className="underline" href="/memorial/photo">メモリアルフォトの整えを見る</Link>
        </div>
      </aside>
      <StickyCta usecase="seizen" />
    </main>
  );
}
