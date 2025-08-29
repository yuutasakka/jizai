// Subscription Service
// Core business logic for managing App Store subscriptions and user tiers
import { supabase, supabaseService } from '../config/supabase.mjs';

export class SubscriptionService {
    constructor() {
        // Trial period duration (14 days)
        this.trialDurationDays = 14;
        
        // Grace period duration (30 days)
        this.gracePeriodDays = 30;
        
        // Product ID mapping to tiers
        this.productTierMap = {
            'com.example.jizai.vault.lite': 'lite',
            'com.example.jizai.vault.standard': 'standard', 
            'com.example.jizai.vault.pro': 'pro'
        };
    }

    /**
     * Get active subscription for user
     */
    async getActiveSubscription(deviceId) {
        try {
            const { data, error } = await supabase
                .from('subscriptions')
                .select(`
                    *,
                    users!inner(device_id)
                `)
                .eq('users.device_id', deviceId)
                .in('status', ['trial', 'active', 'grace'])
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') { // Not found is OK
                throw error;
            }

            return data;

        } catch (error) {
            console.error('❌ Get active subscription error:', error);
            return null;
        }
    }

    /**
     * Start trial subscription
     */
    async startTrial(deviceId, productId) {
        try {
            // Get or create user
            const user = await this.getOrCreateUser(deviceId);
            
            // Check if user already had a trial
            const existingTrial = await this.hasHadTrial(deviceId);
            if (existingTrial) {
                throw new Error('Trial period already used');
            }

            const tier = this.productTierMap[productId];
            if (!tier) {
                throw new Error(`Invalid product ID: ${productId}`);
            }

            const trialStart = new Date();
            const trialEnd = new Date(trialStart.getTime() + this.trialDurationDays * 24 * 60 * 60 * 1000);

            // Create trial subscription
            const { data: subscription, error } = await supabase
                .from('subscriptions')
                .insert({
                    user_id: user.id,
                    original_transaction_id: `trial_${deviceId}_${Date.now()}`,
                    product_id: productId,
                    tier,
                    status: 'trial',
                    is_trial_period: true,
                    trial_start_date: trialStart.toISOString(),
                    trial_end_date: trialEnd.toISOString(),
                    subscription_start_date: trialStart.toISOString(),
                    expires_date: trialEnd.toISOString(),
                    auto_renew_status: true
                })
                .select()
                .single();

            if (error) throw error;

            // Update user's subscription tier and storage quota
            await this.updateUserSubscriptionStatus(deviceId, tier, 'trial');

            console.log(`🆓 Trial started: ${deviceId} -> ${tier} (${this.trialDurationDays} days)`);
            
            return subscription;

        } catch (error) {
            console.error('❌ Start trial error:', error);
            throw error;
        }
    }

    /**
     * Check if user has ever had a trial
     */
    async hasHadTrial(deviceId) {
        try {
            const { data, error } = await supabase
                .from('subscriptions')
                .select('id')
                .eq('users.device_id', deviceId)
                .eq('is_trial_period', true)
                .limit(1);

            if (error) throw error;

            return data && data.length > 0;

        } catch (error) {
            console.error('❌ Check trial history error:', error);
            return false;
        }
    }

    /**
     * Update subscription from App Store receipt validation
     */
    async updateFromReceiptValidation(deviceId, latestReceiptInfo, pendingRenewalInfo) {
        try {
            const user = await this.getOrCreateUser(deviceId);
            const originalTransactionId = latestReceiptInfo.original_transaction_id;
            const productId = latestReceiptInfo.product_id;
            const tier = this.productTierMap[productId];

            if (!tier) {
                throw new Error(`Invalid product ID: ${productId}`);
            }

            const expiresDate = new Date(parseInt(latestReceiptInfo.expires_date_ms));
            const isTrialPeriod = latestReceiptInfo.is_trial_period === 'true';
            const autoRenewStatus = pendingRenewalInfo?.auto_renew_status === '1';

            // Check for existing subscription
            const { data: existing } = await supabase
                .from('subscriptions')
                .select('id, status')
                .eq('original_transaction_id', originalTransactionId)
                .single();

            if (existing) {
                // Update existing subscription
                const { data: updated, error } = await supabase
                    .from('subscriptions')
                    .update({
                        status: this.determineSubscriptionStatus(latestReceiptInfo, pendingRenewalInfo),
                        tier,
                        expires_date: expiresDate.toISOString(),
                        is_trial_period: isTrialPeriod,
                        auto_renew_status: autoRenewStatus,
                        latest_receipt_info: latestReceiptInfo,
                        pending_renewal_info: pendingRenewalInfo,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id)
                    .select()
                    .single();

                if (error) throw error;

                await this.updateUserSubscriptionStatus(deviceId, tier, updated.status);
                return updated;

            } else {
                // Create new subscription
                const { data: created, error } = await supabase
                    .from('subscriptions')
                    .insert({
                        user_id: user.id,
                        original_transaction_id: originalTransactionId,
                        product_id: productId,
                        tier,
                        status: this.determineSubscriptionStatus(latestReceiptInfo, pendingRenewalInfo),
                        is_trial_period: isTrialPeriod,
                        subscription_start_date: new Date(parseInt(latestReceiptInfo.purchase_date_ms)).toISOString(),
                        expires_date: expiresDate.toISOString(),
                        auto_renew_status: autoRenewStatus,
                        latest_receipt_info: latestReceiptInfo,
                        pending_renewal_info: pendingRenewalInfo
                    })
                    .select()
                    .single();

                if (error) throw error;

                await this.updateUserSubscriptionStatus(deviceId, tier, created.status);
                return created;
            }

        } catch (error) {
            console.error('❌ Update from receipt validation error:', error);
            throw error;
        }
    }

    /**
     * Update subscription from App Store Server Notification
     */
    async updateFromNotification(notificationData) {
        try {
            const {
                originalTransactionId,
                productId,
                status,
                expiresDate,
                isTrialPeriod,
                autoRenewStatus,
                latestReceiptInfo,
                pendingRenewalInfo
            } = notificationData;

            const tier = this.productTierMap[productId];
            if (!tier) {
                throw new Error(`Invalid product ID: ${productId}`);
            }

            // Find subscription by original transaction ID
            const { data: subscription, error: findError } = await supabase
                .from('subscriptions')
                .select('id, user_id, users(device_id)')
                .eq('original_transaction_id', originalTransactionId)
                .single();

            if (findError) {
                console.error('❌ Subscription not found for notification:', originalTransactionId);
                return null;
            }

            // Update subscription
            const { data: updated, error: updateError } = await supabase
                .from('subscriptions')
                .update({
                    status,
                    tier,
                    expires_date: expiresDate.toISOString(),
                    is_trial_period: isTrialPeriod,
                    auto_renew_status: autoRenewStatus,
                    latest_receipt_info: latestReceiptInfo,
                    pending_renewal_info: pendingRenewalInfo,
                    updated_at: new Date().toISOString()
                })
                .eq('id', subscription.id)
                .select()
                .single();

            if (updateError) throw updateError;

            // Update user's subscription status
            await this.updateUserSubscriptionStatus(subscription.users.device_id, tier, status);

            console.log(`📱 Subscription updated from notification: ${originalTransactionId} -> ${status}`);
            return updated;

        } catch (error) {
            console.error('❌ Update from notification error:', error);
            throw error;
        }
    }

    /**
     * Cancel subscription (user initiated)
     */
    async cancelSubscription(deviceId, reason = 'user_cancelled') {
        try {
            const subscription = await this.getActiveSubscription(deviceId);
            if (!subscription) {
                throw new Error('No active subscription found');
            }

            // Update subscription status
            const { data: cancelled, error } = await supabase
                .from('subscriptions')
                .update({
                    status: 'cancelled',
                    auto_renew_status: false,
                    // Keep access until expiration date
                    updated_at: new Date().toISOString()
                })
                .eq('id', subscription.id)
                .select()
                .single();

            if (error) throw error;

            console.log(`❌ Subscription cancelled: ${deviceId} (${reason})`);
            return cancelled;

        } catch (error) {
            console.error('❌ Cancel subscription error:', error);
            throw error;
        }
    }

    /**
     * Handle failed renewal (enter grace period)
     */
    async handleFailedRenewal({ originalTransactionId, gracePeriod, gracePeriodExpiresDate }) {
        try {
            const updateData = {
                status: gracePeriod ? 'grace' : 'expired',
                updated_at: new Date().toISOString()
            };

            if (gracePeriod && gracePeriodExpiresDate) {
                updateData.grace_period_expires_date = gracePeriodExpiresDate.toISOString();
            }

            const { data: updated, error } = await supabase
                .from('subscriptions')
                .update(updateData)
                .eq('original_transaction_id', originalTransactionId)
                .select('*, users(device_id)')
                .single();

            if (error) throw error;

            // Update user status
            await this.updateUserSubscriptionStatus(
                updated.users.device_id, 
                updated.tier, 
                updated.status
            );

            return updated;

        } catch (error) {
            console.error('❌ Handle failed renewal error:', error);
            throw error;
        }
    }

    /**
     * Handle successful renewal
     */
    async handleSuccessfulRenewal({ originalTransactionId, expiresDate, latestReceiptInfo, pendingRenewalInfo }) {
        try {
            const { data: updated, error } = await supabase
                .from('subscriptions')
                .update({
                    status: 'active',
                    expires_date: expiresDate.toISOString(),
                    grace_period_expires_date: null, // Clear grace period
                    latest_receipt_info: latestReceiptInfo,
                    pending_renewal_info: pendingRenewalInfo,
                    updated_at: new Date().toISOString()
                })
                .eq('original_transaction_id', originalTransactionId)
                .select('*, users(device_id)')
                .single();

            if (error) throw error;

            // Update user status
            await this.updateUserSubscriptionStatus(
                updated.users.device_id, 
                updated.tier, 
                'active'
            );

            return updated;

        } catch (error) {
            console.error('❌ Handle successful renewal error:', error);
            throw error;
        }
    }

    /**
     * Handle grace period expiration
     */
    async handleGracePeriodExpired({ originalTransactionId }) {
        try {
            const { data: expired, error } = await supabase
                .from('subscriptions')
                .update({
                    status: 'expired',
                    updated_at: new Date().toISOString()
                })
                .eq('original_transaction_id', originalTransactionId)
                .select('*, users(device_id)')
                .single();

            if (error) throw error;

            // Update user to free tier
            await this.updateUserSubscriptionStatus(expired.users.device_id, 'free', 'expired');

            return expired;

        } catch (error) {
            console.error('❌ Handle grace period expired error:', error);
            throw error;
        }
    }

    /**
     * Schedule deletion after grace period
     */
    async scheduleDeletionAfterGracePeriod({ originalTransactionId, deletionDate }) {
        try {
            // Get subscription and user info
            const { data: subscription, error } = await supabase
                .from('subscriptions')
                .select('user_id, users(device_id)')
                .eq('original_transaction_id', originalTransactionId)
                .single();

            if (error) throw error;

            // Check if deletion already scheduled
            const { data: existing } = await supabase
                .from('deletion_schedules')
                .select('id')
                .eq('user_id', subscription.user_id)
                .eq('status', 'scheduled')
                .single();

            if (!existing) {
                // Schedule deletion
                await supabase
                    .from('deletion_schedules')
                    .insert({
                        user_id: subscription.user_id,
                        scheduled_for: deletionDate.toISOString(),
                        deletion_type: 'grace_expire'
                    });

                console.log(`🗑️ Deletion scheduled: ${subscription.users.device_id} for ${deletionDate.toISOString()}`);
            }

        } catch (error) {
            console.error('❌ Schedule deletion error:', error);
            throw error;
        }
    }

    /**
     * Get or create user record
     */
    async getOrCreateUser(deviceId) {
        try {
            // Try to get existing user
            const { data: existingUser } = await supabase
                .from('users')
                .select('*')
                .eq('device_id', deviceId)
                .single();

            if (existingUser) {
                // Update last active
                await supabase
                    .from('users')
                    .update({ last_active_at: new Date().toISOString() })
                    .eq('id', existingUser.id);
                
                return existingUser;
            }

            // Create new user
            const { data: newUser, error } = await supabase
                .from('users')
                .insert({
                    device_id: deviceId,
                    subscription_status: 'free',
                    storage_quota: 1073741824, // 1GB free tier
                    storage_used: 0
                })
                .select()
                .single();

            if (error) throw error;

            console.log(`👤 New user created: ${deviceId}`);
            return newUser;

        } catch (error) {
            console.error('❌ Get or create user error:', error);
            throw error;
        }
    }

    /**
     * Update user's subscription status and storage quota
     */
    async updateUserSubscriptionStatus(deviceId, tier, status) {
        try {
            // Get tier configuration
            const { data: tierConfig, error: tierError } = await supabase
                .from('subscription_tiers')
                .select('*')
                .eq('id', tier)
                .single();

            if (tierError) {
                console.warn(`⚠️ Tier configuration not found: ${tier}`);
                return;
            }

            const { error } = await supabase
                .from('users')
                .update({
                    subscription_status: status,
                    subscription_tier: tier,
                    storage_quota: tierConfig.storage_quota,
                    last_active_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('device_id', deviceId);

            if (error) throw error;

            console.log(`👤 User updated: ${deviceId} -> ${tier} (${status})`);

        } catch (error) {
            console.error('❌ Update user subscription status error:', error);
            throw error;
        }
    }

    /**
     * Determine subscription status from receipt info
     */
    determineSubscriptionStatus(latestReceiptInfo, pendingRenewalInfo) {
        const expiresDate = new Date(parseInt(latestReceiptInfo.expires_date_ms));
        const now = new Date();

        if (expiresDate > now) {
            return latestReceiptInfo.is_trial_period === 'true' ? 'trial' : 'active';
        } else {
            // Check if in billing retry period (grace period)
            if (pendingRenewalInfo?.is_in_billing_retry_period === '1') {
                return 'grace';
            }
            return 'expired';
        }
    }

    /**
     * Get subscription analytics
     */
    async getSubscriptionAnalytics() {
        try {
            // Get subscription counts by status
            const { data: statusCounts, error: statusError } = await supabase
                .from('subscriptions')
                .select('status')
                .neq('status', 'expired');

            if (statusError) throw statusError;

            // Get tier counts
            const { data: tierCounts, error: tierError } = await supabase
                .from('subscriptions')
                .select('tier')
                .in('status', ['active', 'trial', 'grace']);

            if (tierError) throw tierError;

            // Calculate metrics
            const statusBreakdown = statusCounts.reduce((acc, sub) => {
                acc[sub.status] = (acc[sub.status] || 0) + 1;
                return acc;
            }, {});

            const tierBreakdown = tierCounts.reduce((acc, sub) => {
                acc[sub.tier] = (acc[sub.tier] || 0) + 1;
                return acc;
            }, {});

            return {
                totalActiveSubscriptions: statusCounts.length,
                statusBreakdown,
                tierBreakdown,
                generatedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Get subscription analytics error:', error);
            throw error;
        }
    }
}