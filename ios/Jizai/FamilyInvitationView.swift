import SwiftUI

/// View for managing family invitations - sending invites and joining families
struct FamilyInvitationView: View {
    @StateObject private var familyService = FamilySharingService(
        apiClient: FamilySharingAPIClient(deviceManager: DeviceManager.shared)
    )
    
    @State private var selectedTab = 0
    @State private var showingInviteSheet = false
    @State private var showingJoinSheet = false
    @State private var showingSuccessAlert = false
    @State private var successMessage = ""
    
    var body: some View {
        NavigationView {
            VStack {
                // Tab Selector
                Picker("Family Options", selection: $selectedTab) {
                    Text("招待を送る").tag(0)
                    Text("参加する").tag(1)
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding()
                
                if selectedTab == 0 {
                    sendInviteView
                } else {
                    joinFamilyView
                }
                
                Spacer()
            }
            .navigationTitle("家族共有")
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $showingInviteSheet) {
                SendInviteSheet(familyService: familyService) { success, message in
                    if success {
                        successMessage = message
                        showingSuccessAlert = true
                    }
                }
            }
            .sheet(isPresented: $showingJoinSheet) {
                JoinFamilySheet(familyService: familyService) { success, message in
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
        }
    }
    
    // MARK: - Send Invite View
    
    private var sendInviteView: some View {
        VStack(spacing: 20) {
            Image(systemName: "person.badge.plus")
                .font(.system(size: 60))
                .foregroundColor(.blue)
                .padding(.top, 40)
            
            Text("家族を招待")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("メールアドレスを使って家族をVaultに招待できます")
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
                .padding(.horizontal)
            
            VStack(spacing: 12) {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                    Text("思い出を一緒に保存")
                        .font(.body)
                    Spacer()
                }
                
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                    Text("アクセス権限を細かく設定")
                        .font(.body)
                    Spacer()
                }
                
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                    Text("いつでも招待を取り消し可能")
                        .font(.body)
                    Spacer()
                }
            }
            .padding(.horizontal, 30)
            
            Button {
                showingInviteSheet = true
            } label: {
                HStack {
                    Image(systemName: "envelope.fill")
                    Text("招待を送信")
                        .fontWeight(.semibold)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(Color.blue)
                .cornerRadius(12)
            }
            .padding(.horizontal, 30)
            .padding(.top, 20)
        }
    }
    
    // MARK: - Join Family View
    
    private var joinFamilyView: some View {
        VStack(spacing: 20) {
            Image(systemName: "qrcode")
                .font(.system(size: 60))
                .foregroundColor(.green)
                .padding(.top, 40)
            
            Text("ファミリーに参加")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("招待コードを使って家族のVaultに参加できます")
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
                .padding(.horizontal)
            
            VStack(spacing: 12) {
                HStack {
                    Image(systemName: "key.fill")
                        .foregroundColor(.orange)
                    Text("安全な招待コード")
                        .font(.body)
                    Spacer()
                }
                
                HStack {
                    Image(systemName: "clock.fill")
                        .foregroundColor(.blue)
                    Text("期限付きアクセス")
                        .font(.body)
                    Spacer()
                }
                
                HStack {
                    Image(systemName: "shield.fill")
                        .foregroundColor(.green)
                    Text("プライバシー保護")
                        .font(.body)
                    Spacer()
                }
            }
            .padding(.horizontal, 30)
            
            Button {
                showingJoinSheet = true
            } label: {
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("招待コードで参加")
                        .fontWeight(.semibold)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(Color.green)
                .cornerRadius(12)
            }
            .padding(.horizontal, 30)
            .padding(.top, 20)
        }
    }
}

// MARK: - Send Invite Sheet

struct SendInviteSheet: View {
    @ObservedObject var familyService: FamilySharingService
    @Environment(\.dismiss) private var dismiss
    
    let onComplete: (Bool, String) -> Void
    
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
                Section("招待先Vault") {
                    Picker("Vault選択", selection: $selectedVaultId) {
                        ForEach(availableVaults, id: \.0) { vaultId, vaultName in
                            Text(vaultName).tag(vaultId)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                }
                
                Section("招待する人") {
                    TextField("メールアドレス", text: $inviteEmail)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                    
                    Picker("役割", selection: $selectedRole) {
                        ForEach(FamilyRole.allCases.filter { $0 != .owner }, id: \.self) { role in
                            Text(role.localizedName).tag(role)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                }
                
                Section("メッセージ（任意）") {
                    TextField("招待メッセージ", text: $inviteMessage, axis: .vertical)
                        .lineLimit(3...6)
                }
                
                if !familyService.errorMessage?.isEmpty ?? true {
                    Section {
                        Text(familyService.errorMessage ?? "")
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
                    .disabled(selectedVaultId.isEmpty || inviteEmail.isEmpty || isLoading)
                }
            }
        }
        .onAppear {
            if selectedVaultId.isEmpty && !availableVaults.isEmpty {
                selectedVaultId = availableVaults[0].0
            }
        }
    }
    
    private func sendInvitation() {
        isLoading = true
        
        Task {
            let success = await familyService.sendInvitation(
                familyVaultId: selectedVaultId,
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

// MARK: - Join Family Sheet

struct JoinFamilySheet: View {
    @ObservedObject var familyService: FamilySharingService
    @Environment(\.dismiss) private var dismiss
    
    let onComplete: (Bool, String) -> Void
    
    @State private var inviteCode = ""
    @State private var isLoading = false
    @State private var showingCamera = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 30) {
                // Header
                VStack(spacing: 12) {
                    Image(systemName: "qrcode.viewfinder")
                        .font(.system(size: 50))
                        .foregroundColor(.blue)
                    
                    Text("招待コードを入力")
                        .font(.title2)
                        .fontWeight(.semibold)
                    
                    Text("家族から受け取った招待コードを入力してください")
                        .font(.body)
                        .multilineTextAlignment(.center)
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal)
                
                // Input Section
                VStack(spacing: 16) {
                    TextField("招待コード", text: $inviteCode)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .font(.title3)
                        .textCase(.uppercase)
                        .autocapitalization(.allCharacters)
                        .disableAutocorrection(true)
                    
                    Button {
                        showingCamera = true
                    } label: {
                        HStack {
                            Image(systemName: "camera.fill")
                            Text("QRコードをスキャン")
                        }
                        .foregroundColor(.blue)
                    }
                    .disabled(isLoading)
                }
                .padding(.horizontal)
                
                // Error Message
                if let errorMessage = familyService.errorMessage, !errorMessage.isEmpty {
                    Text(errorMessage)
                        .foregroundColor(.red)
                        .font(.caption)
                        .padding(.horizontal)
                }
                
                Spacer()
                
                // Join Button
                Button {
                    joinFamily()
                } label: {
                    HStack {
                        if isLoading {
                            ProgressView()
                                .scaleEffect(0.8)
                                .tint(.white)
                        }
                        Text("ファミリーに参加")
                            .fontWeight(.semibold)
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .background(inviteCode.isEmpty || isLoading ? Color.gray : Color.blue)
                    .cornerRadius(12)
                }
                .disabled(inviteCode.isEmpty || isLoading)
                .padding(.horizontal)
                .padding(.bottom)
            }
            .navigationTitle("ファミリーに参加")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("キャンセル") {
                        dismiss()
                    }
                }
            }
        }
        .sheet(isPresented: $showingCamera) {
            QRCodeScannerView { scannedCode in
                inviteCode = scannedCode
                showingCamera = false
            }
        }
    }
    
    private func joinFamily() {
        isLoading = true
        
        Task {
            let success = await familyService.joinFamily(inviteCode: inviteCode)
            
            await MainActor.run {
                isLoading = false
                
                if success {
                    onComplete(true, "ファミリーに参加しました")
                    dismiss()
                }
            }
        }
    }
}

// MARK: - QR Code Scanner (Placeholder)

struct QRCodeScannerView: View {
    let onCodeScanned: (String) -> Void
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        VStack {
            Text("QRコードスキャナー")
                .font(.title2)
                .padding()
            
            // In a real implementation, this would use AVFoundation
            // for QR code scanning
            Rectangle()
                .fill(Color.gray.opacity(0.3))
                .frame(height: 300)
                .overlay(
                    Text("QRコードをここにかざしてください")
                        .foregroundColor(.secondary)
                )
                .padding()
            
            // Mock scan button for testing
            Button("テスト用コードを使用") {
                onCodeScanned("FAMILY_INVITE_ABC123")
            }
            .padding()
            
            Button("キャンセル") {
                dismiss()
            }
            .padding()
        }
    }
}

#Preview("Family Invitation") {
    FamilyInvitationView()
}

#Preview("Send Invite Sheet") {
    SendInviteSheet(
        familyService: FamilySharingService(
            apiClient: FamilySharingAPIClient(deviceManager: DeviceManager.shared)
        )
    ) { _, _ in }
}

#Preview("Join Family Sheet") {
    JoinFamilySheet(
        familyService: FamilySharingService(
            apiClient: FamilySharingAPIClient(deviceManager: DeviceManager.shared)
        )
    ) { _, _ in }
}