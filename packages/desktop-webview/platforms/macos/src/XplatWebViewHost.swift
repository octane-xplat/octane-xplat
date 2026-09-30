import AppKit
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

	/** Load the packaged web bundle from Contents/Resources/web. */
	@objc public func loadPackaged() -> Bool {
		guard
			let resources = Bundle.main.resourceURL,
			FileManager.default.fileExists(atPath: resources.appendingPathComponent("web/index.html").path),
			let url = URL(string: "xplat://app/index.html")
		else {
			return false
		}

		channel.trustedOrigin = ("xplat", "app", nil)
		webView.load(URLRequest(url: url))
		return true
	}

	@objc public func installDispatcher(_ dispatch: @escaping (String) -> Void) {
		channel.dispatch = dispatch
	}

	@objc public func deliver(_ message: String) {
		channel.deliver(message, to: webView)
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
