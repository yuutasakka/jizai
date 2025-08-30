/**
 * CORS Configuration Utility
 * Provides environment-aware CORS settings with enhanced security
 */

import { secureLogger } from './secure-logger.mjs';

/**
 * Environment-aware CORS origin validation
 * @param {string} origin - Request origin
 * @param {Function} callback - CORS callback function
 */
function validateOrigin(origin, callback) {
    // Get allowed origins from environment or use secure defaults
    const envOrigins = process.env.ORIGIN_ALLOWLIST?.split(',').map(origin => origin.trim()) || [];
    
    // Production origins (strict allowlist only)
    const productionOrigins = [
        // Add production domains here when known
        'https://jizai.vercel.app',
        'https://jizai-ai.com',
        // Add any other production domains
    ];
    
    // Development origins (more permissive for local development)
    const developmentOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',  // Vite default
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'capacitor://localhost',  // Capacitor
        'ionic://localhost',      // Ionic
        'http://localhost',       // iOS Simulator
        'https://localhost'       // iOS実機HTTPS
    ];
    
    // Combine origins based on environment
    let allowedOrigins = [];
    
    if (process.env.NODE_ENV === 'production') {
        // Production: Use only environment-specified origins + known production origins
        allowedOrigins = [...envOrigins, ...productionOrigins];
        
        // Log security warning if using permissive origins in production
        if (envOrigins.some(origin => origin.includes('localhost') || origin.includes('127.0.0.1'))) {
            secureLogger.warn('Production CORS configured with localhost origins', {
                environment: 'production',
                allowedOrigins: envOrigins.filter(o => o.includes('localhost'))
            });
        }
    } else {
        // Development: Use environment origins + development defaults
        allowedOrigins = [...envOrigins, ...developmentOrigins];
    }
    
    // Remove duplicates and empty values
    allowedOrigins = [...new Set(allowedOrigins.filter(Boolean))];
    
    // Handle requests
    if (!origin) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        return callback(null, true);
    }
    
    // Check against allowlist
    if (allowedOrigins.includes(origin)) {
        return callback(null, true);
    }
    
    // Development environment: allow any localhost with different ports
    if (process.env.NODE_ENV === 'development') {
        const isLocalhost = origin.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/);
        if (isLocalhost) {
            secureLogger.debug('Development CORS allowing localhost origin', { origin });
            return callback(null, true);
        }
    }
    
    // Reject unauthorized origins
    secureLogger.warn('CORS blocked unauthorized origin', { 
        origin, 
        environment: process.env.NODE_ENV || 'unknown',
        allowedOrigins: allowedOrigins.length 
    });
    
    callback(new Error('Not allowed by CORS'));
}

/**
 * Get CORS configuration object
 * @returns {Object} CORS configuration
 */
export function getCorsConfig() {
    const config = {
        origin: validateOrigin,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'x-device-id',
            'x-api-version'
        ],
        // Security headers
        exposedHeaders: [
            'X-Credits-Remaining',
            'X-Rate-Limit-Remaining',
            'X-Rate-Limit-Reset'
        ],
        // Preflight cache time (24 hours)
        maxAge: 86400
    };
    
    // Additional security for production
    if (process.env.NODE_ENV === 'production') {
        config.preflightContinue = false;
        config.optionsSuccessStatus = 204;
    }
    
    return config;
}

/**
 * Initialize CORS configuration and log current settings
 */
export function initializeCors() {
    const environment = process.env.NODE_ENV || 'development';
    const envOrigins = process.env.ORIGIN_ALLOWLIST?.split(',').map(o => o.trim()) || [];
    
    secureLogger.info('CORS configuration initialized', {
        environment,
        originsFromEnv: envOrigins.length,
        strictMode: environment === 'production'
    });
    
    // Security audit for production
    if (environment === 'production') {
        if (envOrigins.length === 0) {
            secureLogger.warn('Production CORS has no environment origins configured');
        }
        
        const insecureOrigins = envOrigins.filter(origin => 
            !origin.startsWith('https://') || 
            origin.includes('localhost') || 
            origin.includes('127.0.0.1')
        );
        
        if (insecureOrigins.length > 0) {
            secureLogger.warn('Production CORS has potentially insecure origins', {
                insecureOrigins
            });
        }
    }
}

export default getCorsConfig;