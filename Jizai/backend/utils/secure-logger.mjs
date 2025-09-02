/**
 * Secure Logging Utility
 * Sanitizes sensitive data from logs to prevent PII exposure
 */

// PII patterns to sanitize
const PII_PATTERNS = [
    // Personal identifiers
    { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN-MASKED]' }, // SSN
    { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, replacement: '[CARD-MASKED]' }, // Credit card
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL-MASKED]' }, // Email
    { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, replacement: '[PHONE-MASKED]' }, // Phone number
    
    // Names (common patterns)
    { pattern: /\b(my name is|i am|call me|i'm)\s+[a-zA-Z]+/gi, replacement: '$1 [NAME-MASKED]' },
    { pattern: /\b(mr|mrs|ms|dr|prof)\.\s*[a-zA-Z]+/gi, replacement: '$1. [NAME-MASKED]' },
    
    // Personal information keywords
    { pattern: /\b(password|passphrase|pin|code)\s*[:=]\s*\S+/gi, replacement: '$1: [CREDENTIAL-MASKED]' },
    { pattern: /\b(address|home|live)\s*[:at]*\s*[0-9]+\s+[a-zA-Z\s]+/gi, replacement: '$1: [ADDRESS-MASKED]' },
    
    // Japanese personal info
    { pattern: /私の名前は[ひらがなカタカナ漢字A-Za-z]+/g, replacement: '私の名前は[名前-マスク済み]' },
    { pattern: /住所[はが：は]\s*[都道府県市区町村0-9-\s]+/g, replacement: '住所は[住所-マスク済み]' },
];

// Sensitive context keywords that suggest PII might be present
const SENSITIVE_KEYWORDS = [
    'personal', 'private', 'confidential', 'secret', 'password', 'ssn', 'social security',
    'credit card', 'debit', 'bank', 'account', 'driver license', 'passport', 'birth',
    'birthday', 'anniversary', 'address', 'home', 'phone', 'mobile', 'email',
    '個人', 'プライベート', '秘密', 'パスワード', '住所', '電話番号', 'メール'
];

/**
 * Sanitizes a text string by removing or masking PII
 * @param {string} text - Text to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized text
 */
function sanitizeText(text, options = {}) {
    if (!text || typeof text !== 'string') return text;
    
    const {
        maxLength = 100,        // Max length to preserve (truncate if longer)
        maskSensitive = true,   // Whether to apply PII masking
        preserveWords = 5       // Max number of words to preserve from potentially sensitive content
    } = options;
    
    let sanitized = text;
    
    // Apply PII pattern masking
    if (maskSensitive) {
        for (const { pattern, replacement } of PII_PATTERNS) {
            sanitized = sanitized.replace(pattern, replacement);
        }
        
        // Check for sensitive context and aggressively mask
        const lowerText = sanitized.toLowerCase();
        const hasSensitiveKeyword = SENSITIVE_KEYWORDS.some(keyword => 
            lowerText.includes(keyword)
        );
        
        if (hasSensitiveKeyword) {
            const words = sanitized.split(/\s+/);
            if (words.length > preserveWords) {
                sanitized = words.slice(0, preserveWords).join(' ') + ' [CONTENT-TRUNCATED-FOR-PRIVACY]';
            }
        }
    }
    
    // Truncate if too long
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength) + '...[TRUNCATED]';
    }
    
    return sanitized;
}

/**
 * Creates a sanitized version of request data for logging
 * @param {Object} data - Data object to sanitize
 * @returns {Object} Sanitized data object
 */
function sanitizeLogData(data) {
    if (!data || typeof data !== 'object') return data;
    
    const sanitized = { ...data };
    
    // Sanitize prompt specifically
    if (sanitized.prompt) {
        sanitized.prompt = sanitizeText(sanitized.prompt, { maxLength: 80 });
    }
    
    // Sanitize any other text fields that might contain PII
    const textFields = ['message', 'description', 'title', 'comment', 'note'];
    textFields.forEach(field => {
        if (sanitized[field]) {
            sanitized[field] = sanitizeText(sanitized[field]);
        }
    });
    
    // Remove sensitive fields entirely
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'auth'];
    sensitiveFields.forEach(field => {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    });
    
    return sanitized;
}

/**
 * Secure logger wrapper that automatically sanitizes data
 */
export const secureLogger = {
    /**
     * Log info level with sanitization
     * @param {string} message - Log message
     * @param {Object} data - Optional data to log (will be sanitized)
     */
    info(message, data = null) {
        const sanitizedData = data ? sanitizeLogData(data) : null;
        if (sanitizedData) {
            console.log(`ℹ️ ${message}`, sanitizedData);
        } else {
            console.log(`ℹ️ ${message}`);
        }
    },
    
    /**
     * Log warning with sanitization
     * @param {string} message - Log message
     * @param {Object} data - Optional data to log (will be sanitized)
     */
    warn(message, data = null) {
        const sanitizedData = data ? sanitizeLogData(data) : null;
        if (sanitizedData) {
            console.warn(`⚠️ ${message}`, sanitizedData);
        } else {
            console.warn(`⚠️ ${message}`);
        }
    },
    
    /**
     * Log error with sanitization
     * @param {string} message - Log message
     * @param {Object} data - Optional data to log (will be sanitized)
     */
    error(message, data = null) {
        const sanitizedData = data ? sanitizeLogData(data) : null;
        if (sanitizedData) {
            console.error(`❌ ${message}`, sanitizedData);
        } else {
            console.error(`❌ ${message}`);
        }
    },
    
    /**
     * Log debug with sanitization (only in development)
     * @param {string} message - Log message
     * @param {Object} data - Optional data to log (will be sanitized)
     */
    debug(message, data = null) {
        if (process.env.NODE_ENV === 'development') {
            const sanitizedData = data ? sanitizeLogData(data) : null;
            if (sanitizedData) {
                console.log(`🐛 ${message}`, sanitizedData);
            } else {
                console.log(`🐛 ${message}`);
            }
        }
    },
    
    /**
     * Special method for logging edit requests with enhanced sanitization
     * @param {string} deviceId - Device ID (preserved for debugging)
     * @param {string} prompt - User prompt (will be sanitized)
     * @param {number} fileSize - File size in bytes
     * @param {string} jobId - Optional job ID for tracking
     */
    editRequest(deviceId, prompt, fileSize, jobId = null) {
        // Do not log prompt content; only store metadata
        const sanitizedPrompt = '[REDACTED]';
        const logData = {
            deviceId: deviceId.substring(0, 8) + '***', // Partial masking for debugging
            prompt: sanitizedPrompt,
            prompt_length: typeof prompt === 'string' ? prompt.length : 0,
            fileSize,
            timestamp: new Date().toISOString()
        };
        
        if (jobId) {
            logData.jobId = jobId;
        }
        
        console.log('📝 Edit request received:', logData);
    }
};

// Export individual functions for direct use
export { sanitizeText, sanitizeLogData };
