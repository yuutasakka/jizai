import Foundation

/// API Client for Family Sharing functionality
class FamilySharingAPIClient: ObservableObject {
    private let baseURL: URL
    private let session: URLSession
    private let deviceManager: DeviceManager
    
    init(baseURL: URL = URL(string: "http://localhost:3000")!, deviceManager: DeviceManager) {
        self.baseURL = baseURL
        self.session = URLSession.shared
        self.deviceManager = deviceManager
    }
    
    // MARK: - Private Helper Methods
    
    private func makeRequest<T: Codable>(
        endpoint: String,
        method: HTTPMethod = .GET,
        body: Codable? = nil
    ) async throws -> T {
        guard let url = URL(string: endpoint, relativeTo: baseURL) else {
            throw FamilySharingError.invalidResponse
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(deviceManager.deviceId, forHTTPHeaderField: "x-device-id")
        request.setValue("2.0", forHTTPHeaderField: "x-api-version")
        
        if let body = body {
            do {
                let encoder = JSONEncoder()
                encoder.dateEncodingStrategy = .iso8601
                request.httpBody = try encoder.encode(body)
            } catch {
                print("❌ Encoding error: \(error)")
                throw FamilySharingError.invalidResponse
            }
        }
        
        do {
            let (data, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw FamilySharingError.networkError
            }
            
            // Handle HTTP errors
            if httpResponse.statusCode >= 400 {
                let errorMessage = try? JSONDecoder().decode(APIErrorResponse.self, from: data)
                throw mapAPIError(statusCode: httpResponse.statusCode, errorCode: errorMessage?.code)
            }
            
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            
            return try decoder.decode(T.self, from: data)
        } catch is DecodingError {
            print("❌ Decoding error for endpoint: \(endpoint)")
            throw FamilySharingError.invalidResponse
        } catch let error as FamilySharingError {
            throw error
        } catch {
            print("❌ Network error: \(error)")
            throw FamilySharingError.networkError
        }
    }
    
    private func mapAPIError(statusCode: Int, errorCode: String?) -> FamilySharingError {
        guard let errorCode = errorCode else {
            return .unknown("HTTP \(statusCode)")
        }
        
        switch errorCode {
        case "FAMILY_ALREADY_EXISTS":
            return .familyAlreadyExists
        case "MEMBER_ALREADY_EXISTS":
            return .memberAlreadyExists
        case "FAMILY_FULL":
            return .familyFull
        case "INVALID_INVITE_CODE":
            return .invalidInviteCode
        case "ALREADY_MEMBER":
            return .alreadyMember
        case "DUPLICATE_REQUEST":
            return .duplicateRequest
        case "REQUEST_NOT_FOUND":
            return .requestNotFound
        case "INSUFFICIENT_PERMISSIONS":
            return .insufficientPermissions
        case "FAMILY_VAULT_NOT_FOUND":
            return .familyNotFound
        case "MEMBER_NOT_FOUND":
            return .memberNotFound
        case "INVITE_NOT_ALLOWED":
            return .inviteNotAllowed
        case "ACCESS_REQUESTS_NOT_ALLOWED":
            return .accessRequestsNotAllowed
        default:
            return .unknown(errorCode)
        }
    }
    
    // MARK: - Family Vault Management
    
    /// Create a new family vault
    func createFamilyVault(vaultId: String, familyName: String, maxMembers: Int = 10) async throws -> CreateFamilyVaultResponse.FamilyVaultInfo {
        let request = CreateFamilyVaultRequest(
            deviceId: deviceManager.deviceId,
            vaultId: vaultId,
            familyName: familyName,
            maxMembers: maxMembers
        )
        
        let response: CreateFamilyVaultResponse = try await makeRequest(
            endpoint: "/v1/family/create",
            method: .POST,
            body: request
        )
        
        return response.familyVault
    }
    
    /// Get family vault information
    func getFamilyVaultInfo(vaultId: String) async throws -> FamilyVault {
        let response: FamilyVault = try await makeRequest(
            endpoint: "/v1/family/vault/\(vaultId)?deviceId=\(deviceManager.deviceId)",
            method: .GET
        )
        
        return response
    }
    
    /// Get all family vaults user is member of
    func getUserFamilies() async throws -> [UserFamiliesResponse.UserFamily] {
        let response: UserFamiliesResponse = try await makeRequest(
            endpoint: "/v1/family/my-families?deviceId=\(deviceManager.deviceId)",
            method: .GET
        )
        
        return response.families
    }
    
    // MARK: - Family Invitations
    
    /// Send invitation to join family
    func sendInvitation(
        familyVaultId: String,
        email: String,
        role: FamilyRole = .member,
        permissions: FamilyPermissions? = nil,
        message: String? = nil
    ) async throws -> SendInvitationResponse.InvitationInfo {
        let request = SendInvitationRequest(
            deviceId: deviceManager.deviceId,
            familyVaultId: familyVaultId,
            inviteEmail: email,
            role: role,
            permissions: permissions,
            message: message
        )
        
        let response: SendInvitationResponse = try await makeRequest(
            endpoint: "/v1/family/invite",
            method: .POST,
            body: request
        )
        
        return response.invitation
    }
    
    /// Join family using invite code
    func joinFamilyByCode(_ inviteCode: String) async throws -> JoinFamilyResponse.MembershipInfo {
        let request = JoinFamilyRequest(deviceId: deviceManager.deviceId)
        
        let response: JoinFamilyResponse = try await makeRequest(
            endpoint: "/v1/family/join/\(inviteCode)",
            method: .POST,
            body: request
        )
        
        return response.membership
    }
    
    // MARK: - Access Requests
    
    /// Request access to family vault
    func requestFamilyAccess(familyVaultId: String, message: String? = nil) async throws -> RequestAccessResponse.AccessRequestInfo {
        let request = RequestAccessRequest(
            deviceId: deviceManager.deviceId,
            familyVaultId: familyVaultId,
            message: message
        )
        
        let response: RequestAccessResponse = try await makeRequest(
            endpoint: "/v1/family/request-access",
            method: .POST,
            body: request
        )
        
        return response.accessRequest
    }
    
    /// Get pending access requests for family vault
    func getFamilyAccessRequests(familyVaultId: String) async throws -> [AccessRequest] {
        let response: AccessRequestsResponse = try await makeRequest(
            endpoint: "/v1/family/\(familyVaultId)/access-requests?deviceId=\(deviceManager.deviceId)",
            method: .GET
        )
        
        return response.accessRequests
    }
    
    /// Respond to access request
    func respondToAccessRequest(
        requestId: String,
        action: AccessAction,
        responseMessage: String? = nil,
        role: FamilyRole = .member,
        permissions: FamilyPermissions? = nil
    ) async throws {
        let request = RespondAccessRequest(
            deviceId: deviceManager.deviceId,
            action: action,
            responseMessage: responseMessage,
            role: role,
            permissions: permissions
        )
        
        let _: APISuccessResponse = try await makeRequest(
            endpoint: "/v1/family/access-requests/\(requestId)/respond",
            method: .POST,
            body: request
        )
    }
    
    // MARK: - Member Management
    
    /// Get family members
    func getFamilyMembers(familyVaultId: String) async throws -> [FamilyMember] {
        let response: FamilyMembersResponse = try await makeRequest(
            endpoint: "/v1/family/\(familyVaultId)/members?deviceId=\(deviceManager.deviceId)",
            method: .GET
        )
        
        return response.members
    }
    
    /// Update family member role and permissions
    func updateFamilyMember(
        memberId: String,
        role: FamilyRole? = nil,
        permissions: FamilyPermissions? = nil
    ) async throws {
        let request = UpdateMemberRequest(
            deviceId: deviceManager.deviceId,
            role: role,
            permissions: permissions
        )
        
        let _: APISuccessResponse = try await makeRequest(
            endpoint: "/v1/family/members/\(memberId)",
            method: .PUT,
            body: request
        )
    }
    
    /// Remove family member
    func removeFamilyMember(memberId: String) async throws {
        let request = RemoveMemberRequest(deviceId: deviceManager.deviceId)
        
        let _: APISuccessResponse = try await makeRequest(
            endpoint: "/v1/family/members/\(memberId)",
            method: .DELETE,
            body: request
        )
    }
}

// MARK: - Supporting Types

enum HTTPMethod: String {
    case GET = "GET"
    case POST = "POST"
    case PUT = "PUT"
    case DELETE = "DELETE"
}

struct APIErrorResponse: Codable {
    let error: String
    let message: String
    let code: String
}

struct APISuccessResponse: Codable {
    let success: Bool
    let message: String?
}

struct UpdateMemberRequest: Codable {
    let deviceId: String
    let role: FamilyRole?
    let permissions: FamilyPermissions?
}

struct RemoveMemberRequest: Codable {
    let deviceId: String
}

// MARK: - Family Sharing Service

/// High-level service for family sharing operations
@MainActor
class FamilySharingService: ObservableObject {
    @Published var userFamilies: [UserFamiliesResponse.UserFamily] = []
    @Published var currentFamilyMembers: [FamilyMember] = []
    @Published var pendingAccessRequests: [AccessRequest] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let apiClient: FamilySharingAPIClient
    
    init(apiClient: FamilySharingAPIClient) {
        self.apiClient = apiClient
    }
    
    // MARK: - Public Interface
    
    func loadUserFamilies() async {
        isLoading = true
        errorMessage = nil
        
        do {
            userFamilies = try await apiClient.getUserFamilies()
        } catch let error as FamilySharingError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = NSLocalizedString("family.error.unknown", value: "不明なエラーが発生しました", comment: "")
        }
        
        isLoading = false
    }
    
    func createFamily(vaultId: String, familyName: String, maxMembers: Int = 10) async -> Bool {
        isLoading = true
        errorMessage = nil
        
        do {
            let _ = try await apiClient.createFamilyVault(
                vaultId: vaultId,
                familyName: familyName,
                maxMembers: maxMembers
            )
            
            // Refresh family list
            await loadUserFamilies()
            return true
        } catch let error as FamilySharingError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = NSLocalizedString("family.error.unknown", value: "不明なエラーが発生しました", comment: "")
        }
        
        isLoading = false
        return false
    }
    
    func sendInvitation(
        familyVaultId: String,
        email: String,
        role: FamilyRole = .member,
        message: String? = nil
    ) async -> Bool {
        isLoading = true
        errorMessage = nil
        
        do {
            let _ = try await apiClient.sendInvitation(
                familyVaultId: familyVaultId,
                email: email,
                role: role,
                message: message
            )
            return true
        } catch let error as FamilySharingError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = NSLocalizedString("family.error.unknown", value: "不明なエラーが発生しました", comment: "")
        }
        
        isLoading = false
        return false
    }
    
    func joinFamily(inviteCode: String) async -> Bool {
        isLoading = true
        errorMessage = nil
        
        do {
            let _ = try await apiClient.joinFamilyByCode(inviteCode)
            
            // Refresh family list
            await loadUserFamilies()
            return true
        } catch let error as FamilySharingError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = NSLocalizedString("family.error.unknown", value: "不明なエラーが発生しました", comment: "")
        }
        
        isLoading = false
        return false
    }
    
    func loadFamilyMembers(familyVaultId: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            currentFamilyMembers = try await apiClient.getFamilyMembers(familyVaultId: familyVaultId)
        } catch let error as FamilySharingError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = NSLocalizedString("family.error.unknown", value: "不明なエラーが発生しました", comment: "")
        }
        
        isLoading = false
    }
    
    func loadAccessRequests(familyVaultId: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            pendingAccessRequests = try await apiClient.getFamilyAccessRequests(familyVaultId: familyVaultId)
        } catch let error as FamilySharingError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = NSLocalizedString("family.error.unknown", value: "不明なエラーが発生しました", comment: "")
        }
        
        isLoading = false
    }
    
    func respondToAccessRequest(
        requestId: String,
        action: AccessAction,
        responseMessage: String? = nil
    ) async -> Bool {
        isLoading = true
        errorMessage = nil
        
        do {
            try await apiClient.respondToAccessRequest(
                requestId: requestId,
                action: action,
                responseMessage: responseMessage
            )
            
            // Remove from pending requests
            pendingAccessRequests.removeAll { $0.id == requestId }
            return true
        } catch let error as FamilySharingError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = NSLocalizedString("family.error.unknown", value: "不明なエラーが発生しました", comment: "")
        }
        
        isLoading = false
        return false
    }
    
    func removeMember(memberId: String) async -> Bool {
        isLoading = true
        errorMessage = nil
        
        do {
            try await apiClient.removeFamilyMember(memberId: memberId)
            
            // Remove from current members
            currentFamilyMembers.removeAll { $0.id == memberId }
            return true
        } catch let error as FamilySharingError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = NSLocalizedString("family.error.unknown", value: "不明なエラーが発生しました", comment: "")
        }
        
        isLoading = false
        return false
    }
}