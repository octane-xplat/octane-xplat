import AppKit
import Security
import UniformTypeIdentifiers
import UserNotifications
import WebKit

private final class XplatWebViewChannel: NSObject, WKScriptMessageHandler, WKNavigationDelegate {
	var dispatch: ((String) -> Void)?
	var trustedOrigin: (scheme: String, host: String, port: Int?)?

	func userContentController(
		_: WKUserContentController,
		didReceive message: WKScriptMessage
	) {
		guard message.frameInfo.isMainFrame, let body = message.body as? String else {
			return
		}
		guard isTrusted(message.frameInfo.securityOrigin) else { return }

		dispatch?(body)
	}

	func webView(
		_: WKWebView,
		decidePolicyFor action: WKNavigationAction,
		decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
	) {
		guard action.targetFrame?.isMainFrame == true,
			let url = action.request.url
		else {
			decisionHandler(.cancel)
			return
		}

		guard
			let scheme = url.scheme,
			let host = url.host,
			let trustedOrigin,
			scheme == trustedOrigin.scheme,
			host == trustedOrigin.host,
			trustedOrigin.port == nil || url.port == trustedOrigin.port
		else {
			decisionHandler(.cancel)
			return
		}

		decisionHandler(.allow)
	}

	func deliver(_ message: String, to webView: WKWebView) {
		guard
			let data = try? JSONSerialization.data(withJSONObject: [message]),
			let array = String(data: data, encoding: .utf8),
			array.count >= 2
		else {
			return
		}

		let literal = array.dropFirst().dropLast()
		webView.evaluateJavaScript(
			"window.__xplatHostTransport?.receive(\(literal))",
			completionHandler: nil
		)
	}

	private func isTrusted(_ origin: WKSecurityOrigin) -> Bool {
		guard let trustedOrigin else { return false }
		return origin.protocol == trustedOrigin.scheme &&
			origin.host == trustedOrigin.host &&
			(trustedOrigin.port == nil || origin.port == trustedOrigin.port)
	}
}

private final class XplatBundleSchemeHandler: NSObject, WKURLSchemeHandler {
	func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
		guard
			let url = task.request.url,
			let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
			components.scheme == "xplat",
			components.host == "app",
			let encodedPath = components.percentEncodedPath.removingPercentEncoding,
			let resources = Bundle.main.resourceURL
		else {
			task.didFailWithError(NSError(domain: "XplatWebView", code: 400))
			return
		}

		let root = resources.appendingPathComponent("web", isDirectory: true).standardizedFileURL
		let relativePath = encodedPath == "/" ? "index.html" : String(encodedPath.dropFirst())
		let requested = root.appendingPathComponent(relativePath).standardizedFileURL
		guard requested.path.hasPrefix(root.path + "/") else {
			task.didFailWithError(NSError(domain: "XplatWebView", code: 403))
			return
		}

		let file = FileManager.default.fileExists(atPath: requested.path)
			? requested
			: (URL(fileURLWithPath: relativePath).pathExtension.isEmpty
				? root.appendingPathComponent("index.html")
				: requested)
		let resolvedRoot = root.resolvingSymlinksInPath().path
		let resolvedFile = file.resolvingSymlinksInPath()
		guard
			resolvedFile.path.hasPrefix(resolvedRoot + "/"),
			let data = try? Data(contentsOf: resolvedFile)
		else {
			task.didFailWithError(NSError(domain: "XplatWebView", code: 404))
			return
		}

		let mimeType = Self.mimeType(for: resolvedFile.pathExtension)
		let encoding = mimeType.hasPrefix("text/") || mimeType == "application/javascript" ? "utf-8" : nil
		task.didReceive(URLResponse(
			url: url,
			mimeType: mimeType,
			expectedContentLength: data.count,
			textEncodingName: encoding
		))
		task.didReceive(data)
		task.didFinish()
	}

	func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}

	private static func mimeType(for extensionName: String) -> String {
		switch extensionName.lowercased() {
		case "html": "text/html"
		case "js", "mjs": "application/javascript"
		case "css": "text/css"
		case "json", "map": "application/json"
		case "svg": "image/svg+xml"
		case "png": "image/png"
		case "jpg", "jpeg": "image/jpeg"
		case "webp": "image/webp"
		case "gif": "image/gif"
		case "ico": "image/x-icon"
		case "woff": "font/woff"
		case "woff2": "font/woff2"
		case "ttf": "font/ttf"
		case "wasm": "application/wasm"
		default: "application/octet-stream"
		}
	}
}

@objc(XplatWebViewHost)
public final class XplatWebViewHost: NSObject {
	private let webView: WKWebView
	private let channel: XplatWebViewChannel
	private let userContentController: WKUserContentController
	private let bundleSchemeHandler: XplatBundleSchemeHandler
	private let keychainService = Bundle.main.bundleIdentifier ?? "org.octane.xplat"
	private var disposed = false

	@objc public override init() {
		let configuration = WKWebViewConfiguration()
		let controller = WKUserContentController()
		let transportScript = """
		(() => {
			const listeners = new Set();
			Object.defineProperty(window, '__xplatHostTransport', {
				value: {
					receive(message) { for (const listener of listeners) listener(message); },
					listen(listener) {
						listeners.add(listener);
						return () => listeners.delete(listener);
					}
				},
				configurable: false
			});
		})();
		"""
		controller.addUserScript(WKUserScript(
			source: transportScript,
			injectionTime: .atDocumentStart,
			forMainFrameOnly: true
		))
		configuration.userContentController = controller
		userContentController = controller
		bundleSchemeHandler = XplatBundleSchemeHandler()
		configuration.setURLSchemeHandler(bundleSchemeHandler, forURLScheme: "xplat")
		webView = WKWebView(frame: .zero, configuration: configuration)
		channel = XplatWebViewChannel()
		super.init()
		controller.add(channel, name: "xplat")
		webView.navigationDelegate = channel
		webView.autoresizingMask = [.width, .height]
	}

	@objc public func attach(to parent: NSView) {
		webView.frame = parent.bounds
		parent.addSubview(webView)
	}

	@objc public func owningWindow() -> NSWindow? {
		webView.window
	}

	/** Load an app-owned page served from the local development server. */
	@objc public func load(_ address: String) -> Bool {
		guard let url = URL(string: address),
			url.user == nil,
			url.password == nil,
			let scheme = url.scheme,
			let host = url.host,
			scheme == "http",
			(host == "127.0.0.1" || host == "localhost"),
			url.port != nil
		else {
			return false
		}

		channel.trustedOrigin = (scheme, host, url.port)
		webView.load(URLRequest(url: url))
		return true
	}

	@objc public func setBootstrap(_ serialized: String) -> Bool {
		guard
			let data = serialized.data(using: .utf8),
			let value = try? JSONSerialization.jsonObject(with: data),
			JSONSerialization.isValidJSONObject(value),
			let normalized = try? JSONSerialization.data(withJSONObject: value),
			let json = String(data: normalized, encoding: .utf8)
		else {
			return false
		}

		let script = "Object.defineProperty(window, '__xplatHostSnapshot', { value: \(json), configurable: false });"
		userContentController.addUserScript(WKUserScript(
			source: script,
			injectionTime: .atDocumentStart,
			forMainFrameOnly: true
		))
		return true
	}

	/** Load a page inside the packaged web bundle. */
	@objc public func loadPackaged(_ path: String) -> Bool {
		let raw = path.isEmpty || path == "/" ? "index.html" : String(path.drop(while: { $0 == "/" }))
		guard
			let components = URLComponents(string: "xplat://app/" + raw),
			components.scheme == "xplat",
			components.host == "app",
			let url = components.url,
			let resources = Bundle.main.resourceURL,
			FileManager.default.fileExists(atPath: resources.appendingPathComponent("web/index.html").path)
		else {
			return false
		}

		channel.trustedOrigin = ("xplat", "app", nil)
		webView.load(URLRequest(url: url))
		return true
	}

	/** Inject a secondary window id and app-owned JSON data before load. */
	@objc public func setWindowContext(_ context: NSDictionary) -> Bool {
		guard
			let id = context["id"] as? String,
			let data = context["data"] as? String,
			let encodedId = jsonLiteral(id),
			let json = data.data(using: .utf8),
			let value = try? JSONSerialization.jsonObject(
				with: json,
				options: [.fragmentsAllowed]
			),
			let normalized = jsonLiteral(value)
		else {
			return false
		}

		let script = """
		window.__xplatWindowId = \(encodedId);
		window.__xplatWindowData = \(normalized);
		"""
		userContentController.addUserScript(WKUserScript(
			source: script,
			injectionTime: .atDocumentStart,
			forMainFrameOnly: true
		))
		return true
	}

	@objc public func installDispatcher(_ dispatch: @escaping (String) -> Void) {
		channel.dispatch = dispatch
	}

	@objc public func deliver(_ message: String) {
		channel.deliver(message, to: webView)
	}


	private func jsonLiteral(_ value: Any) -> String? {
		if JSONSerialization.isValidJSONObject(value),
			let data = try? JSONSerialization.data(withJSONObject: value),
			let json = String(data: data, encoding: .utf8)
		{
			return json
		}

		guard
			let data = try? JSONSerialization.data(withJSONObject: [value]),
			let json = String(data: data, encoding: .utf8),
			json.count >= 2
		else {
			return nil
		}

		return String(json.dropFirst().dropLast())
	}

	private func fileURL(for value: String) -> URL {
		if let url = URL(string: value), url.isFileURL {
			return url
		}

		return URL(fileURLWithPath: value)
	}

	private func fileRef(for url: URL) -> NSDictionary {
		["name": url.lastPathComponent, "uri": url.absoluteString]
	}

	@objc public func pickFile(_ options: NSDictionary) -> NSDictionary? {
		let panel = NSOpenPanel()
		panel.allowsMultipleSelection = false
		panel.canChooseDirectories = false
		let accept = options["accept"] as? String ?? "*/*"
		let types = accept
			.split(separator: ",")
			.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
			.compactMap { item -> UTType? in
				if item.hasPrefix(".") {
					return UTType(filenameExtension: String(item.dropFirst()))
				}
				if item.contains("/") && item != "*/*" {
					return UTType(mimeType: item)
				}
				return nil
			}
		if !types.isEmpty { panel.allowedContentTypes = types }
		if let startingFolder = options["startingFolder"] as? String, !startingFolder.isEmpty {
			panel.directoryURL = URL(fileURLWithPath: startingFolder)
		}
		return panel.runModal() == .OK ? panel.url.map(fileRef(for:)) : nil
	}

	@objc public func readFileText(_ uri: String) -> NSString? {
		guard let data = try? Data(contentsOf: fileURL(for: uri)),
			let text = String(data: data, encoding: .utf8)
		else {
			return nil
		}

		return text as NSString
	}

	@objc public func writeFileText(_ options: NSDictionary) -> NSDictionary? {
		guard let text = options["text"] as? String else { return nil }
		let panel = NSSavePanel()
		panel.nameFieldStringValue = options["name"] as? String ?? "untitled.txt"
		guard panel.runModal() == .OK, let url = panel.url else { return nil }
		guard (try? text.write(to: url, atomically: true, encoding: .utf8)) != nil else {
			return nil
		}
		return fileRef(for: url)
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

	private func keychainQuery(_ key: String) -> [String: Any] {
		[
			kSecClass as String: kSecClassGenericPassword,
			kSecAttrService as String: keychainService,
			kSecAttrAccount as String: key,
		]
	}

	@objc public func secureStorageGet(_ key: String) -> NSString? {
		var query = keychainQuery(key)
		query[kSecReturnData as String] = true
		query[kSecMatchLimit as String] = kSecMatchLimitOne
		var item: CFTypeRef?
		guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess,
			let data = item as? Data,
			let value = String(data: data, encoding: .utf8)
		else {
			return nil
		}

		return value as NSString
	}

	@objc public func secureStorageSet(_ options: NSDictionary) -> Bool {
		guard
			let key = options["key"] as? String,
			let value = options["value"] as? String
		else {
			return false
		}
		let data = Data(value.utf8)
		var query = keychainQuery(key)
		let status = SecItemUpdate(
			query as CFDictionary,
			[kSecValueData as String: data] as CFDictionary
		)
		if status == errSecSuccess { return true }
		guard status == errSecItemNotFound else { return false }
		query[kSecValueData as String] = data
		query[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
		return SecItemAdd(query as CFDictionary, nil) == errSecSuccess
	}

	@objc public func secureStorageRemove(_ key: String) -> Bool {
		let status = SecItemDelete(keychainQuery(key) as CFDictionary)
		return status == errSecSuccess || status == errSecItemNotFound
	}

	@objc public func dispose() {
		if disposed { return }
		disposed = true
		channel.dispatch = nil
		webView.stopLoading()
		webView.navigationDelegate = nil
		webView.configuration.userContentController.removeScriptMessageHandler(forName: "xplat")
		webView.removeFromSuperview()
	}

	deinit {
		dispose()
	}
}
