// Vault Subscription API Routes
// Handles App Store subscriptions, trials, and subscription lifecycle management
import express from 'express';
import { supabaseService } from '../config/supabase.mjs';
import { validateAppStoreReceipt } from '../services/appstore-validator.mjs';
import { SubscriptionService } from '../services/subscription-service.mjs';
import { StorageQuotaService } from '../services/storage-quota-service.mjs';
import { auditServiceClientUsage } from '../utils/service-client-audit.mjs';
import { secureLogger } from '../utils/secure-logger.mjs';
import { rlsAuthMiddleware } from '../middleware/rls-auth.mjs';
import rateLimit from 'express-rate-limit';
import { validateBody } from '../middleware/validate.mjs';

const router = express.Router();
const subscriptionService = new SubscriptionService();
const storageQuotaService = new StorageQuotaService();

// Optional IP allowlist middleware for admin endpoints
function optionalIpAllowlist(ipsEnvVar = 'ADMIN_IP_ALLOWLIST') {
    const list = (process.env[ipsEnvVar] || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    if (list.length === 0) return (_req, _res, next) => next();
    return (req, res, next) => {
        const ip = req.ip || req.connection?.remoteAddress || '';
        if (list.includes(ip)) return next();
        return res.status(403).json({ error: 'Forbidden', message: 'IP not allowed', code: 'ADMIN_IP_BLOCKED' });
    };
}

// Basic admin auth middleware for internal endpoints
const requireAdmin = (req, res, next) => {
    const token = req.headers['x-admin-token'];
    const expected = process.env.ADMIN_TOKEN;

    if (!expected) {
        if (process.env.NODE_ENV === 'production') {
            return res.status(503).json({
                error: 'Service Unavailable',
                message: 'Admin token not configured',
                code: 'ADMIN_NOT_CONFIGURED'
            });
        }
    }

    if (expected && token === expected) {
        secureLogger.info('Admin endpoint access granted', { route: req.originalUrl, ip: req.ip });
        return next();
    }
    secureLogger.warn('Admin endpoint access denied', { route: req.originalUrl, ip: req.ip });
    return res.status(401).json({
        error: 'Unauthorized',
        message: 'Admin token required',
        code: 'ADMIN_AUTH_REQUIRED'
    });
};

// ========================================
// SUBSCRIPTION STATUS & VALIDATION
// ========================================

/**
 * GET /v1/subscription/status
 * Get current subscription status for user
 */
router.get('/status', rlsAuthMiddleware(), async (req, res) => {
    try {
        const deviceId = req.deviceId;
        const subscription = await subscriptionService.getActiveSubscription(deviceId);
        const quotaInfo = await storageQuotaService.getQuotaInfo(deviceId);
        
        res.json({
            subscription: {
                status: subscription?.status || 'free',
                tier: subscription?.tier || null,
                expiresAt: subscription?.expires_date || null,
                isTrialPeriod: subscription?.is_trial_period || false,
                trialEndsAt: subscription?.trial_end_date || null,
                autoRenewStatus: subscription?.auto_renew_status || false
            },
            storage: {
                quota: quotaInfo.quota,
                used: quotaInfo.used,
                available: quotaInfo.available,
                percentage: quotaInfo.percentage
            },
            features: subscription?.features || {}
        });

    } catch (error) {
        console.error('❌ Subscription status error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve subscription status',
            code: 'SUBSCRIPTION_STATUS_FAILED'
        });
    }
});

/**
 * POST /v1/subscription/validate
 * Validate App Store receipt and update subscription status
 */
const validateReceiptSchema = {
    receiptData: { type: 'string', min: 10 },
    originalTransactionId: { type: 'string', min: 5, optional: true }
};

router.post('/validate', rlsAuthMiddleware(), validateBody(validateReceiptSchema), async (req, res) => {
    try {
        const { receiptData, originalTransactionId } = req.validatedBody || req.body;
        const deviceId = req.deviceId;

        // 必須項目はバリデーション済み

        // Validate with App Store
        const validationResult = await validateAppStoreReceipt(receiptData);
        
        if (!validationResult.valid) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid receipt',
                code: 'INVALID_RECEIPT',
                details: validationResult.error
            });
        }

        // Update subscription status
        const subscription = await subscriptionService.updateFromReceiptValidation(
            deviceId, 
            validationResult.latestReceiptInfo,
            validationResult.pendingRenewalInfo
        );

        res.json({
            success: true,
            subscription: {
                status: subscription.status,
                tier: subscription.tier,
                expiresAt: subscription.expires_date,
                isTrialPeriod: subscription.is_trial_period,
                autoRenewStatus: subscription.auto_renew_status
            }
        });

    } catch (error) {
        console.error('❌ Receipt validation error:', error);
        
        if (error.code === 'DUPLICATE_TRANSACTION') {
            return res.status(409).json({
                error: 'Conflict',
                message: 'Transaction already processed',
                code: 'DUPLICATE_TRANSACTION'
            });
        }

        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Receipt validation failed',
            code: 'RECEIPT_VALIDATION_FAILED'
        });
    }
});

/**
 * POST /v1/subscription/start-trial
 * Start 14-day trial period
 */
const startTrialSchema = {
    productId: { type: 'string', min: 3 }
};

router.post('/start-trial', rlsAuthMiddleware(), validateBody(startTrialSchema), async (req, res) => {
    try {
        const { productId } = req.validatedBody || req.body;
        const deviceId = req.deviceId;

        // 必須項目はバリデーション済み

        // Check if user already had a trial
        const existingTrial = await subscriptionService.hasHadTrial(deviceId);
        if (existingTrial) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'Trial period already used',
                code: 'TRIAL_ALREADY_USED'
            });
        }

        const trialSubscription = await subscriptionService.startTrial(deviceId, productId);

        res.json({
            success: true,
            trial: {
                status: trialSubscription.status,
                tier: trialSubscription.tier,
                startsAt: trialSubscription.trial_start_date,
                endsAt: trialSubscription.trial_end_date,
                productId: trialSubscription.product_id
            }
        });

    } catch (error) {
        console.error('❌ Start trial error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to start trial',
            code: 'TRIAL_START_FAILED'
        });
    }
});

// ========================================
// SUBSCRIPTION TIERS & FEATURES
// ========================================

/**
 * GET /v1/subscription/tiers
 * Get available subscription tiers and pricing
 */
router.get('/tiers', async (req, res) => {
    try {
        // System operation - public subscription tier information
        auditServiceClientUsage('get_tiers', 'subscription_routes', {}, true);
        const { data: tiers, error } = await supabaseService
            .from('subscription_tiers')
            .select('*')
            .order('monthly_price_cents');

        if (error) throw error;

        res.json({
            tiers: tiers.map(tier => ({
                id: tier.id,
                name: tier.name,
                description: tier.description,
                storageQuota: tier.storage_quota,
                maxVaults: tier.max_vaults,
                maxFamilyMembers: tier.max_family_members,
                features: tier.features,
                pricing: {
                    monthly: tier.monthly_price_cents,
                    annual: tier.annual_price_cents
                }
            }))
        });

    } catch (error) {
        console.error('❌ Get tiers error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve subscription tiers',
            code: 'TIERS_FETCH_FAILED'
        });
    }
});

/**
 * POST /v1/subscription/cancel
 * Cancel subscription (user initiated)
 */
router.post('/cancel', rlsAuthMiddleware(), async (req, res) => {
    try {
        const { reason } = req.body;
        const deviceId = req.deviceId;

        const cancelledSubscription = await subscriptionService.cancelSubscription(deviceId, reason);

        res.json({
            success: true,
            subscription: {
                status: cancelledSubscription.status,
                expiresAt: cancelledSubscription.expires_date,
                gracePeriodEndsAt: cancelledSubscription.grace_period_expires_date
            },
            message: 'Subscription cancelled successfully. Access continues until expiration date.'
        });

    } catch (error) {
        console.error('❌ Cancel subscription error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to cancel subscription',
            code: 'SUBSCRIPTION_CANCEL_FAILED'
        });
    }
});

// ========================================
// STORAGE QUOTA MANAGEMENT
// ========================================

/**
 * GET /v1/subscription/storage
 * Get detailed storage usage information
 */
router.get('/storage', rlsAuthMiddleware(), async (req, res) => {
    try {
        const deviceId = req.deviceId;
        const storageInfo = await storageQuotaService.getDetailedStorageInfo(deviceId);

        res.json(storageInfo);

    } catch (error) {
        console.error('❌ Storage info error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve storage information',
            code: 'STORAGE_INFO_FAILED'
        });
    }
});

/**
 * POST /v1/subscription/storage/check
 * Check if file upload would exceed storage quota
 */
router.post('/storage/check', rlsAuthMiddleware(), async (req, res) => {
    try {
        const { fileSize, vaultId } = req.body;
        const deviceId = req.deviceId;

        if (!fileSize) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'fileSize is required',
                code: 'MISSING_REQUIRED_FIELDS'
            });
        }

        const canUpload = await storageQuotaService.checkQuotaForUpload(deviceId, fileSize, vaultId);

        res.json({
            canUpload: canUpload.allowed,
            quotaInfo: {
                quota: canUpload.quota,
                used: canUpload.used,
                available: canUpload.available,
                wouldExceed: !canUpload.allowed,
                requiredSpace: fileSize
            }
        });

    } catch (error) {
        console.error('❌ Storage check error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to check storage quota',
            code: 'STORAGE_CHECK_FAILED'
        });
    }
});

// ========================================
// SUBSCRIPTION ANALYTICS
// ========================================

/**
 * GET /v1/subscription/analytics
 * Get subscription analytics (admin/internal use)
 */
const adminAnalyticsLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: parseInt(process.env.ADMIN_ANALYTICS_RATE_LIMIT || '20', 10),
    standardHeaders: true,
    legacyHeaders: false
});

router.get('/analytics', adminAnalyticsLimiter, optionalIpAllowlist(), requireAdmin, async (req, res) => {
    try {
        // This would typically be protected by admin authentication
        const analytics = await subscriptionService.getSubscriptionAnalytics();

        res.json(analytics);

    } catch (error) {
        console.error('❌ Analytics error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve analytics',
            code: 'ANALYTICS_FAILED'
        });
    }
});

export default router;
