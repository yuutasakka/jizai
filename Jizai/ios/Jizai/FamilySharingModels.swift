import Foundation

// MARK: - Family Sharing Data Models

/// Family Vault - represents a shared memory vault between family members
struct FamilyVault: Codable, Identifiable {
    let id: String
    let familyName: String
    let inviteCode: String
    let maxMembers: Int
    let vaultInfo: VaultInfo
    let memberCount: Int
    let ownerInfo: UserInfo
    let createdAt: Date
    let isActive: Bool
    
    struct VaultInfo: Codable {
        let id: String
        let name: String
        let coverImage: String?
        let totalMemories: Int
        let lastUpdated: Date
    }
}

/// Family Member - represents a member of a family vault
struct FamilyMember: Codable, Identifiable {
    let id: String
    let user: UserInfo
    let role: FamilyRole
    let status: MemberStatus
    let permissions: FamilyPermissions
    let joinedAt: Date
    let lastActiveAt: Date?
}

/// User information for family members
struct UserInfo: Codable {
    let deviceId: String
    let displayName: String?
    let avatarUrl: String?
    let email: String?
}

/// Family member roles
enum FamilyRole: String, Codable, CaseIterable {
    case owner = "owner"
    case admin = "admin" 
    case member = "member"
    case viewer = "viewer"
    
    var localizedName: String {
        switch self {
        case .owner:
            return NSLocalizedString("family.role.owner", value: "オーナー", comment: "")
        case .admin:
            return NSLocalizedString("family.role.admin", value: "管理者", comment: "")
        case .member:
            return NSLocalizedString("family.role.member", value: "メンバー", comment: "")
        case .viewer:
            return NSLocalizedString("family.role.viewer", value: "閲覧者", comment: "")
        }
    }
    
    var canInvite: Bool {
        return self == .owner || self == .admin
    }
    
    var canManageMembers: Bool {
        return self == .owner || self == .admin
    }
    
    var canUpload: Bool {
        return self != .viewer
    }
}

/// Member status in family vault
enum MemberStatus: String, Codable {
    case active = "active"
    case pending = "pending"
    case suspended = "suspended"
    case left = "left"
    
    var localizedName: String {
        switch self {
        case .active:
            return NSLocalizedString("family.status.active", value: "アクティブ", comment: "")
        case .pending:
            return NSLocalizedString("family.status.pending", value: "承認待ち", comment: "")
        case .suspended:
            return NSLocalizedString("family.status.suspended", value: "停止中", comment: "")
        case .left:
            return NSLocalizedString("family.status.left", value: "退出済み", comment: "")
        }
    }
}

/// Family member permissions
struct FamilyPermissions: Codable {
    let canView: Bool
    let canUpload: Bool
    let canEdit: Bool
    let canDelete: Bool
    let canInvite: Bool
    
    static let viewer = FamilyPermissions(
        canView: true, canUpload: false, canEdit: false, canDelete: false, canInvite: false
    )
    
    static let member = FamilyPermissions(
        canView: true, canUpload: true, canEdit: true, canDelete: false, canInvite: false
    )
    
    static let admin = FamilyPermissions(
        canView: true, canUpload: true, canEdit: true, canDelete: true, canInvite: true
    )
    
    static let owner = admin // Owner has same permissions as admin
}

/// Family Invitation - represents invitation to join family vault
struct FamilyInvitation: Codable, Identifiable {
    let id: String
    let familyVaultId: String
    let familyName: String
    let inviterName: String?
    let inviteEmail: String
    let role: FamilyRole
    let status: InvitationStatus
    let message: String?
    let invitedAt: Date
    let expiresAt: Date
    let acceptedAt: Date?
    let declinedAt: Date?
}

/// Invitation status
enum InvitationStatus: String, Codable {
    case pending = "pending"
    case accepted = "accepted" 
    case declined = "declined"
    case expired = "expired"
    case revoked = "revoked"
    
    var localizedName: String {
        switch self {
        case .pending:
            return NSLocalizedString("invitation.status.pending", value: "招待中", comment: "")
        case .accepted:
            return NSLocalizedString("invitation.status.accepted", value: "承認済み", comment: "")
        case .declined:
            return NSLocalizedString("invitation.status.declined", value: "辞退", comment: "")
        case .expired:
            return NSLocalizedString("invitation.status.expired", value: "期限切れ", comment: "")
        case .revoked:
            return NSLocalizedString("invitation.status.revoked", value: "取消済み", comment: "")
        }
    }
}

/// Access Request - represents request to access family vault
struct AccessRequest: Codable, Identifiable {
    let id: String
    let familyVaultId: String
    let familyName: String
    let requester: UserInfo
    let message: String?
    let status: AccessRequestStatus
    let createdAt: Date
    let expiresAt: Date
    let respondedAt: Date?
    let responseMessage: String?
}

/// Access request status
enum AccessRequestStatus: String, Codable {
    case pending = "pending"
    case approved = "approved"
    case denied = "denied"
    case expired = "expired"
    
    var localizedName: String {
        switch self {
        case .pending:
            return NSLocalizedString("access_request.status.pending", value: "申請中", comment: "")
        case .approved:
            return NSLocalizedString("access_request.status.approved", value: "承認済み", comment: "")
        case .denied:
            return NSLocalizedString("access_request.status.denied", value: "却下", comment: "")
        case .expired:
            return NSLocalizedString("access_request.status.expired", value: "期限切れ", comment: "")
        }
    }
}

// MARK: - API Request/Response Models

/// Create Family Vault Request
struct CreateFamilyVaultRequest: Codable {
    let deviceId: String
    let vaultId: String
    let familyName: String
    let maxMembers: Int
}

/// Create Family Vault Response
struct CreateFamilyVaultResponse: Codable {
    let success: Bool
    let familyVault: FamilyVaultInfo
    
    struct FamilyVaultInfo: Codable {
        let id: String
        let familyName: String
        let inviteCode: String
        let maxMembers: Int
        let createdAt: Date
    }
}

/// Send Invitation Request
struct SendInvitationRequest: Codable {
    let deviceId: String
    let familyVaultId: String
    let inviteEmail: String
    let role: FamilyRole
    let permissions: FamilyPermissions?
    let message: String?
}

/// Send Invitation Response
struct SendInvitationResponse: Codable {
    let success: Bool
    let invitation: InvitationInfo
    
    struct InvitationInfo: Codable {
        let id: String
        let email: String
        let role: FamilyRole
        let status: InvitationStatus
        let invitedAt: Date
        let expiresAt: Date
    }
}

/// Join Family Request
struct JoinFamilyRequest: Codable {
    let deviceId: String
}

/// Join Family Response
struct JoinFamilyResponse: Codable {
    let success: Bool
    let membership: MembershipInfo
    
    struct MembershipInfo: Codable {
        let familyVaultId: String
        let familyName: String
        let role: FamilyRole
        let status: MemberStatus
        let requiresApproval: Bool
    }
}

/// Request Access Request
struct RequestAccessRequest: Codable {
    let deviceId: String
    let familyVaultId: String
    let message: String?
}

/// Request Access Response
struct RequestAccessResponse: Codable {
    let success: Bool
    let accessRequest: AccessRequestInfo
    
    struct AccessRequestInfo: Codable {
        let id: String
        let status: AccessRequestStatus
        let message: String?
        let expiresAt: Date
        let createdAt: Date
    }
}

/// Respond to Access Request Request
struct RespondAccessRequest: Codable {
    let deviceId: String
    let action: AccessAction
    let responseMessage: String?
    let role: FamilyRole?
    let permissions: FamilyPermissions?
}

enum AccessAction: String, Codable {
    case approve = "approve"
    case deny = "deny"
}

/// Family Members Response
struct FamilyMembersResponse: Codable {
    let members: [FamilyMember]
}

/// User Families Response
struct UserFamiliesResponse: Codable {
    let families: [UserFamily]
    
    struct UserFamily: Codable, Identifiable {
        let id: String
        let familyName: String
        let role: FamilyRole
        let status: MemberStatus
        let vaultInfo: VaultInfo
        let memberCount: Int
        let joinedAt: Date
        
        struct VaultInfo: Codable {
            let id: String
            let name: String
            let coverImage: String?
        }
    }
}

/// Access Requests Response
struct AccessRequestsResponse: Codable {
    let accessRequests: [AccessRequest]
}

// MARK: - Error Models

/// Family Sharing API Error
enum FamilySharingError: LocalizedError, Equatable {
    case networkError
    case invalidResponse
    case familyAlreadyExists
    case memberAlreadyExists
    case familyFull
    case invalidInviteCode
    case alreadyMember
    case duplicateRequest
    case requestNotFound
    case insufficientPermissions
    case familyNotFound
    case memberNotFound
    case inviteNotAllowed
    case accessRequestsNotAllowed
    case unknown(String)
    
    var errorDescription: String? {
        switch self {
        case .networkError:
            return NSLocalizedString("family.error.network", value: "ネットワークエラーが発生しました", comment: "")
        case .invalidResponse:
            return NSLocalizedString("family.error.invalid_response", value: "サーバーからの応答が無効です", comment: "")
        case .familyAlreadyExists:
            return NSLocalizedString("family.error.already_exists", value: "このVaultには既に家族共有が設定されています", comment: "")
        case .memberAlreadyExists:
            return NSLocalizedString("family.error.member_exists", value: "このユーザーは既にファミリーのメンバーです", comment: "")
        case .familyFull:
            return NSLocalizedString("family.error.family_full", value: "ファミリーのメンバー数が上限に達しています", comment: "")
        case .invalidInviteCode:
            return NSLocalizedString("family.error.invalid_invite", value: "招待コードが無効または期限切れです", comment: "")
        case .alreadyMember:
            return NSLocalizedString("family.error.already_member", value: "既にこのファミリーのメンバーです", comment: "")
        case .duplicateRequest:
            return NSLocalizedString("family.error.duplicate_request", value: "既にアクセス申請を送信しています", comment: "")
        case .requestNotFound:
            return NSLocalizedString("family.error.request_not_found", value: "アクセス申請が見つかりません", comment: "")
        case .insufficientPermissions:
            return NSLocalizedString("family.error.insufficient_permissions", value: "この操作を実行する権限がありません", comment: "")
        case .familyNotFound:
            return NSLocalizedString("family.error.family_not_found", value: "ファミリーが見つかりません", comment: "")
        case .memberNotFound:
            return NSLocalizedString("family.error.member_not_found", value: "メンバーが見つかりません", comment: "")
        case .inviteNotAllowed:
            return NSLocalizedString("family.error.invite_not_allowed", value: "招待する権限がありません", comment: "")
        case .accessRequestsNotAllowed:
            return NSLocalizedString("family.error.access_requests_not_allowed", value: "アクセス申請を確認する権限がありません", comment: "")
        case .unknown(let message):
            return message
        }
    }
}

// MARK: - Extensions

extension Date {
    var isExpired: Bool {
        return self < Date()
    }
    
    var timeUntilExpiry: String {
        let interval = self.timeIntervalSince(Date())
        if interval <= 0 {
            return NSLocalizedString("common.expired", value: "期限切れ", comment: "")
        }
        
        let days = Int(interval / 86400)
        let hours = Int((interval.truncatingRemainder(dividingBy: 86400)) / 3600)
        
        if days > 0 {
            return String(format: NSLocalizedString("common.days_remaining", value: "あと%d日", comment: ""), days)
        } else if hours > 0 {
            return String(format: NSLocalizedString("common.hours_remaining", value: "あと%d時間", comment: ""), hours)
        } else {
            let minutes = Int((interval.truncatingRemainder(dividingBy: 3600)) / 60)
            return String(format: NSLocalizedString("common.minutes_remaining", value: "あと%d分", comment: ""), minutes)
        }
    }
}

extension FamilyVault {
    var isOwner: Bool {
        // This would need to be determined based on current user's device ID
        return true // Placeholder
    }
    
    var canInvite: Bool {
        return isOwner || memberCount < maxMembers
    }
    
    var availableSlots: Int {
        return max(0, maxMembers - memberCount)
    }
}

extension FamilyMember {
    var displayName: String {
        return user.displayName ?? String(user.deviceId.prefix(8)) + "..."
    }
    
    var isActive: Bool {
        return status == .active
    }
}

extension AccessRequest {
    var isExpired: Bool {
        return expiresAt.isExpired
    }
    
    var canRespond: Bool {
        return status == .pending && !isExpired
    }
}