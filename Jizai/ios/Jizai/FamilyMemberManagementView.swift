import SwiftUI

/// View for managing family members - viewing, editing roles, and removing members
struct FamilyMemberManagementView: View {
    let familyVaultId: String
    let familyName: String
    let userRole: FamilyRole
    
    @StateObject private var familyService = FamilySharingService(
        apiClient: FamilySharingAPIClient(deviceManager: DeviceManager.shared)
    )
    
    @State private var showingInviteSheet = false
    @State private var showingRemoveMemberAlert = false
    @State private var memberToRemove: FamilyMember?
    @State private var showingEditMemberSheet = false
    @State private var memberToEdit: FamilyMember?
    
    var body: some View {
        List {
            // Family Info Section
            Section {
                FamilyInfoCardView(
                    familyName: familyName,
                    memberCount: familyService.currentFamilyMembers.count,
                    userRole: userRole
                )
            }
            
            // Members Section
            Section("メンバー") {
                ForEach(familyService.currentFamilyMembers) { member in
                    FamilyMemberRowView(
                        member: member,
                        userRole: userRole,
                        onEditTapped: {
                            memberToEdit = member
                            showingEditMemberSheet = true
                        },
                        onRemoveTapped: {
                            memberToRemove = member
                            showingRemoveMemberAlert = true
                        }
                    )
                }
            }
            
            // Actions Section
            if userRole.canInvite {
                Section {
                    Button {
                        showingInviteSheet = true
                    } label: {
                        HStack {
                            Image(systemName: "person.badge.plus")
                                .foregroundColor(.blue)
                            Text("新しいメンバーを招待")
                                .foregroundColor(.blue)
                        }
                    }
                }
            }
        }
        .navigationTitle("ファミリーメンバー")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable {
            await familyService.loadFamilyMembers(familyVaultId: familyVaultId)
        }
        .task {
            await familyService.loadFamilyMembers(familyVaultId: familyVaultId)
        }
        .sheet(isPresented: $showingInviteSheet) {
            SendInviteSheet(
                familyService: familyService,
                preselectedVaultId: familyVaultId
            ) { success, message in
                if success {
                    Task {
                        await familyService.loadFamilyMembers(familyVaultId: familyVaultId)
                    }
                }
            }
        }
        .sheet(item: $memberToEdit) { member in
            EditMemberRoleSheet(
                member: member,
                familyService: familyService
            ) { success in
                if success {
                    Task {
                        await familyService.loadFamilyMembers(familyVaultId: familyVaultId)
                    }
                }
            }
        }
        .alert("メンバーを削除", isPresented: $showingRemoveMemberAlert) {
            Button("キャンセル", role: .cancel) { }
            Button("削除", role: .destructive) {
                if let member = memberToRemove {
                    removeMember(member)
                }
            }
        } message: {
            if let member = memberToRemove {
                Text("\(member.displayName)をファミリーから削除しますか？この操作は取り消せません。")
            }
        }
    }
    
    private func removeMember(_ member: FamilyMember) {
        Task {
            let success = await familyService.removeMember(memberId: member.id)
            if success {
                await familyService.loadFamilyMembers(familyVaultId: familyVaultId)
            }
        }
    }
}

// MARK: - Family Info Card

struct FamilyInfoCardView: View {
    let familyName: String
    let memberCount: Int
    let userRole: FamilyRole
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "house.fill")
                    .foregroundColor(.blue)
                    .font(.title2)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(familyName)
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    Text("あなたの役割: \(userRole.localizedName)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("\(memberCount)")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)
                    
                    Text("メンバー")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Role permissions summary
            HStack(spacing: 16) {
                if userRole.canInvite {
                    PermissionBadge(icon: "person.badge.plus", text: "招待")
                }
                if userRole.canUpload {
                    PermissionBadge(icon: "square.and.arrow.up", text: "アップロード")
                }
                if userRole.canManageMembers {
                    PermissionBadge(icon: "person.2.badge.gearshape", text: "管理")
                }
                Spacer()
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct PermissionBadge: View {
    let icon: String
    let text: String
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption)
            Text(text)
                .font(.caption)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color.blue.opacity(0.1))
        .foregroundColor(.blue)
        .cornerRadius(8)
    }
}

// MARK: - Family Member Row

struct FamilyMemberRowView: View {
    let member: FamilyMember
    let userRole: FamilyRole
    let onEditTapped: () -> Void
    let onRemoveTapped: () -> Void
    
    var body: some View {
        HStack(spacing: 16) {
            // Avatar
            AsyncImage(url: URL(string: member.user.avatarUrl ?? "")) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Image(systemName: "person.circle.fill")
                    .foregroundColor(.gray)
            }
            .frame(width: 40, height: 40)
            .clipShape(Circle())
            
            // Member Info
            VStack(alignment: .leading, spacing: 4) {
                Text(member.displayName)
                    .font(.headline)
                    .fontWeight(.medium)
                
                HStack(spacing: 8) {
                    Text(member.role.localizedName)
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(roleColor(for: member.role).opacity(0.2))
                        .foregroundColor(roleColor(for: member.role))
                        .cornerRadius(8)
                    
                    Text(member.status.localizedName)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                }
            }
            
            Spacer()
            
            // Actions
            if canEditMember(member) {
                Menu {
                    if canChangeRole(member) {
                        Button("役割を変更") {
                            onEditTapped()
                        }
                    }
                    
                    if canRemoveMember(member) {
                        Button("削除", role: .destructive) {
                            onRemoveTapped()
                        }
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .foregroundColor(.secondary)
                        .font(.title3)
                }
            }
        }
        .padding(.vertical, 4)
    }
    
    private func roleColor(for role: FamilyRole) -> Color {
        switch role {
        case .owner:
            return .purple
        case .admin:
            return .orange
        case .member:
            return .blue
        case .viewer:
            return .green
        }
    }
    
    private func canEditMember(_ member: FamilyMember) -> Bool {
        // Can't edit yourself or if you're not admin/owner
        guard member.user.deviceId != DeviceManager.shared.deviceId else { return false }
        return userRole.canManageMembers
    }
    
    private func canChangeRole(_ member: FamilyMember) -> Bool {
        // Only owners can change roles of admins, admins can change member/viewer roles
        switch userRole {
        case .owner:
            return member.role != .owner
        case .admin:
            return member.role == .member || member.role == .viewer
        default:
            return false
        }
    }
    
    private func canRemoveMember(_ member: FamilyMember) -> Bool {
        // Can't remove owners, and role hierarchy applies
        guard member.role != .owner else { return false }
        return userRole.canManageMembers
    }
}

// MARK: - Edit Member Role Sheet

struct EditMemberRoleSheet: View {
    let member: FamilyMember
    @ObservedObject var familyService: FamilySharingService
    let onComplete: (Bool) -> Void
    
    @Environment(\.dismiss) private var dismiss
    @State private var selectedRole: FamilyRole
    @State private var isLoading = false
    
    init(member: FamilyMember, familyService: FamilySharingService, onComplete: @escaping (Bool) -> Void) {
        self.member = member
        self.familyService = familyService
        self.onComplete = onComplete
        self._selectedRole = State(initialValue: member.role)
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section("メンバー情報") {
                    HStack {
                        AsyncImage(url: URL(string: member.user.avatarUrl ?? "")) { image in
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                        } placeholder: {
                            Image(systemName: "person.circle.fill")
                                .foregroundColor(.gray)
                        }
                        .frame(width: 40, height: 40)
                        .clipShape(Circle())
                        
                        VStack(alignment: .leading) {
                            Text(member.displayName)
                                .font(.headline)
                            Text("参加日: \(member.joinedAt.formatted(date: .abbreviated, time: .omitted))")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                    }
                }
                
                Section("役割を変更") {
                    ForEach(availableRoles, id: \.self) { role in
                        HStack {
                            VStack(alignment: .leading) {
                                Text(role.localizedName)
                                    .font(.headline)
                                Text(roleDescription(for: role))
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            
                            Spacer()
                            
                            if selectedRole == role {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.blue)
                            } else {
                                Image(systemName: "circle")
                                    .foregroundColor(.secondary)
                            }
                        }
                        .contentShape(Rectangle())
                        .onTapGesture {
                            selectedRole = role
                        }
                    }
                }
                
                Section("権限") {
                    PermissionSummaryView(role: selectedRole)
                }
            }
            .navigationTitle("役割を変更")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("キャンセル") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    Button("保存") {
                        updateMemberRole()
                    }
                    .disabled(selectedRole == member.role || isLoading)
                }
            }
        }
    }
    
    private var availableRoles: [FamilyRole] {
        // Return roles that current user can assign
        return FamilyRole.allCases.filter { role in
            role != .owner // Can't make someone owner through this interface
        }
    }
    
    private func roleDescription(for role: FamilyRole) -> String {
        switch role {
        case .owner:
            return "完全な管理権限"
        case .admin:
            return "メンバー管理と招待が可能"
        case .member:
            return "アップロードと編集が可能"
        case .viewer:
            return "閲覧のみ可能"
        }
    }
    
    private func updateMemberRole() {
        isLoading = true
        
        Task {
            let success = await familyService.updateMember(
                memberId: member.id,
                role: selectedRole
            )
            
            await MainActor.run {
                isLoading = false
                onComplete(success)
                if success {
                    dismiss()
                }
            }
        }
    }
}

// MARK: - Permission Summary View

struct PermissionSummaryView: View {
    let role: FamilyRole
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            PermissionRow(
                icon: "eye.fill",
                title: "閲覧",
                isGranted: true,
                color: .blue
            )
            
            PermissionRow(
                icon: "square.and.arrow.up.fill",
                title: "アップロード",
                isGranted: role.canUpload,
                color: .green
            )
            
            PermissionRow(
                icon: "pencil",
                title: "編集",
                isGranted: role != .viewer,
                color: .orange
            )
            
            PermissionRow(
                icon: "person.badge.plus.fill",
                title: "招待",
                isGranted: role.canInvite,
                color: .purple
            )
            
            PermissionRow(
                icon: "person.2.badge.gearshape.fill",
                title: "メンバー管理",
                isGranted: role.canManageMembers,
                color: .red
            )
        }
    }
}

struct PermissionRow: View {
    let icon: String
    let title: String
    let isGranted: Bool
    let color: Color
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(isGranted ? color : .gray)
                .frame(width: 20)
            
            Text(title)
                .foregroundColor(isGranted ? .primary : .secondary)
            
            Spacer()
            
            Image(systemName: isGranted ? "checkmark.circle.fill" : "xmark.circle.fill")
                .foregroundColor(isGranted ? .green : .red)
        }
    }
}

// MARK: - Enhanced Send Invite Sheet

struct SendInviteSheet: View {
    @ObservedObject var familyService: FamilySharingService
    let preselectedVaultId: String?
    let onComplete: (Bool, String) -> Void
    
    @Environment(\.dismiss) private var dismiss
    
    @State private var selectedVaultId = ""
    @State private var inviteEmail = ""
    @State private var selectedRole = FamilyRole.member
    @State private var inviteMessage = ""
    @State private var isLoading = false
    
    // Mock vault data - in real app, this would come from a vault service
    private let availableVaults = [
        ("vault1", "家族の思い出"),
        ("vault2", "旅行写真"),
        ("vault3", "子供の成長記録")
    ]
    
    var body: some View {
        NavigationView {
            Form {
                if preselectedVaultId == nil {
                    Section("招待先Vault") {
                        Picker("Vault選択", selection: $selectedVaultId) {
                            ForEach(availableVaults, id: \.0) { vaultId, vaultName in
                                Text(vaultName).tag(vaultId)
                            }
                        }
                        .pickerStyle(MenuPickerStyle())
                    }
                }
                
                Section("招待する人") {
                    TextField("メールアドレス", text: $inviteEmail)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                    
                    Picker("役割", selection: $selectedRole) {
                        ForEach(FamilyRole.allCases.filter { $0 != .owner }, id: \.self) { role in
                            VStack(alignment: .leading) {
                                Text(role.localizedName)
                                Text(roleDescription(for: role))
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            .tag(role)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                }
                
                Section("メッセージ（任意）") {
                    TextField("招待メッセージ", text: $inviteMessage, axis: .vertical)
                        .lineLimit(3...6)
                }
                
                Section("権限プレビュー") {
                    PermissionSummaryView(role: selectedRole)
                }
                
                if let errorMessage = familyService.errorMessage, !errorMessage.isEmpty {
                    Section {
                        Text(errorMessage)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle("招待を送信")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("キャンセル") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    Button("送信") {
                        sendInvitation()
                    }
                    .disabled(inviteEmail.isEmpty || isLoading)
                }
            }
        }
        .onAppear {
            if let preselectedId = preselectedVaultId {
                selectedVaultId = preselectedId
            } else if selectedVaultId.isEmpty && !availableVaults.isEmpty {
                selectedVaultId = availableVaults[0].0
            }
        }
    }
    
    private func roleDescription(for role: FamilyRole) -> String {
        switch role {
        case .owner:
            return "完全な管理権限"
        case .admin:
            return "メンバー管理と招待が可能"
        case .member:
            return "アップロードと編集が可能"
        case .viewer:
            return "閲覧のみ可能"
        }
    }
    
    private func sendInvitation() {
        isLoading = true
        let vaultId = preselectedVaultId ?? selectedVaultId
        
        Task {
            let success = await familyService.sendInvitation(
                familyVaultId: vaultId,
                email: inviteEmail,
                role: selectedRole,
                message: inviteMessage.isEmpty ? nil : inviteMessage
            )
            
            await MainActor.run {
                isLoading = false
                
                if success {
                    onComplete(true, "招待を送信しました")
                    dismiss()
                }
            }
        }
    }
}

#Preview("Family Member Management") {
    NavigationView {
        FamilyMemberManagementView(
            familyVaultId: "family123",
            familyName: "山田家の思い出",
            userRole: .admin
        )
    }
}

#Preview("Edit Member Role") {
    EditMemberRoleSheet(
        member: FamilyMember(
            id: "member1",
            user: UserInfo(deviceId: "device123", displayName: "太郎", avatarUrl: nil, email: "taro@example.com"),
            role: .member,
            status: .active,
            permissions: FamilyPermissions.member,
            joinedAt: Date(),
            lastActiveAt: Date()
        ),
        familyService: FamilySharingService(
            apiClient: FamilySharingAPIClient(deviceManager: DeviceManager.shared)
        )
    ) { _ in }
}