import Foundation
import UIKit

class APIClient: ObservableObject {
    static let shared = APIClient()
    
    private let baseURL: String
    private let session = URLSession.shared
    
    private init() {
        // 環境に応じたベースURL設定
        #if DEBUG
        // デバッグ時: 設定済みのAPIベースURLまたはlocalhost
        if let configuredURL = Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String, !configuredURL.isEmpty {
            self.baseURL = configuredURL
        } else {
            self.baseURL = "http://localhost:3000"
        }
        #else
        // 本番時: 必須のAPIベースURL
        self.baseURL = Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String ?? "https://api.jizai.app"
        #endif
        
        print("🌐 APIClient initialized with baseURL: \(baseURL)")
    }
    
    // MARK: - Configuration
    var currentBaseURL: String {
        return baseURL
    }
    
    enum APIError: Error, LocalizedError {
        case invalidURL
        case noData
        case decodingError
        case networkError(String)
        case serverError(String)
        case insufficientCredits(Int)
        case duplicateTransaction
        case safetyBlocked
        case apiUnavailable
        case rateLimitExceeded
        case imageTooLarge
        case invalidImageFormat
        
        var errorDescription: String? {
            switch self {
            case .invalidURL:
                return "無効なURLです"
            case .noData:
                return "データが見つかりません"
            case .decodingError:
                return "データの解析に失敗しました"
            case .networkError(let message):
                return "ネットワークエラー: \(message)"
            case .serverError(let message):
                return "サーバーエラー: \(message)"
            case .insufficientCredits(let credits):
                return "クレジットが不足しています (現在: \(credits)クレジット)"
            case .duplicateTransaction:
                return "重複したトランザクションです"
            case .safetyBlocked:
                return "不適切なコンテンツが含まれています"
            case .apiUnavailable:
                return "APIサービスが一時的に利用できません"
            case .rateLimitExceeded:
                return "アクセス制限に達しました。しばらく待ってから再試行してください"
            case .imageTooLarge:
                return "画像サイズが大きすぎます（最大10MB）"
            case .invalidImageFormat:
                return "サポートされていない画像形式です"
            }
        }
    }
    
    // MARK: - Health Check
    func healthCheck() async throws -> Bool {
        guard let url = URL(string: "\(baseURL)/v1/health") else {
            throw APIError.invalidURL
        }
        
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.networkError("Invalid response")
        }
        
        if httpResponse.statusCode == 200 {
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let ok = json["ok"] as? Bool {
                return ok
            }
        }
        
        throw APIError.serverError("Health check failed")
    }
    
    // MARK: - Balance Management
    func getBalance(deviceId: String) async throws -> CreditBalance {
        guard let url = URL(string: "\(baseURL)/v1/balance?deviceId=\(deviceId)") else {
            throw APIError.invalidURL
        }
        
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.networkError("Invalid response")
        }
        
        if httpResponse.statusCode == 200 {
            do {
                let balance = try JSONDecoder().decode(CreditBalance.self, from: data)
                return balance
            } catch {
                throw APIError.decodingError
            }
        } else {
            try handleErrorResponse(data: data, statusCode: httpResponse.statusCode)
            throw APIError.serverError("Unknown error")
        }
    }
    
    // MARK: - Purchase Management
    func processPurchase(request: PurchaseRequest) async throws -> PurchaseResponse {
        guard let url = URL(string: "\(baseURL)/v1/purchase") else {
            throw APIError.invalidURL
        }
        
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            urlRequest.httpBody = try JSONEncoder().encode(request)
        } catch {
            throw APIError.decodingError
        }
        
        let (data, response) = try await session.data(for: urlRequest)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.networkError("Invalid response")
        }
        
        if httpResponse.statusCode == 200 {
            do {
                let purchaseResponse = try JSONDecoder().decode(PurchaseResponse.self, from: data)
                return purchaseResponse
            } catch {
                throw APIError.decodingError
            }
        } else {
            try handleErrorResponse(data: data, statusCode: httpResponse.statusCode)
            throw APIError.serverError("Unknown error")
        }
    }
    
    // MARK: - Image Editing
    func editImage(image: UIImage, prompt: String, deviceId: String) async throws -> (UIImage, Int) {
        guard let url = URL(string: "\(baseURL)/v1/edit") else {
            throw APIError.invalidURL
        }
        
        guard let imageData = image.jpegData(compressionQuality: 0.8) else {
            throw APIError.networkError("Failed to process image")
        }
        
        let boundary = UUID().uuidString
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.setValue(deviceId, forHTTPHeaderField: "x-device-id")
        
        // Create multipart form data
        var body = Data()
        
        // Add image
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"image\"; filename=\"image.jpg\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(imageData)
        body.append("\r\n".data(using: .utf8)!)
        
        // Add prompt
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"prompt\"\r\n\r\n".data(using: .utf8)!)
        body.append(prompt.data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)
        
        // Close boundary
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        
        request.httpBody = body
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.networkError("Invalid response")
        }
        
        if httpResponse.statusCode == 200 {
            guard let editedImage = UIImage(data: data) else {
                throw APIError.decodingError
            }
            
            // Extract remaining credits from header
            let remainingCredits = httpResponse.value(forHTTPHeaderField: "X-Credits-Remaining")
                .flatMap { Int($0) } ?? 0
            
            return (editedImage, remainingCredits)
        } else {
            try handleErrorResponse(data: data, statusCode: httpResponse.statusCode)
            throw APIError.serverError("Unknown error")
        }
    }
    
    // MARK: - Report Management
    func submitReport(request: ReportRequest) async throws -> ReportResponse {
        guard let url = URL(string: "\(baseURL)/v1/report") else {
            throw APIError.invalidURL
        }
        
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            urlRequest.httpBody = try JSONEncoder().encode(request)
        } catch {
            throw APIError.decodingError
        }
        
        let (data, response) = try await session.data(for: urlRequest)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.networkError("Invalid response")
        }
        
        if httpResponse.statusCode == 200 {
            do {
                let reportResponse = try JSONDecoder().decode(ReportResponse.self, from: data)
                return reportResponse
            } catch {
                throw APIError.decodingError
            }
        } else {
            try handleErrorResponse(data: data, statusCode: httpResponse.statusCode)
            throw APIError.serverError("Unknown error")
        }
    }
    
    // MARK: - Error Handling
    private func handleErrorResponse(data: Data, statusCode: Int) throws {
        guard let errorResponse = try? JSONDecoder().decode(ErrorResponse.self, from: data) else {
            throw APIError.serverError("HTTP \(statusCode)")
        }
        
        switch statusCode {
        case 400:
            if errorResponse.code == "SAFETY_BLOCKED" {
                throw APIError.safetyBlocked
            } else {
                throw APIError.networkError(errorResponse.message)
            }
        case 402:
            if let credits = (try? JSONDecoder().decode(InsufficientCreditsError.self, from: data))?.credits {
                throw APIError.insufficientCredits(credits)
            } else {
                throw APIError.insufficientCredits(0)
            }
        case 409:
            throw APIError.duplicateTransaction
        case 502:
            throw APIError.apiUnavailable
        case 500:
            throw APIError.serverError(errorResponse.message)
        default:
            throw APIError.serverError("HTTP \(statusCode): \(errorResponse.message)")
        }
    }
}

// MARK: - Helper Structures
private struct ErrorResponse: Codable {
    let error: String
    let message: String
    let code: String
}

private struct InsufficientCreditsError: Codable {
    let error: String
    let message: String
    let code: String
    let credits: Int
}