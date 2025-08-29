export const metadata = {
  metadataBase: new URL('https://{your-domain}')
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

