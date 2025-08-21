import Foundation
import StoreKit
import SwiftUI

@MainActor
class StoreManager: ObservableObject {
    static let shared = StoreManager()
    
    @Published var products: [Product] = []
    @Published var purchasedProductIDs: Set<String> = []
    @Published var isLoading = false
    @Published var purchaseError: String?
    
    private var transactionListener: Task<Void, Error>?
    private let apiClient = APIClient.shared
    private let deviceManager = DeviceManager.shared
    private let receiptValidator = ReceiptValidator.shared
    
    // Product IDs matching backend
    private let productIDs: Set<String> = [
        "com.example.jizai.coins20",
        "com.example.jizai.coins100", 
        "com.example.jizai.coins300"
    ]
    
    private init() {
        transactionListener = configureTransactionListener()
    }
    
    deinit {
        transactionListener?.cancel()
    }
    
    // MARK: - Initialization
    func initialize() async {
        await loadProducts()
        await updatePurchasedProducts()
    }
    
    // MARK: - Product Loading
    private func loadProducts() async {
        do {
            isLoading = true
            products = try await Product.products(for: productIDs)
            
            // Sort products by price
            products.sort { $0.price < $1.price }
            
            print("✅ Loaded \(products.count) products")
            for product in products {
                print("  - \(product.id): \(product.displayPrice)")
            }
        } catch {
            print("❌ Failed to load products: \(error)")
            purchaseError = "商品の読み込みに失敗しました: \(error.localizedDescription)"
        }
        isLoading = false
    }
    
    // MARK: - Purchase Flow
    func purchase(_ product: Product) async throws -> PurchaseResult {
        isLoading = true
        purchaseError = nil
        
        defer {
            isLoading = false
        }
        
        do {
            let result = try await product.purchase()
            
            switch result {
            case .success(let verification):
                let transaction = try checkVerified(verification)
                
                // Process the purchase with backend
                try await processPurchaseWithBackend(transaction: transaction, product: product)
                
                // Finish the transaction
                await transaction.finish()
                
                // Update purchased products
                await updatePurchasedProducts()
                
                return .success
                
            case .userCancelled:
                return .cancelled
                
            case .pending:
                return .pending
                
            @unknown default:
                throw StoreError.unknown
            }
            
        } catch {
            print("❌ Purchase failed: \(error)")
            purchaseError = "購入に失敗しました: \(error.localizedDescription)"
            throw error
        }
    }
    
    // MARK: - Backend Integration
    private func processPurchaseWithBackend(transaction: Transaction, product: Product) async throws {
        let purchaseRequest = PurchaseRequest(
            deviceId: deviceManager.deviceId,
            productId: product.id,
            transactionId: String(transaction.id)
        )
        
        do {
            let response = try await apiClient.processPurchase(request: purchaseRequest)
            
            if response.success {
                print("✅ Backend purchase processed: +\(response.added) credits")
            } else {
                throw StoreError.backendProcessingFailed
            }
            
        } catch APIClient.APIError.duplicateTransaction {
            // This is expected if we're restoring a purchase
            print("ℹ️ Duplicate transaction (already processed)")
        } catch {
            print("❌ Backend processing failed: \(error)")
            throw StoreError.backendProcessingFailed
        }
    }
    
    // MARK: - Transaction Verification
    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw StoreError.failedVerification
        case .verified(let safe):
            // Additional verification for transactions
            if let transaction = safe as? Transaction {
                guard receiptValidator.verifyTransaction(transaction) else {
                    throw StoreError.failedVerification
                }
            }
            return safe
        }
    }
    
    // MARK: - Transaction Listener
    private func configureTransactionListener() -> Task<Void, Error> {
        Task.detached { [weak self] in
            for await result in Transaction.updates {
                guard let self = self else { break }
                
                do {
                    let transaction = try self.checkVerified(result)
                    
                    await MainActor.run {
                        print("🔄 Transaction update: \(transaction.productID)")
                    }
                    
                    // Process any unfinished transactions
                    if let product = await self.product(for: transaction.productID) {
                        try await self.processPurchaseWithBackend(transaction: transaction, product: product)
                    }
                    
                    await transaction.finish()
                    await self.updatePurchasedProducts()
                    
                } catch {
                    await MainActor.run {
                        print("❌ Transaction update failed: \(error)")
                    }
                }
            }
        }
    }
    
    // MARK: - Restore Purchases
    func restorePurchases() async {
        isLoading = true
        
        do {
            try await AppStore.sync()
            await updatePurchasedProducts()
            
            // Process any unfinished transactions
            for await result in Transaction.currentEntitlements {
                let transaction = try checkVerified(result)
                
                if let product = await product(for: transaction.productID) {
                    try await processPurchaseWithBackend(transaction: transaction, product: product)
                }
            }
            
        } catch {
            print("❌ Restore purchases failed: \(error)")
            purchaseError = "購入履歴の復元に失敗しました: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    // MARK: - Helper Methods
    private func updatePurchasedProducts() async {
        var purchasedIDs: Set<String> = []
        
        for await result in Transaction.currentEntitlements {
            do {
                let transaction = try checkVerified(result)
                purchasedIDs.insert(transaction.productID)
            } catch {
                print("❌ Failed to verify transaction: \(error)")
            }
        }
        
        purchasedProductIDs = purchasedIDs
    }
    
    private func product(for productID: String) async -> Product? {
        return products.first { $0.id == productID }
    }
    
    // MARK: - Product Info
    func getJizaiProduct(for product: Product) -> JizaiProduct? {
        return JizaiProduct(rawValue: product.id)
    }
    
    func getCreditsCount(for product: Product) -> Int {
        return getJizaiProduct(for: product)?.credits ?? 0
    }
}

// MARK: - Purchase Result
enum PurchaseResult {
    case success
    case cancelled
    case pending
}

// MARK: - Store Errors
enum StoreError: Error, LocalizedError {
    case failedVerification
    case backendProcessingFailed
    case unknown
    
    var errorDescription: String? {
        switch self {
        case .failedVerification:
            return "購入の検証に失敗しました"
        case .backendProcessingFailed:
            return "サーバーでの処理に失敗しました"
        case .unknown:
            return "不明なエラーが発生しました"
        }
    }
}