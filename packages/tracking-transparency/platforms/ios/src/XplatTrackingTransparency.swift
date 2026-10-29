import Foundation
import UIKit
import AppTrackingTransparency
import AdSupport

@objc(XplatTrackingTransparency)
@objcMembers
public final class XplatTrackingTransparency: NSObject {
    private static var requesting = false

    private func reply(_ status: Int) -> String { return "{\"status\":" + String(status) + "}" }
    private func failure(_ message: String) -> String {
        guard let bytes = try? JSONSerialization.data(withJSONObject: ["error": message]),
              let text = String(data: bytes, encoding: .utf8) else { return "{\"error\":\"Tracking request failed\"}" }
        return text
    }
    public func available() -> Bool {
        if #available(iOS 14.0, *) { return true }
        return false
    }
    public func read() -> String {
        if #available(iOS 14.0, *) { return reply(Int(ATTrackingManager.trackingAuthorizationStatus.rawValue)) }
        return reply(-1)
    }
    public func request(_ completion: @escaping (String) -> Void) {
        guard Thread.isMainThread else { completion(failure("Tracking requests require the main thread")); return }
        guard !Bundle.main.bundlePath.hasSuffix(".appex") else { completion(failure("Tracking prompts are unavailable in app extensions")); return }
        if #available(iOS 14.0, *) {
            guard let purpose = Bundle.main.object(forInfoDictionaryKey: "NSUserTrackingUsageDescription") as? String,
                  !purpose.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                completion(failure("Configure NSUserTrackingUsageDescription in Info.plist and rebuild before requesting tracking")); return
            }
            guard UIApplication.shared.applicationState == .active else {
                completion(failure("Request tracking only from an active foreground app action")); return
            }
            let status = ATTrackingManager.trackingAuthorizationStatus
            if status != .notDetermined { completion(reply(Int(status.rawValue))); return }
            guard !XplatTrackingTransparency.requesting else { completion(failure("A native tracking request is already pending")); return }
            XplatTrackingTransparency.requesting = true
            ATTrackingManager.requestTrackingAuthorization { status in
                DispatchQueue.main.async {
                    XplatTrackingTransparency.requesting = false
                    completion(self.reply(Int(status.rawValue)))
                }
            }
        } else { completion(reply(-1)) }
    }
    public func advertisingId() -> String? {
        if #available(iOS 14.0, *) {
            guard ATTrackingManager.trackingAuthorizationStatus == .authorized else { return nil }
        } else {
            guard ASIdentifierManager.shared().isAdvertisingTrackingEnabled else { return nil }
        }
        let identifier = ASIdentifierManager.shared().advertisingIdentifier.uuidString
        return identifier == "00000000-0000-0000-0000-000000000000" ? nil : identifier
    }
}
