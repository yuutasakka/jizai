/**
 * Security Headers Middleware
 * Implements comprehensive security headers including HSTS for production
 */

import { secureLogger } from './secure-logger.mjs';
import { randomBytes } from 'crypto';

/**
 * Security headers configuration
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware function
 */
export function securityHeaders(options = {}) {
    const {
        enableHSTS = process.env.NODE_ENV === 'production',
        hstsMaxAge = 31536000, // 1 year in seconds
        includeSubdomains = true,
        preload = true,
        reportOnly = false
    } = options;

    return (req, res, next) => {
        // Only add HSTS in production and over HTTPS
        if (enableHSTS) {
            // Check if we're in a secure context (no NODE_ENV shortcut)
            const isSecure = req.secure || 
                             req.get('X-Forwarded-Proto') === 'https' || 
                             req.connection.encrypted;
            
            if (isSecure) {
                let hstsValue = `max-age=${hstsMaxAge}`;
                
                if (includeSubdomains) {
                    hstsValue += '; includeSubDomains';
                }
                
                if (preload) {
                    hstsValue += '; preload';
                }
                
                res.setHeader('Strict-Transport-Security', hstsValue);
                
                // Log HSTS activation for monitoring
                if (!res.locals.hstsLogged) {
                    secureLogger.debug('HSTS header applied', {
                        maxAge: hstsMaxAge,
                        includeSubdomains,
                        preload,
                        userAgent: req.get('User-Agent')?.substring(0, 50)
                    });
                    res.locals.hstsLogged = true;
                }
            } else if (process.env.NODE_ENV === 'production') {
                // Warn if production but not secure
                secureLogger.warn('HSTS skipped - connection not secure in production', {
                    secure: req.secure,
                    forwardedProto: req.get('X-Forwarded-Proto'),
                    encrypted: !!req.connection.encrypted
                });
            }
        }

        // Additional security headers (complementing Vercel headers)
        
        // Prevent MIME type sniffing (redundant with Vercel but ensures coverage)
        if (!res.getHeader('X-Content-Type-Options')) {
            res.setHeader('X-Content-Type-Options', 'nosniff');
        }
        
        // Cross-Origin Resource Policy (CORP) - stricter in production
        const corp = process.env.SECURITY_CORP || (process.env.NODE_ENV === 'production' ? 'same-origin' : 'cross-origin');
        res.setHeader('Cross-Origin-Resource-Policy', corp);
        
        // Cross-Origin Embedder Policy (COEP) - stricter in production (may require auditing)
        const coep = process.env.SECURITY_COEP || (process.env.NODE_ENV === 'production' ? 'require-corp' : 'unsafe-none');
        res.setHeader('Cross-Origin-Embedder-Policy', coep);
        
        // Cross-Origin Opener Policy (COOP) - protect against window.opener attacks
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
        
        // Permissions Policy (Feature Policy) - restrict sensitive features
        const permissionsPolicies = [
            'camera=()',           // Disable camera access
            'microphone=()',       // Disable microphone access
            'geolocation=()',      // Disable location access
            'payment=()',          // Disable payment API
            'usb=()',              // Disable USB API
            'accelerometer=()',    // Disable accelerometer
            'gyroscope=()',        // Disable gyroscope
            'magnetometer=()',     // Disable magnetometer
            'fullscreen=*'         // Allow fullscreen (for image viewing)
        ];
        res.setHeader('Permissions-Policy', permissionsPolicies.join(', '));

        next();
    };
}

/**
 * Initialize security headers middleware with environment-aware settings
 * @returns {Function} Configured middleware
 */
export function initializeSecurityHeaders() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    const middleware = securityHeaders({
        enableHSTS: isProduction,
        hstsMaxAge: isProduction ? 31536000 : 0, // 1 year for production, 0 for dev
        includeSubdomains: isProduction,
        preload: isProduction
    });
    
    secureLogger.info('Security headers middleware initialized', {
        environment: process.env.NODE_ENV || 'development',
        hstsEnabled: isProduction,
        hstsMaxAge: isProduction ? 31536000 : 0
    });
    
    return middleware;
}

/**
 * Generate cryptographically secure nonce for CSP
 * @returns {string} Base64 encoded nonce
 */
function generateNonce() {
    return randomBytes(16).toString('base64');
}

/**
 * Content Security Policy (CSP) middleware with enhanced reporting and nonce support
 * @param {Object} options - CSP configuration options
 * @returns {Function} Express middleware
 */
export function cspHeaders(options = {}) {
    const {
        reportOnly = false, // Changed default to enforcing mode
        reportUri = '/csp-report',
        enableReporting = process.env.NODE_ENV === 'production',
        useNonce = process.env.NODE_ENV === 'production'
    } = options;
    
    return (req, res, next) => {
        const isProduction = process.env.NODE_ENV === 'production';
        
        // Generate nonce for this request if enabled
        let nonce = null;
        if (useNonce && isProduction) {
            nonce = generateNonce();
            res.locals.nonce = nonce; // Make nonce available to templates
        }
        
        // Enhanced CSP directives - PRODUCTION HARDENED
        const cspDirectives = [
            "default-src 'self'",
            "img-src 'self' data: https: blob:",
            
            // ENHANCED SCRIPT POLICY - Production hardened, Development flexible
            isProduction 
                ? (nonce 
                    ? `script-src 'self' 'nonce-${nonce}'` 
                    : "script-src 'self'") // Strict: only self or nonce
                : "script-src 'self' 'unsafe-inline'", // Dev: removed unsafe-eval as requested
            
            // Style sources with conditional nonce
            isProduction && nonce
                ? `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`
                : "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            
            "font-src 'self' https://fonts.gstatic.com",
            
            // Connect sources - minimal necessary connections
            "connect-src 'self' https://vitals.vercel-analytics.com https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com",
            
            "media-src 'self' data: blob:",
            "object-src 'none'", // Block all plugins
            "base-uri 'self'", // Prevent base tag injection
            "frame-ancestors 'none'", // Prevent embedding (clickjacking protection)
            "form-action 'self'", // Only allow form submission to same origin
            
            // Production-only directives
            ...(isProduction ? [
                "upgrade-insecure-requests", // Force HTTPS upgrades
                "require-trusted-types-for 'script'", // DOM XSS protection (if supported)
                "trusted-types 'none'" // Disable Trusted Types fallback
            ] : [])
        ];
        
        // Add report URI if reporting is enabled
        if (enableReporting && reportUri) {
            cspDirectives.push(`report-uri ${reportUri}`);
            
            // Modern reporting API (if supported by browser)
            cspDirectives.push(`report-to csp-endpoint`);
        }
        
        const cspValue = cspDirectives.join('; ');
        const headerName = reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
        
        // Set CSP header for all responses
        res.setHeader(headerName, cspValue);
        
        // Set Reporting API endpoints header (modern browsers)
        if (enableReporting) {
            const reportingEndpoints = JSON.stringify({
                "group": "csp-endpoint",
                "max_age": 10886400,
                "endpoints": [
                    { "url": reportUri }
                ]
            });
            res.setHeader('Report-To', reportingEndpoints);
        }
        
        // Log nonce generation for monitoring
        if (nonce) {
            secureLogger.debug('CSP nonce generated', {
                requestId: req.id,
                userAgent: req.get('User-Agent')?.substring(0, 50)
            });
        }
        
        next();
    };
}

/**
 * Initialize CSP with Report-Only mode for violation collection
 * @param {Object} options - CSP options
 * @returns {Function} Configured middleware
 */
export function initializeCSPReporting(options = {}) {
    const {
        reportOnly = true,
        enableInProduction = true
    } = options;
    
    const isProduction = process.env.NODE_ENV === 'production';
    const shouldEnable = isProduction ? enableInProduction : true;
    
    if (!shouldEnable) {
        return (req, res, next) => next(); // No-op middleware
    }
    
    const middleware = cspHeaders({
        reportOnly,
        reportUri: '/csp-report',
        enableReporting: true
    });
    
    secureLogger.info('CSP reporting initialized', {
        environment: process.env.NODE_ENV || 'development',
        reportOnly,
        reportingEnabled: true,
        reportEndpoint: '/csp-report'
    });
    
    return middleware;
}

export default securityHeaders;
