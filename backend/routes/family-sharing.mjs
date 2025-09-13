// Family Sharing API Routes
// Handles family vault creation, invitations, access requests, and member management
import express from 'express';
import { supabase } from '../config/supabase.mjs';
import { FamilySharingService } from '../services/family-sharing-service.mjs';
import { NotificationService } from '../services/notification-service.mjs';

const router = express.Router();
const familySharingService = new FamilySharingService();
const notificationService = new NotificationService();

// ========================================
// FAMILY VAULT MANAGEMENT
// ========================================

/**
 * POST /v1/family/create
 * Create a new family sharing group for a vault
 */
router.post('/create', async (req, res) => {
    try {
        const { deviceId, vaultId, familyName, maxMembers = 10 } = req.body;

        if (!deviceId || !vaultId || !familyName) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'deviceId, vaultId, and familyName are required',
                code: 'MISSING_REQUIRED_FIELDS'
            });
        }

        // Check if user has permission to create family sharing
        const hasPermission = await familySharingService.canCreateFamilySharing(req.supabaseAuth, deviceId, vaultId);
        if (!hasPermission.allowed) {
            return res.status(403).json({
                error: 'Forbidden',
                message: hasPermission.reason,
                code: 'FAMILY_SHARING_NOT_ALLOWED'
            });
        }

        const familyVault = await familySharingService.createFamilyVault(
            req.supabaseAuth,  // 認証クライアント使用
            vaultId, 
            familyName, 
            maxMembers
        );

        res.json({
            success: true,
            familyVault: {
                id: familyVault.id,
                familyName: familyVault.family_name,
                inviteCode: familyVault.invite_code,
                maxMembers: familyVault.max_members,
                createdAt: familyVault.created_at
            }
        });

    } catch (error) {
        console.error('❌ Create family vault error:', error);
        
        if (error.code === 'FAMILY_ALREADY_EXISTS') {
            return res.status(409).json({
                error: 'Conflict',
                message: 'Family sharing already exists for this vault',
                code: 'FAMILY_ALREADY_EXISTS'
            });
        }

        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create family sharing',
            code: 'FAMILY_CREATE_FAILED'
        });
    }
});

/**
 * GET /v1/family/vault/:vaultId
 * Get family sharing information for a vault
 */
router.get('/vault/:vaultId', async (req, res) => {
    try {
        const { vaultId } = req.params;
        const { deviceId } = req.query;

        if (!deviceId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'deviceId query parameter is required',
                code: 'MISSING_DEVICE_ID'
            });
        }

        const familyInfo = await familySharingService.getFamilyVaultInfo(req.supabaseAuth, vaultId, deviceId);

        if (!familyInfo) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Family vault not found or access denied',
                code: 'FAMILY_VAULT_NOT_FOUND'
            });
        }

        res.json(familyInfo);

    } catch (error) {
        console.error('❌ Get family vault error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve family vault information',
            code: 'FAMILY_VAULT_INFO_FAILED'
        });
    }
});

/**
 * GET /v1/family/my-families
 * Get all family vaults user is member of
 */
router.get('/my-families', async (req, res) => {
    try {
        const { deviceId } = req.query;

        if (!deviceId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'deviceId query parameter is required',
                code: 'MISSING_DEVICE_ID'
            });
        }

        const families = await familySharingService.getUserFamilies(req.supabaseAuth, deviceId);

        res.json({
            families: families.map(family => ({
                id: family.id,
                familyName: family.family_name,
                role: family.role,
                status: family.member_status,
                vaultInfo: {
                    id: family.vault_id,
                    name: family.vault_name,
                    coverImage: family.vault_cover_image
                },
                memberCount: family.member_count,
                joinedAt: family.joined_at
            }))
        });

    } catch (error) {
        console.error('❌ Get user families error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve user families',
            code: 'USER_FAMILIES_FAILED'
        });
    }
});

// ========================================
// FAMILY INVITATIONS
// ========================================

/**
 * POST /v1/family/invite
 * Send family sharing invitation
 */
router.post('/invite', async (req, res) => {
    try {
        const { deviceId, familyVaultId, inviteEmail, role = 'member', permissions = {} } = req.body;

        if (!deviceId || !familyVaultId || !inviteEmail) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'deviceId, familyVaultId, and inviteEmail are required',
                code: 'MISSING_REQUIRED_FIELDS'
            });
        }

        // Check if user has permission to invite
        const hasPermission = await familySharingService.canInviteMembers(deviceId, familyVaultId);
        if (!hasPermission.allowed) {
            return res.status(403).json({
                error: 'Forbidden',
                message: hasPermission.reason,
                code: 'INVITE_NOT_ALLOWED'
            });
        }

        const invitation = await familySharingService.inviteToFamily(
            req.supabaseAuth,
            deviceId,
            familyVaultId,
            inviteEmail,
            role,
            permissions
        );

        // Send email notification (if email service is configured)
        await notificationService.sendFamilyInvitation(invitation);

        res.json({
            success: true,
            invitation: {
                id: invitation.id,
                email: invitation.invite_email,
                role: invitation.role,
                status: invitation.status,
                invitedAt: invitation.invited_at,
                expiresAt: invitation.expires_at
            }
        });

    } catch (error) {
        console.error('❌ Send family invitation error:', error);
        
        if (error.code === 'MEMBER_ALREADY_EXISTS') {
            return res.status(409).json({
                error: 'Conflict',
                message: 'User is already a family member',
                code: 'MEMBER_ALREADY_EXISTS'
            });
        }

        if (error.code === 'FAMILY_FULL') {
            return res.status(409).json({
                error: 'Conflict',
                message: 'Family has reached maximum member limit',
                code: 'FAMILY_FULL'
            });
        }

        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to send family invitation',
            code: 'FAMILY_INVITE_FAILED'
        });
    }
});

/**
 * POST /v1/family/join/:inviteCode
 * Join family using invite code
 */
router.post('/join/:inviteCode', async (req, res) => {
    try {
        const { inviteCode } = req.params;
        const { deviceId } = req.body;

        if (!deviceId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'deviceId is required',
                code: 'MISSING_DEVICE_ID'
            });
        }

        const joinResult = await familySharingService.joinFamilyByCode(req.supabaseAuth, deviceId, inviteCode);

        res.json({
            success: true,
            membership: {
                familyVaultId: joinResult.family_vault_id,
                familyName: joinResult.family_name,
                role: joinResult.role,
                status: joinResult.status,
                requiresApproval: joinResult.requires_approval
            }
        });

    } catch (error) {
        console.error('❌ Join family error:', error);
        
        if (error.code === 'INVALID_INVITE_CODE') {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Invalid or expired invite code',
                code: 'INVALID_INVITE_CODE'
            });
        }

        if (error.code === 'ALREADY_MEMBER') {
            return res.status(409).json({
                error: 'Conflict',
                message: 'Already a member of this family',
                code: 'ALREADY_MEMBER'
            });
        }

        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to join family',
            code: 'FAMILY_JOIN_FAILED'
        });
    }
});

// ========================================
// ACCESS REQUESTS
// ========================================

/**
 * POST /v1/family/request-access
 * Request access to a family vault
 */
router.post('/request-access', async (req, res) => {
    try {
        const { deviceId, familyVaultId, message } = req.body;

        if (!deviceId || !familyVaultId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'deviceId and familyVaultId are required',
                code: 'MISSING_REQUIRED_FIELDS'
            });
        }

        const accessRequest = await familySharingService.requestFamilyAccess(
            req.supabaseAuth,
            deviceId,
            familyVaultId,
            message
        );

        res.json({
            success: true,
            accessRequest: {
                id: accessRequest.id,
                status: accessRequest.status,
                message: accessRequest.message,
                expiresAt: accessRequest.expires_at,
                createdAt: accessRequest.created_at
            }
        });

    } catch (error) {
        console.error('❌ Request family access error:', error);
        
        if (error.code === 'DUPLICATE_REQUEST') {
            return res.status(409).json({
                error: 'Conflict',
                message: 'Access request already pending',
                code: 'DUPLICATE_REQUEST'
            });
        }

        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to request family access',
            code: 'ACCESS_REQUEST_FAILED'
        });
    }
});

/**
 * GET /v1/family/:familyVaultId/access-requests
 * Get pending access requests for family vault
 */
router.get('/:familyVaultId/access-requests', async (req, res) => {
    try {
        const { familyVaultId } = req.params;
        const { deviceId } = req.query;

        if (!deviceId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'deviceId query parameter is required',
                code: 'MISSING_DEVICE_ID'
            });
        }

        // Check if user has permission to view access requests
        const hasPermission = await familySharingService.canManageAccessRequests(deviceId, familyVaultId);
        if (!hasPermission.allowed) {
            return res.status(403).json({
                error: 'Forbidden',
                message: hasPermission.reason,
                code: 'ACCESS_REQUESTS_NOT_ALLOWED'
            });
        }

        const accessRequests = await familySharingService.getFamilyAccessRequests(familyVaultId);

        res.json({
            accessRequests: accessRequests.map(request => ({
                id: request.id,
                requester: {
                    deviceId: request.requester_device_id,
                    displayName: request.requester_display_name,
                    avatarUrl: request.requester_avatar_url
                },
                message: request.message,
                status: request.status,
                createdAt: request.created_at,
                expiresAt: request.expires_at
            }))
        });

    } catch (error) {
        console.error('❌ Get access requests error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve access requests',
            code: 'ACCESS_REQUESTS_FAILED'
        });
    }
});

/**
 * POST /v1/family/access-requests/:requestId/respond
 * Approve or deny access request
 */
router.post('/access-requests/:requestId/respond', async (req, res) => {
    try {
        const { requestId } = req.params;
        const { deviceId, action, responseMessage, role = 'member', permissions = {} } = req.body;

        if (!deviceId || !action || !['approve', 'deny'].includes(action)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'deviceId and action (approve/deny) are required',
                code: 'MISSING_REQUIRED_FIELDS'
            });
        }

        const response = await familySharingService.respondToAccessRequest(
            requestId,
            deviceId,
            action,
            responseMessage,
            role,
            permissions
        );

        res.json({
            success: true,
            response: {
                requestId,
                action,
                status: response.status,
                respondedAt: response.responded_at,
                membership: response.membership // Only present if approved
            }
        });

    } catch (error) {
        console.error('❌ Respond to access request error:', error);
        
        if (error.code === 'REQUEST_NOT_FOUND') {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Access request not found',
                code: 'REQUEST_NOT_FOUND'
            });
        }

        if (error.code === 'INSUFFICIENT_PERMISSIONS') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Insufficient permissions to respond to request',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to respond to access request',
            code: 'ACCESS_REQUEST_RESPONSE_FAILED'
        });
    }
});

// ========================================
// MEMBER MANAGEMENT
// ========================================

/**
 * GET /v1/family/:familyVaultId/members
 * Get family members list
 */
router.get('/:familyVaultId/members', async (req, res) => {
    try {
        const { familyVaultId } = req.params;
        const { deviceId } = req.query;

        if (!deviceId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'deviceId query parameter is required',
                code: 'MISSING_DEVICE_ID'
            });
        }

        const members = await familySharingService.getFamilyMembers(familyVaultId, deviceId);

        res.json({
            members: members.map(member => ({
                id: member.id,
                user: {
                    deviceId: member.device_id,
                    displayName: member.display_name,
                    avatarUrl: member.avatar_url
                },
                role: member.role,
                status: member.status,
                permissions: {
                    canView: member.can_view,
                    canUpload: member.can_upload,
                    canEdit: member.can_edit,
                    canDelete: member.can_delete,
                    canInvite: member.can_invite
                },
                joinedAt: member.joined_at
            }))
        });

    } catch (error) {
        console.error('❌ Get family members error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve family members',
            code: 'FAMILY_MEMBERS_FAILED'
        });
    }
});

/**
 * PUT /v1/family/members/:memberId
 * Update family member role and permissions
 */
router.put('/members/:memberId', async (req, res) => {
    try {
        const { memberId } = req.params;
        const { deviceId, role, permissions } = req.body;

        if (!deviceId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'deviceId is required',
                code: 'MISSING_DEVICE_ID'
            });
        }

        const updatedMember = await familySharingService.updateFamilyMember(
            memberId,
            deviceId,
            { role, permissions }
        );

        res.json({
            success: true,
            member: {
                id: updatedMember.id,
                role: updatedMember.role,
                permissions: {
                    canView: updatedMember.can_view,
                    canUpload: updatedMember.can_upload,
                    canEdit: updatedMember.can_edit,
                    canDelete: updatedMember.can_delete,
                    canInvite: updatedMember.can_invite
                }
            }
        });

    } catch (error) {
        console.error('❌ Update family member error:', error);
        
        if (error.code === 'INSUFFICIENT_PERMISSIONS') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Insufficient permissions to update member',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update family member',
            code: 'MEMBER_UPDATE_FAILED'
        });
    }
});

/**
 * DELETE /v1/family/members/:memberId
 * Remove family member
 */
router.delete('/members/:memberId', async (req, res) => {
    try {
        const { memberId } = req.params;
        const { deviceId } = req.body;

        if (!deviceId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'deviceId is required',
                code: 'MISSING_DEVICE_ID'
            });
        }

        await familySharingService.removeFamilyMember(memberId, deviceId);

        res.json({
            success: true,
            message: 'Family member removed successfully'
        });

    } catch (error) {
        console.error('❌ Remove family member error:', error);
        
        if (error.code === 'INSUFFICIENT_PERMISSIONS') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Insufficient permissions to remove member',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to remove family member',
            code: 'MEMBER_REMOVAL_FAILED'
        });
    }
});

export default router;