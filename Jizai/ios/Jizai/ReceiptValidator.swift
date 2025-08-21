import Foundation
import StoreKit

class ReceiptValidator: ObservableObject {
    static let shared = ReceiptValidator()
    
    private init() {}
    
    enum ValidationError: Error, LocalizedError {
        case noReceiptFound
        case receiptReadFailed
        case validationFailed
        case networkError
        
        var errorDescription: String? {
            switch self {
            case .noReceiptFound:
                return "レシートが見つかりません"
            case .receiptReadFailed:
                return "レシートの読み込みに失敗しました"
            case .validationFailed:
                return "レシートの検証に失敗しました"
            case .networkError:
                return "ネットワークエラーが発生しました"
            }
        }
    }
    
    // MARK: - Receipt Validation
    func validateReceipt() async throws -> Bool {
        // In StoreKit 2, receipt validation is handled automatically
        // by the Transaction verification system. This method serves as
        // an additional validation layer if needed.
        
        guard let receiptURL = Bundle.main.appStoreReceiptURL,
              FileManager.default.fileExists(atPath: receiptURL.path) else {
            throw ValidationError.noReceiptFound
        }
        
        do {
            let receiptData = try Data(contentsOf: receiptURL)
            
            // In production, you would send this to your server for validation
            // For now, we'll perform basic validation
            return try await validateReceiptData(receiptData)
            
        } catch {
            throw ValidationError.receiptReadFailed
        }
    }
    
    private func validateReceiptData(_ receiptData: Data) async throws -> Bool {
        // In a production app, you would:
        // 1. Send the receipt data to your server
        // 2. Your server validates with Apple's servers
        // 3. Return the validation result
        
        // For development/testing purposes, we'll assume validation succeeds
        // if the receipt data exists and is not empty
        return !receiptData.isEmpty
    }
    
    // MARK: - Transaction Verification Helper
    func verifyTransaction(_ transaction: Transaction) -> Bool {
        // StoreKit 2 provides built-in verification through VerificationResult
        // This method can be used for additional custom verification if needed
        
        // Basic checks
        guard !transaction.productID.isEmpty,
              transaction.purchaseDate <= Date(),
              transaction.originalPurchaseDate <= transaction.purchaseDate else {
            return false
        }
        
        // Additional validation logic can be added here
        return true
    }
    
    // MARK: - Refresh Receipt
    func refreshReceipt() async throws {
        // Request receipt refresh from App Store
        do {
            try await AppStore.sync()
        } catch {
            throw ValidationError.networkError
        }
    }
}