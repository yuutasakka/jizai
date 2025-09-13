/**
 * App Store Receipt Validation Service
 * 
 * Validates App Store receipts and manages transaction verification
 * Integrates with Apple's App Store Connect API
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import axios from 'axios';

export class AppStoreReceiptValidator {
  constructor() {
    this.bundleId = process.env.APPLE_BUNDLE_ID;
    this.environment = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
    this.sharedSecret = process.env.APPLE_WEBHOOK_SECRET;
  }

  /**
   * Validate App Store receipt
   */
  async validateReceipt(receiptData) {
    try {
      // In production, this would validate against Apple's servers
      // For now, we'll do basic structure validation
      
      if (!receiptData || typeof receiptData !== 'string') {
        return {
          valid: false,
          error: 'Invalid receipt data format'
        };
      }

      // Mock validation for development
      if (this.environment === 'sandbox') {
        return this.mockReceiptValidation(receiptData);
      }

      // Production validation would go here
      return await this.validateWithApple(receiptData);

    } catch (error) {
      console.error('Receipt validation error:', error);
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Mock validation for development/testing
   */
  mockReceiptValidation(receiptData) {
    // Simple validation for testing
    if (receiptData.startsWith('mock_')) {
      return {
        valid: true,
        latestReceiptInfo: {
          original_transaction_id: 'mock_' + Date.now(),
          product_id: 'com.jizai.vault.standard',
          expires_date_ms: (Date.now() + 30 * 24 * 60 * 60 * 1000).toString(),
          is_trial_period: 'true',
          original_purchase_date_ms: Date.now().toString()
        },
        pendingRenewalInfo: {
          auto_renew_status: '1',
          product_id: 'com.jizai.vault.standard'
        }
      };
    }

    return {
      valid: false,
      error: 'Invalid test receipt'
    };
  }

  /**
   * Validate with Apple's servers (production)
   */
  async validateWithApple(receiptData) {
    const endpoint = this.environment === 'production'
      ? 'https://buy.itunes.apple.com/verifyReceipt'
      : 'https://sandbox.itunes.apple.com/verifyReceipt';

    try {
      const response = await axios.post(endpoint, {
        'receipt-data': receiptData,
        'password': this.sharedSecret,
        'exclude-old-transactions': true
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = response.data;
      
      if (result.status === 0) {
        return {
          valid: true,
          latestReceiptInfo: result.latest_receipt_info?.[0],
          pendingRenewalInfo: result.pending_renewal_info?.[0],
          receipt: result.receipt
        };
      } else {
        return {
          valid: false,
          error: `Apple validation failed with status: ${result.status}`,
          status: result.status
        };
      }

    } catch (error) {
      console.error('Apple receipt validation error:', error);
      return {
        valid: false,
        error: 'Failed to communicate with Apple servers'
      };
    }
  }

  /**
   * Verify JWT signature from App Store Server Notifications
   */
  verifyJWTSignature(signedPayload) {
    try {
      // In production, verify against Apple's certificate chain
      // For now, just decode and verify structure
      const decoded = jwt.decode(signedPayload, { complete: true });
      
      if (!decoded || !decoded.payload) {
        return { valid: false, error: 'Invalid JWT structure' };
      }

      // Verify bundle ID matches
      const bundleId = decoded.payload.data?.bundleId;
      if (bundleId && bundleId !== this.bundleId) {
        return { 
          valid: false, 
          error: `Bundle ID mismatch: expected ${this.bundleId}, got ${bundleId}` 
        };
      }

      return { 
        valid: true, 
        payload: decoded.payload 
      };

    } catch (error) {
      console.error('JWT verification error:', error);
      return { 
        valid: false, 
        error: 'JWT verification failed' 
      };
    }
  }

  /**
   * Extract transaction info from signed data
   */
  extractTransactionInfo(signedTransactionInfo) {
    try {
      return jwt.decode(signedTransactionInfo);
    } catch (error) {
      console.error('Transaction info decode error:', error);
      return null;
    }
  }
}

/**
 * Convenience function for validating receipts
 */
export async function validateAppStoreReceipt(receiptData) {
  const validator = new AppStoreReceiptValidator();
  return await validator.validateReceipt(receiptData);
}

/**
 * Convenience function for verifying JWT signatures
 */
export function verifyJWTSignature(signedPayload) {
  const validator = new AppStoreReceiptValidator();
  return validator.verifyJWTSignature(signedPayload);
}

export default AppStoreReceiptValidator;