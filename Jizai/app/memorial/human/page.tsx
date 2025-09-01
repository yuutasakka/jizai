import type { Metadata } from 'next';
import Script from 'next/script';
import Link from 'next/link';
import { ExampleGallery } from '../../src/components/ExampleGallery';
import Image from 'next/image';

export const dynamic = 'force-static';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://{your-domain}';

export const generateMetadata = (): Metadata => ({
  title: '遺影写真の編集・四つ切/A4/L判対応｜当日仕上げ – JIZAI',
  description:
    '遺影の背景・服装・肌/髪の整えを自然に。四つ切・A4・L判に最適化、やり直し2回無料。最短当日で仕上げます。',
  alternates: { canonical: `${SITE}/memorial/human` },
  openGraph: {
    title: '遺影写真の編集・四つ切/A4/L判対応｜当日仕上げ – JIZAI',
    description:
      '遺影の背景・服装・肌/髪の整えを自然に。四つ切・A4・L判に最適化、やり直し2回無料。最短当日で仕上げます。',
    url: `${SITE}/memorial/human`,
    type: 'website',
  },
});
export const revalidate = 86400;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: '遺影写真編集',
  provider: { '@type': 'Organization', name: 'JIZAI' },
  areaServed: 'JP',
  offers: { '@type': 'AggregateOffer', lowPrice: '160', priceCurrency: 'JPY' },
};

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'どの写真が適切ですか？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '正面・ピント良・影少なめ。スマホ撮影は反射を避け真上から。',
      },
    },
    {
      '@type': 'Question',
      name: '不自然になりませんか？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '自然さ優先。服装/背景は仕上げ前にプレビューで確認できます。',
      },
    },
    {
      '@type': 'Question',
      name: 'サイズは？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '祭壇は四つ切、掲示はA4、自宅・焼香台はL判/小キャビネが一般的です。',
      },
    },
  ],
};

export default function Page() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* パンくず */}
      <nav className="text-sm mb-6 text-[color:var(--color-jz-text-secondary)]">
        <Link href="/" className="underline">Home</Link> <span>›</span> <Link href="/memorial/human" className="underline">用途別</Link> <span>›</span> <strong>遺影写真（人）</strong>
      </nav>

      {/* Hero */}
      <section className="text-center mb-10">
        <h1 className="jz-font-display jz-text-display-large mb-3">遺影写真の編集と仕上げ</h1>
        <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">四つ切・A4・L判に最適化。服装・背景・肌/髪の整え。やり直し2回無料、当日仕上げ可。</p>
        <div className="mt-4">
          <a href="/" className="inline-block px-5 py-3 rounded-md bg-[color:var(--color-jz-accent)] text-white">この用途で作成する</a>
        </div>
      </section>

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

      {/* 使い方（3ステップ） */}
      <section id="howto" className="mb-12">
        <h2 className="jz-font-display jz-text-display-small mb-4">使い方（3ステップ）</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <h3 className="font-medium mb-1">1. 写真を選ぶ</h3>
            <p className="jz-text-body">スマホ撮影でもOK。反射を避け、正面・ピント・影の少ない写真が理想です。</p>
          </div>
          <div>
            <h3 className="font-medium mb-1">2. プリセットを選ぶ</h3>
            <p className="jz-text-body">服装（喪服/白シャツ+黒ネクタイ）、背景（白/薄グレー/やわらかグラデ）、整え（髪の乱れ・肌・メガネ反射）を選択。<br/>※自由入力は折りたたみ（上級者向け）。</p>
          </div>
          <div>
            <h3 className="font-medium mb-1">3. サイズ・書き出し</h3>
            <p className="jz-text-body">四つ切/A4/L判/小キャビネ/2L、<strong>300/350dpi</strong>、<strong>塗り足し3mm</strong>に対応。断裁ガイドで構図を確認して書き出し。</p>
          </div>
        </div>
      </section>

      {/* 用途別プリセット（推奨） */}
      <section id="preset" className="mb-12">
        <h2 className="jz-font-display jz-text-display-small mb-4">用途別プリセット（推奨）</h2>
        <ul className="jz-text-body space-y-1 mb-4">
          <li>• 服装：喪服 / 白シャツ＋黒ネクタイ</li>
          <li>• 背景：無地白 / 薄グレー / やわらかグラデ（淡）</li>
          <li>• 整え：髪の乱れの整え・肌の自然な補正・メガネ反射の軽減</li>
        </ul>
        <a href="/?usecase=human&preset=bg-plain" className="inline-block px-4 py-2 rounded-md border bg-[color:var(--color-jz-card)] hover:bg-[color:var(--color-jz-surface)]">この設定で作成する</a>
      </section>

      {/* サイズ・印刷設定 */}
      <section id="print" className="mb-12">
        <h2 className="jz-font-display jz-text-display-small mb-4">サイズ・印刷設定</h2>
        <ul className="jz-text-body space-y-1">
          <li>・対応サイズ：四つ切(254×305mm) / A4(210×297mm) / L判(89×127mm) / 小キャビネ(120×165mm) / 2L(127×178mm)</li>
          <li>・解像度：<strong>300/350dpi</strong>、色空間：<strong>sRGB</strong></li>
          <li>・断裁：<strong>塗り足し3mm</strong>、セーフマージン5mm（顔や文字が縁に寄らないように）</li>
          <li>・リサイズ：<strong>フィット（余白）</strong> / <strong>フィル（トリミング）</strong></li>
        </ul>
      </section>

      {/* 仕上がり例（Before/After） */}
      <section id="examples" className="mb-12 space-y-3">
        <h2 className="jz-font-display jz-text-display-small mb-2">仕上がり例</h2>
        <ExampleGallery usecase="human" />
        <p className="text-xs text-[color:var(--color-jz-text-tertiary)]">※プレビューは英語表記です。画像に日本語の文字を入れる場合は、その部分を日本語に置き換えてから生成してください。</p>
      </section>

      {/* 料金 */}
      <section id="pricing" className="mb-12">
        <h2 className="jz-font-display jz-text-display-small mb-4">料金</h2>
        {/* 新・クレジットプラン */}
        {/* @ts-expect-error Server Component import */}
        {require('../../_components/PricingCredits').default()}
      </section>

      {/* よくある質問 */}
      <section id="faq" className="mb-12">
        <h2 className="jz-font-display jz-text-display-small mb-4">よくある質問</h2>
        <div className="space-y-3 jz-text-body">
          <div>
            <h3 className="font-medium">Q. どの写真が適切ですか？</h3>
            <p>A. 正面・ピント良・影少なめ。スマホ撮影は反射を避け、真上から。</p>
          </div>
          <div>
            <h3 className="font-medium">Q. 不自然になりませんか？</h3>
            <p>A. 自然さを最優先に仕上げます。保存前にプレビューで確認できます。</p>
          </div>
          <div>
            <h3 className="font-medium">Q. サイズの選び方は？</h3>
            <p>A. 祭壇＝四つ切、掲示＝A4、自宅・焼香台＝L判/小キャビネが一般的です。</p>
          </div>
        </div>
      </section>

      

      {/* 法務 */}
      <section className="text-center jz-text-caption text-[color:var(--color-jz-text-tertiary)]">
        <a href="#terms" className="underline mr-3">利用規約</a>
        <a href="#privacy" className="underline mr-3">プライバシー</a>
        <a href="#commerce" className="underline">特定商取引法</a>
      </section>

      {/* フッターナビ（用途別） */}
      <footer className="mt-6 text-center">
        <div className="inline-flex flex-wrap gap-4 jz-text-caption">
          <a className="underline" href="/memorial/human">遺影写真（人）</a>
          <a className="underline" href="/memorial/pet">ペット遺影</a>
          <a className="underline" href="/memorial/seizen">生前撮影</a>
          <a className="underline" href="/memorial/photo">メモリアルフォト</a>
        </div>
      </footer>

      {/* JSON-LD */}
      <Script id="jsonld-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: '用途別', item: `${SITE}/memorial/human` },
          { '@type': 'ListItem', position: 3, name: '遺影写真（人）', item: `${SITE}/memorial/human` },
        ]
      }) }} />
      <Script id="jsonld-service" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Script id="jsonld-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        ...faqLd,
        mainEntity: [
          { '@type': 'Question', name: 'どの写真が適切ですか？', acceptedAnswer: { '@type': 'Answer', text: '正面・ピント良・影少なめ。スマホ撮影は反射を避け、真上から。' }},
          { '@type': 'Question', name: '不自然になりませんか？', acceptedAnswer: { '@type': 'Answer', text: '自然さを最優先に仕上げます。保存前にプレビューで確認できます。' }},
          { '@type': 'Question', name: 'サイズの選び方は？', acceptedAnswer: { '@type': 'Answer', text: '祭壇＝四つ切、掲示＝A4、自宅・焼香台＝L判/小キャビネが一般的です。' }},
        ]
      }) }} />
      <Script id="jsonld-howto" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: '遺影写真の作成手順',
        step: [
          { '@type': 'HowToStep', name: '写真を選ぶ', text: 'スマホ撮影でもOK。反射を避け、正面・ピント良・影少なめの写真を選びます。' },
          { '@type': 'HowToStep', name: 'プリセットを選ぶ', text: '服装・背景・整えの項目から選びます。自由入力は上級者向け。' },
          { '@type': 'HowToStep', name: 'サイズ・書き出し', text: '四つ切/A4/L判/小キャビネ/2L・300/350dpi・塗り足し3mmで書き出します。' },
        ],
      }) }} />

      {/* 関連リンク（用途横断） */}
      <aside id="links" className="mt-10 text-center">
        <h2 className="jz-font-display jz-text-display-small mb-3">関連リンク（用途横断）</h2>
        <div className="inline-flex flex-wrap gap-4 jz-text-body">
          <Link className="underline" href="/memorial/seizen">生前撮影の整えを見る</Link>
          <Link className="underline" href="/memorial/photo">メモリアルフォトの整えを見る</Link>
        </div>
      </aside>
    </main>
  );
}
