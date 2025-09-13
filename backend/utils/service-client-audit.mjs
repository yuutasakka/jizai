/**
 * Service Client Audit Utility
 * Monitors and logs service client usage for security auditing
 */

import { secureLogger } from './secure-logger.mjs';

/**
 * Categories of legitimate service client usage
 */
export const LEGITIMATE_OPERATIONS = {
  // System maintenance and cleanup
  SYSTEM_CLEANUP: 'system_cleanup',
  STATISTICS: 'system_statistics', 
  MAINTENANCE: 'system_maintenance',
  
  // Webhook and external integrations
  WEBHOOK: 'webhook_processing',
  EXTERNAL_SYNC: 'external_sync',
  
  // Administrative operations
  ADMIN_REPORTING: 'admin_reporting',
  SYSTEM_CONFIG: 'system_configuration',
  
  // Legitimate cross-user operations
  NOTIFICATION_SYSTEM: 'system_notifications',
  SUBSCRIPTION_WEBHOOK: 'subscription_webhook'
};

/**
 * Monitor service client usage
 * @param {string} operation - Operation being performed
 * @param {string} category - Operation category from LEGITIMATE_OPERATIONS
 * @param {Object} context - Additional context for the operation
 * @param {boolean} isLegitimate - Whether this is a legitimate admin operation
 */
export function auditServiceClientUsage(operation, category, context = {}, isLegitimate = false) {
  const auditData = {
    operation,
    category,
    context,
    isLegitimate,
    timestamp: new Date().toISOString(),
    stack: new Error().stack?.split('\n')[2]?.trim() // Caller information
  };
  
  if (isLegitimate && Object.values(LEGITIMATE_OPERATIONS).includes(category)) {
    // Log legitimate usage at info level
    secureLogger.info('Service client used for legitimate operation', auditData);
  } else {
    // Log suspicious usage at warning level
    secureLogger.warn('Service client used - potential RLS bypass', {
      ...auditData,
      security_review_required: true,
      recommendation: 'Consider using authenticated client with RLS'
    });
  }
  
  return auditData;
}

/**
 * Check if operation is legitimate admin operation
 * @param {string} operation - Operation name
 * @param {Object} context - Operation context
 * @returns {boolean} True if legitimate admin operation
 */
export function isLegitimateAdminOperation(operation, context = {}) {
  // System cleanup operations
  if (operation.includes('cleanup') || operation.includes('expire') || operation.includes('delete_old')) {
    return true;
  }
  
  // Statistics and reporting
  if (operation.includes('stats') || operation.includes('report') || operation.includes('aggregate')) {
    return true;
  }
  
  // Webhook processing
  if (context.source === 'webhook' || operation.includes('webhook')) {
    return true;
  }
  
  // System notifications (not user-specific)
  if (operation.includes('system_notification') && !context.user_id) {
    return true;
  }
  
  return false;
}

/**
 * Enhanced audit function for notification service
 * @param {string} operation - Operation being performed
 * @param {Object} context - Context including recipient info
 */
export function auditNotificationOperation(operation, context = {}) {
  const isSystemNotification = !context.user_id || context.type === 'system';
  const category = isSystemNotification ? 
    LEGITIMATE_OPERATIONS.NOTIFICATION_SYSTEM : 
    'user_notification';
    
  return auditServiceClientUsage(
    operation, 
    category, 
    context, 
    isSystemNotification
  );
}

/**
 * Generate audit report of service client usage
 * @param {Date} startDate - Start date for report
 * @param {Date} endDate - End date for report
 * @returns {Object} Audit report summary
 */
export function generateAuditReport(startDate, endDate) {
  // This would typically query logs, but for now return structure
  return {
    period: { start: startDate, end: endDate },
    summary: {
      total_operations: 0,
      legitimate_operations: 0,
      suspicious_operations: 0,
      categories: {}
    },
    recommendations: [
      'Review suspicious operations for RLS compliance',
      'Migrate user data operations to authenticated clients',
      'Implement proper JWT authentication for user operations'
    ]
  };
}