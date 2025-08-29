import type { Metadata } from 'next';
import Script from 'next/script';

export const dynamic = 'force-static';

export const generateMetadata = (): Metadata => ({
  title: 'ペット遺影の編集と仕上げ｜四つ切/A4/L判対応 – JIZAI',
  description: '毛並みの整え・背景無地化・色味補正。四つ切/A4/L判、当日対応。',
  alternates: { canonical: 'https://{your-domain}/memorial/pet' },
  openGraph: {
    title: 'ペット遺影の編集と仕上げ – JIZAI',
    description: '毛並みの整え・背景無地化・色味補正。四つ切/A4/L判、当日対応。',
    url: 'https://{your-domain}/memorial/pet',
    type: 'website',
  },
});

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'ペット遺影編集',
  provider: { '@type': 'Organization', name: 'JIZAI' },
  areaServed: 'JP',
  offers: { '@type': 'AggregateOffer', lowPrice: '1480', priceCurrency: 'JPY' },
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
        <a href="/" className="underline">Home</a> <span>›</span> <span>用途別</span> <span>›</span> <strong>ペット遺影</strong>
      </nav>
      <section className="text-center mb-10">
        <h1 className="jz-font-display jz-text-display-large mb-3">ペット遺影の編集と仕上げ</h1>
        <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">毛並みの整え・背景無地化・色味補正。四つ切/A4/L判、当日対応。</p>
        <div className="mt-4"><a href="/" className="inline-block px-5 py-3 rounded-md bg-[color:var(--color-jz-accent)] text-white">この用途で作成する</a></div>
      </section>
      <section className="mb-10">
        <h2 className="jz-font-display jz-text-display-small mb-4">使い方3ステップ</h2>
        <ol className="grid gap-4 md:grid-cols-3 list-decimal list-inside jz-text-body">
          <li>お手持ちの写真を選択</li>
          <li>毛並み・背景・色味の整えを選ぶ</li>
          <li>仕上がりを確認して保存</li>
        </ol>
      </section>
      <section className="mb-10">
        <h2 className="jz-font-display jz-text-display-small mb-4">用途別プリセット</h2>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-2 rounded-md border bg-[color:var(--color-jz-card)]">毛並みの整え（推奨）</span>
          <span className="px-3 py-2 rounded-md border bg-[color:var(--color-jz-card)]">背景無地化</span>
          <span className="px-3 py-2 rounded-md border bg-[color:var(--color-jz-card)]">色味補正</span>
        </div>
      </section>
      <section className="mb-10">
        <h2 className="jz-font-display jz-text-display-small mb-4">サイズ / 印刷</h2>
        <ul className="jz-text-body space-y-1">
          <li>対応サイズ：四つ切 / A4 / L判 / 小キャビネ / 2L</li>
          <li>解像度：300 / 350 dpi</li>
          <li>塗り足し：3mm（各辺）</li>
        </ul>
      </section>
      <section className="mb-10">
        <h2 className="jz-font-display jz-text-display-small mb-4">実例</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[1,2,3].map((i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <img src={`https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&q=60`} alt="before" className="rounded-md aspect-square object-cover" />
              <img src={`https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&q=60&sat=-100`} alt="after" className="rounded-md aspect-square object-cover" />
            </div>
          ))}
        </div>
      </section>
      <section className="mb-10">
        <h2 className="jz-font-display jz-text-display-small mb-4">FAQ</h2>
        <div className="space-y-3 jz-text-body">
          <div><p className="font-medium">動いている写真でも大丈夫？</p><p>ブレが少ない写真を推奨しますが、軽微なブレは整え可能です。</p></div>
          <div><p className="font-medium">小物を消せますか？</p><p>自然な範囲で不要物の削除に対応します。</p></div>
          <div><p className="font-medium">背景は好きな色にできますか？</p><p>無地化や色の調整が可能です。お好みに合わせて仕上げます。</p></div>
        </div>
      </section>
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
      <section className="text-center jz-text-caption text-[color:var(--color-jz-text-tertiary)]">
        <a href="#terms" className="underline mr-3">利用規約</a>
        <a href="#privacy" className="underline mr-3">プライバシー</a>
        <a href="#commerce" className="underline">特定商取引法</a>
      </section>
      <Script id="jsonld-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://{your-domain}/' },
          { '@type': 'ListItem', position: 2, name: '用途別', item: 'https://{your-domain}/' },
          { '@type': 'ListItem', position: 3, name: 'ペット遺影', item: 'https://{your-domain}/memorial/pet' },
        ]
      }) }} />
      <Script id="jsonld-service" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Script id="jsonld-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    </main>
  );
}
