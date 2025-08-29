import type { Metadata } from 'next';
import Script from 'next/script';
import Link from 'next/link';
import Image from 'next/image';

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
        <Link href="/" className="underline">Home</Link> <span>›</span> <Link href="/memorial/human" className="underline">用途別</Link> <span>›</span> <strong>メモリアルフォト</strong>
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
        <h1 className="jz-font-display jz-text-display-large mb-3">メモリアルフォトの編集</h1>
        <p className="jz-text-body text-[color:var(--color-jz-text-secondary)]">法要・命日の写真整えと印刷最適化。四つ切/A4/L判。</p>
        <div className="mt-4"><a href="/" className="inline-block px-5 py-3 rounded-md bg-[color:var(--color-jz-accent)] text-white">この用途で作成する</a></div>
      </section>
      <section id="howto" className="mb-12">
        <h2 className="jz-font-display jz-text-display-small mb-4">使い方（3ステップ）</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div><h3 className="font-medium mb-1">1. 写真を選ぶ</h3><p className="jz-text-body">スマホ撮影でもOK。反射を避け、正面・ピント・影の少ない写真が理想です。</p></div>
          <div><h3 className="font-medium mb-1">2. プリセットを選ぶ</h3><p className="jz-text-body">背景（無地化・淡いグラデ）/ 整え（色味の自然な補正・不要な写り込み軽減）/ レイアウト（セーフマージン）を選択。</p></div>
          <div><h3 className="font-medium mb-1">3. サイズ・書き出し</h3><p className="jz-text-body">四つ切/A4/L判/小キャビネ/2L、<strong>300/350dpi</strong>、<strong>塗り足し3mm</strong>に対応。</p></div>
        </div>
      </section>
      <section id="preset" className="mb-12">
        <h2 className="jz-font-display jz-text-display-small mb-4">用途別プリセット（推奨）</h2>
        <ul className="jz-text-body space-y-1 mb-4">
          <li>• 背景：無地化 / 祭壇写真用の淡いグラデ</li>
          <li>• 整え：色味の自然な補正・不要な写り込みの軽減</li>
          <li>• レイアウト：断裁を想定したセーフマージンを推奨</li>
        </ul>
        <a href="/?usecase=photo&preset=remove-objects" className="inline-block px-4 py-2 rounded-md border bg-[color:var(--color-jz-card)] hover:bg-[color:var(--color-jz-surface)]">この設定で作成する</a>
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
      <section id="examples" className="mb-12">
        <h2 className="jz-font-display jz-text-display-small mb-4">仕上がり例（Before/After）</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid grid-cols-2 gap-2">
            <Image src="/examples/photo_01_before.png" width={600} height={600} priority alt="メモリアルフォトの不要物を軽減した例（Before）" className="rounded-md aspect-square object-cover" />
            <Image src="/examples/photo_01_after.png" width={600} height={600} alt="メモリアルフォトの不要物を軽減した例（After）" className="rounded-md aspect-square object-cover" />
          </div>
        </div>
        <div className="mt-4"><a href="/?usecase=photo&preset=remove-objects" className="underline">この例で試す</a></div>
      </section>
      <section id="pricing" className="mb-12">
        <h2 className="jz-font-display jz-text-display-small mb-4">料金</h2>
        <div className="space-y-2 jz-text-body">
          <p><strong>セルフ仕上げ ¥1,480</strong> … 差し戻し2回無料 / 当日可 / 四つ切〜2L対応</p>
          <p><strong>おまかせ仕上げ ¥3,980</strong> … 人手チェック（色/髪/肌）/ 優先対応</p>
          <p><strong>高度修復 ¥6,980〜</strong> … 破損修復・白黒→カラー・服装合成（見積）</p>
        </div>
      </section>
      <section id="faq" className="mb-12">
        <h2 className="jz-font-display jz-text-display-small mb-4">よくある質問</h2>
        <div className="space-y-3 jz-text-body">
          <div><h3 className="font-medium">Q. 法要の掲示に最適な設定は？</h3><p>A. A4/350dpi・塗り足し3mmの書き出しを推奨します。</p></div>
          <div><h3 className="font-medium">Q. 人物の追加・削除はできますか？</h3><p>A. 大きな構図変更は要相談ですが、軽微な調整は可能です。</p></div>
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
          { '@type': 'ListItem', position: 2, name: '用途別', item: 'https://{your-domain}/memorial/human' },
          { '@type': 'ListItem', position: 3, name: 'メモリアルフォト', item: 'https://{your-domain}/memorial/photo' },
        ]
      }) }} />
      <Script id="jsonld-service" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Script id="jsonld-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        ...faqLd,
        mainEntity: [
          { '@type': 'Question', name: '法要の掲示に最適な設定は？', acceptedAnswer: { '@type': 'Answer', text: 'A4/350dpi・塗り足し3mmの書き出しを推奨します。' }},
          { '@type': 'Question', name: '人物の追加・削除はできますか？', acceptedAnswer: { '@type': 'Answer', text: '大きな構図変更は要相談ですが、軽微な調整は可能です。' }},
        ]
      }) }} />
      <Script id="jsonld-howto" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: 'メモリアルフォトの編集手順',
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
          <Link className="underline" href="/memorial/seizen">生前撮影の整えを見る</Link>
        </div>
      </aside>
    </main>
  );
}
