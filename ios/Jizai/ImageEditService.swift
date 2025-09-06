import Foundation
import UIKit
import PhotosUI
import SwiftUI

class ImageEditService: ObservableObject {
    static let shared = ImageEditService()
    
    @Published var isProcessing = false
    @Published var showImagePicker = false
    @Published var showCamera = false
    @Published var sourceType: UIImagePickerController.SourceType = .photoLibrary
    
    private let apiClient = APIClient.shared
    private let deviceManager = DeviceManager.shared
    
    private init() {}
    
    enum ImageSource {
        case camera
        case photoLibrary
    }
    
    // MARK: - Image Selection
    func selectImageSource(_ source: ImageSource) {
        switch source {
        case .camera:
            sourceType = .camera
            showCamera = true
        case .photoLibrary:
            sourceType = .photoLibrary
            showImagePicker = true
        }
    }
    
    // MARK: - Image Processing
    func processImage(_ image: UIImage, prompt: String) async throws -> (UIImage, Int) {
        await MainActor.run {
            isProcessing = true
        }
        
        defer {
            Task { @MainActor in
                isProcessing = false
            }
        }
        
        // Validate image size (max 10MB)
        guard let imageData = image.jpegData(compressionQuality: 0.8),
              imageData.count <= 10 * 1024 * 1024 else {
            throw ImageEditError.imageTooLarge
        }
        
        // Validate prompt
        guard !prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              prompt.count <= 1000 else {
            throw ImageEditError.invalidPrompt
        }
        
        // Process through API
        return try await apiClient.editImage(
            image: image,
            prompt: prompt,
            deviceId: deviceManager.deviceId
        )
    }
    
    // MARK: - Image Utilities
    func resizeImage(_ image: UIImage, maxSize: CGSize) -> UIImage {
        let size = image.size
        let aspectRatio = size.width / size.height
        
        var newSize: CGSize
        if aspectRatio > 1 {
            // Landscape
            newSize = CGSize(width: min(size.width, maxSize.width),
                           height: min(size.width, maxSize.width) / aspectRatio)
        } else {
            // Portrait
            newSize = CGSize(width: min(size.height, maxSize.height) * aspectRatio,
                           height: min(size.height, maxSize.height))
        }
        
        UIGraphicsBeginImageContextWithOptions(newSize, false, 0.0)
        image.draw(in: CGRect(origin: .zero, size: newSize))
        let resizedImage = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        
        return resizedImage ?? image
    }
    
    func compressImage(_ image: UIImage, maxSizeKB: Int) -> UIImage {
        let maxBytes = maxSizeKB * 1024
        var compression: CGFloat = 1.0
        var imageData = image.jpegData(compressionQuality: compression)
        
        while let data = imageData, data.count > maxBytes && compression > 0.1 {
            compression -= 0.1
            imageData = image.jpegData(compressionQuality: compression)
        }
        
        if let data = imageData, let compressedImage = UIImage(data: data) {
            return compressedImage
        }
        
        return image
    }
}

// MARK: - Image Edit Errors
enum ImageEditError: Error, LocalizedError {
    case imageTooLarge
    case invalidPrompt
    case processingFailed
    case unsupportedFormat
    
    var errorDescription: String? {
        switch self {
        case .imageTooLarge:
            return "画像サイズが大きすぎます（最大10MB）"
        case .invalidPrompt:
            return "プロンプトが無効です（1-1000文字）"
        case .processingFailed:
            return "画像の処理に失敗しました"
        case .unsupportedFormat:
            return "サポートされていない画像形式です"
        }
    }
}

// MARK: - UIImagePickerController Coordinator
struct ImagePickerCoordinator: UIViewControllerRepresentable {
    @Binding var selectedImage: UIImage?
    @Binding var isPresented: Bool
    let sourceType: UIImagePickerController.SourceType
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = sourceType
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: ImagePickerCoordinator
        
        init(_ parent: ImagePickerCoordinator) {
            self.parent = parent
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let image = info[.originalImage] as? UIImage {
                parent.selectedImage = image
            }
            parent.isPresented = false
        }
        
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.isPresented = false
        }
    }
}