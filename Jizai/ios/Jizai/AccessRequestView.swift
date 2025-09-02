import SwiftUI

/// View for managing access requests - both sending and reviewing requests
struct AccessRequestView: View {
    let familyVaultId: String
    let userRole: FamilyRole
    
    @StateObject private var familyService = FamilySharingService(
        apiClient: FamilySharingAPIClient(deviceManager: DeviceManager.shared)
    )
    
    @State private var showingRequestSheet = false
    @State private var showingSuccessAlert = false
    @State private var successMessage = ""
    
    var body: some View {
        List {
            // Request Access Section (for non-members)
            if !userRole.canManageMembers {
                Section("アクセス申請") {
                    Button {
                        showingRequestSheet = true
                    } label: {
                        HStack {
                            Image(systemName: "hand.raised.fill")
                                .foregroundColor(.blue)
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text("アクセスを申請")
                                    .foregroundColor(.blue)
                                    .font(.headline)
                                Text("ファミリーオーナーにアクセス許可を申請します")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            
                            Spacer()
                            
                            Image(systemName: "chevron.right")
                                .foregroundColor(.secondary)
                                .font(.caption)
                        }
                    }
                }
            }
            
            // Pending Requests Section (for admins/owners)
            if userRole.canManageMembers {
                Section {
                    if familyService.pendingAccessRequests.isEmpty {
                        Text("現在、保留中のアクセス申請はありません")
                            .foregroundColor(.secondary)
                            .font(.body)
                            .frame(maxWidth: .infinity)
                            .padding()
                    } else {
                        ForEach(familyService.pendingAccessRequests.filter { $0.canRespond }) { request in
                            AccessRequestRowView(
                                request: request,
                                onApprove: { approveRequest(request) },
                                onDeny: { denyRequest(request) }
                            )
                        }
                    }
                } header: {
                    HStack {
                        Text("アクセス申請")
                        Spacer()
                        if !familyService.pendingAccessRequests.isEmpty {
                            Text("\(familyService.pendingAccessRequests.filter { $0.canRespond }.count)")
                                .font(.caption)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(Color.red)
                                .foregroundColor(.white)
                                .clipShape(Capsule())
                        }
                    }
                }
            }
            
            // Recent Activity Section
            Section("履歴") {
                ForEach(familyService.pendingAccessRequests.filter { !$0.canRespond }) { request in
                    AccessRequestHistoryRowView(request: request)
                }
                
                if familyService.pendingAccessRequests.filter({ !$0.canRespond }).isEmpty {
                    Text("履歴はありません")
                        .foregroundColor(.secondary)
                        .font(.body)
                        .frame(maxWidth: .infinity)
                        .padding()
                }
            }
        }
        .navigationTitle("アクセス管理")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable {
            await familyService.loadAccessRequests(familyVaultId: familyVaultId)
        }
        .task {
            await familyService.loadAccessRequests(familyVaultId: familyVaultId)
        }
        .sheet(isPresented: $showingRequestSheet) {
            RequestAccessSheet(
                familyVaultId: familyVaultId,
                familyService: familyService
            ) { success, message in
                if success {
                    successMessage = message
                    showingSuccessAlert = true
                }
            }
        }
        .alert("成功", isPresented: $showingSuccessAlert) {
            Button("OK") { }
        } message: {
            Text(successMessage)
        }
        .overlay {
            if familyService.isLoading {
                LoadingView()
            }
        }
    }
    
    private func approveRequest(_ request: AccessRequest) {
        Task {
            let success = await familyService.respondToAccessRequest(
                requestId: request.id,
                action: .approve,
                responseMessage: "承認されました"
            )
            
            if success {
                await familyService.loadAccessRequests(familyVaultId: familyVaultId)
            }
        }
    }
    
    private func denyRequest(_ request: AccessRequest) {
        Task {
            let success = await familyService.respondToAccessRequest(
                requestId: request.id,
                action: .deny,
                responseMessage: "申請が却下されました"
            )
            
            if success {
                await familyService.loadAccessRequests(familyVaultId: familyVaultId)
            }
        }
    }
}

// MARK: - Access Request Row View

struct AccessRequestRowView: View {
    let request: AccessRequest
    let onApprove: () -> Void
    let onDeny: () -> Void
    
    @State private var showingDetailSheet = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // User Info
            HStack(spacing: 12) {
                AsyncImage(url: URL(string: request.requester.avatarUrl ?? "")) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Image(systemName: "person.circle.fill")
                        .foregroundColor(.gray)
                }
                .frame(width: 40, height: 40)
                .clipShape(Circle())
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(request.requester.displayName ?? "Unknown User")
                        .font(.headline)
                        .fontWeight(.medium)
                    
                    HStack {
                        Image(systemName: "clock")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Text(request.createdAt.formatted(.relative(presentation: .named)))
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        if !request.expiresAt.isExpired {
                            Text("・\(request.expiresAt.timeUntilExpiry)")
                                .font(.caption)
                                .foregroundColor(.orange)
                        }
                    }
                }
                
                Spacer()
                
                Button {
                    showingDetailSheet = true
                } label: {
                    Image(systemName: "info.circle")
                        .foregroundColor(.blue)
                }
            }
            
            // Message Preview
            if let message = request.message, !message.isEmpty {
                Text(message)
                    .font(.body)
                    .lineLimit(2)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
            }
            
            // Action Buttons
            HStack(spacing: 12) {
                Button {
                    onDeny()
                } label: {
                    HStack {
                        Image(systemName: "xmark")
                        Text("却下")
                    }
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.red)
                    .frame(maxWidth: .infinity)
                    .frame(height: 40)
                    .background(Color.red.opacity(0.1))
                    .cornerRadius(8)
                }
                
                Button {
                    onApprove()
                } label: {
                    HStack {
                        Image(systemName: "checkmark")
                        Text("承認")
                    }
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 40)
                    .background(Color.blue)
                    .cornerRadius(8)
                }
            }
        }
        .padding(.vertical, 8)
        .sheet(isPresented: $showingDetailSheet) {
            AccessRequestDetailSheet(request: request) {
                showingDetailSheet = false
            }
        }
    }
}

// MARK: - Access Request History Row View

struct AccessRequestHistoryRowView: View {
    let request: AccessRequest
    
    var body: some View {
        HStack(spacing: 12) {
            AsyncImage(url: URL(string: request.requester.avatarUrl ?? "")) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Image(systemName: "person.circle.fill")
                    .foregroundColor(.gray)
            }
            .frame(width: 30, height: 30)
            .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 4) {
                Text(request.requester.displayName ?? "Unknown User")
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                HStack {
                    Text(request.createdAt.formatted(date: .abbreviated, time: .omitted))
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text("・")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text(request.status.localizedName)
                        .font(.caption)
                        .foregroundColor(statusColor(for: request.status))
                }
            }
            
            Spacer()
            
            Image(systemName: statusIcon(for: request.status))
                .foregroundColor(statusColor(for: request.status))
                .font(.caption)
        }
        .opacity(0.7)
    }
    
    private func statusColor(for status: AccessRequestStatus) -> Color {
        switch status {
        case .approved:
            return .green
        case .denied:
            return .red
        case .expired:
            return .orange
        case .pending:
            return .blue
        }
    }
    
    private func statusIcon(for status: AccessRequestStatus) -> String {
        switch status {
        case .approved:
            return "checkmark.circle.fill"
        case .denied:
            return "xmark.circle.fill"
        case .expired:
            return "clock.fill"
        case .pending:
            return "hourglass"
        }
    }
}

// MARK: - Request Access Sheet

struct RequestAccessSheet: View {
    let familyVaultId: String
    @ObservedObject var familyService: FamilySharingService
    let onComplete: (Bool, String) -> Void
    
    @Environment(\.dismiss) private var dismiss
    @State private var requestMessage = ""
    @State private var isLoading = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Header
                VStack(spacing: 12) {
                    Image(systemName: "hand.raised.circle.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.blue)
                    
                    Text("アクセス申請")
                        .font(.title2)
                        .fontWeight(.semibold)
                    
                    Text("ファミリーオーナーにアクセス許可を申請します")
                        .font(.body)
                        .multilineTextAlignment(.center)
                        .foregroundColor(.secondary)
                }
                .padding(.top, 20)
                
                // Message Input
                VStack(alignment: .leading, spacing: 8) {
                    Text("申請理由（任意）")
                        .font(.headline)
                    
                    TextField(
                        "例: 家族の思い出を一緒に管理したいです",
                        text: $requestMessage,
                        axis: .vertical
                    )
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(3...6)
                    
                    Text("オーナーがあなたの申請を確認しやすくなります")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal)
                
                // Info Section
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Image(systemName: "info.circle.fill")
                            .foregroundColor(.blue)
                        Text("申請について")
                            .font(.headline)
                        Spacer()
                    }
                    
                    VStack(spacing: 8) {
                        InfoRowView(
                            icon: "clock.fill",
                            text: "申請は72時間で自動的に期限切れになります",
                            color: .orange
                        )
                        
                        InfoRowView(
                            icon: "bell.fill",
                            text: "オーナーに通知が送信されます",
                            color: .blue
                        )
                        
                        InfoRowView(
                            icon: "checkmark.seal.fill",
                            text: "承認されると家族メンバーになります",
                            color: .green
                        )
                    }
                }
                .padding(.horizontal)
                
                Spacer()
                
                // Error Message
                if let errorMessage = familyService.errorMessage, !errorMessage.isEmpty {
                    Text(errorMessage)
                        .foregroundColor(.red)
                        .font(.caption)
                        .padding(.horizontal)
                }
                
                // Submit Button
                Button {
                    submitRequest()
                } label: {
                    HStack {
                        if isLoading {
                            ProgressView()
                                .scaleEffect(0.8)
                                .tint(.white)
                        }
                        Text("申請を送信")
                            .fontWeight(.semibold)
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .background(isLoading ? Color.gray : Color.blue)
                    .cornerRadius(12)
                }
                .disabled(isLoading)
                .padding(.horizontal)
                .padding(.bottom)
            }
            .navigationTitle("アクセス申請")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("キャンセル") {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private func submitRequest() {
        isLoading = true
        
        Task {
            // Mock API call using family service
            // In real implementation, this would call the API
            let success = true // await familyService.requestAccess(familyVaultId: familyVaultId, message: requestMessage)
            
            await MainActor.run {
                isLoading = false
                
                if success {
                    onComplete(true, "アクセス申請を送信しました")
                    dismiss()
                }
            }
        }
    }
}

// MARK: - Access Request Detail Sheet

struct AccessRequestDetailSheet: View {
    let request: AccessRequest
    let onDismiss: () -> Void
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // User Info Card
                    VStack(spacing: 16) {
                        AsyncImage(url: URL(string: request.requester.avatarUrl ?? "")) { image in
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                        } placeholder: {
                            Image(systemName: "person.circle.fill")
                                .foregroundColor(.gray)
                        }
                        .frame(width: 80, height: 80)
                        .clipShape(Circle())
                        
                        VStack(spacing: 4) {
                            Text(request.requester.displayName ?? "Unknown User")
                                .font(.title2)
                                .fontWeight(.semibold)
                            
                            if let email = request.requester.email {
                                Text(email)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                    
                    // Request Details
                    VStack(alignment: .leading, spacing: 16) {
                        DetailRowView(
                            title: "申請日時",
                            value: request.createdAt.formatted(date: .complete, time: .standard),
                            icon: "calendar"
                        )
                        
                        DetailRowView(
                            title: "有効期限",
                            value: request.expiresAt.isExpired ? "期限切れ" : request.expiresAt.timeUntilExpiry,
                            icon: "clock",
                            valueColor: request.expiresAt.isExpired ? .red : .orange
                        )
                        
                        DetailRowView(
                            title: "ステータス",
                            value: request.status.localizedName,
                            icon: "flag",
                            valueColor: statusColor(for: request.status)
                        )
                        
                        if let respondedAt = request.respondedAt {
                            DetailRowView(
                                title: "応答日時",
                                value: respondedAt.formatted(date: .complete, time: .standard),
                                icon: "checkmark.circle"
                            )
                        }
                    }
                    
                    // Message
                    if let message = request.message, !message.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Image(systemName: "text.bubble")
                                    .foregroundColor(.blue)
                                Text("申請メッセージ")
                                    .font(.headline)
                            }
                            
                            Text(message)
                                .font(.body)
                                .padding()
                                .background(Color(.systemGray6))
                                .cornerRadius(8)
                        }
                    }
                    
                    // Response Message
                    if let responseMessage = request.responseMessage, !responseMessage.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Image(systemName: "bubble.right")
                                    .foregroundColor(.green)
                                Text("応答メッセージ")
                                    .font(.headline)
                            }
                            
                            Text(responseMessage)
                                .font(.body)
                                .padding()
                                .background(Color.green.opacity(0.1))
                                .cornerRadius(8)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("申請詳細")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("閉じる") {
                        onDismiss()
                    }
                }
            }
        }
    }
    
    private func statusColor(for status: AccessRequestStatus) -> Color {
        switch status {
        case .approved:
            return .green
        case .denied:
            return .red
        case .expired:
            return .orange
        case .pending:
            return .blue
        }
    }
}

// MARK: - Supporting Views

struct InfoRowView: View {
    let icon: String
    let text: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(color)
                .frame(width: 20)
            
            Text(text)
                .font(.body)
                .foregroundColor(.primary)
            
            Spacer()
        }
    }
}

struct DetailRowView: View {
    let title: String
    let value: String
    let icon: String
    let valueColor: Color?
    
    init(title: String, value: String, icon: String, valueColor: Color? = nil) {
        self.title = title
        self.value = value
        self.icon = icon
        self.valueColor = valueColor
    }
    
    var body: some View {
        HStack {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .foregroundColor(.blue)
                    .frame(width: 20)
                
                Text(title)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(valueColor ?? .primary)
        }
        .padding(.vertical, 4)
    }
}

struct LoadingView: View {
    var body: some View {
        ZStack {
            Color.black.opacity(0.3)
                .ignoresSafeArea()
            
            ProgressView()
                .scaleEffect(1.2)
                .tint(.white)
                .frame(width: 60, height: 60)
                .background(Color.black.opacity(0.7))
                .cornerRadius(8)
        }
    }
}

#Preview("Access Request View - Admin") {
    NavigationView {
        AccessRequestView(
            familyVaultId: "family123",
            userRole: .admin
        )
    }
}

#Preview("Access Request View - Member") {
    NavigationView {
        AccessRequestView(
            familyVaultId: "family123",
            userRole: .member
        )
    }
}

#Preview("Request Access Sheet") {
    RequestAccessSheet(
        familyVaultId: "family123",
        familyService: FamilySharingService(
            apiClient: FamilySharingAPIClient(deviceManager: DeviceManager.shared)
        )
    ) { _, _ in }
}