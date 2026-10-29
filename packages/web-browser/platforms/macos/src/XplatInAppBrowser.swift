import AppKit
import WebKit

/// In-app browsing only. No app-shell scripts, message bridge or external opener.
@objc(XplatInAppBrowser)
public final class XplatInAppBrowser: NSObject, NSWindowDelegate, WKNavigationDelegate, WKUIDelegate {
	private var window: NSWindow?
	private var webView: WKWebView?
	private var observations: [NSKeyValueObservation] = []
	private var initialURL: URL?
	private var navigation: WKNavigation?
	private var address: NSTextField?
	private var status: NSTextField?
	private var backButton: NSButton?
	private var forwardButton: NSButton?
	private var reloadButton: NSButton?

	@objc public class func create() -> XplatInAppBrowser { XplatInAppBrowser() }
	@objc public class func accepts(_ value: String) -> Bool { addressURL(value) != nil }

	@objc public func open(_ value: String) -> Bool {
		guard Thread.isMainThread, NSApp != nil, let url = Self.addressURL(value) else { return false }
		close()
		let configuration = WKWebViewConfiguration()
		let browser = WKWebView(frame: .zero, configuration: configuration)
		browser.allowsBackForwardNavigationGestures = true
		browser.navigationDelegate = self
		browser.uiDelegate = self
		let panel = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 900, height: 640), styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
		panel.isReleasedWhenClosed = false
		panel.minSize = NSSize(width: 480, height: 320)
		panel.title = "Browser"
		panel.delegate = self
		window = panel; webView = browser; initialURL = url

		let back = NSButton(title: "Back", target: self, action: #selector(goBack(_:)))
		let forward = NSButton(title: "Forward", target: self, action: #selector(goForward(_:)))
		let reload = NSButton(title: "Reload", target: self, action: #selector(reloadOrStop(_:)))
		let closeButton = NSButton(title: "Close", target: self, action: #selector(closeAction(_:)))
		let location = NSTextField(labelWithString: value)
		location.isSelectable = true
		location.lineBreakMode = .byTruncatingMiddle
		location.setAccessibilityLabel("Page address")
		location.setContentHuggingPriority(.defaultLow, for: .horizontal)
		location.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
		let toolbar = NSStackView(views: [back, forward, reload, location, closeButton])
		toolbar.orientation = .horizontal; toolbar.alignment = .centerY; toolbar.spacing = 8
		let feedback = NSTextField(labelWithString: "")
		feedback.isHidden = true
		let chrome = NSStackView(views: [toolbar, feedback])
		chrome.orientation = .vertical; chrome.alignment = .leading; chrome.spacing = 4
		let root = NSView()
		panel.contentView = root
		let children: [NSView] = [chrome, browser]
		for child in children { child.translatesAutoresizingMaskIntoConstraints = false; root.addSubview(child) }
		NSLayoutConstraint.activate([
			chrome.topAnchor.constraint(equalTo: root.topAnchor, constant: 8),
			chrome.leadingAnchor.constraint(equalTo: root.leadingAnchor, constant: 8),
			chrome.trailingAnchor.constraint(equalTo: root.trailingAnchor, constant: -8),
			toolbar.widthAnchor.constraint(equalTo: chrome.widthAnchor),
			browser.topAnchor.constraint(equalTo: chrome.bottomAnchor, constant: 8),
			browser.leadingAnchor.constraint(equalTo: root.leadingAnchor),
			browser.trailingAnchor.constraint(equalTo: root.trailingAnchor),
			browser.bottomAnchor.constraint(equalTo: root.bottomAnchor),
		])
		address = location; status = feedback; backButton = back; forwardButton = forward; reloadButton = reload
		updateChrome(browser)
		let update: () -> Void = { [weak self, weak browser] in
			DispatchQueue.main.async { [weak self, weak browser] in
				guard let self, let browser, self.webView === browser else { return }
				self.updateChrome(browser)
			}
		}
		observations = [
			browser.observe(\.title, options: [.initial, .new]) { _, _ in update() },
			browser.observe(\.url, options: [.initial, .new]) { _, _ in update() },
			browser.observe(\.canGoBack, options: [.initial, .new]) { _, _ in update() },
			browser.observe(\.canGoForward, options: [.initial, .new]) { _, _ in update() },
			browser.observe(\.isLoading, options: [.initial, .new]) { _, _ in update() },
		]
		navigation = browser.load(URLRequest(url: url))
		panel.center()
		panel.makeKeyAndOrderFront(nil)
		NSApp.activate(ignoringOtherApps: true)
		return panel.isVisible
	}

	@objc public func close() {
		if !Thread.isMainThread { DispatchQueue.main.async { self.close() }; return }
		let panel = window, browser = webView, tokens = observations
		window = nil; webView = nil; observations = []; initialURL = nil; navigation = nil
		address = nil; status = nil; backButton = nil; forwardButton = nil; reloadButton = nil
		Self.cleanup(panel, browser, tokens, close: true)
	}
	private static func cleanup(_ panel: NSWindow?, _ browser: WKWebView?, _ tokens: [NSKeyValueObservation], close: Bool) {
		let work = {
			for token in tokens { token.invalidate() }
			browser?.navigationDelegate = nil; browser?.uiDelegate = nil; browser?.stopLoading()
			panel?.delegate = nil; panel?.contentView = nil
			if close { panel?.close() }
		}
		if Thread.isMainThread { work() } else { DispatchQueue.main.async(execute: work) }
	}
	public func windowWillClose(_ notification: Notification) {
		guard let panel = notification.object as? NSWindow, panel === window else { return }
		let browser = webView, tokens = observations
		window = nil; webView = nil; observations = []; initialURL = nil; navigation = nil
		address = nil; status = nil; backButton = nil; forwardButton = nil; reloadButton = nil
		Self.cleanup(panel, browser, tokens, close: false)
	}
	private func updateChrome(_ browser: WKWebView) {
		if let title = browser.title, !title.isEmpty { window?.title = title } else { window?.title = "Browser" }
		address?.stringValue = browser.url?.absoluteString ?? initialURL?.absoluteString ?? ""
		backButton?.isEnabled = browser.canGoBack; forwardButton?.isEnabled = browser.canGoForward
		reloadButton?.title = browser.isLoading ? "Stop" : "Reload"
	}
	@objc private func goBack(_ sender: Any?) { if let browser = webView, browser.canGoBack { navigation = browser.goBack() } }
	@objc private func goForward(_ sender: Any?) { if let browser = webView, browser.canGoForward { navigation = browser.goForward() } }
	@objc private func reloadOrStop(_ sender: Any?) {
		guard let browser = webView else { return }
		if browser.isLoading { browser.stopLoading() }
		else if browser.url != nil { navigation = browser.reload() }
		else if let initialURL { navigation = browser.load(URLRequest(url: initialURL)) }
	}
	@objc private func closeAction(_ sender: Any?) { close() }
	private static func addressURL(_ value: String) -> URL? {
		guard let url = URL(string: value), isHTTP(url) else { return nil }
		return url
	}
	private static func isHTTP(_ url: URL) -> Bool { ["http", "https"].contains(url.scheme?.lowercased() ?? "") && !(url.host ?? "").isEmpty }
	public func webView(_ browser: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
		guard browser === webView, let url = action.request.url else { decisionHandler(.cancel); return }
		let childDocument = action.targetFrame?.isMainFrame == false && (url.scheme == "about" || url.scheme == "data")
		decisionHandler(Self.isHTTP(url) || childDocument ? .allow : .cancel)
	}
	public func webView(_ browser: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
		guard browser === webView, action.targetFrame == nil, let url = action.request.url, Self.isHTTP(url) else { return nil }
		navigation = browser.load(action.request)
		return nil
	}
	public func webView(_ browser: WKWebView, didStartProvisionalNavigation value: WKNavigation!) {
		if browser === webView { navigation = value; status?.isHidden = true; status?.stringValue = "" }
	}
	public func webView(_ browser: WKWebView, didFinish value: WKNavigation!) {
		if browser === webView && value === navigation { status?.isHidden = true; updateChrome(browser) }
	}
	public func webView(_ browser: WKWebView, didFailProvisionalNavigation value: WKNavigation!, withError error: Error) { failed(browser, value, error) }
	public func webView(_ browser: WKWebView, didFail value: WKNavigation!, withError error: Error) { failed(browser, value, error) }
	private func failed(_ browser: WKWebView, _ value: WKNavigation?, _ error: Error) {
		guard browser === webView, value === navigation else { return }
		let failure = error as NSError
		if failure.domain == NSURLErrorDomain && failure.code == NSURLErrorCancelled { return }
		status?.stringValue = "Could not load this page. Try Reload."
		status?.isHidden = false
	}

	deinit { Self.cleanup(window, webView, observations, close: true) }
}
