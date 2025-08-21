import SwiftUI

struct ContentView: View {
    @StateObject private var appState = AppState()
    @StateObject private var imageEditService = ImageEditService.shared
    
    @State private var showActionSheet = false
    @State private var showPurchaseSheet = false
    @State private var showReportSheet = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Header with credits
                headerView
                
                // Main content
                ScrollView {
                    VStack(spacing: 24) {
                        // Image selection and display
                        imageSection
                        
                        // Prompt input
                        promptSection
                        
                        // Edit button
                        editButton
                        
                        // Result section
                        if case .completed(let editedImage, _) = appState.editState {
                            resultSection(editedImage)
                        }
                    }
                    .padding(.horizontal)
                }
                
                Spacer()
            }
            .navigationTitle("Jizai")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("購入") {
                        showPurchaseSheet = true
                    }
                }
            }
        }
        .alert("エラー", isPresented: $appState.showError) {
            Button("OK") {}
        } message: {
            Text(appState.errorMessage)
        }
        .sheet(isPresented: $showPurchaseSheet) {
            PurchaseView(appState: appState)
        }
        .sheet(isPresented: $showReportSheet) {
            ReportView(appState: appState)
        }
        .sheet(isPresented: $imageEditService.showImagePicker) {
            ImagePickerCoordinator(
                selectedImage: $appState.selectedImage,
                isPresented: $imageEditService.showImagePicker,
                sourceType: imageEditService.sourceType
            )
        }
        .actionSheet(isPresented: $showActionSheet) {
            ActionSheet(
                title: Text("画像を選択"),
                buttons: [
                    .default(Text("カメラ")) {
                        imageEditService.selectImageSource(.camera)
                    },
                    .default(Text("フォトライブラリ")) {
                        imageEditService.selectImageSource(.photoLibrary)
                    },
                    .cancel()
                ]
            )
        }
        .onAppear {
            Task {
                await appState.refreshBalance()
            }
        }
    }
    
    private var headerView: some View {
        HStack {
            VStack(alignment: .leading) {
                Text("残高")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                if let balance = appState.creditBalance {
                    Text("\(balance.credits) クレジット")
                        .font(.title2)
                        .fontWeight(.bold)
                } else {
                    Text("読み込み中...")
                        .font(.title2)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            Button(action: {
                Task {
                    await appState.refreshBalance()
                }
            }) {
                Image(systemName: "arrow.clockwise")
                    .font(.title2)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
        .padding(.horizontal)
    }
    
    private var imageSection: some View {
        VStack(spacing: 16) {
            Text("画像を選択")
                .font(.headline)
            
            if let selectedImage = appState.selectedImage {
                Image(uiImage: selectedImage)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(maxHeight: 300)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.blue, lineWidth: 2)
                    )
            } else {
                Button(action: {
                    showActionSheet = true
                }) {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color(.systemGray5))
                        .frame(height: 200)
                        .overlay(
                            VStack {
                                Image(systemName: "plus.circle.fill")
                                    .font(.system(size: 40))
                                    .foregroundColor(.blue)
                                Text("画像を選択")
                                    .font(.headline)
                                    .foregroundColor(.blue)
                            }
                        )
                }
            }
            
            if appState.selectedImage != nil {
                Button("別の画像を選択") {
                    showActionSheet = true
                }
                .font(.caption)
                .foregroundColor(.blue)
            }
        }
    }
    
    private var promptSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("編集指示")
                .font(.headline)
            
            TextField("例: Change 'OPEN' to 'CLOSED'", text: $appState.prompt, axis: .vertical)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .lineLimit(3...6)
            
            Text("英語で具体的な編集指示を入力してください")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
    
    private var editButton: some View {
        Button(action: {
            Task {
                await appState.editImage()
            }
        }) {
            HStack {
                if case .loading = appState.editState {
                    ProgressView()
                        .scaleEffect(0.8)
                }
                
                Text(buttonText)
                    .fontWeight(.semibold)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(buttonBackgroundColor)
            .foregroundColor(.white)
            .cornerRadius(12)
        }
        .disabled(!canEdit)
    }
    
    private var buttonText: String {
        switch appState.editState {
        case .loading:
            return "編集中..."
        case .completed:
            return "再編集 (1クレジット)"
        default:
            return "編集開始 (1クレジット)"
        }
    }
    
    private var buttonBackgroundColor: Color {
        canEdit ? .blue : .gray
    }
    
    private var canEdit: Bool {
        appState.selectedImage != nil &&
        !appState.prompt.isEmpty &&
        appState.editState != .loading &&
        (appState.creditBalance?.credits ?? 0) > 0
    }
    
    private func resultSection(_ editedImage: UIImage) -> some View {
        VStack(spacing: 16) {
            Text("編集結果")
                .font(.headline)
            
            Image(uiImage: editedImage)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(maxHeight: 300)
                .cornerRadius(12)
            
            HStack(spacing: 16) {
                Button("保存") {
                    UIImageWriteToSavedPhotosAlbum(editedImage, nil, nil, nil)
                }
                .buttonStyle(.borderedProminent)
                
                Button("共有") {
                    shareImage(editedImage)
                }
                .buttonStyle(.bordered)
                
                Button("通報") {
                    showReportSheet = true
                }
                .buttonStyle(.bordered)
                .foregroundColor(.red)
            }
        }
    }
    
    private func shareImage(_ image: UIImage) {
        let activityVC = UIActivityViewController(activityItems: [image], applicationActivities: nil)
        
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first {
            window.rootViewController?.present(activityVC, animated: true)
        }
    }
}

// MARK: - Purchase View
struct PurchaseView: View {
    @ObservedObject var appState: AppState
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("クレジットを購入")
                    .font(.title2)
                    .fontWeight(.bold)
                    .padding()
                
                ForEach(JizaiProduct.allCases, id: \.rawValue) { product in
                    Button(action: {
                        Task {
                            // In a real app, this would integrate with StoreKit
                            let transactionId = "demo_\(UUID().uuidString)"
                            await appState.processPurchase(product: product, transactionId: transactionId)
                            dismiss()
                        }
                    }) {
                        HStack {
                            VStack(alignment: .leading) {
                                Text(product.displayName)
                                    .font(.headline)
                                Text("1クレジット = 1回の編集")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            
                            Spacer()
                            
                            Text(product.price)
                                .font(.title3)
                                .fontWeight(.bold)
                        }
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                
                Spacer()
            }
            .padding()
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("閉じる") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Report View
struct ReportView: View {
    @ObservedObject var appState: AppState
    @Environment(\.dismiss) private var dismiss
    
    @State private var selectedReason: ReportReason = .other
    @State private var note: String = ""
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("不適切なコンテンツを通報")
                    .font(.title2)
                    .fontWeight(.bold)
                    .padding()
                
                VStack(alignment: .leading, spacing: 16) {
                    Text("通報理由")
                        .font(.headline)
                    
                    ForEach(ReportReason.allCases, id: \.rawValue) { reason in
                        Button(action: {
                            selectedReason = reason
                        }) {
                            HStack {
                                Image(systemName: selectedReason == reason ? "checkmark.circle.fill" : "circle")
                                    .foregroundColor(selectedReason == reason ? .blue : .gray)
                                
                                VStack(alignment: .leading) {
                                    Text(reason.displayName)
                                        .font(.headline)
                                    Text(reason.description)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                
                                Spacer()
                            }
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                .padding()
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("詳細説明（任意）")
                        .font(.headline)
                    
                    TextField("詳細を入力してください", text: $note, axis: .vertical)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .lineLimit(3...6)
                }
                .padding()
                
                Button("通報する") {
                    Task {
                        await appState.submitReport(reason: selectedReason, note: note.isEmpty ? nil : note)
                        dismiss()
                    }
                }
                .buttonStyle(.borderedProminent)
                .frame(maxWidth: .infinity)
                .padding()
                
                Spacer()
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("キャンセル") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    ContentView()
}