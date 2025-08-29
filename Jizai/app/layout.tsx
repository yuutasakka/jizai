import Script from 'next/script';

export const metadata = {
  metadataBase: new URL('https://{your-domain}'),
  openGraph: {
    type: 'website',
    siteName: 'JIZAI',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og.png'],
  },
};

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://{your-domain}';
const orgLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'JIZAI',
  url: SITE,
  logo: `${SITE}/og.png`,
};
const siteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  url: SITE,
  name: 'JIZAI',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE}/?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        {children}
        <Script id="jsonld-org" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
        <Script id="jsonld-site" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }} />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
              window.dataLayer=window.dataLayer||[];
              function gtag(){dataLayer.push(arguments)}
              gtag('js', new Date());
              gtag('config','${process.env.NEXT_PUBLIC_GA_ID}',{anonymize_ip:true});
            ` }} />
          </>
        )}
      </body>
    </html>
  );
}
