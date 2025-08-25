/**
 * Family Sharing Service
 * 
 * Handles family vault creation, invitation management, member management, and access control
 * Integrates with subscription system to enforce family member limits
 */

import { supabaseService } from '../config/supabase.mjs';
import crypto from 'crypto';

export class FamilySharingService {
  constructor() {
    this.defaultMaxMembers = 10;
    this.inviteCodeLength = 8;
    this.inviteCodeExpiration = 7; // days
  }

  /**
   * Create a new family vault
   */
  async createFamilyVault(deviceId, vaultId, familyName, maxMembers = this.defaultMaxMembers) {
    try {
      // Verify the vault exists and belongs to the user
      const { data: vault, error: vaultError } = await supabaseService
        .from('vaults')
        .select('*')
        .eq('id', vaultId)
        .eq('device_id', deviceId)
        .single();

      if (vaultError || !vault) {
        throw new Error('Vault not found or access denied');
      }

      // Check if family vault already exists for this vault
      const { data: existingFamily, error: existingError } = await supabaseService
        .from('family_vaults')
        .select('*')
        .eq('vault_id', vaultId)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }

      if (existingFamily) {
        throw new Error('Family vault already exists for this vault');
      }

      // Generate unique invite code
      const inviteCode = await this.generateUniqueInviteCode();

      // Create family vault
      const familyVaultData = {
        vault_id: vaultId,
        owner_device_id: deviceId,
        family_name: familyName,
        invite_code: inviteCode,
        max_members: maxMembers,
        member_count: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      const { data: familyVault, error: createError } = await supabaseService
        .from('family_vaults')
        .insert(familyVaultData)
        .select('*')
        .single();

      if (createError) throw createError;

      // Add owner as first member
      await this.addFamilyMember(familyVault.id, deviceId, 'owner', null, true);

      return familyVault;
    } catch (error) {
      console.error('❌ Create family vault error:', error);
      throw error;
    }
  }

  /**
   * Generate unique invite code
   */
  async generateUniqueInviteCode() {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      
      // Check if code already exists
      const { data: existingCode, error } = await supabaseService
        .from('family_vaults')
        .select('id')
        .eq('invite_code', code)
        .single();

      if (error && error.code === 'PGRST116') {
        // Code doesn't exist, we can use it
        return code;
      }

      attempts++;
    }

    throw new Error('Failed to generate unique invite code');
  }

  /**
   * Join family vault using invite code
   */
  async joinFamilyVault(deviceId, inviteCode) {
    try {
      // Find family vault by invite code
      const { data: familyVault, error: familyError } = await supabaseService
        .from('family_vaults')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (familyError || !familyVault) {
        throw new Error('Invalid or expired invite code');
      }

      // Check if user is already a member
      const { data: existingMember, error: memberError } = await supabaseService
        .from('family_members')
        .select('*')
        .eq('family_vault_id', familyVault.id)
        .eq('device_id', deviceId)
        .single();

      if (memberError && memberError.code !== 'PGRST116') {
        throw memberError;
      }

      if (existingMember) {
        throw new Error('You are already a member of this family vault');
      }

      // Check member limit
      if (familyVault.member_count >= familyVault.max_members) {
        throw new Error('Family vault has reached maximum member limit');
      }

      // Add as pending member
      const member = await this.addFamilyMember(familyVault.id, deviceId, 'member', 'pending');

      // Update member count
      await supabaseService
        .from('family_vaults')
        .update({
          member_count: familyVault.member_count + 1,
          updated_at: new Date()
        })
        .eq('id', familyVault.id);

      return {
        familyVault,
        member,
        status: 'pending_approval'
      };
    } catch (error) {
      console.error('❌ Join family vault error:', error);
      throw error;
    }
  }

  /**
   * Add family member
   */
  async addFamilyMember(familyVaultId, deviceId, role = 'member', status = 'active', skipCountUpdate = false) {
    try {
      const memberData = {
        family_vault_id: familyVaultId,
        device_id: deviceId,
        role: role,
        status: status,
        joined_at: new Date(),
        updated_at: new Date()
      };

      const { data: member, error } = await supabaseService
        .from('family_members')
        .insert(memberData)
        .select('*')
        .single();

      if (error) throw error;

      return member;
    } catch (error) {
      console.error('❌ Add family member error:', error);
      throw error;
    }
  }

  /**
   * Get user's family vaults
   */
  async getUserFamilyVaults(deviceId) {
    try {
      const { data: familyMemberships, error } = await supabaseService
        .from('family_members')
        .select(`
          *,
          family_vault:family_vaults(
            *,
            vault:vaults(id, title, created_at)
          )
        `)
        .eq('device_id', deviceId)
        .in('status', ['active', 'pending']);

      if (error) throw error;

      return familyMemberships || [];
    } catch (error) {
      console.error('❌ Get user family vaults error:', error);
      throw error;
    }
  }

  /**
   * Get family vault details
   */
  async getFamilyVaultDetails(familyVaultId, requestingDeviceId) {
    try {
      // Verify user has access to this family vault
      const { data: membership, error: memberError } = await supabaseService
        .from('family_members')
        .select('*')
        .eq('family_vault_id', familyVaultId)
        .eq('device_id', requestingDeviceId)
        .single();

      if (memberError || !membership) {
        throw new Error('Access denied to family vault');
      }

      // Get family vault with members
      const { data: familyVault, error: vaultError } = await supabaseService
        .from('family_vaults')
        .select(`
          *,
          vault:vaults(id, title, created_at),
          members:family_members(
            *,
            device_id
          )
        `)
        .eq('id', familyVaultId)
        .single();

      if (vaultError) throw vaultError;

      return {
        familyVault,
        userRole: membership.role,
        userStatus: membership.status
      };
    } catch (error) {
      console.error('❌ Get family vault details error:', error);
      throw error;
    }
  }

  /**
   * Update family member role
   */
  async updateMemberRole(familyVaultId, targetDeviceId, newRole, requestingDeviceId) {
    try {
      // Verify requesting user has admin privileges
      const { data: requestingMember, error: reqError } = await supabaseService
        .from('family_members')
        .select('role')
        .eq('family_vault_id', familyVaultId)
        .eq('device_id', requestingDeviceId)
        .single();

      if (reqError || !requestingMember) {
        throw new Error('Access denied');
      }

      if (!['owner', 'admin'].includes(requestingMember.role)) {
        throw new Error('Insufficient permissions to change member roles');
      }

      // Can't change owner role
      const { data: targetMember, error: targetError } = await supabaseService
        .from('family_members')
        .select('role')
        .eq('family_vault_id', familyVaultId)
        .eq('device_id', targetDeviceId)
        .single();

      if (targetError || !targetMember) {
        throw new Error('Target member not found');
      }

      if (targetMember.role === 'owner') {
        throw new Error('Cannot change owner role');
      }

      // Update role
      const { data: updatedMember, error: updateError } = await supabaseService
        .from('family_members')
        .update({
          role: newRole,
          updated_at: new Date()
        })
        .eq('family_vault_id', familyVaultId)
        .eq('device_id', targetDeviceId)
        .select('*')
        .single();

      if (updateError) throw updateError;

      return updatedMember;
    } catch (error) {
      console.error('❌ Update member role error:', error);
      throw error;
    }
  }

  /**
   * Remove family member
   */
  async removeFamilyMember(familyVaultId, targetDeviceId, requestingDeviceId) {
    try {
      // Verify requesting user has admin privileges
      const { data: requestingMember, error: reqError } = await supabaseService
        .from('family_members')
        .select('role')
        .eq('family_vault_id', familyVaultId)
        .eq('device_id', requestingDeviceId)
        .single();

      if (reqError || !requestingMember) {
        throw new Error('Access denied');
      }

      if (!['owner', 'admin'].includes(requestingMember.role)) {
        throw new Error('Insufficient permissions to remove members');
      }

      // Get target member info
      const { data: targetMember, error: targetError } = await supabaseService
        .from('family_members')
        .select('role')
        .eq('family_vault_id', familyVaultId)
        .eq('device_id', targetDeviceId)
        .single();

      if (targetError || !targetMember) {
        throw new Error('Target member not found');
      }

      // Can't remove owner
      if (targetMember.role === 'owner') {
        throw new Error('Cannot remove owner from family vault');
      }

      // Remove member
      const { error: removeError } = await supabaseService
        .from('family_members')
        .delete()
        .eq('family_vault_id', familyVaultId)
        .eq('device_id', targetDeviceId);

      if (removeError) throw removeError;

      // Update member count
      const { data: familyVault, error: countError } = await supabaseService
        .from('family_vaults')
        .select('member_count')
        .eq('id', familyVaultId)
        .single();

      if (!countError && familyVault) {
        await supabaseService
          .from('family_vaults')
          .update({
            member_count: Math.max(0, familyVault.member_count - 1),
            updated_at: new Date()
          })
          .eq('id', familyVaultId);
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Remove family member error:', error);
      throw error;
    }
  }

  /**
   * Leave family vault
   */
  async leaveFamilyVault(familyVaultId, deviceId) {
    try {
      // Get member info
      const { data: member, error: memberError } = await supabaseService
        .from('family_members')
        .select('role')
        .eq('family_vault_id', familyVaultId)
        .eq('device_id', deviceId)
        .single();

      if (memberError || !member) {
        throw new Error('You are not a member of this family vault');
      }

      // Owner cannot leave, must transfer ownership first
      if (member.role === 'owner') {
        throw new Error('Owner cannot leave family vault. Transfer ownership first.');
      }

      // Remove member
      const { error: removeError } = await supabaseService
        .from('family_members')
        .delete()
        .eq('family_vault_id', familyVaultId)
        .eq('device_id', deviceId);

      if (removeError) throw removeError;

      // Update member count
      const { data: familyVault, error: countError } = await supabaseService
        .from('family_vaults')
        .select('member_count')
        .eq('id', familyVaultId)
        .single();

      if (!countError && familyVault) {
        await supabaseService
          .from('family_vaults')
          .update({
            member_count: Math.max(0, familyVault.member_count - 1),
            updated_at: new Date()
          })
          .eq('id', familyVaultId);
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Leave family vault error:', error);
      throw error;
    }
  }

  /**
   * Get pending access requests
   */
  async getPendingAccessRequests(familyVaultId, requestingDeviceId) {
    try {
      // Verify requesting user has admin privileges
      const { data: requestingMember, error: reqError } = await supabaseService
        .from('family_members')
        .select('role')
        .eq('family_vault_id', familyVaultId)
        .eq('device_id', requestingDeviceId)
        .single();

      if (reqError || !requestingMember) {
        throw new Error('Access denied');
      }

      if (!['owner', 'admin'].includes(requestingMember.role)) {
        throw new Error('Insufficient permissions to view access requests');
      }

      // Get pending members
      const { data: pendingMembers, error } = await supabaseService
        .from('family_members')
        .select('*')
        .eq('family_vault_id', familyVaultId)
        .eq('status', 'pending')
        .order('joined_at', { ascending: true });

      if (error) throw error;

      return pendingMembers || [];
    } catch (error) {
      console.error('❌ Get pending access requests error:', error);
      throw error;
    }
  }

  /**
   * Approve or deny access request
   */
  async processAccessRequest(familyVaultId, targetDeviceId, action, requestingDeviceId) {
    try {
      // Verify requesting user has admin privileges
      const { data: requestingMember, error: reqError } = await supabaseService
        .from('family_members')
        .select('role')
        .eq('family_vault_id', familyVaultId)
        .eq('device_id', requestingDeviceId)
        .single();

      if (reqError || !requestingMember) {
        throw new Error('Access denied');
      }

      if (!['owner', 'admin'].includes(requestingMember.role)) {
        throw new Error('Insufficient permissions to process access requests');
      }

      if (action === 'approve') {
        // Approve the request
        const { data: updatedMember, error: updateError } = await supabaseService
          .from('family_members')
          .update({
            status: 'active',
            updated_at: new Date()
          })
          .eq('family_vault_id', familyVaultId)
          .eq('device_id', targetDeviceId)
          .eq('status', 'pending')
          .select('*')
          .single();

        if (updateError) throw updateError;

        return { action: 'approved', member: updatedMember };
      } else if (action === 'deny') {
        // Deny the request by removing the pending member
        const { error: removeError } = await supabaseService
          .from('family_members')
          .delete()
          .eq('family_vault_id', familyVaultId)
          .eq('device_id', targetDeviceId)
          .eq('status', 'pending');

        if (removeError) throw removeError;

        // Update member count
        const { data: familyVault, error: countError } = await supabaseService
          .from('family_vaults')
          .select('member_count')
          .eq('id', familyVaultId)
          .single();

        if (!countError && familyVault) {
          await supabaseService
            .from('family_vaults')
            .update({
              member_count: Math.max(0, familyVault.member_count - 1),
              updated_at: new Date()
            })
            .eq('id', familyVaultId);
        }

        return { action: 'denied' };
      } else {
        throw new Error('Invalid action. Use "approve" or "deny"');
      }
    } catch (error) {
      console.error('❌ Process access request error:', error);
      throw error;
    }
  }

  /**
   * Transfer ownership of family vault
   */
  async transferOwnership(familyVaultId, newOwnerDeviceId, currentOwnerDeviceId) {
    try {
      // Verify current user is the owner
      const { data: currentOwner, error: ownerError } = await supabaseService
        .from('family_members')
        .select('role')
        .eq('family_vault_id', familyVaultId)
        .eq('device_id', currentOwnerDeviceId)
        .single();

      if (ownerError || !currentOwner || currentOwner.role !== 'owner') {
        throw new Error('Only the current owner can transfer ownership');
      }

      // Verify new owner is a member
      const { data: newOwner, error: newOwnerError } = await supabaseService
        .from('family_members')
        .select('*')
        .eq('family_vault_id', familyVaultId)
        .eq('device_id', newOwnerDeviceId)
        .single();

      if (newOwnerError || !newOwner) {
        throw new Error('New owner must be an existing member');
      }

      if (newOwner.status !== 'active') {
        throw new Error('New owner must have active status');
      }

      // Transfer ownership (use a transaction-like approach)
      const { error: updateOldError } = await supabaseService
        .from('family_members')
        .update({ role: 'admin', updated_at: new Date() })
        .eq('family_vault_id', familyVaultId)
        .eq('device_id', currentOwnerDeviceId);

      if (updateOldError) throw updateOldError;

      const { error: updateNewError } = await supabaseService
        .from('family_members')
        .update({ role: 'owner', updated_at: new Date() })
        .eq('family_vault_id', familyVaultId)
        .eq('device_id', newOwnerDeviceId);

      if (updateNewError) {
        // Rollback previous update
        await supabaseService
          .from('family_members')
          .update({ role: 'owner', updated_at: new Date() })
          .eq('family_vault_id', familyVaultId)
          .eq('device_id', currentOwnerDeviceId);
        
        throw updateNewError;
      }

      // Update family vault owner
      await supabaseService
        .from('family_vaults')
        .update({
          owner_device_id: newOwnerDeviceId,
          updated_at: new Date()
        })
        .eq('id', familyVaultId);

      return { success: true };
    } catch (error) {
      console.error('❌ Transfer ownership error:', error);
      throw error;
    }
  }

  /**
   * Delete family vault (owner only)
   */
  async deleteFamilyVault(familyVaultId, deviceId) {
    try {
      // Verify user is the owner
      const { data: member, error: memberError } = await supabaseService
        .from('family_members')
        .select('role')
        .eq('family_vault_id', familyVaultId)
        .eq('device_id', deviceId)
        .single();

      if (memberError || !member || member.role !== 'owner') {
        throw new Error('Only the owner can delete the family vault');
      }

      // Delete all members first (cascade should handle this, but being explicit)
      await supabaseService
        .from('family_members')
        .delete()
        .eq('family_vault_id', familyVaultId);

      // Delete family vault
      const { error: deleteError } = await supabaseService
        .from('family_vaults')
        .delete()
        .eq('id', familyVaultId);

      if (deleteError) throw deleteError;

      return { success: true };
    } catch (error) {
      console.error('❌ Delete family vault error:', error);
      throw error;
    }
  }

  /**
   * Regenerate invite code
   */
  async regenerateInviteCode(familyVaultId, deviceId) {
    try {
      // Verify user has admin privileges
      const { data: member, error: memberError } = await supabaseService
        .from('family_members')
        .select('role')
        .eq('family_vault_id', familyVaultId)
        .eq('device_id', deviceId)
        .single();

      if (memberError || !member) {
        throw new Error('Access denied');
      }

      if (!['owner', 'admin'].includes(member.role)) {
        throw new Error('Insufficient permissions to regenerate invite code');
      }

      // Generate new invite code
      const newInviteCode = await this.generateUniqueInviteCode();

      // Update family vault
      const { data: updatedVault, error: updateError } = await supabaseService
        .from('family_vaults')
        .update({
          invite_code: newInviteCode,
          updated_at: new Date()
        })
        .eq('id', familyVaultId)
        .select('*')
        .single();

      if (updateError) throw updateError;

      return updatedVault;
    } catch (error) {
      console.error('❌ Regenerate invite code error:', error);
      throw error;
    }
  }
}

export default FamilySharingService;