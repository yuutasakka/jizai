// Request ID middleware: attaches a stable request ID to each request
import { randomUUID } from 'crypto';

const SAFE_ID = /^[A-Za-z0-9._-]{8,128}$/;

export function requestIdMiddleware() {
  return (req, res, next) => {
    let id = req.headers['x-request-id'];
    if (typeof id !== 'string' || !SAFE_ID.test(id)) {
      try { id = randomUUID(); } catch { id = Math.random().toString(36).slice(2); }
    }
    req.id = id;
    res.locals.requestId = id;
    res.setHeader('X-Request-ID', id);
    next();
  };
}

export function httpRequestLogger(secureLogger) {
  return (req, res, next) => {
    const start = Date.now();
    const onFinish = () => {
      res.removeListener('finish', onFinish);
      res.removeListener('close', onFinish);
      const durationMs = Date.now() - start;
      secureLogger.info('http_request', {
        requestId: req.id,
        method: req.method,
        path: req.originalUrl || req.url,
        status: res.statusCode,
        ip: req.ip,
        durationMs
      });
    };
    res.on('finish', onFinish);
    res.on('close', onFinish);
    next();
  };
}

export default requestIdMiddleware;

