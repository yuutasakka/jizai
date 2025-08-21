import SwiftUI
import StoreKit

struct StoreKitPurchaseView: View {
    @StateObject private var storeManager = StoreManager.shared
    @ObservedObject var appState: AppState
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                headerSection
                
                if storeManager.isLoading {
                    loadingSection
                } else if storeManager.products.isEmpty {
                    emptyStateSection
                } else {
                    productsSection
                }
                
                restoreButton
                
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
            .alert("購入エラー", isPresented: .constant(storeManager.purchaseError != nil)) {
                Button("OK") {
                    storeManager.purchaseError = nil
                }
            } message: {
                if let error = storeManager.purchaseError {
                    Text(error)
                }
            }
        }
        .task {
            await storeManager.initialize()
        }
    }
    
    private var headerSection: some View {
        VStack(spacing: 12) {
            Image(systemName: "creditcard.fill")
                .font(.system(size: 40))
                .foregroundColor(.blue)
            
            Text("クレジットを購入")
                .font(.title2)
                .fontWeight(.bold)
            
            Text("画像編集に必要なクレジットを追加購入できます")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            if let balance = appState.creditBalance {
                Text("現在の残高: \(balance.credits) クレジット")
                    .font(.headline)
                    .foregroundColor(.blue)
                    .padding(.top, 8)
            }
        }
        .padding()
    }
    
    private var loadingSection: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.2)
            
            Text("商品を読み込み中...")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, minHeight: 200)
    }
    
    private var emptyStateSection: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 40))
                .foregroundColor(.orange)
            
            Text("商品が見つかりません")
                .font(.headline)
            
            Text("App Store接続を確認してください")
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Button("再読み込み") {
                Task {
                    await storeManager.initialize()
                }
            }
            .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity, minHeight: 200)
    }
    
    private var productsSection: some View {
        LazyVStack(spacing: 16) {
            ForEach(storeManager.products, id: \.id) { product in
                ProductCard(
                    product: product,
                    storeManager: storeManager,
                    appState: appState
                )
            }
        }
    }
    
    private var restoreButton: some View {
        Button("購入履歴を復元") {
            Task {
                await storeManager.restorePurchases()
                
                // Refresh balance after restore
                await appState.refreshBalance()
            }
        }
        .font(.subheadline)
        .foregroundColor(.blue)
    }
}

// MARK: - Product Card
struct ProductCard: View {
    let product: Product
    let storeManager: StoreManager
    let appState: AppState
    
    @State private var isPurchasing = false
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(product.displayName)
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    Text(product.description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                    
                    if let jizaiProduct = storeManager.getJizaiProduct(for: product) {
                        Text("\(jizaiProduct.credits)クレジット")
                            .font(.subheadline)
                            .foregroundColor(.blue)
                            .fontWeight(.medium)
                    }
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text(product.displayPrice)
                        .font(.title3)
                        .fontWeight(.bold)
                    
                    if let jizaiProduct = storeManager.getJizaiProduct(for: product),
                       jizaiProduct != .coins20 {
                        let savings = calculateSavings(for: jizaiProduct)
                        if savings > 0 {
                            Text("\(savings)%お得")
                                .font(.caption)
                                .foregroundColor(.green)
                                .fontWeight(.medium)
                        }
                    }
                }
            }
            
            Button(action: {
                Task {
                    await purchaseProduct()
                }
            }) {
                HStack {
                    if isPurchasing {
                        ProgressView()
                            .scaleEffect(0.8)
                            .tint(.white)
                    }
                    
                    Text(isPurchasing ? "購入中..." : "購入する")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 44)
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(8)
            }
            .disabled(isPurchasing || storeManager.isLoading)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
    
    private func purchaseProduct() async {
        isPurchasing = true
        
        do {
            let result = try await storeManager.purchase(product)
            
            switch result {
            case .success:
                // Refresh balance after successful purchase
                await appState.refreshBalance()
                
            case .cancelled:
                break // User cancelled, no action needed
                
            case .pending:
                // Transaction is pending, will be processed later
                break
            }
            
        } catch {
            print("❌ Purchase failed: \(error)")
        }
        
        isPurchasing = false
    }
    
    private func calculateSavings(for jizaiProduct: JizaiProduct) -> Int {
        let basePrice = 320.0 // Price for 20 credits
        let basePricePerCredit = basePrice / 20.0
        
        let currentPrice = Double(product.price)
        let currentCredits = Double(jizaiProduct.credits)
        let currentPricePerCredit = currentPrice / currentCredits
        
        let savings = (basePricePerCredit - currentPricePerCredit) / basePricePerCredit * 100
        return max(0, Int(savings.rounded()))
    }
}

#Preview {
    StoreKitPurchaseView(appState: AppState())
}