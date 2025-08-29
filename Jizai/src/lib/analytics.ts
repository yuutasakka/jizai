export function track(event: string, params: Record<string, any> = {}) {
  if (typeof window === 'undefined') return;
  const w = window as any;
  if (typeof w.gtag === 'function') {
    try { w.gtag('event', event, params); } catch {}
  } else if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('[ga:event]', event, params);
  }
}

