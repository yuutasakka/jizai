import type { Metadata } from 'next';
import Script from 'next/script';

export const dynamic = 'force-static';

export const generateMetadata = (): Metadata => ({
  title: '遺影写真の編集と仕上げ｜四つ切/A4/L判対応 – JIZAI',
  description:
    '四つ切・A4・L判に最適化。服装・背景・肌/髪の整え。やり直し2回無料、当日仕上げ可。',
  alternates: { canonical: 'https://{your-domain}/memorial/human' },
  openGraph: {
    title: '遺影写真の編集と仕上げ – JIZAI',
    description:
      '四つ切・A4・L判に最適化。服装・背景・肌/髪の整え。やり直し2回無料、当日仕上げ可。',
    url: 'https://{your-domain}/memorial/human',
    type: 'website',
  },
});

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: '遺影写真編集',
  provider: { '@type': 'Organization', name: 'JIZAI' },
  areaServed: 'JP',
  offers: { '@type': 'AggregateOffer', lowPrice: '1480', priceCurrency: 'JPY' },
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
        <a href="/" className="underline">Home</a> <span>›</span> <span>用途別</span> <span>›</span> <strong>遺影写真（人）</strong>
      </nav>

      {/* Hero */}
      <section className="text-center mb-10">
        <h1 className="jz-font-display jz-text-display-large mb-3">遺影写真の編集と仕上げ</h1>
        <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">四つ切・A4・L判に最適化。服装・背景・肌/髪の整え。やり直し2回無料、当日仕上げ可。</p>
        <div className="mt-4">
          <a href="/" className="inline-block px-5 py-3 rounded-md bg-[color:var(--color-jz-accent)] text-white">この用途で作成する</a>
        </div>
      </section>

      {/* 使い方3ステップ */}
      <section className="mb-10">
        <h2 className="jz-font-display jz-text-display-small mb-4">使い方3ステップ</h2>
        <ol className="grid gap-4 md:grid-cols-3 list-decimal list-inside jz-text-body">
          <li>写真を選ぶ（スキャン/スマホ撮影可）</li>
          <li>整えたい点を選択（服・背景・肌/髪）</li>
          <li>仕上がりを確認して保存（当日OK）</li>
        </ol>
      </section>

      {/* 用途別プリセット（推奨） */}
      <section className="mb-10">
        <h2 className="jz-font-display jz-text-display-small mb-4">用途別プリセット</h2>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-2 rounded-md border bg-[color:var(--color-jz-card)]">背景無地化（推奨）</span>
          <span className="px-3 py-2 rounded-md border bg-[color:var(--color-jz-card)]">肌・髪の整え</span>
          <span className="px-3 py-2 rounded-md border bg-[color:var(--color-jz-card)]">服装の整え</span>
        </div>
      </section>

      {/* サイズ/印刷 */}
      <section className="mb-10">
        <h2 className="jz-font-display jz-text-display-small mb-4">サイズ / 印刷</h2>
        <ul className="jz-text-body space-y-1">
          <li>対応サイズ：四つ切 / A4 / L判 / 小キャビネ / 2L</li>
          <li>解像度：300 / 350 dpi</li>
          <li>塗り足し：3mm（各辺）</li>
        </ul>
      </section>

      {/* 実例 */}
      <section className="mb-10">
        <h2 className="jz-font-display jz-text-display-small mb-4">実例</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[1,2,3].map((i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <img src={`https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=60`} alt="before" className="rounded-md aspect-square object-cover" />
              <img src={`https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=60&sat=-100`} alt="after" className="rounded-md aspect-square object-cover" />
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-10">
        <h2 className="jz-font-display jz-text-display-small mb-4">FAQ</h2>
        <div className="space-y-3 jz-text-body">
          <div>
            <p className="font-medium">どの写真が適切ですか？</p>
            <p>正面・ピント良・影少なめ。スマホ撮影は反射を避け真上から。</p>
          </div>
          <div>
            <p className="font-medium">不自然になりませんか？</p>
            <p>自然さ優先。服装/背景は仕上げ前にプレビューで確認できます。</p>
          </div>
          <div>
            <p className="font-medium">サイズは？</p>
            <p>祭壇は四つ切、掲示はA4、自宅・焼香台はL判/小キャビネが一般的です。</p>
          </div>
        </div>
      </section>

      {/* 料金 */}
      <section className="mb-10">
        <h2 className="jz-font-display jz-text-display-small mb-4">料金</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[{t:'セルフ',p:'¥1,500'},{t:'おまかせ',p:'¥3,500'},{t:'高度修復',p:'¥8,000'}].map(x=> (
            <div key={x.t} className="border rounded-md p-4">
              <h3 className="font-semibold mb-2">{x.t}</h3>
              <p className="text-xl mb-2">{x.p}</p>
              <a className="inline-block px-3 py-2 rounded-md border" href="/">このプランで進む</a>
            </div>
          ))}
        </div>
      </section>

      {/* 法務 */}
      <section className="text-center jz-text-caption text-[color:var(--color-jz-text-tertiary)]">
        <a href="#terms" className="underline mr-3">利用規約</a>
        <a href="#privacy" className="underline mr-3">プライバシー</a>
        <a href="#commerce" className="underline">特定商取引法</a>
      </section>

      {/* JSON-LD */}
      <Script id="jsonld-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://{your-domain}/' },
          { '@type': 'ListItem', position: 2, name: '用途別', item: 'https://{your-domain}/' },
          { '@type': 'ListItem', position: 3, name: '遺影写真（人）', item: 'https://{your-domain}/memorial/human' },
        ]
      }) }} />
      <Script id="jsonld-service" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Script id="jsonld-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    </main>
  );
}
