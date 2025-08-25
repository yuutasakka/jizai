/**
 * Print Export View - iOS印刷出力機能
 * 
 * Features:
 * - 5つの印刷サイズ選択
 * - 2つのDPI設定（300、350DPI）
 * - サブスクリプション連携
 * - プレビュー表示
 * - ダウンロード・共有機能
 */

import SwiftUI
import UIKit

// 印刷サイズ定義
struct PrintSize: Identifiable, Hashable {
    let id = UUID()
    let key: String
    let name: String
    let nameEn: String
    let dimensions: CGSize  // mm
    let description: String
    let category: String
    let requiredTier: SubscriptionTier
    
    static let allSizes: [PrintSize] = [
        PrintSize(
            key: "l-size",
            name: "L判",
            nameEn: "L Size",
            dimensions: CGSize(width: 89, height: 127),
            description: "デジカメプリント標準サイズ",
            category: "popular",
            requiredTier: .free
        ),
        PrintSize(
            key: "2l",
            name: "2L",
            nameEn: "2L Size", 
            dimensions: CGSize(width: 127, height: 178),
            description: "L判の2倍サイズ",
            category: "large",
            requiredTier: .lite
        ),
        PrintSize(
            key: "a4",
            name: "A4",
            nameEn: "A4",
            dimensions: CGSize(width: 210, height: 297),
            description: "一般的な書類サイズ",
            category: "standard",
            requiredTier: .lite
        ),
        PrintSize(
            key: "small-cabinet",
            name: "小キャビネ",
            nameEn: "Small Cabinet",
            dimensions: CGSize(width: 102, height: 146),
            description: "コンパクトなプリントサイズ",
            category: "standard",
            requiredTier: .standard
        ),
        PrintSize(
            key: "yotsu-giri", 
            name: "四つ切り",
            nameEn: "Yotsugiri",
            dimensions: CGSize(width: 254, height: 305),
            description: "写真店で人気の標準サイズ",
            category: "popular",
            requiredTier: .standard
        )
    ]
}

// DPI設定
enum PrintDPI: Int, CaseIterable, Identifiable {
    case standard = 300
    case premium = 350
    
    var id: Int { rawValue }
    
    var name: String {
        switch self {
        case .standard: return "300 DPI"
        case .premium: return "350 DPI" 
        }
    }
    
    var description: String {
        switch self {
        case .standard: return "標準品質"
        case .premium: return "高品質"
        }
    }
    
    var requiredTier: SubscriptionTier {
        switch self {
        case .standard: return .free
        case .premium: return .standard
        }
    }
}

// 印刷出力フォーマット
enum PrintFormat: String, CaseIterable, Identifiable {
    case jpeg = "jpeg"
    case png = "png"
    
    var id: String { rawValue }
    
    var displayName: String {
        return rawValue.uppercased()
    }
    
    var description: String {
        switch self {
        case .jpeg: return "標準的な写真形式"
        case .png: return "高品質・透明対応"
        }
    }
    
    var requiredTier: SubscriptionTier {
        switch self {
        case .jpeg: return .free
        case .png: return .standard
        }
    }
}

// 印刷出力状態
enum PrintExportState {
    case idle
    case generating
    case completed(URL)
    case failed(String)
}

struct PrintExportView: View {
    let image: UIImage
    let imageName: String
    @Environment(\.dismiss) private var dismiss
    @StateObject private var subscriptionService = SubscriptionService.shared
    
    @State private var selectedSize = PrintSize.allSizes[0]
    @State private var selectedDPI = PrintDPI.standard
    @State private var selectedFormat = PrintFormat.jpeg
    @State private var exportState = PrintExportState.idle
    @State private var showingShareSheet = false
    @State private var exportedFileURL: URL?
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // プレビューセクション
                    previewSection
                    
                    // 設定セクション
                    settingsSection
                    
                    // 出力情報セクション
                    outputInfoSection
                    
                    // 制限情報
                    subscriptionLimitsSection
                    
                    // 出力ボタン
                    exportButtonSection
                }
                .padding()
            }
            .navigationTitle("印刷出力")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("閉じる") {
                        dismiss()
                    }
                }
            }
        }
        .sheet(isPresented: $showingShareSheet) {
            if let url = exportedFileURL {
                ShareSheet(items: [url])
            }
        }
        .onAppear {
            subscriptionService.loadSubscriptionStatus()
        }
    }
    
    // MARK: - プレビューセクション
    private var previewSection: some View {
        VStack(spacing: 16) {
            Text("プレビュー")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            // 画像プレビュー
            ZStack {
                Rectangle()
                    .fill(Color.gray.opacity(0.1))
                    .aspectRatio(
                        selectedSize.dimensions.width / selectedSize.dimensions.height,
                        contentMode: .fit
                    )
                    .cornerRadius(12)
                
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .cornerRadius(12)
            }
            .frame(maxHeight: 300)
            
            // サイズ情報
            VStack(spacing: 4) {
                Text(selectedSize.name)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Text("\(Int(selectedSize.dimensions.width)) × \(Int(selectedSize.dimensions.height))mm")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Text(selectedSize.description)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical)
    }
    
    // MARK: - 設定セクション
    private var settingsSection: some View {
        VStack(spacing: 20) {
            // サイズ選択
            VStack(alignment: .leading, spacing: 12) {
                Text("印刷サイズ")
                    .font(.headline)
                
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                    ForEach(PrintSize.allSizes) { size in
                        printSizeCard(size)
                    }
                }
            }
            
            Divider()
            
            // DPI選択
            VStack(alignment: .leading, spacing: 12) {
                Text("印刷品質 (DPI)")
                    .font(.headline)
                
                ForEach(PrintDPI.allCases) { dpi in
                    printDPIRow(dpi)
                }
            }
            
            Divider()
            
            // 形式選択
            VStack(alignment: .leading, spacing: 12) {
                Text("出力形式")
                    .font(.headline)
                
                ForEach(PrintFormat.allCases) { format in
                    printFormatRow(format)
                }
            }
        }
    }
    
    // 印刷サイズカード
    private func printSizeCard(_ size: PrintSize) -> some View {
        let isSelected = selectedSize.key == size.key
        let isAvailable = subscriptionService.currentTier.rawValue >= size.requiredTier.rawValue
        
        return Button(action: {
            if isAvailable {
                selectedSize = size
            }
        }) {
            VStack(spacing: 8) {
                // サイズアイコン（アスペクト比表現）
                Rectangle()
                    .fill(isSelected ? Color.blue.opacity(0.2) : Color.gray.opacity(0.1))
                    .aspectRatio(size.dimensions.width / size.dimensions.height, contentMode: .fit)
                    .frame(height: 40)
                    .cornerRadius(6)
                    .overlay(
                        Rectangle()
                            .stroke(
                                isSelected ? Color.blue : Color.clear,
                                lineWidth: 2
                            )
                            .cornerRadius(6)
                    )
                
                VStack(spacing: 2) {
                    HStack {
                        Text(size.name)
                            .font(.footnote)
                            .fontWeight(isSelected ? .semibold : .regular)
                        
                        if !isAvailable {
                            Image(systemName: "crown.fill")
                                .foregroundColor(.yellow)
                                .font(.caption2)
                        }
                    }
                    
                    Text("\(Int(size.dimensions.width))×\(Int(size.dimensions.height))")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? Color.blue.opacity(0.1) : Color.gray.opacity(0.05))
                    .stroke(
                        isSelected ? Color.blue : Color.gray.opacity(0.3),
                        lineWidth: 1
                    )
            )
            .opacity(isAvailable ? 1.0 : 0.6)
        }
        .disabled(!isAvailable)
    }
    
    // DPI選択行
    private func printDPIRow(_ dpi: PrintDPI) -> some View {
        let isSelected = selectedDPI == dpi
        let isAvailable = subscriptionService.currentTier.rawValue >= dpi.requiredTier.rawValue
        
        return Button(action: {
            if isAvailable {
                selectedDPI = dpi
            }
        }) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    HStack {
                        Text(dpi.name)
                            .font(.body)
                            .fontWeight(isSelected ? .semibold : .regular)
                        
                        if !isAvailable {
                            Image(systemName: "crown.fill")
                                .foregroundColor(.yellow)
                                .font(.caption)
                        }
                    }
                    
                    Text(dpi.description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.blue)
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? Color.blue.opacity(0.1) : Color.gray.opacity(0.05))
                    .stroke(
                        isSelected ? Color.blue : Color.gray.opacity(0.3),
                        lineWidth: 1
                    )
            )
            .opacity(isAvailable ? 1.0 : 0.6)
        }
        .disabled(!isAvailable)
    }
    
    // 形式選択行
    private func printFormatRow(_ format: PrintFormat) -> some View {
        let isSelected = selectedFormat == format
        let isAvailable = subscriptionService.currentTier.rawValue >= format.requiredTier.rawValue
        
        return Button(action: {
            if isAvailable {
                selectedFormat = format
            }
        }) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    HStack {
                        Text(format.displayName)
                            .font(.body)
                            .fontWeight(isSelected ? .semibold : .regular)
                        
                        if !isAvailable {
                            Image(systemName: "crown.fill")
                                .foregroundColor(.yellow)
                                .font(.caption)
                        }
                    }
                    
                    Text(format.description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.blue)
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? Color.blue.opacity(0.1) : Color.gray.opacity(0.05))
                    .stroke(
                        isSelected ? Color.blue : Color.gray.opacity(0.3),
                        lineWidth: 1
                    )
            )
            .opacity(isAvailable ? 1.0 : 0.6)
        }
        .disabled(!isAvailable)
    }
    
    // MARK: - 出力情報セクション
    private var outputInfoSection: some View {
        VStack(spacing: 16) {
            Text("出力情報")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            VStack(spacing: 12) {
                InfoRow(label: "解像度", value: selectedDPI.name)
                InfoRow(label: "形式", value: selectedFormat.displayName)
                InfoRow(label: "推定ファイルサイズ", value: estimatedFileSize)
            }
            .padding()
            .background(Color.gray.opacity(0.05))
            .cornerRadius(12)
        }
    }
    
    // MARK: - 制限情報セクション
    private var subscriptionLimitsSection: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: "info.circle.fill")
                    .foregroundColor(.blue)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(subscriptionLimitText)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    if subscriptionService.currentTier == .free {
                        Text("アップグレードでより多くのサイズと高品質出力が利用可能")
                            .font(.caption2)
                            .foregroundColor(.blue)
                    }
                }
                
                Spacer()
            }
            .padding()
            .background(Color.blue.opacity(0.05))
            .cornerRadius(12)
        }
    }
    
    // MARK: - 出力ボタンセクション
    private var exportButtonSection: some View {
        VStack(spacing: 16) {
            switch exportState {
            case .idle:
                Button(action: generatePrintExport) {
                    HStack {
                        Image(systemName: "printer.fill")
                        Text("印刷用に出力")
                    }
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .cornerRadius(12)
                }
                
            case .generating:
                VStack(spacing: 8) {
                    ProgressView()
                        .scaleEffect(1.2)
                    Text("出力中...")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding()
                
            case .completed(let url):
                VStack(spacing: 12) {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                        Text("出力完了")
                            .font(.headline)
                            .foregroundColor(.green)
                    }
                    
                    Button(action: {
                        exportedFileURL = url
                        showingShareSheet = true
                    }) {
                        HStack {
                            Image(systemName: "square.and.arrow.up")
                            Text("共有・保存")
                        }
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.green)
                        .cornerRadius(12)
                    }
                }
                
            case .failed(let error):
                VStack(spacing: 12) {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.red)
                        Text("出力失敗")
                            .font(.headline)
                            .foregroundColor(.red)
                    }
                    
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                    
                    Button(action: {
                        exportState = .idle
                    }) {
                        Text("再試行")
                            .font(.subheadline)
                            .foregroundColor(.blue)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(Color.blue.opacity(0.1))
                            .cornerRadius(8)
                    }
                }
            }
        }
    }
    
    // MARK: - 計算プロパティ
    private var estimatedFileSize: String {
        let width = selectedSize.dimensions.width * CGFloat(selectedDPI.rawValue) / 25.4
        let height = selectedSize.dimensions.height * CGFloat(selectedDPI.rawValue) / 25.4
        let pixels = Int(width * height)
        let bytesPerPixel = selectedFormat == .jpeg ? 3 : 4
        let estimatedBytes = pixels * bytesPerPixel
        return ByteCountFormatter.string(fromByteCount: Int64(estimatedBytes), countStyle: .file)
    }
    
    private var subscriptionLimitText: String {
        switch subscriptionService.currentTier {
        case .free:
            return "無料版: 月2回まで出力可能"
        case .lite:
            return "Lite版: 月5回まで出力可能"
        case .standard:
            return "Standard版: 月20回まで出力可能"
        case .pro:
            return "Pro版: 月100回まで出力可能"
        }
    }
    
    // MARK: - メソッド
    private func generatePrintExport() {
        exportState = .generating
        
        // 実際の実装では、バックエンドAPIを呼び出し
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            // シミュレーション: 成功ケース
            if let imageData = image.jpegData(compressionQuality: 0.95) {
                let tempURL = FileManager.default.temporaryDirectory
                    .appendingPathComponent("print_export_\(Date().timeIntervalSince1970)")
                    .appendingPathExtension(selectedFormat.rawValue)
                
                do {
                    try imageData.write(to: tempURL)
                    exportState = .completed(tempURL)
                } catch {
                    exportState = .failed(error.localizedDescription)
                }
            } else {
                exportState = .failed("画像の処理に失敗しました")
            }
        }
    }
}

// MARK: - サポートビュー
struct InfoRow: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.medium)
        }
        .font(.subheadline)
    }
}

// 共有シート
struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

// MARK: - プレビュー
struct PrintExportView_Previews: PreviewProvider {
    static var previews: some View {
        PrintExportView(
            image: UIImage(systemName: "photo.fill") ?? UIImage(),
            imageName: "Sample Photo"
        )
    }
}