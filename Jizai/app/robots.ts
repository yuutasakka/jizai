export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://{your-domain}/sitemap.xml',
  } as const;
}

