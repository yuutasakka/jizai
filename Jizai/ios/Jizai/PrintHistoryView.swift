/**
 * Print History View - iOS印刷履歴表示
 * 
 * Features:
 * - 印刷出力履歴一覧
 * - ファイル共有・保存
 * - 期限管理
 * - サイズ・DPI・形式表示
 */

import SwiftUI
import UIKit

// 印刷履歴アイテム
struct PrintHistoryItem: Identifiable, Codable {
    let id: String
    let memoryTitle: String
    let printSize: String
    let dpi: Int
    let format: String
    let fileSize: Int
    let status: String
    let createdAt: Date
    let expiresAt: Date
    let downloadURL: String?
    
    var isExpired: Bool {
        Date() > expiresAt
    }
    
    var printSizeName: String {
        let sizeNames: [String: String] = [
            "yotsu-giri": "四つ切り",
            "a4": "A4",
            "l-size": "L判",
            "small-cabinet": "小キャビネ",
            "2l": "2L"
        ]
        return sizeNames[printSize] ?? printSize
    }
    
    var statusName: String {
        switch status {
        case "completed": return "完了"
        case "processing": return "処理中"
        case "failed": return "失敗"
        default: return status
        }
    }
    
    var formattedFileSize: String {
        return ByteCountFormatter.string(fromByteCount: Int64(fileSize), countStyle: .file)
    }
}

// 印刷履歴サービス
class PrintHistoryService: ObservableObject {
    @Published var historyItems: [PrintHistoryItem] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    static let shared = PrintHistoryService()
    
    private let apiClient: APIClient
    
    init(apiClient: APIClient = .shared) {
        self.apiClient = apiClient
    }
    
    @MainActor
    func loadPrintHistory() async {
        isLoading = true
        errorMessage = nil
        
        do {
            // 実際の実装では、APIClient経由でバックエンドから取得
            let response = try await apiClient.getPrintExportHistory()
            historyItems = response.map { item in
                PrintHistoryItem(
                    id: item.id,
                    memoryTitle: item.memory.title,
                    printSize: item.print_size,
                    dpi: item.dpi,
                    format: item.format,
                    fileSize: item.file_size,
                    status: item.status,
                    createdAt: ISO8601DateFormatter().date(from: item.created_at) ?? Date(),
                    expiresAt: ISO8601DateFormatter().date(from: item.expires_at) ?? Date(),
                    downloadURL: item.export_path
                )
            }
        } catch {
            errorMessage = error.localizedDescription
            // デモ用のサンプルデータ
            loadSampleData()
        }
        
        isLoading = false
    }
    
    private func loadSampleData() {
        historyItems = [
            PrintHistoryItem(
                id: "1",
                memoryTitle: "家族旅行の思い出",
                printSize: "l-size",
                dpi: 300,
                format: "jpeg",
                fileSize: 5_242_880,
                status: "completed",
                createdAt: Date().addingTimeInterval(-3600),
                expiresAt: Date().addingTimeInterval(6 * 24 * 3600),
                downloadURL: "sample_url_1"
            ),
            PrintHistoryItem(
                id: "2",
                memoryTitle: "桜の写真",
                printSize: "a4",
                dpi: 350,
                format: "png",
                fileSize: 12_582_912,
                status: "completed",
                createdAt: Date().addingTimeInterval(-7200),
                expiresAt: Date().addingTimeInterval(-3600), // 期限切れ
                downloadURL: "sample_url_2"
            ),
            PrintHistoryItem(
                id: "3",
                memoryTitle: "ペットの写真",
                printSize: "2l",
                dpi: 300,
                format: "jpeg",
                fileSize: 8_388_608,
                status: "processing",
                createdAt: Date().addingTimeInterval(-1800),
                expiresAt: Date().addingTimeInterval(6 * 24 * 3600 + 1800),
                downloadURL: nil
            )
        ]
    }
    
    func refreshHistory() {
        Task {
            await loadPrintHistory()
        }
    }
}

struct PrintHistoryView: View {
    @StateObject private var historyService = PrintHistoryService.shared
    @State private var showingShareSheet = false
    @State private var selectedFileURL: URL?
    
    var body: some View {
        NavigationView {
            Group {
                if historyService.isLoading {
                    loadingView
                } else if let errorMessage = historyService.errorMessage {
                    errorView(errorMessage)
                } else if historyService.historyItems.isEmpty {
                    emptyView
                } else {
                    historyListView
                }
            }
            .navigationTitle("印刷履歴")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: historyService.refreshHistory) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
            .onAppear {
                if historyService.historyItems.isEmpty {
                    historyService.refreshHistory()
                }
            }
        }
        .sheet(isPresented: $showingShareSheet) {
            if let url = selectedFileURL {
                ShareSheet(items: [url])
            }
        }
    }
    
    // MARK: - ローディング表示
    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.2)
            Text("読み込み中...")
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    // MARK: - エラー表示
    private func errorView(_ message: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.largeTitle)
                .foregroundColor(.red)
            
            Text("エラーが発生しました")
                .font(.headline)
            
            Text(message)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            Button("再試行") {
                historyService.refreshHistory()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    // MARK: - 空状態表示
    private var emptyView: some View {
        VStack(spacing: 16) {
            Image(systemName: "printer")
                .font(.system(size: 60))
                .foregroundColor(.secondary)
            
            Text("印刷履歴がありません")
                .font(.headline)
            
            Text("画像を印刷出力すると、ここに履歴が表示されます")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    // MARK: - 履歴リスト表示
    private var historyListView: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                // 統計情報カード
                statisticsCard
                
                // 履歴アイテム一覧
                ForEach(historyService.historyItems) { item in
                    PrintHistoryCard(
                        item: item,
                        onDownload: { downloadItem in
                            handleDownload(downloadItem)
                        }
                    )
                }
            }
            .padding()
        }
    }
    
    // MARK: - 統計情報カード
    private var statisticsCard: some View {
        let completedItems = historyService.historyItems.filter { $0.status == "completed" }
        let totalFileSize = completedItems.reduce(0) { $0 + $1.fileSize }
        
        return VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("今月の印刷出力")
                        .font(.headline)
                        .foregroundColor(.primary)
                    Text("\(completedItems.count)回")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("総ファイルサイズ")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(ByteCountFormatter.string(fromByteCount: Int64(totalFileSize), countStyle: .file))
                        .font(.subheadline)
                        .fontWeight(.medium)
                }
                
                Image(systemName: "printer.fill")
                    .font(.largeTitle)
                    .foregroundColor(.blue)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.blue.opacity(0.1))
        )
    }
    
    // MARK: - ダウンロード処理
    private func handleDownload(_ item: PrintHistoryItem) {
        guard let downloadURL = item.downloadURL else { return }
        
        // 実際の実装では、署名付きURLから実際のファイルをダウンロード
        // ここではサンプル画像を使用
        if let sampleImage = UIImage(systemName: "photo.fill"),
           let imageData = sampleImage.jpegData(compressionQuality: 0.9) {
            
            let tempURL = FileManager.default.temporaryDirectory
                .appendingPathComponent("\(item.memoryTitle)_\(item.printSizeName)")
                .appendingPathExtension(item.format)
            
            do {
                try imageData.write(to: tempURL)
                selectedFileURL = tempURL
                showingShareSheet = true
            } catch {
                print("Failed to save file: \(error)")
            }
        }
    }
}

// MARK: - 印刷履歴カード
struct PrintHistoryCard: View {
    let item: PrintHistoryItem
    let onDownload: (PrintHistoryItem) -> Void
    
    var body: some View {
        VStack(spacing: 12) {
            // ヘッダー行
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.memoryTitle)
                        .font(.headline)
                        .lineLimit(1)
                    
                    Text(item.createdAt.formatted(date: .abbreviated, time: .shortened))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                HStack(spacing: 8) {
                    StatusBadge(status: item.status)
                    
                    if item.isExpired {
                        ExpiredBadge()
                    }
                }
            }
            
            // 印刷設定情報
            VStack(spacing: 8) {
                HStack {
                    InfoItem(label: "サイズ", value: item.printSizeName, icon: "rectangle")
                    Spacer()
                    InfoItem(label: "解像度", value: "\(item.dpi) DPI", icon: "viewfinder")
                }
                
                HStack {
                    InfoItem(label: "形式", value: item.format.uppercased(), icon: "doc")
                    Spacer()
                    InfoItem(label: "サイズ", value: item.formattedFileSize, icon: "externaldrive")
                }
            }
            
            // 期限情報
            HStack {
                Image(systemName: "clock")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Text("ダウンロード期限: \(item.expiresAt.formatted(date: .abbreviated, time: .omitted))")
                    .font(.caption)
                    .foregroundColor(item.isExpired ? .red : .secondary)
                
                Spacer()
            }
            
            // アクションボタン
            HStack {
                Spacer()
                
                Button(action: {
                    onDownload(item)
                }) {
                    HStack(spacing: 6) {
                        Image(systemName: item.isExpired ? "clock.badge.xmark" : "square.and.arrow.down")
                            .font(.caption)
                        
                        Text(item.isExpired ? "期限切れ" : "保存・共有")
                            .font(.caption)
                            .fontWeight(.medium)
                    }
                    .foregroundColor(item.isExpired ? .secondary : .white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(
                        RoundedRectangle(cornerRadius: 6)
                            .fill(item.isExpired ? Color.gray.opacity(0.2) : Color.blue)
                    )
                }
                .disabled(item.isExpired || item.status != "completed")
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.1), radius: 2, x: 0, y: 1)
        )
    }
}

// MARK: - サポートビュー
struct StatusBadge: View {
    let status: String
    
    var body: some View {
        let (text, color) = statusInfo
        
        Text(text)
            .font(.caption2)
            .fontWeight(.medium)
            .foregroundColor(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(
                RoundedRectangle(cornerRadius: 4)
                    .fill(color)
            )
    }
    
    private var statusInfo: (String, Color) {
        switch status {
        case "completed": return ("完了", .green)
        case "processing": return ("処理中", .orange)
        case "failed": return ("失敗", .red)
        default: return (status, .gray)
        }
    }
}

struct ExpiredBadge: View {
    var body: some View {
        HStack(spacing: 2) {
            Image(systemName: "clock.badge.xmark")
                .font(.caption2)
            Text("期限切れ")
                .font(.caption2)
                .fontWeight(.medium)
        }
        .foregroundColor(.white)
        .padding(.horizontal, 6)
        .padding(.vertical, 4)
        .background(
            RoundedRectangle(cornerRadius: 4)
                .fill(Color.red)
        )
    }
}

struct InfoItem: View {
    let label: String
    let value: String
    let icon: String
    
    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(width: 12)
            
            VStack(alignment: .leading, spacing: 1) {
                Text(label)
                    .font(.caption2)
                    .foregroundColor(.secondary)
                
                Text(value)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
            }
        }
    }
}

// MARK: - プレビュー
struct PrintHistoryView_Previews: PreviewProvider {
    static var previews: some View {
        PrintHistoryView()
    }
}