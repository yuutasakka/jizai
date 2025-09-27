// Simple in-memory response cache for GET endpoints (non-user specific)
// Use sparingly for endpoints that return identical results across users

const store = new Map(); // key -> { expiresAt, payload, headers }

export function cacheMiddleware({ ttlMs = 60_000 } = {}) {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();
    const key = req.originalUrl || req.url;
    const now = Date.now();
    const cached = store.get(key);
    if (cached && cached.expiresAt > now) {
      for (const [h, v] of Object.entries(cached.headers || {})) {
        res.setHeader(h, v);
      }
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached.payload);
    }

    const json = res.json.bind(res);
    res.json = (body) => {
      try {
        store.set(key, {
          expiresAt: now + ttlMs,
          payload: body,
          headers: {
            'Cache-Control': `public, max-age=${Math.floor(ttlMs / 1000)}`
          }
        });
        res.setHeader('Cache-Control', `public, max-age=${Math.floor(ttlMs / 1000)}`);
        res.setHeader('X-Cache', 'MISS');
      } catch {}
      return json(body);
    };
    next();
  };
}

export default cacheMiddleware;

