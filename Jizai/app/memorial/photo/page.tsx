import type { Metadata } from 'next';
import Script from 'next/script';

export const dynamic = 'force-static';

export const generateMetadata = (): Metadata => ({
  title: 'メモリアルフォトの編集｜四つ切/A4/L判対応 – JIZAI',
  description: '法要・命日の写真整えと印刷最適化。四つ切/A4/L判。',
  alternates: { canonical: 'https://{your-domain}/memorial/photo' },
  openGraph: {
    title: 'メモリアルフォトの編集 – JIZAI',
    description: '法要・命日の写真整えと印刷最適化。四つ切/A4/L判。',
    url: 'https://{your-domain}/memorial/photo',
    type: 'website',
  },
});

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'メモリアルフォト編集',
  provider: { '@type': 'Organization', name: 'JIZAI' },
  areaServed: 'JP',
  offers: { '@type': 'AggregateOffer', lowPrice: '1480', priceCurrency: 'JPY' },
};

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: '人物の追加・削除はできますか？', acceptedAnswer: { '@type': 'Answer', text: '大きな構図変更は要相談ですが、軽微な調整は可能です。' }},
    { '@type': 'Question', name: 'アルバム用にまとめて依頼可能ですか？', acceptedAnswer: { '@type': 'Answer', text: '複数枚にも対応しています。まずはご相談ください。' }},
    { '@type': 'Question', name: '印刷向けの色味調整は可能ですか？', acceptedAnswer: { '@type': 'Answer', text: '印刷に適した色味・明るさへ最適化します。' }},
  ],
};

export default function Page() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <nav className="text-sm mb-6 text-[color:var(--color-jz-text-secondary)]">
        <a href="/" className="underline">Home</a> <span>›</span> <span>用途別</span> <span>›</span> <strong>メモリアルフォト</strong>
      </nav>
      <section className="text-center mb-10">
        <h1 className="jz-font-display jz-text-display-large mb-3">メモリアルフォトの編集</h1>
        <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">法要・命日の写真整えと印刷最適化。四つ切/A4/L判。</p>
        <div className="mt-4"><a href="/" className="inline-block px-5 py-3 rounded-md bg-[color:var(--color-jz-accent)] text-white">この用途で作成する</a></div>
      </section>
      <section className="mb-10">
        <h2 className="jz-font-display jz-text-display-small mb-4">使い方3ステップ</h2>
        <ol className="grid gap-4 md:grid-cols-3 list-decimal list-inside jz-text-body">
          <li>行事のお写真を選ぶ</li>
          <li>不要物の除去やトリミングを指定</li>
          <li>印刷に最適なサイズで書き出し</li>
        </ol>
      </section>
      <section className="mb-10">
        <h2 className="jz-font-display jz-text-display-small mb-4">用途別プリセット</h2>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-2 rounded-md border bg-[color:var(--color-jz-card)]">不要物の除去（推奨）</span>
          <span className="px-3 py-2 rounded-md border bg-[color:var(--color-jz-card)]">色味・明るさ</span>
          <span className="px-3 py-2 rounded-md border bg-[color:var(--color-jz-card)]">トリミング</span>
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
              <img src={`https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=60`} alt="before" className="rounded-md aspect-square object-cover" />
              <img src={`https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=60&sat=-100`} alt="after" className="rounded-md aspect-square object-cover" />
            </div>
          ))}
        </div>
      </section>
      <section className="mb-10">
        <h2 className="jz-font-display jz-text-display-small mb-4">FAQ</h2>
        <div className="space-y-3 jz-text-body">
          <div><p className="font-medium">人物の追加・削除はできますか？</p><p>大きな構図変更は要相談ですが、軽微な調整は可能です。</p></div>
          <div><p className="font-medium">アルバム用にまとめて依頼可能ですか？</p><p>複数枚にも対応しています。まずはご相談ください。</p></div>
          <div><p className="font-medium">印刷向けの色味調整は可能ですか？</p><p>印刷に適した色味・明るさへ最適化します。</p></div>
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
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://{your-domain}/' },
          { '@type': 'ListItem', position: 2, name: '用途別', item: 'https://{your-domain}/' },
          { '@type': 'ListItem', position: 3, name: 'メモリアルフォト', item: 'https://{your-domain}/memorial/photo' },
        ]
      }) }} />
      <Script id="jsonld-service" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Script id="jsonld-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    </main>
  );
}
