import AVFoundation
import WebKit

// Retained native boundary. WebKit delivers the media-capture delegate call
// off the JS thread, and on this host real getUserMedia dispatch was never
// observed reaching any UIDelegate — so the TypeScript replacement could not
// be runtime-qualified and this leaf stays until delivery is proven on a
// Developer-signed bundle (.agents/docs/notes/macos-jsc-host.md). The rest
// of the webview host is TypeScript.

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

	fileprivate func isTrusted(_ scheme: String?, _ host: String?, _ port: Int) -> Bool {
		guard
			let trustedOrigin,
			let expectedScheme = trustedOrigin["scheme"] as? String,
			let expectedHost = trustedOrigin["host"] as? String
		else {
			return false
		}

		let expectedPort = trustedOrigin["port"] as? NSNumber
		return scheme == expectedScheme &&
			host == expectedHost &&
			(expectedPort == nil || port == expectedPort!.intValue)
	}

	fileprivate func isTrusted(_ origin: NSDictionary?) -> Bool {
		isTrusted(
			origin?["scheme"] as? String,
			origin?["host"] as? String,
			(origin?["port"] as? NSNumber)?.intValue ?? 0
		)
	}

	private func isTrusted(_ origin: WKSecurityOrigin) -> Bool {
		isTrusted(origin.protocol, origin.host, origin.port)
	}

	private func mediaTypes(for type: WKMediaCaptureType) -> [AVMediaType] {
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
	}

	// Shared decision path for the WebKit entry and the host-visible probe:
	// deny unless both origins are trusted, then gate on the per-type access.
	fileprivate func decide(
		originTrusted: Bool,
		frameTrusted: Bool,
		type: WKMediaCaptureType,
		decisionHandler: @escaping (WKPermissionDecision) -> Void
	) {
		guard originTrusted, frameTrusted else {
			decisionHandler(.deny)
			return
		}

		requestMediaAccess(mediaTypes(for: type)) { granted in
			decisionHandler(granted ? .grant : .deny)
		}
	}

	func webView(
		_ webView: WKWebView,
		requestMediaCapturePermissionFor origin: WKSecurityOrigin,
		initiatedByFrame frame: WKFrameInfo,
		type: WKMediaCaptureType,
		decisionHandler: @escaping (WKPermissionDecision) -> Void
	) {
		decide(
			originTrusted: isTrusted(origin),
			frameTrusted: isTrusted(frame.securityOrigin),
			type: type,
			decisionHandler: decisionHandler
		)
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

	// Test seam for hosts where WebKit never dispatches the delegate: runs
	// the same trust gate and per-type access check as the real delegate
	// entry, delivering the WKPermissionDecision raw value to the handler.
	@objc public func decideMediaCapturePermission(
		_ origin: NSDictionary?,
		frame frameOrigin: NSDictionary?,
		type: Int,
		decisionHandler: @escaping (Int) -> Void
	) {
		mediaDelegate.decide(
			originTrusted: mediaDelegate.isTrusted(origin),
			frameTrusted: mediaDelegate.isTrusted(frameOrigin),
			type: WKMediaCaptureType(rawValue: type) ?? .camera
		) { decisionHandler($0.rawValue) }
	}
}
