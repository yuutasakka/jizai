import Foundation
import SwiftUI

// MARK: - Credit Management Models
struct CreditBalance: Codable {
    let credits: Int
    let deviceId: String
    let lastAccessAt: String
    
    var lastAccessDate: Date? {
        let formatter = ISO8601DateFormatter()
        return formatter.date(from: lastAccessAt)
    }
}

// MARK: - Purchase Models
struct PurchaseRequest: Codable {
    let deviceId: String
    let productId: String
    let transactionId: String
}

struct PurchaseResponse: Codable {
    let success: Bool
    let credits: Int
    let added: Int
    let deviceId: String
    let productId: String
    let transactionId: String
}

// MARK: - Report Models
struct ReportRequest: Codable {
    let deviceId: String
    let jobId: String?
    let reasonId: String
    let note: String?
}

struct ReportResponse: Codable {
    let success: Bool
    let reportId: String
    let message: String
}

// MARK: - Product Definitions
enum JizaiProduct: String, CaseIterable {
    case coins2   = "com.jizai.coins2"
    case coins10  = "com.jizai.coins10"
    case coins20  = "com.jizai.coins20"
    case coins50  = "com.jizai.coins50"
    case coins100 = "com.jizai.coins100"
    case staffService = "com.jizai.staff.service"
    
    var credits: Int {
        switch self {
        case .coins2: return 2
        case .coins10: return 10
        case .coins20: return 20
        case .coins50: return 50
        case .coins100: return 100
        case .staffService: return 0
        }
    }

    var displayName: String {
        switch self {
        case .staffService:
            return "スタッフにおまかせ（1件）"
        default:
            return "\(credits)クレジット"
        }
    }
}

// MARK: - Report Reasons
enum ReportReason: String, CaseIterable {
    case copyright = "copyright"
    case privacy = "privacy"
    case sexual = "sexual"
    case violence = "violence"
    case other = "other"
    
    var displayName: String {
        switch self {
        case .copyright:
            return "著作権侵害"
        case .privacy:
            return "プライバシー侵害"
        case .sexual:
            return "性的コンテンツ"
        case .violence:
            return "暴力的コンテンツ"
        case .other:
            return "その他"
        }
    }
    
    var description: String {
        switch self {
        case .copyright:
            return "著作権者の許可なく使用されています"
        case .privacy:
            return "個人のプライバシーを侵害しています"
        case .sexual:
            return "不適切な性的コンテンツが含まれています"
        case .violence:
            return "暴力的な内容が含まれています"
        case .other:
            return "その他の不適切なコンテンツです"
        }
    }
}

// MARK: - Image Edit State
enum ImageEditState {
    case idle
    case loading
    case completed(UIImage, Int) // (edited image, remaining credits)
    case error(String)
}

// MARK: - App State Models
class AppState: ObservableObject {
    @Published var creditBalance: CreditBalance?
    @Published var isLoading = false
    @Published var selectedImage: UIImage?
    @Published var editedImage: UIImage?
    @Published var prompt: String = ""
    @Published var editState: ImageEditState = .idle
    @Published var showError = false
    @Published var errorMessage = ""
    
    private let apiClient = APIClient.shared
    private let deviceManager = DeviceManager.shared
    
    init() {
        Task {
            await refreshBalance()
            await StoreManager.shared.initialize()
        }
    }
    
    @MainActor
    func refreshBalance() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let balance = try await apiClient.getBalance(deviceId: deviceManager.deviceId)
            creditBalance = balance
        } catch {
            showError(message: error.localizedDescription)
        }
    }
    
    @MainActor
    func editImage() async {
        guard let image = selectedImage, !prompt.isEmpty else {
            showError(message: "画像とプロンプトを入力してください")
            return
        }
        
        editState = .loading
        
        do {
            let (editedImg, remainingCredits) = try await apiClient.editImage(
                image: image,
                prompt: prompt,
                deviceId: deviceManager.deviceId
            )
            
            editedImage = editedImg
            editState = .completed(editedImg, remainingCredits)
            
            // Update credit balance
            if var currentBalance = creditBalance {
                currentBalance = CreditBalance(
                    credits: remainingCredits,
                    deviceId: currentBalance.deviceId,
                    lastAccessAt: currentBalance.lastAccessAt
                )
                creditBalance = currentBalance
            }
            
        } catch {
            editState = .error(error.localizedDescription)
            showError(message: error.localizedDescription)
        }
    }
    
    // Purchase handling is now managed by StoreManager
    
    @MainActor
    func submitReport(reason: ReportReason, note: String? = nil, jobId: String? = nil) async {
        isLoading = true
        defer { isLoading = false }
        
        let request = ReportRequest(
            deviceId: deviceManager.deviceId,
            jobId: jobId,
            reasonId: reason.rawValue,
            note: note
        )
        
        do {
            let response = try await apiClient.submitReport(request: request)
            if response.success {
                // Show success message
                showError(message: "通報を受け付けました")
            }
        } catch {
            showError(message: error.localizedDescription)
        }
    }
    
    private func showError(message: String) {
        errorMessage = message
        showError = true
    }
    
    func resetEditState() {
        editState = .idle
        selectedImage = nil
        editedImage = nil
        prompt = ""
    }
}
