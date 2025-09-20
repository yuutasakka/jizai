// Webhook Routes for App Store Server Notifications
// Handles real-time updates from Apple's subscription system
import express from 'express';
import { AppStoreWebhookHandler } from '../services/appstore-webhook.mjs';
import rateLimit from 'express-rate-limit';

const router = express.Router();
const webhookHandler = new AppStoreWebhookHandler();

// Optional IP allowlist (comma-separated) for additional protection
function optionalIpAllowlist(ipsEnvVar = 'WEBHOOK_IP_ALLOWLIST') {
    const list = (process.env[ipsEnvVar] || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    if (list.length === 0) return (_req, _res, next) => next();
    return (req, res, next) => {
        const ip = req.ip || req.connection?.remoteAddress || '';
        if (list.includes(ip)) return next();
        return res.status(403).json({ error: 'Forbidden', message: 'IP not allowed' });
    };
}

// Tight rate limit for webhook endpoint
const webhookLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: parseInt(process.env.WEBHOOK_RATE_LIMIT || '30', 10),
    standardHeaders: true,
    legacyHeaders: false
});

// Simple in-memory replay protection cache
const seenNotifications = new Map(); // key: notificationUUID, value: expireAt (ms)
const REPLAY_TTL_MS = parseInt(process.env.WEBHOOK_REPLAY_TTL_MS || '300000', 10); // 5 minutes

function checkReplay(notificationUUID) {
    const now = Date.now();
    const exp = seenNotifications.get(notificationUUID);
    if (exp && exp > now) return true;
    // cleanup occasionally
    if (seenNotifications.size > 1000) {
        for (const [k, v] of seenNotifications.entries()) {
            if (v <= now) seenNotifications.delete(k);
        }
    }
    seenNotifications.set(notificationUUID, now + REPLAY_TTL_MS);
    return false;
}

// Admin endpoints limiter
const adminLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: parseInt(process.env.ADMIN_WEBHOOK_RATE_LIMIT || '30', 10),
    standardHeaders: true,
    legacyHeaders: false
});

// Basic admin auth middleware for internal endpoints
const requireAdmin = (req, res, next) => {
    const token = req.headers['x-admin-token'];
    const expected = process.env.ADMIN_TOKEN;

    if (!expected) {
        // Explicitly deny in production if not configured
        if (process.env.NODE_ENV === 'production') {
            return res.status(503).json({
                error: 'Service Unavailable',
                message: 'Configuration error'
            });
        }
    }

    if (expected && token === expected) {
        return next();
    }
    return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
    });
};

// ========================================
// APP STORE SERVER NOTIFICATIONS V2
// ========================================

/**
 * POST /v1/webhooks/appstore
 * Handle App Store Server Notifications V2
 * 
 * Apple sends notifications to this endpoint for subscription events:
 * - SUBSCRIBED: New subscription or resubscribe
 * - DID_CHANGE_RENEWAL_STATUS: Auto-renewal turned on/off
 * - DID_RENEW: Successful renewal
 * - DID_FAIL_TO_RENEW: Failed renewal (billing issue)
 * - EXPIRED: Subscription expired
 * - GRACE_PERIOD_EXPIRED: Grace period ended
 * - REFUND: User received refund
 * - REVOKE: Subscription revoked by Apple
 */
// Basic request validation middleware
const validateWebhookRequest = (req, res, next) => {
    // Check User-Agent (Apple sends specific user agent)
    const userAgent = req.headers['user-agent'];
    if (process.env.NODE_ENV === 'production' && !userAgent?.includes('App Store')) {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Access denied'
        });
    }

    // Check Content-Type
    const contentType = req.headers['content-type'];
    if (!contentType?.includes('application/json')) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid content type',
            code: 'INVALID_CONTENT_TYPE'
        });
    }

    next();
};

// Body is parsed as raw in index-vault-integration before JSON parser
router.post('/appstore', webhookLimiter, optionalIpAllowlist(), validateWebhookRequest, async (req, res) => {
    try {
        const body = Buffer.isBuffer(req.body) ? req.body.toString() : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
        
        // Verify this is a legitimate App Store notification
        if (!body) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Empty request body',
                code: 'EMPTY_BODY'
            });
        }

        let notificationPayload;
        try {
            notificationPayload = JSON.parse(body);
        } catch (parseError) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid JSON payload',
                code: 'INVALID_JSON'
            });
        }

        // Validate required fields
        if (!notificationPayload.notificationType || !notificationPayload.notificationUUID) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Missing required notification fields',
                code: 'MISSING_FIELDS'
            });
        }

        console.log(`📱 Received App Store notification: ${notificationPayload.notificationType}`);

        // Replay protection
        if (checkReplay(notificationPayload.notificationUUID)) {
            return res.status(200).json({
                success: false,
                notificationUUID: notificationPayload.notificationUUID,
                error: 'Duplicate notification (replay ignored)'
            });
        }

        // Verify signature (in production, this is crucial for security)
        if (process.env.NODE_ENV === 'production') {
            const signatureHeader = req.headers['x-apple-signature'];
            if (!signatureHeader) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Missing Apple signature',
                    code: 'MISSING_SIGNATURE'
                });
            }

            // Verify JWT signature
            const verification = await webhookHandler.verifySignature(body, signatureHeader);
            if (!verification.valid) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Invalid signature',
                    code: 'INVALID_SIGNATURE'
                });
            }
        }

        // Process the notification
        try {
            const result = await webhookHandler.processNotification(notificationPayload);
            
            // Mark as processed
            await webhookHandler.markNotificationProcessed(
                notificationPayload.notificationUUID, 
                true
            );

            // Return success response (Apple expects 200 OK)
            res.status(200).json({
                success: true,
                notificationUUID: notificationPayload.notificationUUID,
                processed: true
            });

            console.log(`✅ Processed notification: ${notificationPayload.notificationUUID}`);

        } catch (processingError) {
            console.error('❌ Notification processing failed:', processingError);
            
            // Mark as failed for retry
            await webhookHandler.markNotificationProcessed(
                notificationPayload.notificationUUID, 
                false, 
                processingError.message
            );

            // Still return 200 to Apple to prevent retries for our processing errors
            // Apple will retry if we return non-200 status
            res.status(200).json({
                success: false,
                notificationUUID: notificationPayload.notificationUUID,
                error: 'Processing failed - will retry',
                retryScheduled: true
            });
        }

    } catch (error) {
        console.error('❌ Webhook handler error:', error);
        
        // Return 200 even for errors to prevent Apple from retrying
        // We'll handle retries internally
        res.status(200).json({
            success: false,
            error: 'Internal processing error',
            retryScheduled: true
        });
    }
});

// ========================================
// WEBHOOK MANAGEMENT & TESTING
// ========================================

/**
 * GET /v1/webhooks/appstore/status
 * Check webhook health and recent activity
 * Internal endpoint for monitoring
 */
router.get('/appstore/status', adminLimiter, requireAdmin, async (req, res) => {
    try {
        // Check recent notification activity
        const stats = await webhookHandler.getWebhookStats();
        
        res.json({
            status: 'healthy',
            webhook: {
                endpointUrl: `${req.protocol}://${req.get('host')}/v1/webhooks/appstore`,
                lastNotification: stats.lastNotification,
                totalNotifications: stats.totalNotifications,
                successRate: stats.successRate,
                pendingRetries: stats.pendingRetries
            },
            configuration: {
                signatureVerification: process.env.NODE_ENV === 'production',
                bundleId: process.env.APPLE_BUNDLE_ID,
                environment: process.env.NODE_ENV
            }
        });

    } catch (error) {
        console.error('❌ Webhook status error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve webhook status',
            code: 'WEBHOOK_STATUS_FAILED'
        });
    }
});

/**
 * POST /v1/webhooks/appstore/test
 * Test webhook processing (development only)
 */
router.post('/appstore/test', adminLimiter, requireAdmin, async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Test endpoint not available in production',
            code: 'TEST_NOT_ALLOWED'
        });
    }

    try {
        const { notificationType = 'TEST', originalTransactionId = 'test_12345' } = req.body;

        // Create test notification payload
        const testNotification = {
            notificationType,
            subtype: null,
            notificationUUID: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            data: {
                appAppleId: 123456789,
                bundleId: process.env.APPLE_BUNDLE_ID || 'com.example.jizai',
                latestReceiptInfo: {
                    original_transaction_id: originalTransactionId,
                    product_id: 'com.example.jizai.vault.standard',
                    expires_date_ms: (Date.now() + 30 * 24 * 60 * 60 * 1000).toString(), // 30 days
                    is_trial_period: 'false',
                    original_purchase_date_ms: Date.now().toString()
                },
                pendingRenewalInfo: {
                    auto_renew_status: '1',
                    product_id: 'com.example.jizai.vault.standard'
                }
            },
            version: '2.0',
            signedDate: new Date().toISOString()
        };

        const result = await webhookHandler.processNotification(testNotification);

        res.json({
            success: true,
            testNotification,
            processingResult: result,
            message: 'Test notification processed successfully'
        });

    } catch (error) {
        console.error('❌ Test webhook error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Test webhook processing failed',
            code: 'TEST_WEBHOOK_FAILED'
        });
    }
});

/**
 * POST /v1/webhooks/retry-failed
 * Manually trigger retry of failed notifications
 * Internal/admin endpoint
 */
router.post('/retry-failed', requireAdmin, async (req, res) => {
    try {
        // This should be protected by admin authentication in production
        await webhookHandler.retryFailedNotifications();

        res.json({
            success: true,
            message: 'Failed notifications retry initiated'
        });

    } catch (error) {
        console.error('❌ Retry failed notifications error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retry notifications',
            code: 'RETRY_FAILED'
        });
    }
});

// Apply validation middleware to webhook endpoints (kept for future routes under /appstore)
router.use('/appstore', validateWebhookRequest);

export default router;
