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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
