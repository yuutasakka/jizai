import { metrics } from '../utils/metrics.mjs';

function normalizePath(path = '/') {
  try {
    const p = path.split('?')[0];
    return p
      // UUID / long hex tokens
      .replace(/\b[0-9a-f]{8,}\b/gi, ':id')
      // numeric ids
      .replace(/\b\d{3,}\b/g, ':n');
  } catch {
    return '/unknown';
  }
}

export function httpMetricsMiddleware() {
  return (req, res, next) => {
    const start = Date.now();
    const method = req.method;
    const path = normalizePath(req.originalUrl || req.url);
    const done = () => {
      res.removeListener('finish', done);
      res.removeListener('close', done);
      const status = res.statusCode;
      const dur = Date.now() - start;
      metrics.inc('http_requests_total', { method, path, status });
      metrics.observe('http_request_duration_ms', { method, path, status }, dur);
      if (status === 429) metrics.inc('http_429_total', { path });
      if (status >= 500) metrics.inc('http_5xx_total', { path, status });
    };
    res.on('finish', done);
    res.on('close', done);
    next();
  };
}

export default httpMetricsMiddleware;

