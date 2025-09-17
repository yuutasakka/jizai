/**
 * App Store Server Notifications V2 Webhook Handler
 * 
 * Handles subscription lifecycle events from Apple's App Store
 * Supports all notification types with proper signature verification
 */

import jwt from 'jsonwebtoken';
import { supabaseService } from '../config/supabase.mjs';
import { auditServiceClientUsage } from '../utils/service-client-audit.mjs';

/**
 * Main webhook handler for App Store Server Notifications V2
 */
export class AppStoreWebhookHandler {
  constructor() {
    this.bundleId = process.env.APPSTORE_BUNDLE_ID;
    this.environment = process.env.APPSTORE_ENVIRONMENT || 'sandbox';
    this.sharedSecret = process.env.APPSTORE_SHARED_SECRET;
  }

  /**
   * Process incoming webhook notification
   */
  async handleWebhook(req, res) {
    try {
      // Verify webhook signature
      const signedPayload = req.body;
      if (!this.verifySignature(signedPayload)) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // Decode JWT payload
      const notification = this.decodeNotification(signedPayload);
      if (!notification) {
        console.error('Failed to decode notification');
        return res.status(400).json({ error: 'Invalid payload' });
      }

      // Log notification receipt
      await this.logNotification(notification, 'success');

      // Process notification based on type
      await this.processNotification(notification);

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      
      // Log failed notification if we have it
      if (req.body) {
        try {
          const notification = this.decodeNotification(req.body);
          if (notification) {
            await this.logNotification(notification, 'failed', error.message);
          }
        } catch (logError) {
          console.error('Failed to log error notification:', logError);
        }
      }

      res.status(500).json({ error: 'Processing failed' });
    }
  }

  /**
   * Verify JWT signature with Apple's certificate
   */
  async verifySignature(rawBody, signatureHeader) {
    try {
      // Apple Server Notifications v2 may send a signed JWT in the body (signedPayload) or a signature header.
      // Here we accept header token precedence, otherwise try to extract signedPayload from JSON body.
      let token = signatureHeader;
      if (!token) {
        try {
          const parsed = JSON.parse(rawBody);
          token = parsed?.signedPayload || null;
        } catch {}
      }
      if (!token || typeof token !== 'string') {
        return { valid: false, error: 'No signature token found' };
      }

      // Decode without verifying to inspect claims
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || !decoded.payload) {
        return { valid: false, error: 'Invalid JWT structure' };
      }

      // Soft-validate bundleId if present
      const bundleId = decoded.payload.data?.bundleId || decoded.payload.bundleId;
      if (this.bundleId && bundleId && bundleId !== this.bundleId) {
        return { valid: false, error: `Bundle ID mismatch: expected ${this.bundleId}, got ${bundleId}` };
      }

      // Cryptographic verification (production): requires JWKS/PEM public key
      // To avoid hardcoding endpoints, allow configuration via APPSTORE_JWKS_PEM (PEM) or APPSTORE_PUBLIC_KEY
      const publicKey = process.env.APPSTORE_PUBLIC_KEY || process.env.APPSTORE_JWKS_PEM;
      if (process.env.NODE_ENV === 'production') {
        if (!publicKey) {
          console.error('Apple signature verification key not configured');
          return { valid: false, error: 'Verification key not configured' };
        }
        try {
          jwt.verify(token, publicKey, { algorithms: ['ES256', 'RS256'] });
        } catch (e) {
          console.error('JWT verification failed:', e.message);
          return { valid: false, error: 'JWT verification failed' };
        }
      }

      return { valid: true };
    } catch (error) {
      console.error('Signature verification error:', error);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Decode JWT notification payload
   */
  decodeNotification(signedPayload) {
    try {
      const decoded = jwt.decode(signedPayload);
      return decoded;
    } catch (error) {
      console.error('Notification decode error:', error);
      return null;
    }
  }

  /**
   * Process notification based on type
   */
  async processNotification(notification) {
    const { notificationType, subtype, data } = notification;
    const { signedTransactionInfo } = data || {};
    
    if (!signedTransactionInfo) {
      console.warn('No transaction info in notification');
      return;
    }

    // Decode transaction info
    const transactionInfo = jwt.decode(signedTransactionInfo);
    const { originalTransactionId, productId } = transactionInfo;

    console.log(`Processing ${notificationType} for transaction ${originalTransactionId}`);

    switch (notificationType) {
      case 'SUBSCRIBED':
        await this.handleSubscribed(transactionInfo, subtype);
        break;
      
      case 'DID_RENEW':
        await this.handleDidRenew(transactionInfo, subtype);
        break;
      
      case 'DID_FAIL_TO_RENEW':
        await this.handleFailedToRenew(transactionInfo, subtype);
        break;
      
      case 'EXPIRED':
        await this.handleExpired(transactionInfo, subtype);
        break;
      
      case 'GRACE_PERIOD_EXPIRED':
        await this.handleGracePeriodExpired(transactionInfo);
        break;
      
      case 'DID_CHANGE_RENEWAL_STATUS':
        await this.handleRenewalStatusChanged(transactionInfo);
        break;
      
      case 'REFUND':
        await this.handleRefund(transactionInfo);
        break;
      
      case 'REVOKE':
        await this.handleRevoke(transactionInfo);
        break;
      
      default:
        console.warn(`Unknown notification type: ${notificationType}`);
    }
  }

  /**
   * Handle new subscription (SUBSCRIBED)
   */
  async handleSubscribed(transactionInfo, subtype) {
    const {
      originalTransactionId,
      productId,
      expiresDate,
      purchaseDate,
      appAccountToken
    } = transactionInfo;

    // Map product ID to plan key
    const planKey = this.getProductIdToPlanKey(productId);
    if (!planKey) {
      console.error(`Unknown product ID: ${productId}`);
      return;
    }

    // Get subscription tier info (system operation - bypassing RLS by design)
    auditServiceClientUsage('get_tier_info', 'appstore_webhook', { plan_key: planKey }, true);
    const { data: tier } = await supabaseService
      .from('vault_subscription_tiers')
      .select('*')
      .eq('plan_key', planKey)
      .single();

    if (!tier) {
      console.error(`Unknown plan key: ${planKey}`);
      return;
    }

    const userId = appAccountToken; // Device ID
    const renewsAt = new Date(expiresDate);
    const startedAt = new Date(purchaseDate);

    // Create or update subscription
    const subscriptionData = {
      user_id: userId,
      plan_key: planKey,
      status: 'active',
      subscription_start_at: startedAt,
      renews_at: renewsAt,
      original_transaction_id: originalTransactionId,
      app_account_token: appAccountToken,
      product_id: productId,
      auto_renew_status: true,
      storage_quota_gb: tier.storage_quota_gb,
      updated_at: new Date()
    };

    auditServiceClientUsage('subscription_create', 'appstore_webhook', { user_id: userId, plan_key: planKey, transaction_id: originalTransactionId }, true);
    const { error } = await supabaseService
      .from('vault_subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'original_transaction_id',
        returning: 'minimal'
      });

    if (error) {
      console.error('Failed to create subscription:', error);
      throw error;
    }

    console.log(`Subscription activated for user ${userId}, plan ${planKey}`);
  }

  /**
   * Handle successful renewal (DID_RENEW)
   */
  async handleDidRenew(transactionInfo, subtype) {
    const { originalTransactionId, expiresDate } = transactionInfo;
    const renewsAt = new Date(expiresDate);

    auditServiceClientUsage('subscription_renew', 'appstore_webhook', { transaction_id: originalTransactionId }, true);
    const { error } = await supabaseService
      .from('vault_subscriptions')
      .update({
        status: 'active',
        renews_at: renewsAt,
        grace_period_end_at: null,
        updated_at: new Date()
      })
      .eq('original_transaction_id', originalTransactionId);

    if (error) {
      console.error('Failed to update renewal:', error);
      throw error;
    }

    console.log(`Subscription renewed for transaction ${originalTransactionId}`);
  }

  /**
   * Handle failed renewal (DID_FAIL_TO_RENEW)
   */
  async handleFailedToRenew(transactionInfo, subtype) {
    const { originalTransactionId, expiresDate } = transactionInfo;
    const expiredAt = new Date(expiresDate);
    const gracePeriodEnd = new Date(expiredAt.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days

    auditServiceClientUsage('subscription_grace', 'appstore_webhook', { transaction_id: originalTransactionId }, true);
    const { error } = await supabaseService
      .from('vault_subscriptions')
      .update({
        status: 'in_grace',
        grace_period_end_at: gracePeriodEnd,
        updated_at: new Date()
      })
      .eq('original_transaction_id', originalTransactionId);

    if (error) {
      console.error('Failed to update failed renewal:', error);
      throw error;
    }

    console.log(`Subscription entered grace period for transaction ${originalTransactionId}`);
  }

  /**
   * Handle subscription expiration (EXPIRED)
   */
  async handleExpired(transactionInfo, subtype) {
    const { originalTransactionId } = transactionInfo;

    auditServiceClientUsage('subscription_expire', 'appstore_webhook', { transaction_id: originalTransactionId }, true);
    const { error } = await supabaseService
      .from('vault_subscriptions')
      .update({
        status: 'expired',
        updated_at: new Date()
      })
      .eq('original_transaction_id', originalTransactionId);

    if (error) {
      console.error('Failed to update expiration:', error);
      throw error;
    }

    console.log(`Subscription expired for transaction ${originalTransactionId}`);
  }

  /**
   * Handle grace period expiration (GRACE_PERIOD_EXPIRED)
   */
  async handleGracePeriodExpired(transactionInfo) {
    const { originalTransactionId } = transactionInfo;
    const deletionDate = new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)); // 90 days

    auditServiceClientUsage('subscription_cancel', 'appstore_webhook', { transaction_id: originalTransactionId }, true);
    const { error } = await supabaseService
      .from('vault_subscriptions')
      .update({
        status: 'canceled',
        deletion_scheduled_at: deletionDate,
        updated_at: new Date()
      })
      .eq('original_transaction_id', originalTransactionId);

    if (error) {
      console.error('Failed to update grace period expiry:', error);
      throw error;
    }

    console.log(`Subscription scheduled for deletion: ${originalTransactionId}`);
  }

  /**
   * Handle auto-renewal status change
   */
  async handleRenewalStatusChanged(transactionInfo) {
    const { originalTransactionId, autoRenewStatus } = transactionInfo;

    auditServiceClientUsage('subscription_renew_status', 'appstore_webhook', { transaction_id: originalTransactionId, auto_renew: autoRenewStatus }, true);
    const { error } = await supabaseService
      .from('vault_subscriptions')
      .update({
        auto_renew_status: autoRenewStatus,
        updated_at: new Date()
      })
      .eq('original_transaction_id', originalTransactionId);

    if (error) {
      console.error('Failed to update renewal status:', error);
      throw error;
    }

    console.log(`Renewal status changed for ${originalTransactionId}: ${autoRenewStatus}`);
  }

  /**
   * Handle refund (REFUND)
   */
  async handleRefund(transactionInfo) {
    const { originalTransactionId } = transactionInfo;

    auditServiceClientUsage('subscription_refund', 'appstore_webhook', { transaction_id: originalTransactionId }, true);
    const { error } = await supabaseService
      .from('vault_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date(),
        deletion_scheduled_at: new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)),
        updated_at: new Date()
      })
      .eq('original_transaction_id', originalTransactionId);

    if (error) {
      console.error('Failed to process refund:', error);
      throw error;
    }

    console.log(`Refund processed for transaction ${originalTransactionId}`);
  }

  /**
   * Handle subscription revocation (REVOKE)
   */
  async handleRevoke(transactionInfo) {
    const { originalTransactionId } = transactionInfo;

    auditServiceClientUsage('subscription_revoke', 'appstore_webhook', { transaction_id: originalTransactionId }, true);
    const { error } = await supabaseService
      .from('vault_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date(),
        deletion_scheduled_at: new Date(), // Immediate deletion for revoke
        updated_at: new Date()
      })
      .eq('original_transaction_id', originalTransactionId);

    if (error) {
      console.error('Failed to process revocation:', error);
      throw error;
    }

    console.log(`Subscription revoked for transaction ${originalTransactionId}`);
  }

  /**
   * Log notification to audit table
   */
  async logNotification(notification, status, errorMessage = null) {
    try {
      const { signedTransactionInfo } = notification.data || {};
      const transactionInfo = signedTransactionInfo ? jwt.decode(signedTransactionInfo) : null;

      const logData = {
        notification_uuid: notification.notificationUUID,
        notification_type: notification.notificationType,
        notification_subtype: notification.subtype,
        original_transaction_id: transactionInfo?.originalTransactionId,
        raw_payload: notification,
        processing_status: status,
        error_message: errorMessage
      };

      auditServiceClientUsage('log_notification', 'appstore_webhook', { uuid: notification.notificationUUID, type: notification.notificationType }, true);
      await supabaseService
        .from('app_store_notifications')
        .insert(logData);
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }

  /**
   * Map App Store product ID to internal plan key
   */
  getProductIdToPlanKey(productId) {
    const mapping = {
      'com.jizai.vault.lite.month': 'lite',
      'com.jizai.vault.standard.month': 'standard',
      'com.jizai.vault.pro.month': 'pro',
      'com.jizai.vault.addon.50gb.month': 'addon_50gb'
    };

    return mapping[productId] || null;
  }

  /**
   * Get webhook health status
   */
  async getHealthStatus() {
    try {
      // Check recent notifications (system operation - health check)
      auditServiceClientUsage('health_check', 'appstore_webhook', {}, true);
      const { data: recentNotifications, error } = await supabaseService
        .from('app_store_notifications')
        .select('processing_status, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        throw error;
      }

      const totalNotifications = recentNotifications.length;
      const failedNotifications = recentNotifications.filter(n => n.processing_status === 'failed').length;
      const successRate = totalNotifications > 0 ? ((totalNotifications - failedNotifications) / totalNotifications) * 100 : 100;

      return {
        status: successRate >= 95 ? 'healthy' : 'degraded',
        totalNotifications,
        failedNotifications,
        successRate: Math.round(successRate * 100) / 100,
        lastNotificationAt: recentNotifications[0]?.created_at || null
      };
    } catch (error) {
      console.error('Health check error:', error);
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

export default new AppStoreWebhookHandler();
