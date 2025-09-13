/**
 * Response Sanitizer Middleware
 * - Strips internal fields like `code` from JSON responses
 * - Optionally masks server error messages for 5xx responses
 *
 * Keeps changes minimal and centralized to avoid heavy edits across routes.
 */

export function responseSanitizer(options = {}) {
  const {
    stripFields = ['code', 'errorCode', 'error_id', 'errorId'],
    maskServerErrors = true,
  } = options;

  function sanitize(value) {
    if (Array.isArray(value)) return value.map(sanitize);
    if (value && typeof value === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(value)) {
        if (stripFields.includes(k)) continue;
        out[k] = (v && typeof v === 'object') ? sanitize(v) : v;
      }
      return out;
    }
    return value;
  }

  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      try {
        let payload = body;
        if (payload && typeof payload === 'object') {
          payload = sanitize(payload);
          if (maskServerErrors && res.statusCode >= 500) {
            if (typeof payload.message === 'string') {
              payload.message = 'An unexpected error occurred.';
            }
            if (typeof payload.error === 'string') {
              payload.error = 'Error';
            }
          }
        }
        return originalJson(payload);
      } catch (_) {
        return originalJson(body);
      }
    };
    next();
  };
}

export default responseSanitizer;

