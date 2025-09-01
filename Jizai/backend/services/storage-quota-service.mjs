// Storage Quota Service
// Enforces storage limits based on subscription tiers and manages quota tracking  
import { supabase } from '../config/supabase.mjs';
import { monitorServiceClientUsage } from '../middleware/rls-auth.mjs';

export class StorageQuotaService {
    constructor() {
        // Storage tier limits (in bytes)
        this.tierLimits = {
            free: 1073741824,      // 1GB
            lite: 5368709120,      // 5GB  
            standard: 21474836480, // 20GB
            pro: 107374182400      // 100GB
        };

        // File type size limits (prevent abuse)
        this.fileSizeLimits = {
            image: 50 * 1024 * 1024,    // 50MB per image
            video: 500 * 1024 * 1024,   // 500MB per video
            document: 25 * 1024 * 1024, // 25MB per document
            audio: 100 * 1024 * 1024    // 100MB per audio
        };
    }

    /**
     * Get user's current quota information (system operation)
     */
    async getQuotaInfo(deviceId) {
        try {
            // System operation - quota lookup by device ID
            monitorServiceClientUsage('get_quota_info', 'storage_quota_system', { device_id: deviceId }, true);
            const { data: user, error } = await supabase
                .from('users')
                .select(`
                    id,
                    storage_quota,
                    storage_used,
                    subscription_tier,
                    subscriptions (
                        status,
                        tier,
                        expires_date
                    )
                `)
                .eq('device_id', deviceId)
                .single();

            if (error) throw error;

            // Calculate effective tier based on subscription status
            const effectiveTier = this.getEffectiveTier(user);
            const effectiveQuota = this.tierLimits[effectiveTier] || user.storage_quota;

            return {
                quota: effectiveQuota,
                used: user.storage_used || 0,
                available: Math.max(0, effectiveQuota - (user.storage_used || 0)),
                percentage: ((user.storage_used || 0) / effectiveQuota) * 100,
                tier: effectiveTier,
                subscription: user.subscriptions?.[0] || null
            };

        } catch (error) {
            console.error('❌ Get quota info error:', error);
            throw new Error('Failed to retrieve quota information');
        }
    }

    /**
     * Get detailed storage breakdown by vault and file type
     */
    async getDetailedStorageInfo(deviceId) {
        try {
            const quotaInfo = await this.getQuotaInfo(deviceId);

            // Get storage usage by vault
            const { data: vaultUsage, error: vaultError } = await supabase
                .from('vaults')
                .select(`
                    id,
                    name,
                    storage_used,
                    memory_count
                `)
                .eq('owner_id', quotaInfo.userId)
                .eq('archived_at', null);

            if (vaultError) throw vaultError;

            // Get storage usage by file type
            const { data: typeUsage, error: typeError } = await supabase
                .from('memories')
                .select('file_type, file_size')
                .in('vault_id', vaultUsage.map(v => v.id))
                .eq('deleted_at', null);

            if (typeError) throw typeError;

            // Aggregate by file type
            const typeBreakdown = typeUsage.reduce((acc, memory) => {
                const type = memory.file_type;
                acc[type] = (acc[type] || 0) + memory.file_size;
                return acc;
            }, {});

            return {
                ...quotaInfo,
                breakdown: {
                    vaults: vaultUsage.map(vault => ({
                        id: vault.id,
                        name: vault.name,
                        storageUsed: vault.storage_used || 0,
                        memoryCount: vault.memory_count || 0,
                        percentage: ((vault.storage_used || 0) / quotaInfo.quota) * 100
                    })),
                    fileTypes: Object.entries(typeBreakdown).map(([type, size]) => ({
                        type,
                        size,
                        percentage: (size / quotaInfo.quota) * 100
                    }))
                }
            };

        } catch (error) {
            console.error('❌ Get detailed storage info error:', error);
            throw new Error('Failed to retrieve detailed storage information');
        }
    }

    /**
     * Check if file upload would exceed quota
     */
    async checkQuotaForUpload(deviceId, fileSize, vaultId = null, fileType = 'image') {
        try {
            // Check file size limits
            const fileSizeLimit = this.fileSizeLimits[fileType];
            if (fileSize > fileSizeLimit) {
                return {
                    allowed: false,
                    reason: `File size exceeds limit for ${fileType} files (${this.formatBytes(fileSizeLimit)})`,
                    code: 'FILE_SIZE_LIMIT_EXCEEDED'
                };
            }

            const quotaInfo = await this.getQuotaInfo(deviceId);

            // Check if adding this file would exceed quota
            if ((quotaInfo.used + fileSize) > quotaInfo.quota) {
                return {
                    allowed: false,
                    reason: `Upload would exceed storage quota. Need ${this.formatBytes(fileSize)} but only ${this.formatBytes(quotaInfo.available)} available.`,
                    code: 'QUOTA_EXCEEDED',
                    quota: quotaInfo.quota,
                    used: quotaInfo.used,
                    available: quotaInfo.available,
                    required: fileSize
                };
            }

            return {
                allowed: true,
                quota: quotaInfo.quota,
                used: quotaInfo.used,
                available: quotaInfo.available,
                remainingAfterUpload: quotaInfo.available - fileSize
            };

        } catch (error) {
            console.error('❌ Check quota error:', error);
            return {
                allowed: false,
                reason: 'Failed to verify storage quota',
                code: 'QUOTA_CHECK_FAILED'
            };
        }
    }

    /**
     * Reserve storage quota before upload (prevents race conditions)
     */
    async reserveQuota(deviceId, fileSize, reservationId) {
        try {
            const canUpload = await this.checkQuotaForUpload(deviceId, fileSize);
            
            if (!canUpload.allowed) {
                return canUpload;
            }

            // Create temporary reservation
            const { error } = await supabase
                .from('storage_reservations')
                .insert({
                    user_device_id: deviceId,
                    reservation_id: reservationId,
                    reserved_bytes: fileSize,
                    expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
                });

            if (error) throw error;

            return {
                allowed: true,
                reservationId,
                reserved: fileSize,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            };

        } catch (error) {
            console.error('❌ Reserve quota error:', error);
            return {
                allowed: false,
                reason: 'Failed to reserve storage quota',
                code: 'QUOTA_RESERVATION_FAILED'
            };
        }
    }

    /**
     * Commit quota reservation (after successful upload)
     */
    async commitQuotaReservation(reservationId, actualFileSize) {
        try {
            // Get reservation details
            const { data: reservation, error: getError } = await supabase
                .from('storage_reservations')
                .select('*')
                .eq('reservation_id', reservationId)
                .single();

            if (getError || !reservation) {
                throw new Error('Reservation not found or expired');
            }

            // Remove reservation
            await supabase
                .from('storage_reservations')
                .delete()
                .eq('reservation_id', reservationId);

            return {
                success: true,
                actualSize: actualFileSize,
                reservedSize: reservation.reserved_bytes
            };

        } catch (error) {
            console.error('❌ Commit quota reservation error:', error);
            throw error;
        }
    }

    /**
     * Release quota reservation (on upload failure)
     */
    async releaseQuotaReservation(reservationId) {
        try {
            await supabase
                .from('storage_reservations')
                .delete()
                .eq('reservation_id', reservationId);

            return { success: true };

        } catch (error) {
            console.error('❌ Release quota reservation error:', error);
            throw error;
        }
    }

    /**
     * Update user's storage quota when subscription changes
     */
    async updateQuotaForSubscription(deviceId, newTier) {
        try {
            const newQuota = this.tierLimits[newTier];
            if (!newQuota) {
                throw new Error(`Invalid subscription tier: ${newTier}`);
            }

            // Get current usage
            const { data: user, error: getUserError } = await supabase
                .from('users')
                .select('storage_used, storage_quota')
                .eq('device_id', deviceId)
                .single();

            if (getUserError) throw getUserError;

            // Check if downgrading would exceed new quota
            if (newQuota < user.storage_used) {
                return {
                    success: false,
                    reason: `Current usage (${this.formatBytes(user.storage_used)}) exceeds new tier quota (${this.formatBytes(newQuota)})`,
                    code: 'USAGE_EXCEEDS_NEW_QUOTA',
                    currentUsage: user.storage_used,
                    newQuota,
                    excessData: user.storage_used - newQuota
                };
            }

            // Update quota
            const { error: updateError } = await supabase
                .from('users')
                .update({ 
                    storage_quota: newQuota,
                    subscription_tier: newTier,
                    updated_at: new Date().toISOString()
                })
                .eq('device_id', deviceId);

            if (updateError) throw updateError;

            return {
                success: true,
                newQuota,
                tier: newTier,
                available: newQuota - user.storage_used
            };

        } catch (error) {
            console.error('❌ Update quota for subscription error:', error);
            throw error;
        }
    }

    /**
     * Get users approaching quota limits (for warnings)
     */
    async getUsersApproachingQuota(warningThreshold = 0.8) {
        try {
            const { data: users, error } = await supabase
                .from('users')
                .select(`
                    id,
                    device_id,
                    storage_quota,
                    storage_used,
                    subscription_tier
                `)
                .gte('storage_used', supabase.raw(`storage_quota * ${warningThreshold}`))
                .eq('deleted_at', null);

            if (error) throw error;

            return users.map(user => ({
                deviceId: user.device_id,
                tier: user.subscription_tier || 'free',
                quota: user.storage_quota,
                used: user.storage_used,
                percentage: (user.storage_used / user.storage_quota) * 100,
                available: user.storage_quota - user.storage_used
            }));

        } catch (error) {
            console.error('❌ Get users approaching quota error:', error);
            throw error;
        }
    }

    /**
     * Clean up expired quota reservations
     */
    async cleanupExpiredReservations() {
        try {
            const { error } = await supabase
                .from('storage_reservations')
                .delete()
                .lt('expires_at', new Date().toISOString());

            if (error) throw error;

            console.log('✅ Expired quota reservations cleaned up');

        } catch (error) {
            console.error('❌ Cleanup reservations error:', error);
        }
    }

    /**
     * Recalculate storage usage for a user (audit/repair function)
     */
    async recalculateStorageUsage(deviceId) {
        try {
            // Get user ID
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('device_id', deviceId)
                .single();

            if (userError) throw userError;

            // Calculate actual usage from memories
            const { data: totalUsage, error: usageError } = await supabase
                .from('memories')
                .select('file_size')
                .in('vault_id', 
                    supabase
                        .from('vaults')
                        .select('id')
                        .eq('owner_id', user.id)
                        .eq('archived_at', null)
                )
                .eq('deleted_at', null);

            if (usageError) throw usageError;

            const actualUsage = totalUsage.reduce((sum, memory) => sum + memory.file_size, 0);

            // Update user's storage usage
            const { error: updateError } = await supabase
                .from('users')
                .update({ 
                    storage_used: actualUsage,
                    updated_at: new Date().toISOString()
                })
                .eq('device_id', deviceId);

            if (updateError) throw updateError;

            // Update vault usage
            const { data: vaults, error: vaultError } = await supabase
                .from('vaults')
                .select('id')
                .eq('owner_id', user.id)
                .eq('archived_at', null);

            if (vaultError) throw vaultError;

            for (const vault of vaults) {
                const { data: vaultUsage, error: vaultUsageError } = await supabase
                    .from('memories')
                    .select('file_size')
                    .eq('vault_id', vault.id)
                    .eq('deleted_at', null);

                if (vaultUsageError) continue;

                const vaultTotal = vaultUsage.reduce((sum, memory) => sum + memory.file_size, 0);
                const vaultCount = vaultUsage.length;

                await supabase
                    .from('vaults')
                    .update({ 
                        storage_used: vaultTotal,
                        memory_count: vaultCount,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', vault.id);
            }

            return {
                success: true,
                actualUsage,
                vaultsUpdated: vaults.length
            };

        } catch (error) {
            console.error('❌ Recalculate storage usage error:', error);
            throw error;
        }
    }

    /**
     * Get effective subscription tier based on subscription status
     */
    getEffectiveTier(user) {
        const subscription = user.subscriptions?.[0];
        
        if (!subscription) {
            return 'free';
        }

        // Check if subscription is active or in grace period
        if (['active', 'trial', 'grace'].includes(subscription.status)) {
            return subscription.tier;
        }

        return 'free';
    }

    /**
     * Format bytes to human readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}