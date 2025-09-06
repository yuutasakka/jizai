/**
 * CSP (Content Security Policy) Reporter
 * Collects and analyzes CSP violation reports for security monitoring
 */

import { secureLogger, sanitizeText } from './secure-logger.mjs';

/**
 * CSP Report analyzer and logger
 */
class CSPReporter {
    constructor() {
        this.violationCounts = new Map();
        this.suspiciousPatterns = [
            /eval\(/i,
            /onclick=/i,
            /onerror=/i,
            /javascript:/i,
            /data:.*script/i,
            /vbscript:/i
        ];
    }

    /**
     * Process a CSP violation report
     * @param {Object} report - CSP violation report
     * @param {Object} request - Express request object
     */
    processViolationReport(report, request) {
        try {
            // Sanitize the report data to remove potential PII
            const sanitizedReport = this.sanitizeReport(report);
            
            // Analyze violation
            const analysis = this.analyzeViolation(sanitizedReport);
            
            // Track violation frequency
            this.trackViolation(sanitizedReport);
            
            // Log based on severity
            if (analysis.severity === 'high') {
                secureLogger.warn('High-severity CSP violation detected', {
                    ...sanitizedReport,
                    analysis,
                    userAgent: sanitizeText(request.get('User-Agent'), { maxLength: 100 }),
                    ip: this.sanitizeIP(request.ip)
                });
            } else if (analysis.severity === 'medium') {
                secureLogger.info('Medium-severity CSP violation', {
                    directive: sanitizedReport.violatedDirective,
                    blockedUri: sanitizedReport.blockedUri,
                    analysis
                });
            } else {
                secureLogger.debug('Low-severity CSP violation', {
                    directive: sanitizedReport.violatedDirective
                });
            }
            
            return analysis;
            
        } catch (error) {
            secureLogger.error('CSP report processing failed', {
                error: error.message,
                reportKeys: report ? Object.keys(report) : null
            });
            return { severity: 'unknown', processed: false };
        }
    }

    /**
     * Sanitize CSP report data
     * @param {Object} report - Raw CSP report
     * @returns {Object} Sanitized report
     */
    sanitizeReport(report) {
        if (!report || typeof report !== 'object') {
            return {};
        }

        const sanitized = {};
        
        // Safe fields to include
        const safeFields = [
            'violatedDirective',
            'effectiveDirective', 
            'originalPolicy',
            'disposition',
            'statusCode',
            'lineNumber',
            'columnNumber'
        ];
        
        safeFields.forEach(field => {
            if (report[field] !== undefined) {
                sanitized[field] = report[field];
            }
        });
        
        // Sanitize URI fields
        if (report.blockedUri) {
            sanitized.blockedUri = this.sanitizeURI(report.blockedUri);
        }
        
        if (report.documentUri) {
            sanitized.documentUri = this.sanitizeURI(report.documentUri);
        }
        
        if (report.referrer) {
            sanitized.referrer = this.sanitizeURI(report.referrer);
        }
        
        // Sanitize script sample (may contain sensitive data)
        if (report.scriptSample) {
            sanitized.scriptSample = sanitizeText(report.scriptSample, { maxLength: 200 });
        }
        
        return sanitized;
    }

    /**
     * Sanitize URI to remove sensitive information
     * @param {string} uri - URI to sanitize
     * @returns {string} Sanitized URI
     */
    sanitizeURI(uri) {
        if (!uri || typeof uri !== 'string') return uri;
        
        try {
            const url = new URL(uri);
            
            // Remove query parameters that might contain sensitive data
            const sensitiveParams = ['token', 'key', 'secret', 'password', 'auth'];
            sensitiveParams.forEach(param => {
                if (url.searchParams.has(param)) {
                    url.searchParams.set(param, '[REDACTED]');
                }
            });
            
            return url.toString();
        } catch {
            // If not a valid URL, just sanitize as text
            return sanitizeText(uri, { maxLength: 100 });
        }
    }

    /**
     * Sanitize IP address (partial masking for privacy)
     * @param {string} ip - IP address
     * @returns {string} Sanitized IP
     */
    sanitizeIP(ip) {
        if (!ip) return ip;
        
        // IPv4: mask last octet
        if (ip.includes('.')) {
            const parts = ip.split('.');
            if (parts.length === 4) {
                return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
            }
        }
        
        // IPv6: mask last 64 bits
        if (ip.includes(':')) {
            const parts = ip.split(':');
            if (parts.length > 4) {
                return parts.slice(0, 4).join(':') + '::xxxx';
            }
        }
        
        return 'xxx.xxx.xxx.xxx';
    }

    /**
     * Analyze CSP violation severity and patterns
     * @param {Object} report - Sanitized CSP report
     * @returns {Object} Analysis results
     */
    analyzeViolation(report) {
        const analysis = {
            severity: 'low',
            patterns: [],
            recommendations: []
        };
        
        // Check for suspicious patterns
        const suspiciousContent = [
            report.scriptSample,
            report.blockedUri
        ].filter(Boolean).join(' ');
        
        for (const pattern of this.suspiciousPatterns) {
            if (pattern.test(suspiciousContent)) {
                analysis.patterns.push(pattern.toString());
                analysis.severity = 'high';
            }
        }
        
        // Analyze by directive type
        const directive = report.violatedDirective || '';
        
        if (directive.includes('script-src')) {
            analysis.severity = analysis.severity === 'low' ? 'medium' : analysis.severity;
            analysis.recommendations.push('Review inline script usage');
        }
        
        if (directive.includes('connect-src')) {
            analysis.severity = analysis.severity === 'low' ? 'medium' : analysis.severity;
            analysis.recommendations.push('Verify external connection endpoints');
        }
        
        if (directive.includes('object-src') || directive.includes('plugin-types')) {
            analysis.severity = 'medium';
            analysis.recommendations.push('Review plugin and object usage');
        }
        
        // Check for external domains
        if (report.blockedUri && !report.blockedUri.includes(process.env.DOMAIN || 'localhost')) {
            analysis.severity = analysis.severity === 'low' ? 'medium' : analysis.severity;
            analysis.recommendations.push('Verify external domain necessity');
        }
        
        return analysis;
    }

    /**
     * Track violation frequency for pattern analysis
     * @param {Object} report - Sanitized report
     */
    trackViolation(report) {
        const key = `${report.violatedDirective}-${report.blockedUri}`;
        const current = this.violationCounts.get(key) || 0;
        this.violationCounts.set(key, current + 1);
        
        // Log frequent violations
        if ((current + 1) % 10 === 0) {
            secureLogger.warn('Frequent CSP violation pattern detected', {
                pattern: key,
                count: current + 1,
                recommendation: 'Consider updating CSP policy or investigating source'
            });
        }
    }

    /**
     * Get violation statistics
     * @returns {Object} Violation statistics
     */
    getStatistics() {
        const stats = {
            totalViolations: Array.from(this.violationCounts.values()).reduce((a, b) => a + b, 0),
            uniquePatterns: this.violationCounts.size,
            topViolations: []
        };
        
        // Get top 5 violations
        const sorted = Array.from(this.violationCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        stats.topViolations = sorted.map(([pattern, count]) => ({ pattern, count }));
        
        return stats;
    }
}

// Create singleton instance
const cspReporter = new CSPReporter();

/**
 * Express middleware for handling CSP reports
 * @returns {Function} Express middleware
 */
export function cspReportHandler() {
    return (req, res, next) => {
        if (req.path === '/csp-report' && req.method === 'POST') {
            try {
                const report = req.body;
                
                // Process the violation report
                const analysis = cspReporter.processViolationReport(report, req);
                
                // Return success response
                res.status(204).end();
                
            } catch (error) {
                secureLogger.error('CSP report handler error', { error: error.message });
                res.status(400).json({ error: 'Invalid CSP report' });
            }
        } else {
            next();
        }
    };
}

/**
 * Get CSP violation statistics endpoint
 * @returns {Function} Express handler
 */
export function cspStatsHandler() {
    return (req, res) => {
        try {
            const stats = cspReporter.getStatistics();
            res.json({
                success: true,
                timestamp: new Date().toISOString(),
                ...stats
            });
        } catch (error) {
            secureLogger.error('CSP stats handler error', { error: error.message });
            res.status(500).json({ error: 'Failed to get statistics' });
        }
    };
}

export { cspReporter };
export default CSPReporter;