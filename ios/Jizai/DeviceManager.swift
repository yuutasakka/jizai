import Foundation
import UIKit

class DeviceManager: ObservableObject {
    static let shared = DeviceManager()
    
    private let deviceIdKey = "JizaiDeviceId"
    @Published private(set) var deviceId: String
    
    private init() {
        if let savedDeviceId = UserDefaults.standard.string(forKey: deviceIdKey) {
            self.deviceId = savedDeviceId
        } else {
            self.deviceId = Self.generateDeviceId()
            UserDefaults.standard.set(self.deviceId, forKey: deviceIdKey)
        }
    }
    
    private static func generateDeviceId() -> String {
        let identifier = UIDevice.current.identifierForVendor?.uuidString ?? UUID().uuidString
        let timestamp = Int(Date().timeIntervalSince1970)
        return "ios_\(identifier.prefix(8))_\(timestamp)"
    }
    
    func regenerateDeviceId() {
        let newDeviceId = Self.generateDeviceId()
        deviceId = newDeviceId
        UserDefaults.standard.set(newDeviceId, forKey: deviceIdKey)
    }
}