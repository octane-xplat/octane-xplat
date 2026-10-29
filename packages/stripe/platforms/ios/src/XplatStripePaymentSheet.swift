import Foundation
import UIKit
import StripeCore
import StripePayments
import StripePaymentSheet

/// The Objective-C boundary exposes no card fields or raw SDK error objects.
@objc(XplatStripePaymentSheet)
@objcMembers
public final class XplatStripePaymentSheet: NSObject {
    private var client: STPAPIClient?
    private var merchant: String?
    private var sheet: PaymentSheet?
    private var active = false

    public func initialize(_ json: String) -> Bool {
        guard !active, let data = json.data(using: .utf8),
              let decoded = try? JSONSerialization.jsonObject(with: data),
              let values = decoded as? [String: Any],
              let key = values["publishableKey"] as? String else { return false }
        let api = STPAPIClient(publishableKey: key)
        api.stripeAccount = values["stripeAccountId"] as? String
        client = api
        merchant = values["merchantIdentifier"] as? String
        sheet = nil
        return true
    }

    public func prepare(_ json: String) -> Bool {
        guard !active, let client = client, let data = json.data(using: .utf8),
              let decoded = try? JSONSerialization.jsonObject(with: data),
              let values = decoded as? [String: Any],
              let secret = values["paymentIntentClientSecret"] as? String,
              let name = values["merchantDisplayName"] as? String else { return false }
        var configuration = PaymentSheet.Configuration()
        configuration.apiClient = client
        configuration.merchantDisplayName = name
        configuration.returnURL = values["returnURL"] as? String
        configuration.primaryButtonLabel = values["primaryButtonLabel"] as? String
        if let wallet = values["applePay"] as? [String: Any],
           let country = wallet["merchantCountryCode"] as? String {
            guard let merchant = merchant else { return false }
            configuration.applePay = .init(merchantId: merchant, merchantCountryCode: country)
        }
        sheet = PaymentSheet(paymentIntentClientSecret: secret, configuration: configuration)
        return true
    }

    public func present(_ presenter: UIViewController, completion: @escaping (String) -> Void) {
        guard Thread.isMainThread, !active, let sheet = sheet,
              UIApplication.shared.applicationState == .active,
              presenter.viewIfLoaded?.window != nil, presenter.presentedViewController == nil else {
            completion("Failed")
            return
        }
        active = true
        sheet.present(from: presenter) { [weak self] result in
            guard let self = self else { return }
            self.active = false
            switch result {
            case .completed:
                self.sheet = nil
                completion("")
            case .canceled:
                completion("Canceled")
            case .failed:
                completion("Failed")
            }
        }
    }

    public func reset() -> Bool {
        guard !active else { return false }
        sheet = nil
        return true
    }

    public func handleURL(_ value: String) -> Bool {
        guard let url = URL(string: value) else { return false }
        return StripeAPI.handleURLCallback(with: url)
    }
}
