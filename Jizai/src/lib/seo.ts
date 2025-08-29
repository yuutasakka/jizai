export type FAQItem = { q: string; a: string };

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(id: string, data: any) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function setSEO(opts: {
  title: string;
  description: string;
  url: string;
  serviceType: string;
  brand?: string;
  lowPriceJPY?: string;
  image?: string;
  faq: FAQItem[];
}) {
  const brand = opts.brand || 'JIZAI';
  const image = opts.image || `${window.location.origin}/og.png`;

  // Title & description
  document.title = opts.title;
  upsertMeta('name', 'description', opts.description);

  // Canonical
  upsertLink('canonical', opts.url);

  // Open Graph
  upsertMeta('property', 'og:title', opts.title);
  upsertMeta('property', 'og:description', opts.description);
  upsertMeta('property', 'og:type', 'website');
  upsertMeta('property', 'og:url', opts.url);
  upsertMeta('property', 'og:image', image);

  // Twitter
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', opts.title);
  upsertMeta('name', 'twitter:description', opts.description);
  upsertMeta('name', 'twitter:image', image);

  // JSON-LD: Service
  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: opts.title,
    serviceType: opts.serviceType,
    areaServed: 'JP',
    brand,
    url: opts.url,
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: opts.lowPriceJPY || '1480',
      priceCurrency: 'JPY'
    }
  };
  upsertJsonLd('ld-service', serviceLd);

  // JSON-LD: FAQ
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: opts.faq.slice(0, 5).map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a
      }
    }))
  };
  upsertJsonLd('ld-faq', faqLd);
}

