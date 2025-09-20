/**
 * RLS Authentication Middleware
 * Converts device ID to proper JWT token for Supabase RLS enforcement
 */

import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { SubscriptionService } from '../services/subscription-service.mjs';
import { secureLogger } from '../utils/secure-logger.mjs';
import { supabaseService } from '../config/supabase.mjs';

/**
 * Create JWT token for RLS context
 * @param {string} deviceId - Device identifier
 * @param {Object} user - User data from database
 * @returns {string} JWT token
 */
function createUserJWT(deviceId, user) {
    const payload = {
        sub: user.id, // Supabase user ID
        user_id: user.id, // Custom claim for current_user_id()
        email: user.email || `device_${deviceId}@jizai.local`,
        device_id: deviceId,
        aud: 'authenticated',
        role: 'authenticated',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    };
    
    // Use Supabase JWT secret from environment
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) {
        throw new Error('SUPABASE_JWT_SECRET environment variable is required');
    }
    
    return jwt.sign(payload, secret, {
        algorithm: 'HS256',
        header: {
            alg: 'HS256',
            typ: 'JWT'
        }
    });
}

/**
 * RLS Authentication Middleware
 * Sets up authenticated Supabase client with proper JWT for RLS enforcement
 */
export function rlsAuthMiddleware() {
    return async (req, res, next) => {
        try {
            const auth = req.headers['authorization'];
            const subscriptionService = new SubscriptionService();
            let supabaseAuth;
            let user = null;
            let deviceId = null;
            let claims = null;

            if (auth && auth.startsWith('Bearer ')) {
                // Supabase JWT supplied from frontend
                const token = auth.slice('Bearer '.length);
                try {
                    const secret = process.env.SUPABASE_JWT_SECRET;
                    claims = jwt.verify(token, secret);
                    // Build client with provided JWT
                    supabaseAuth = createClient(
                        process.env.SUPABASE_URL,
                        process.env.SUPABASE_ANON_KEY,
                        {
                            auth: { autoRefreshToken: false, persistSession: false },
                            global: { headers: { Authorization: `Bearer ${token}` } }
                        }
                    );
                    // Fetch user/device mapping
                    const { data: userRow } = await supabaseService
                        .from('users')
                        .select('id, email, device_id')
                        .eq('id', claims.sub)
                        .limit(1)
                        .single();
                    if (userRow) {
                        user = { id: userRow.id, email: userRow.email };
                        deviceId = userRow.device_id || req.headers['x-device-id'] || claims?.device_id || null;
                    }
                } catch (e) {
                    secureLogger.warn('JWT verification failed, falling back to deviceId', { error: e.message });
                }
            }

            // Fallback to deviceId header for legacy flows
            if (!supabaseAuth) {
                deviceId = req.headers['x-device-id'];
                if (!deviceId) {
                    return res.status(401).json({
                        error: 'Unauthorized',
                        message: 'Authorization token is required (or X-Device-ID for legacy)'
                    });
                }
                user = await subscriptionService.getOrCreateUser(deviceId);
                const userJWT = createUserJWT(deviceId, user);
                supabaseAuth = createClient(
                    process.env.SUPABASE_URL,
                    process.env.SUPABASE_ANON_KEY,
                    {
                        auth: { autoRefreshToken: false, persistSession: false },
                        global: { headers: { Authorization: `Bearer ${userJWT}` } }
                    }
                );
            }

            // Set authenticated client in request context
            req.supabaseAuth = supabaseAuth;
            req.user = user;
            req.deviceId = deviceId;
            
            // Log successful authentication
            secureLogger.debug('RLS authentication successful', {
                deviceId: typeof deviceId === 'string' ? (deviceId.substring(0, 8) + '...') : 'unknown',
                userId: user?.id || 'unknown',
                userEmail: user?.email || 'no-email'
            });
            
            next();
            
        } catch (error) {
            secureLogger.error('RLS authentication failed', {
                error: error.message,
                deviceId: typeof req.headers['x-device-id'] === 'string' ? (req.headers['x-device-id'].substring(0, 8) + '...') : 'unknown'
            });
            
            return res.status(401).json({
                error: 'Authentication Failed',
                message: 'Unable to authenticate device'
            });
        }
    };
}

/**
 * Service Client Usage Monitor
 * Logs when service client is used for auditing purposes
 */
export function monitorServiceClientUsage(operation, context = {}) {
    secureLogger.warn('Service client used - RLS bypassed', {
        operation,
        context,
        timestamp: new Date().toISOString(),
        stack: new Error().stack?.split('\n')[1]?.trim()
    });
}

/**
 * Helper function to create authenticated client from user context
 * @param {Object} user - User object with id and email
 * @param {string} deviceId - Device identifier
 * @returns {Object} Authenticated Supabase client
 */
export function createAuthenticatedClient(user, deviceId) {
    const userJWT = createUserJWT(deviceId, user);
    
    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            },
            global: {
                headers: {
                    Authorization: `Bearer ${userJWT}`
                }
            }
        }
    );
}
