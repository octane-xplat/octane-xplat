import AVFoundation
import UserNotifications
import WebKit

// Retained native boundary. The JavaScriptCore bridge only invokes JS closures
// on the main run loop: UserNotifications completions run on an internal XPC
// queue and WKWebView delivers the media-capture delegate call off the JS
// thread, so JS implementations of these callbacks are never invoked and the
// request hangs or degrades to the timeout. The rest of the webview host is
// TypeScript.

func mediaUsageKey(for mediaType: AVMediaType) -> String {
	mediaType == .audio ? "NSMicrophoneUsageDescription" : "NSCameraUsageDescription"
}

// A missing usage description makes the request prompt fail or terminate the
// process — report denial instead of touching AVFoundation.
func mediaDeclared(_ mediaType: AVMediaType) -> Bool {
	Bundle.main.object(forInfoDictionaryKey: mediaUsageKey(for: mediaType)) != nil
}

func requestMediaAccess(_ mediaTypes: [AVMediaType], completion: @escaping (Bool) -> Void) {
	var remaining = mediaTypes
	var grantedAll = true
	var step: (() -> Void)!
	step = {
		while let mediaType = remaining.first {
			remaining.removeFirst()
			guard mediaDeclared(mediaType) else {
				grantedAll = false
				continue
			}

			switch AVCaptureDevice.authorizationStatus(for: mediaType) {
			case .authorized:
				continue
			case .notDetermined:
				AVCaptureDevice.requestAccess(for: mediaType) { granted in
					grantedAll = grantedAll && granted
					DispatchQueue.main.async {
						step()
					}
				}
				return
			default:
				grantedAll = false
				continue
			}
		}

		completion(grantedAll)
	}
	step()
}

// Media capture (camera/microphone via getUserMedia) is granted only to the
// app's own trusted origin and only when the host app holds the matching macOS
// privacy permission. Requests from any other frame are denied. The TypeScript
// host keeps `trustedOrigin` in sync on every load. Private like the original
// delegate: WebKit types must stay out of the emitted -Swift.h.
private final class XplatWebViewMediaDelegate: NSObject, WKUIDelegate {
	var trustedOrigin: NSDictionary?

	private func isTrusted(_ origin: WKSecurityOrigin) -> Bool {
		guard
			let trustedOrigin,
			let scheme = trustedOrigin["scheme"] as? String,
			let host = trustedOrigin["host"] as? String
		else {
			return false
		}

		let port = trustedOrigin["port"] as? NSNumber
		return origin.protocol == scheme &&
			origin.host == host &&
			(port == nil || origin.port == port!.intValue)
	}

	func webView(
		_ webView: WKWebView,
		requestMediaCapturePermissionFor origin: WKSecurityOrigin,
		initiatedByFrame frame: WKFrameInfo,
		type: WKMediaCaptureType,
		decisionHandler: @escaping (WKPermissionDecision) -> Void
	) {
		guard isTrusted(origin), isTrusted(frame.securityOrigin) else {
			decisionHandler(.deny)
			return
		}

		let mediaTypes: [AVMediaType] =
			switch type {
			case .camera:
				[.video]
			case .microphone:
				[.audio]
			case .cameraAndMicrophone:
				[.video, .audio]
			@unknown default:
				[.video]
			}

		requestMediaAccess(mediaTypes) { granted in
			decisionHandler(granted ? .grant : .deny)
		}
	}
}

@objc(XplatWebViewNative)
public final class XplatWebViewNative: NSObject {
	private let mediaDelegate = XplatWebViewMediaDelegate()

	/** The private WKUIDelegate handling media-capture decisions. */
	@objc public func mediaUIDelegate() -> NSObject {
		mediaDelegate
	}

	@objc public func setMediaTrustedOrigin(_ origin: NSDictionary?) {
		mediaDelegate.trustedOrigin = origin
	}

	private func waitForResult<T>(_ operation: (@escaping (T) -> Void) -> Void) -> T? {
		var result: T?
		var done = false
		operation {
			result = $0
			done = true
		}

		let deadline = Date().addingTimeInterval(5)
		while !done && Date() < deadline {
			RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.01))
		}
		return result
	}

	@objc public func notificationPermission() -> NSString {
		let status = waitForResult { done in
			UNUserNotificationCenter.current().getNotificationSettings {
				done($0.authorizationStatus)
			}
		}

		switch status {
		case .authorized, .provisional, .ephemeral:
			return "granted"
		case .denied:
			return "denied"
		default:
			return "unsupported"
		}
	}

	@objc public func requestNotificationPermission() -> Bool {
		switch notificationPermission() as String {
		case "granted":
			return true
		case "denied":
			return false
		default:
			break
		}

		return waitForResult { done in
			UNUserNotificationCenter.current().requestAuthorization(
				options: [.alert, .sound]
			) { granted, error in
				done(granted && error == nil)
			}
		} ?? false
	}

	@objc public func notify(_ options: NSDictionary) -> Bool {
		guard requestNotificationPermission() else { return false }
		let content = UNMutableNotificationContent()
		content.title = options["title"] as? String ?? ""
		content.body = options["body"] as? String ?? ""
		let request = UNNotificationRequest(
			identifier: UUID().uuidString,
			content: content,
			trigger: nil
		)
		return waitForResult { done in
			UNUserNotificationCenter.current().add(request) { error in
				done(error == nil)
			}
		} ?? false
	}
}
