/**
 * Notification Service
 * 
 * Handles in-app notifications for family sharing events, subscription changes,
 * and system notifications. Manages notification delivery and read status.
 */

import { supabaseService } from '../config/supabase.mjs';
import { auditServiceClientUsage } from '../utils/service-client-audit.mjs';

export class NotificationService {
  constructor() {
    this.maxNotificationsPerUser = 100;
    this.defaultRetentionDays = 30;
  }

  /**
   * Send family invitation notification
   */
  async sendFamilyInvitation(recipientDeviceId, senderDeviceId, familyVaultId, familyName) {
    try {
      const notification = {
        device_id: recipientDeviceId,
        type: 'family_invitation',
        title: 'Family Vault Invitation',
        message: `You've been invited to join the family vault "${familyName}"`,
        data: {
          sender_device_id: senderDeviceId,
          family_vault_id: familyVaultId,
          family_name: familyName
        },
        is_read: false,
        created_at: new Date(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };

      auditServiceClientUsage('family_invitation', 'system_notification', { type: 'family_invitation' }, true);
      const { data, error } = await supabaseService
        .from('notifications')
        .insert(notification)
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('❌ Send family invitation notification error:', error);
      throw error;
    }
  }

  /**
   * Send access request notification
   */
  async sendAccessRequest(familyVaultId, requesterDeviceId, ownerDeviceId, familyName) {
    try {
      const notification = {
        device_id: ownerDeviceId,
        type: 'access_request',
        title: 'Family Vault Access Request',
        message: `Someone has requested access to join your family vault "${familyName}"`,
        data: {
          requester_device_id: requesterDeviceId,
          family_vault_id: familyVaultId,
          family_name: familyName
        },
        is_read: false,
        created_at: new Date()
      };

      auditServiceClientUsage('access_request', 'system_notification', { type: 'access_request' }, true);
      const { data, error } = await supabaseService
        .from('notifications')
        .insert(notification)
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('❌ Send access request notification error:', error);
      throw error;
    }
  }

  /**
   * Send subscription change notification
   */
  async sendSubscriptionChange(deviceId, subscriptionTier, changeType, expiresAt = null) {
    try {
      let title, message;
      
      switch (changeType) {
        case 'upgraded':
          title = 'Subscription Upgraded';
          message = `Your subscription has been upgraded to ${subscriptionTier}`;
          break;
        case 'downgraded':
          title = 'Subscription Changed';
          message = `Your subscription has been changed to ${subscriptionTier}`;
          break;
        case 'renewed':
          title = 'Subscription Renewed';
          message = `Your ${subscriptionTier} subscription has been renewed`;
          break;
        case 'cancelled':
          title = 'Subscription Cancelled';
          message = `Your ${subscriptionTier} subscription has been cancelled`;
          break;
        case 'expired':
          title = 'Subscription Expired';
          message = `Your ${subscriptionTier} subscription has expired`;
          break;
        default:
          title = 'Subscription Update';
          message = `Your subscription status has changed`;
      }

      const notification = {
        device_id: deviceId,
        type: 'subscription_change',
        title: title,
        message: message,
        data: {
          subscription_tier: subscriptionTier,
          change_type: changeType,
          expires_at: expiresAt
        },
        is_read: false,
        created_at: new Date()
      };

      auditServiceClientUsage('subscription_change', 'system_notification', { type: 'subscription_change', changeType }, true);
      const { data, error } = await supabaseService
        .from('notifications')
        .insert(notification)
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('❌ Send subscription change notification error:', error);
      throw error;
    }
  }

  /**
   * Send storage quota warning
   */
  async sendStorageWarning(deviceId, usagePercentage, subscriptionTier) {
    try {
      let title, message;
      
      if (usagePercentage >= 95) {
        title = 'Storage Almost Full';
        message = `Your storage is ${usagePercentage}% full. Consider upgrading or deleting unused memories.`;
      } else if (usagePercentage >= 80) {
        title = 'Storage Warning';
        message = `Your storage is ${usagePercentage}% full. You may want to review your memories.`;
      } else {
        return null; // No notification needed
      }

      const notification = {
        device_id: deviceId,
        type: 'storage_warning',
        title: title,
        message: message,
        data: {
          usage_percentage: usagePercentage,
          subscription_tier: subscriptionTier
        },
        is_read: false,
        created_at: new Date()
      };

      auditServiceClientUsage('storage_warning', 'system_notification', { type: 'storage_warning', usagePercentage }, true);
      const { data, error } = await supabaseService
        .from('notifications')
        .insert(notification)
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('❌ Send storage warning notification error:', error);
      throw error;
    }
  }

  /**
   * Get notifications for user
   */
  async getUserNotifications(deviceId, limit = 50, offset = 0, unreadOnly = false) {
    try {
      auditServiceClientUsage('get_notifications', 'notification_system', { unreadOnly }, true);
      let query = supabaseService
        .from('notifications')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data: notifications, error } = await query;

      if (error) throw error;

      // Filter out expired notifications
      const activeNotifications = notifications?.filter(notification => {
        return !notification.expires_at || new Date(notification.expires_at) > new Date();
      }) || [];

      return activeNotifications;
    } catch (error) {
      console.error('❌ Get user notifications error:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, deviceId) {
    try {
      auditServiceClientUsage('mark_read', 'notification_system', { notificationId }, true);
      const { data, error } = await supabaseService
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date()
        })
        .eq('id', notificationId)
        .eq('device_id', deviceId)
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('❌ Mark notification as read error:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(deviceId) {
    try {
      auditServiceClientUsage('mark_all_read', 'notification_system', {}, true);
      const { data, error } = await supabaseService
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date()
        })
        .eq('device_id', deviceId)
        .eq('is_read', false);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('❌ Mark all notifications as read error:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, deviceId) {
    try {
      auditServiceClientUsage('delete_notification', 'notification_system', { notificationId }, true);
      const { error } = await supabaseService
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('device_id', deviceId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('❌ Delete notification error:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(deviceId) {
    try {
      auditServiceClientUsage('get_unread_count', 'notification_system', {}, true);
      const { count, error } = await supabaseService
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('device_id', deviceId)
        .eq('is_read', false)
        .gte('expires_at', new Date().toISOString());

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('❌ Get unread count error:', error);
      return 0;
    }
  }

  /**
   * Clean up old notifications (background job)
   */
  async cleanupOldNotifications() {
    try {
      auditServiceClientUsage('cleanup_notifications', 'system_maintenance', {}, true);
      const cutoffDate = new Date(Date.now() - (this.defaultRetentionDays * 24 * 60 * 60 * 1000));

      // Delete old read notifications
      const { data: deletedRead, error: readError } = await supabaseService
        .from('notifications')
        .delete()
        .eq('is_read', true)
        .lt('created_at', cutoffDate.toISOString());

      if (readError) throw readError;

      // Delete expired notifications
      const { data: deletedExpired, error: expiredError } = await supabaseService
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (expiredError) throw expiredError;

      return {
        deletedReadCount: deletedRead?.length || 0,
        deletedExpiredCount: deletedExpired?.length || 0,
        cleanedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Cleanup old notifications error:', error);
      throw error;
    }
  }

  /**
   * Send system announcement
   */
  async sendSystemAnnouncement(title, message, targetDeviceIds = null, priority = 'normal') {
    try {
      let notifications = [];

      auditServiceClientUsage('system_announcement', 'system_notification', { priority, targetCount: targetDeviceIds?.length || 'broadcast' }, true);
      if (targetDeviceIds) {
        // Send to specific devices
        notifications = targetDeviceIds.map(deviceId => ({
          device_id: deviceId,
          type: 'system_announcement',
          title: title,
          message: message,
          data: {
            priority: priority
          },
          is_read: false,
          created_at: new Date()
        }));
      } else {
        // Broadcast to all users - get active device IDs
        const { data: activeDevices, error: devicesError } = await supabaseService
          .from('subscriptions')
          .select('device_id')
          .in('status', ['active', 'trial', 'in_grace'])
          .limit(1000); // Safety limit

        if (devicesError) throw devicesError;

        notifications = activeDevices?.map(sub => ({
          device_id: sub.device_id,
          type: 'system_announcement',
          title: title,
          message: message,
          data: {
            priority: priority
          },
          is_read: false,
          created_at: new Date()
        })) || [];
      }

      if (notifications.length === 0) {
        return { sent: 0 };
      }

      // Insert in batches to avoid payload limits
      const batchSize = 100;
      let totalSent = 0;

      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        const { data, error } = await supabaseService
          .from('notifications')
          .insert(batch);

        if (error) throw error;
        totalSent += batch.length;
      }

      return { sent: totalSent };
    } catch (error) {
      console.error('❌ Send system announcement error:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats() {
    try {
      auditServiceClientUsage('get_stats', 'notification_system', {}, true);
      // Total notifications by type
      const { data: typeStats, error: typeError } = await supabaseService
        .from('notifications')
        .select('type')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (typeError) throw typeError;

      const statsByType = {};
      typeStats?.forEach(notification => {
        const type = notification.type;
        statsByType[type] = (statsByType[type] || 0) + 1;
      });

      // Unread notifications count
      const { count: unreadCount, error: unreadError } = await supabaseService
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      if (unreadError) throw unreadError;

      // Delivery rate (read vs unread)
      const { count: totalSent, error: totalError } = await supabaseService
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (totalError) throw totalError;

      const readRate = totalSent > 0 ? ((totalSent - unreadCount) / totalSent) * 100 : 0;

      return {
        last30Days: {
          total: totalSent || 0,
          byType: statsByType
        },
        current: {
          unread: unreadCount || 0,
          readRate: Math.round(readRate * 100) / 100
        },
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Get notification statistics error:', error);
      throw error;
    }
  }

  /**
   * Send welcome notification for new users
   */
  async sendWelcomeNotification(deviceId) {
    try {
      const notification = {
        device_id: deviceId,
        type: 'welcome',
        title: 'Welcome to Jizai!',
        message: 'Start creating beautiful memories and explore family sharing features.',
        data: {
          onboarding: true
        },
        is_read: false,
        created_at: new Date()
      };

      auditServiceClientUsage('welcome_notification', 'system_notification', { type: 'welcome' }, true);
      const { data, error } = await supabaseService
        .from('notifications')
        .insert(notification)
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('❌ Send welcome notification error:', error);
      throw error;
    }
  }
}

export default NotificationService;