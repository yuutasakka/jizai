/**
 * RLS Authentication Middleware
 * Converts device ID to proper JWT token for Supabase RLS enforcement
 */

import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { subscriptionService } from '../services/subscription-service.mjs';
import { secureLogger } from '../utils/secure-logger.mjs';

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
            const deviceId = req.headers['x-device-id'];
            
            if (!deviceId) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'X-Device-ID header is required'
                });
            }
            
            // Get or create user for this device
            const user = await subscriptionService.getOrCreateUser(deviceId);
            
            // Create JWT token for this user
            const userJWT = createUserJWT(deviceId, user);
            
            // Create authenticated Supabase client
            const supabaseAuth = createClient(
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
            
            // Set authenticated client in request context
            req.supabaseAuth = supabaseAuth;
            req.user = user;
            req.deviceId = deviceId;
            
            // Log successful authentication
            secureLogger.debug('RLS authentication successful', {
                deviceId: deviceId.substring(0, 8) + '...',
                userId: user.id,
                userEmail: user.email || 'no-email'
            });
            
            next();
            
        } catch (error) {
            secureLogger.error('RLS authentication failed', {
                error: error.message,
                deviceId: req.headers['x-device-id']?.substring(0, 8) + '...'
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