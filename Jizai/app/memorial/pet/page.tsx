import type { Metadata } from 'next';
import Script from 'next/script';
import { ExampleGallery } from '../../src/components/ExampleGallery';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-static';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://{your-domain}';

export const generateMetadata = (): Metadata => ({
  title: 'ペット遺影の編集｜毛並み整え・背景無地化 – JIZAI',
  description: 'ペット遺影の毛並み整え・背景無地化・色味補正。四つ切・A4・L判対応。自然な仕上がりで当日対応。',
  alternates: { canonical: `${SITE}/memorial/pet` },
  openGraph: {
    title: 'ペット遺影の編集｜毛並み整え・背景無地化 – JIZAI',
    description: 'ペット遺影の毛並み整え・背景無地化・色味補正。四つ切・A4・L判対応。自然な仕上がりで当日対応。',
    url: `${SITE}/memorial/pet`,
    type: 'website',
  },
});
export const revalidate = 86400;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'ペット遺影編集',
  provider: { '@type': 'Organization', name: 'JIZAI' },
  areaServed: 'JP',
  offers: { '@type': 'AggregateOffer', lowPrice: '160', priceCurrency: 'JPY' },
};

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: '動いている写真でも大丈夫？', acceptedAnswer: { '@type': 'Answer', text: 'ブレが少ない写真を推奨しますが、軽微なブレは整え可能です。' }},
    { '@type': 'Question', name: '小物を消せますか？', acceptedAnswer: { '@type': 'Answer', text: '自然な範囲で不要物の削除に対応します。' }},
    { '@type': 'Question', name: '背景は好きな色にできますか？', acceptedAnswer: { '@type': 'Answer', text: '無地化や色の調整が可能です。お好みに合わせて仕上げます。' }},
  ],
};

export default function Page() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <nav className="text-sm mb-6 text-[color:var(--color-jz-text-secondary)]">
        <Link href="/" className="underline">Home</Link> <span>›</span> <Link href="/memorial/human" className="underline">用途別</Link> <span>›</span> <strong>ペット遺影</strong>
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
      <section className="text-center mb-10">
        <h1 className="jz-font-display jz-text-display-large mb-3">ペット遺影の編集と仕上げ</h1>
        <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">毛並みの整え・背景無地化・色味補正。四つ切/A4/L判、当日対応。</p>
        <div className="mt-4"><a href="/" className="inline-block px-5 py-3 rounded-md bg-[color:var(--color-jz-accent)] text-white">この用途で作成する</a></div>
      </section>
      {/* 仕上がり例（折り目の上に露出を上げる） */}
      <section id="examples" className="mb-12 space-y-3">
        <h2 className="jz-font-display jz-text-display-small mb-2">仕上がり例</h2>
        <ExampleGallery usecase="pet" />
        <p className="text-xs text-[color:var(--color-jz-text-tertiary)]">※プレビューは英語表記です。画像に日本語の文字を入れる場合は、その部分を日本語に置き換えてから生成してください。</p>
      </section>
      <section id="howto" className="mb-12">
        <h2 className="jz-font-display jz-text-display-small mb-4">使い方（3ステップ）</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div><h3 className="font-medium mb-1">1. 写真を選ぶ</h3><p className="jz-text-body">スマホ撮影でもOK。反射を避け、正面・ピント・影の少ない写真が理想です。</p></div>
          <div><h3 className="font-medium mb-1">2. プリセットを選ぶ</h3><p className="jz-text-body">毛並み（過剰なぼかしは避ける）/ 背景（白・薄グレー・やわらかグラデ）/ 色味（自然な補正）を選択。</p></div>
          <div><h3 className="font-medium mb-1">3. サイズ・書き出し</h3><p className="jz-text-body">四つ切/A4/L判/小キャビネ/2L、<strong>300/350dpi</strong>、<strong>塗り足し3mm</strong>に対応。</p></div>
        </div>
      </section>
      <section id="preset" className="mb-12">
        <h2 className="jz-font-display jz-text-display-small mb-4">用途別プリセット（推奨）</h2>
        <ul className="jz-text-body space-y-1 mb-4">
          <li>• 毛並み：乱れの整え（過剰なぼかしは避ける）</li>
          <li>• 背景：無地白 / 薄グレー / やわらかグラデ</li>
          <li>• 色味：被写体の色を保った軽微な補正（目の輝きは不自然にならない範囲）</li>
        </ul>
        <a href="/?usecase=pet&preset=fur" className="inline-block px-4 py-2 rounded-md border bg-[color:var(--color-jz-card)] hover:bg-[color:var(--color-jz-surface)]">この設定で作成する</a>
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
          <div><h3 className="font-medium">Q. 毛並みはどこまで整えられますか？</h3><p>A. 不自然にならない範囲で整えます。耳・ひげのエッジは丁寧に残します。</p></div>
          <div><h3 className="font-medium">Q. 背景は好きな色にできますか？</h3><p>A. 無地化や色の調整が可能です。お好みに合わせて仕上げます。</p></div>
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
          { '@type': 'ListItem', position: 3, name: 'ペット遺影', item: `${SITE}/memorial/pet` },
        ]
      }) }} />
      <Script id="jsonld-service" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Script id="jsonld-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        ...faqLd,
        mainEntity: [
          { '@type': 'Question', name: '毛並みはどこまで整えられますか？', acceptedAnswer: { '@type': 'Answer', text: '不自然にならない範囲で整えます。耳・ひげのエッジは丁寧に残します。' }},
          { '@type': 'Question', name: '背景は好きな色にできますか？', acceptedAnswer: { '@type': 'Answer', text: '無地化や色の調整が可能です。お好みに合わせて仕上げます。' }},
        ]
      }) }} />
      <Script id="jsonld-howto" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: 'ペット遺影の作成手順',
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
    </main>
  );
}
