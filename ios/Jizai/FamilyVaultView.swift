import SwiftUI

/// Main view for displaying and managing family vaults
struct FamilyVaultView: View {
    @StateObject private var familyService = FamilySharingService(
        apiClient: FamilySharingAPIClient(deviceManager: DeviceManager.shared)
    )
    
    @State private var showingCreateFamilySheet = false
    @State private var showingInvitationView = false
    @State private var selectedFamily: UserFamiliesResponse.UserFamily?
    
    var body: some View {
        NavigationView {
            Group {
                if familyService.userFamilies.isEmpty && !familyService.isLoading {
                    EmptyFamilyView(
                        onCreateTapped: { showingCreateFamilySheet = true },
                        onJoinTapped: { showingInvitationView = true }
                    )
                } else {
                    familyListView
                }
            }
            .navigationTitle("家族共有")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    Button {
                        showingInvitationView = true
                    } label: {
                        Image(systemName: "person.badge.plus")
                    }
                    
                    Menu {
                        Button("新しいファミリーを作成") {
                            showingCreateFamilySheet = true
                        }
                        
                        Button("招待で参加") {
                            showingInvitationView = true
                        }
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .refreshable {
                await familyService.loadUserFamilies()
            }
            .task {
                await familyService.loadUserFamilies()
            }
            .sheet(isPresented: $showingCreateFamilySheet) {
                CreateFamilySheet(familyService: familyService)
            }
            .sheet(isPresented: $showingInvitationView) {
                FamilyInvitationView()
            }
            .overlay {
                if familyService.isLoading {
                    LoadingOverlayView()
                }
            }
        }
    }
    
    // MARK: - Family List View
    
    private var familyListView: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                ForEach(familyService.userFamilies) { family in
                    FamilyVaultCardView(
                        family: family,
                        onTapped: { selectedFamily = family }
                    )
                    .padding(.horizontal)
                }
            }
            .padding(.vertical)
        }
        .navigationDestination(item: $selectedFamily) { family in
            FamilyVaultDetailView(family: family)
        }
    }
}

// MARK: - Empty Family View

struct EmptyFamilyView: View {
    let onCreateTapped: () -> Void
    let onJoinTapped: () -> Void
    
    var body: some View {
        VStack(spacing: 30) {
            // Illustration
            VStack(spacing: 20) {
                Image(systemName: "house.and.flag.circle.fill")
                    .font(.system(size: 80))
                    .foregroundStyle(.blue.gradient)
                
                VStack(spacing: 8) {
                    Text("家族共有を始めよう")
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    Text("大切な思い出を家族と一緒に保存・共有できます")
                        .font(.body)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
            }
            
            // Features
            VStack(spacing: 16) {
                FeatureRowView(
                    icon: "photo.on.rectangle.angled",
                    title: "思い出の共有",
                    description: "写真や動画を家族全員で見ることができます"
                )
                
                FeatureRowView(
                    icon: "person.3.sequence.fill",
                    title: "権限管理",
                    description: "メンバーごとに細かく権限を設定できます"
                )
                
                FeatureRowView(
                    icon: "shield.checkerboard",
                    title: "安全な共有",
                    description: "暗号化された安全な環境でデータを保護"
                )
            }
            .padding(.horizontal, 30)
            
            // Action Buttons
            VStack(spacing: 12) {
                Button {
                    onCreateTapped()
                } label: {
                    HStack {
                        Image(systemName: "plus.circle.fill")
                        Text("新しいファミリーを作成")
                            .fontWeight(.semibold)
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .background(Color.blue)
                    .cornerRadius(12)
                }
                
                Button {
                    onJoinTapped()
                } label: {
                    HStack {
                        Image(systemName: "person.badge.plus")
                        Text("招待で参加する")
                            .fontWeight(.semibold)
                    }
                    .foregroundColor(.blue)
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(12)
                }
            }
            .padding(.horizontal, 30)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemGroupedBackground))
    }
}

// MARK: - Feature Row View

struct FeatureRowView: View {
    let icon: String
    let title: String
    let description: String
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.blue)
                .frame(width: 30)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
    }
}

// MARK: - Family Vault Card View

struct FamilyVaultCardView: View {
    let family: UserFamiliesResponse.UserFamily
    let onTapped: () -> Void
    
    var body: some View {
        Button(action: onTapped) {
            VStack(spacing: 0) {
                // Header with cover image
                ZStack {
                    AsyncImage(url: URL(string: family.vaultInfo.coverImage ?? "")) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    } placeholder: {
                        LinearGradient(
                            colors: [.blue.opacity(0.7), .purple.opacity(0.5)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    }
                    .frame(height: 120)
                    .clipped()
                    
                    // Overlay
                    VStack {
                        Spacer()
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(family.familyName)
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                                
                                Text("あなたの役割: \(family.role.localizedName)")
                                    .font(.caption)
                                    .foregroundColor(.white.opacity(0.9))
                            }
                            
                            Spacer()
                        }
                        .padding()
                    }
                    .background(
                        LinearGradient(
                            colors: [.clear, .black.opacity(0.6)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                }
                
                // Info Section
                VStack(spacing: 16) {
                    HStack {
                        StatusBadgeView(status: family.status)
                        
                        Spacer()
                        
                        Text("\(family.memberCount)人")
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Vault名")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text(family.vaultInfo.name)
                                .font(.subheadline)
                                .fontWeight(.medium)
                        }
                        
                        Spacer()
                        
                        VStack(alignment: .trailing, spacing: 4) {
                            Text("参加日")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text(family.joinedAt.formatted(date: .abbreviated, time: .omitted))
                                .font(.subheadline)
                                .fontWeight(.medium)
                        }
                    }
                }
                .padding()
                .background(Color(.secondarySystemGroupedBackground))
            }
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(16)
            .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Status Badge View

struct StatusBadgeView: View {
    let status: MemberStatus
    
    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(statusColor)
                .frame(width: 8, height: 8)
            
            Text(status.localizedName)
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(statusColor)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(statusColor.opacity(0.1))
        .cornerRadius(12)
    }
    
    private var statusColor: Color {
        switch status {
        case .active:
            return .green
        case .pending:
            return .orange
        case .suspended:
            return .red
        case .left:
            return .gray
        }
    }
}

// MARK: - Create Family Sheet

struct CreateFamilySheet: View {
    @ObservedObject var familyService: FamilySharingService
    @Environment(\.dismiss) private var dismiss
    
    @State private var familyName = ""
    @State private var selectedVaultId = ""
    @State private var maxMembers = 10
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
                Section("基本情報") {
                    TextField("ファミリー名", text: $familyName)
                        .textInputAutocapitalization(.words)
                    
                    Picker("対象Vault", selection: $selectedVaultId) {
                        ForEach(availableVaults, id: \.0) { vaultId, vaultName in
                            Text(vaultName).tag(vaultId)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                }
                
                Section("設定") {
                    Stepper("最大メンバー数: \(maxMembers)人", value: $maxMembers, in: 2...20)
                }
                
                Section("ファミリー共有について") {
                    VStack(alignment: .leading, spacing: 12) {
                        InfoRowView(
                            icon: "person.3.fill",
                            text: "最大20人まで招待できます",
                            color: .blue
                        )
                        
                        InfoRowView(
                            icon: "shield.fill",
                            text: "メンバーの権限を細かく設定可能",
                            color: .green
                        )
                        
                        InfoRowView(
                            icon: "key.fill",
                            text: "招待コードで簡単に参加",
                            color: .orange
                        )
                    }
                }
                
                if let errorMessage = familyService.errorMessage, !errorMessage.isEmpty {
                    Section {
                        Text(errorMessage)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle("ファミリー作成")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("キャンセル") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    Button("作成") {
                        createFamily()
                    }
                    .disabled(familyName.isEmpty || selectedVaultId.isEmpty || isLoading)
                }
            }
        }
        .onAppear {
            if selectedVaultId.isEmpty && !availableVaults.isEmpty {
                selectedVaultId = availableVaults[0].0
            }
        }
    }
    
    private func createFamily() {
        isLoading = true
        
        Task {
            let success = await familyService.createFamily(
                vaultId: selectedVaultId,
                familyName: familyName,
                maxMembers: maxMembers
            )
            
            await MainActor.run {
                isLoading = false
                
                if success {
                    dismiss()
                }
            }
        }
    }
}

// MARK: - Family Vault Detail View

struct FamilyVaultDetailView: View {
    let family: UserFamiliesResponse.UserFamily
    
    @State private var selectedTab = 0
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            FamilyHeaderView(family: family)
            
            // Tab Bar
            Picker("選択", selection: $selectedTab) {
                Text("概要").tag(0)
                Text("メンバー").tag(1)
                Text("申請").tag(2)
            }
            .pickerStyle(SegmentedPickerStyle())
            .padding()
            
            // Content
            TabView(selection: $selectedTab) {
                FamilyOverviewTab(family: family)
                    .tag(0)
                
                FamilyMemberManagementView(
                    familyVaultId: family.id,
                    familyName: family.familyName,
                    userRole: family.role
                )
                .tag(1)
                
                AccessRequestView(
                    familyVaultId: family.id,
                    userRole: family.role
                )
                .tag(2)
            }
            .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
        }
        .navigationTitle(family.familyName)
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Family Header View

struct FamilyHeaderView: View {
    let family: UserFamiliesResponse.UserFamily
    
    var body: some View {
        VStack(spacing: 16) {
            AsyncImage(url: URL(string: family.vaultInfo.coverImage ?? "")) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                LinearGradient(
                    colors: [.blue.opacity(0.7), .purple.opacity(0.5)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            }
            .frame(height: 120)
            .clipped()
            
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(family.vaultInfo.name)
                        .font(.title2)
                        .fontWeight(.semibold)
                    
                    Text("あなたの役割: \(family.role.localizedName)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("\(family.memberCount)")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)
                    
                    Text("メンバー")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .padding(.horizontal)
        }
        .background(Color(.secondarySystemGroupedBackground))
    }
}

// MARK: - Family Overview Tab

struct FamilyOverviewTab: View {
    let family: UserFamiliesResponse.UserFamily
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Quick Stats
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: 16) {
                    StatCardView(
                        title: "メンバー数",
                        value: "\(family.memberCount)",
                        icon: "person.3.fill",
                        color: .blue
                    )
                    
                    StatCardView(
                        title: "参加日",
                        value: family.joinedAt.formatted(.dateTime.month().day()),
                        icon: "calendar",
                        color: .green
                    )
                    
                    StatCardView(
                        title: "ステータス",
                        value: family.status.localizedName,
                        icon: "checkmark.seal.fill",
                        color: .orange
                    )
                    
                    StatCardView(
                        title: "権限",
                        value: family.role.localizedName,
                        icon: "key.fill",
                        color: .purple
                    )
                }
                .padding(.horizontal)
                
                // Recent Activity (Placeholder)
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("最近の活動")
                            .font(.headline)
                            .fontWeight(.semibold)
                        
                        Spacer()
                        
                        Button("すべて見る") {
                            // Navigate to activity view
                        }
                        .font(.caption)
                        .foregroundColor(.blue)
                    }
                    
                    Text("活動履歴は開発中です")
                        .font(.body)
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 30)
                }
                .padding(.horizontal)
            }
            .padding(.vertical)
        }
    }
}

// MARK: - Stat Card View

struct StatCardView: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.tertiarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

// MARK: - Loading Overlay View

struct LoadingOverlayView: View {
    var body: some View {
        ZStack {
            Color.black.opacity(0.3)
                .ignoresSafeArea()
            
            VStack(spacing: 16) {
                ProgressView()
                    .scaleEffect(1.2)
                    .tint(.white)
                
                Text("読み込み中...")
                    .font(.subheadline)
                    .foregroundColor(.white)
            }
            .padding(30)
            .background(Color.black.opacity(0.7))
            .cornerRadius(12)
        }
    }
}

#Preview("Family Vault View - Empty") {
    FamilyVaultView()
}

#Preview("Family Vault Card") {
    FamilyVaultCardView(
        family: UserFamiliesResponse.UserFamily(
            id: "family1",
            familyName: "山田家の思い出",
            role: .admin,
            status: .active,
            vaultInfo: UserFamiliesResponse.UserFamily.VaultInfo(
                id: "vault1",
                name: "家族の思い出",
                coverImage: nil
            ),
            memberCount: 4,
            joinedAt: Date()
        )
    ) { }
    .padding()
}

#Preview("Create Family Sheet") {
    CreateFamilySheet(
        familyService: FamilySharingService(
            apiClient: FamilySharingAPIClient(deviceManager: DeviceManager.shared)
        )
    )
}