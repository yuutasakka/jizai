/**
 * Authorization Token Middleware (Supabase JWT)
 * - Validates `Authorization: Bearer <token>` using Supabase Admin API
 * - Attaches `req.authUser` when valid
 * - Can be used in optional or required mode
 */

import { supabaseService } from '../config/supabase.mjs';
import { secureLogger } from '../utils/secure-logger.mjs';

export function authzTokenMiddleware({ required = false } = {}) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers['authorization'] || '';
      const match = authHeader.match(/^Bearer\s+(.+)$/i);

      if (!match) {
        if (required) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing bearer token',
            code: 'MISSING_TOKEN'
          });
        }
        return next();
      }

      const token = match[1].trim();
      if (!token) {
        if (required) {
          return res.status(401).json({ error: 'Unauthorized', message: 'Empty token', code: 'EMPTY_TOKEN' });
        }
        return next();
      }

      const { data, error } = await supabaseService.auth.getUser(token);
      if (error || !data?.user) {
        if (required) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired token',
            code: 'INVALID_TOKEN'
          });
        }
        secureLogger.debug('Bearer token rejected', { reason: error?.message || 'no user' });
        return next();
      }

      // Attach validated auth user to request
      req.authUser = data.user;
      secureLogger.debug('Bearer token validated', { userId: data.user.id, provider: data.user.app_metadata?.provider });
      return next();
    } catch (e) {
      if (required) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Token validation failed', code: 'TOKEN_VALIDATE_ERROR' });
      }
      secureLogger.warn('Token validation error', { error: e.message });
      return next();
    }
  };
}

// Convenience wrapper to require authentication
export function requireAuth() {
  return authzTokenMiddleware({ required: true });
}

export default authzTokenMiddleware;

