/**
 * Family Sharing Service
 * 
 * Handles family vault creation, invitation management, member management, and access control
 * Integrates with subscription system to enforce family member limits
 */

import { supabaseService } from '../config/supabase.mjs';
import { monitorServiceClientUsage } from '../middleware/rls-auth.mjs';
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
  async createFamilyVault(supabaseAuth, vaultId, familyName, maxMembers = this.defaultMaxMembers) {
    try {
      // Get authenticated user from the JWT context
      const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
      if (userError || !user) {
        throw new Error('Authentication required');
      }

      // Verify the vault exists and belongs to the user (RLS enforced)
      const { data: vault, error: vaultError } = await supabaseAuth
        .from('vaults')
        .select('*')
        .eq('id', vaultId)
        .single();

      if (vaultError || !vault) {
        throw new Error('Vault not found or access denied');
      }

      // Check if family vault already exists for this vault
      const { data: existingFamily, error: existingError } = await supabaseAuth
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
        owner_id: user.id,
        family_name: familyName,
        invite_code: inviteCode,
        max_members: maxMembers,
        member_count: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      const { data: familyVault, error: createError } = await supabaseAuth
        .from('family_vaults')
        .insert(familyVaultData)
        .select('*')
        .single();

      if (createError) throw createError;

      // Add owner as first member using authenticated client
      await this.addFamilyMember(supabaseAuth, familyVault.id, user.id, 'owner', 'active');

      return familyVault;
    } catch (error) {
      console.error('❌ Create family vault error:', error);
      throw error;
    }
  }

  /**
   * Generate unique invite code (system operation with monitoring)
   */
  async generateUniqueInviteCode() {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      
      // Check if code already exists (system operation)
      monitorServiceClientUsage('check_invite_code_uniqueness', 'system_operation', { code_check: true }, true);
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
  async joinFamilyByCode(supabaseAuth, deviceId, inviteCode) {
    try {
      const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
      if (userError || !user) {
        throw new Error('Authentication required');
      }

      // Find family vault by invite code (system operation)
      monitorServiceClientUsage('find_family_vault_by_code', 'family_sharing', { invite_code: inviteCode }, true);
      const { data: familyVault, error: familyError } = await supabaseService
        .from('family_vaults')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (familyError || !familyVault) {
        throw new Error('Invalid or expired invite code');
      }

      // Check if user is already a member (system operation)
      monitorServiceClientUsage('check_existing_membership', 'family_sharing', { family_vault_id: familyVault.id }, true);
      const { data: existingMember, error: memberError } = await supabaseService
        .from('family_members')
        .select('*')
        .eq('family_vault_id', familyVault.id)
        .eq('user_id', user.id)
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

      // Add as member using authenticated client
      const member = await this.addFamilyMember(supabaseAuth, familyVault.id, user.id, 'member', 'active');

      // Update member count (system operation)
      monitorServiceClientUsage('update_member_count', 'family_sharing', { action: 'increment' }, true);
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
        status: 'joined'
      };
    } catch (error) {
      console.error('❌ Join family vault error:', error);
      throw error;
    }
  }

  /**
   * Add family member using authenticated client
   */
  async addFamilyMember(supabaseAuth, familyVaultId, userId, role = 'member', status = 'active') {
    try {
      const memberData = {
        family_vault_id: familyVaultId,
        user_id: userId,
        role: role,
        status: status,
        joined_at: new Date(),
        updated_at: new Date()
      };

      const { data: member, error } = await supabaseAuth
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
  async getUserFamilies(supabaseAuth, deviceId) {
    try {
      const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
      if (userError || !user) {
        throw new Error('Authentication required');
      }

      const { data: familyMemberships, error } = await supabaseAuth
        .from('family_members')
        .select(`
          *,
          family_vault:family_vaults(
            *,
            vault:vaults(id, name, created_at)
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'pending']);

      if (error) throw error;

      return familyMemberships || [];
    } catch (error) {
      console.error('❌ Get user family vaults error:', error);
      throw error;
    }
  }

  /**
   * Get family vault details with RLS
   */
  async getFamilyVaultInfo(supabaseAuth, vaultId, deviceId) {
    try {
      const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
      if (userError || !user) {
        throw new Error('Authentication required');
      }

      // Get family vault through user's membership (RLS enforced)
      const { data: familyMembership, error: membershipError } = await supabaseAuth
        .from('family_members')
        .select(`
          *,
          family_vault:family_vaults!inner(
            *,
            vault:vaults!inner(*)
          )
        `)
        .eq('user_id', user.id)
        .eq('family_vault.vault_id', vaultId)
        .single();

      if (membershipError || !familyMembership) {
        throw new Error('Access denied to family vault');
      }

      return familyMembership.family_vault;
    } catch (error) {
      console.error('❌ Get family vault info error:', error);
      throw error;
    }
  }

  /**
   * Check if user can create family sharing for vault
   */
  async canCreateFamilySharing(supabaseAuth, deviceId, vaultId) {
    try {
      // RLS will automatically enforce that user can only access their own vaults
      const { data: vault, error: vaultError } = await supabaseAuth
        .from('vaults')
        .select('id')
        .eq('id', vaultId)
        .single();

      if (vaultError || !vault) {
        return {
          allowed: false,
          reason: 'Vault not found or access denied'
        };
      }

      // Check if family vault already exists
      const { data: existingFamily, error: familyError } = await supabaseAuth
        .from('family_vaults')
        .select('id')
        .eq('vault_id', vaultId)
        .single();

      if (!familyError && existingFamily) {
        return {
          allowed: false,
          reason: 'Family vault already exists for this vault'
        };
      }

      return {
        allowed: true,
        reason: 'Family sharing can be created for this vault'
      };
    } catch (error) {
      console.error('❌ Check family sharing permission error:', error);
      return {
        allowed: false,
        reason: 'Failed to check family sharing permissions'
      };
    }
  }

  /**
   * Invite user to family with RLS
   */
  async inviteToFamily(supabaseAuth, deviceId, familyVaultId, inviteEmail, message = '') {
    try {
      const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
      if (userError || !user) {
        throw new Error('Authentication required');
      }

      // Verify user has admin privileges through RLS
      const { data: membership, error: membershipError } = await supabaseAuth
        .from('family_members')
        .select('role, family_vault:family_vaults(*)')
        .eq('family_vault_id', familyVaultId)
        .eq('user_id', user.id)
        .single();

      if (membershipError || !membership) {
        throw new Error('Access denied');
      }

      if (!['owner', 'admin'].includes(membership.role)) {
        throw new Error('Insufficient permissions to invite members');
      }

      // Create invitation record using authenticated client
      const invitationData = {
        family_vault_id: familyVaultId,
        invited_by: user.id,
        invite_email: inviteEmail,
        message: message,
        status: 'pending',
        created_at: new Date(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };

      const { data: invitation, error: createError } = await supabaseAuth
        .from('family_invitations')
        .insert(invitationData)
        .select('*')
        .single();

      if (createError) throw createError;

      return invitation;
    } catch (error) {
      console.error('❌ Invite to family error:', error);
      throw error;
    }
  }

  /**
   * Request family access with RLS
   */
  async requestFamilyAccess(supabaseAuth, deviceId, familyVaultId, message = '') {
    try {
      const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
      if (userError || !user) {
        throw new Error('Authentication required');
      }

      // Create access request using authenticated client
      const requestData = {
        family_vault_id: familyVaultId,
        requested_by: user.id,
        message: message,
        status: 'pending',
        created_at: new Date()
      };

      const { data: accessRequest, error: createError } = await supabaseAuth
        .from('family_access_requests')
        .insert(requestData)
        .select('*')
        .single();

      if (createError) throw createError;

      return accessRequest;
    } catch (error) {
      console.error('❌ Request family access error:', error);
      throw error;
    }
  }

  // Additional methods would need similar RLS conversion...
  // For brevity, showing the pattern for the most critical methods
}

export default FamilySharingService;