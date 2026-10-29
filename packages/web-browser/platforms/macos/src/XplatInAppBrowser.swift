import AppKit
import WebKit

/// Claim completion before ending a sheet: AppKit may synchronously call back.
private final class BrowserDialog {
	let alert: NSAlert
	private var completion: ((NSApplication.ModalResponse) -> Void)?
	init(_ alert: NSAlert, completion: @escaping (NSApplication.ModalResponse) -> Void) {
		self.alert = alert; self.completion = completion
	}
	func finish(_ response: NSApplication.ModalResponse, parent: NSWindow?) {
		guard let callback = completion else { return }
		completion = nil
		if let parent, alert.window.sheetParent === parent { parent.endSheet(alert.window, returnCode: response) }
		alert.window.orderOut(nil)
		// Let Cocoa remove the old sheet before JavaScript requests another one.
		DispatchQueue.main.async { callback(response) }
	}
}

/// Delivers WebKit's selection once; no persistent app bookmark is created.
private final class BrowserFileSelection {
	let panel: NSOpenPanel
	private var completion: (([URL]?) -> Void)?
	init(_ panel: NSOpenPanel, completion: @escaping ([URL]?) -> Void) {
		self.panel = panel; self.completion = completion
	}
	func finish(_ response: NSApplication.ModalResponse, parent: NSWindow?) {
		guard let callback = completion else { return }
		completion = nil
		let urls: [URL]? = response == .OK ? panel.urls : nil
		if let parent, panel.sheetParent === parent { parent.endSheet(panel, returnCode: response) }
		panel.orderOut(nil)
		DispatchQueue.main.async { callback(urls) }
	}
}

/// In-app browsing only. No app-shell scripts, message bridge or external opener.
@objc(XplatInAppBrowser)
public final class XplatInAppBrowser: NSObject, NSWindowDelegate, WKNavigationDelegate, WKUIDelegate {
	private var fileSelection: BrowserFileSelection?
	private var dialog: BrowserDialog?
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
		let panel = window, browser = webView, tokens = observations, pending = dialog, selection = fileSelection
		window = nil; webView = nil; observations = []; initialURL = nil; navigation = nil; dialog = nil; fileSelection = nil
		address = nil; status = nil; backButton = nil; forwardButton = nil; reloadButton = nil
		Self.cleanup(panel, browser, tokens, pending, selection, close: true)
	}
	private static func cleanup(_ panel: NSWindow?, _ browser: WKWebView?, _ tokens: [NSKeyValueObservation], _ pending: BrowserDialog?, _ selection: BrowserFileSelection?, close: Bool) {
		let work = {
			pending?.finish(.cancel, parent: panel)
			selection?.finish(.cancel, parent: panel)
			for token in tokens { token.invalidate() }
			browser?.navigationDelegate = nil; browser?.uiDelegate = nil; browser?.stopLoading()
			panel?.delegate = nil; panel?.contentView = nil
			if close { panel?.close() }
		}
		if Thread.isMainThread { work() } else { DispatchQueue.main.async(execute: work) }
	}
	public func windowWillClose(_ notification: Notification) {
		guard let panel = notification.object as? NSWindow, panel === window else { return }
		let browser = webView, tokens = observations, pending = dialog, selection = fileSelection
		window = nil; webView = nil; observations = []; initialURL = nil; navigation = nil; dialog = nil; fileSelection = nil
		address = nil; status = nil; backButton = nil; forwardButton = nil; reloadButton = nil
		Self.cleanup(panel, browser, tokens, pending, selection, close: false)
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
	private func cancelPanels() {
		let pending = dialog, selection = fileSelection
		dialog = nil; fileSelection = nil
		pending?.finish(.cancel, parent: window)
		selection?.finish(.cancel, parent: window)
	}
	private func presentDialog(_ alert: NSAlert, in browser: WKWebView, completion: @escaping (NSApplication.ModalResponse) -> Void) {
		guard browser === webView, let panel = window, panel.isVisible, dialog == nil, fileSelection == nil, panel.attachedSheet == nil else {
			completion(.cancel); return
		}
		let pending = BrowserDialog(alert, completion: completion)
		dialog = pending
		alert.beginSheetModal(for: panel) { [weak self, weak browser, weak panel] response in
			let current = self?.dialog === pending && browser != nil && self?.webView === browser && panel != nil && self?.window === panel
			if current { self?.dialog = nil }
			pending.finish(current ? response : .cancel, parent: panel)
		}
	}
	private func pageAlert(_ message: String, frame: WKFrameInfo, cancel: Bool) -> NSAlert {
		let alert = NSAlert()
		let host = frame.securityOrigin.host
		alert.messageText = host.isEmpty ? "Web page" : "Web page: \(host)"
		alert.informativeText = message
		alert.addButton(withTitle: "OK")
		if cancel { alert.addButton(withTitle: "Cancel").keyEquivalent = "\u{1b}" }
		return alert
	}
	public func webView(_ browser: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
		presentDialog(pageAlert(message, frame: frame, cancel: false), in: browser) { _ in completionHandler() }
	}
	public func webView(_ browser: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
		presentDialog(pageAlert(message, frame: frame, cancel: true), in: browser) { response in
			completionHandler(response == .alertFirstButtonReturn)
		}
	}
	public func webView(_ browser: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (String?) -> Void) {
		let alert = pageAlert(prompt, frame: frame, cancel: true)
		let input = NSTextField(frame: NSRect(x: 0, y: 0, width: 320, height: 24))
		input.stringValue = defaultText ?? ""
		input.setAccessibilityLabel("Response")
		alert.accessoryView = input
		alert.window.initialFirstResponder = input
		presentDialog(alert, in: browser) { response in
			completionHandler(response == .alertFirstButtonReturn ? input.stringValue : nil)
		}
	}
	public func webView(_ browser: WKWebView, runOpenPanelWith parameters: WKOpenPanelParameters, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping ([URL]?) -> Void) {
		guard browser === webView, let owner = window, owner.isVisible, dialog == nil, fileSelection == nil, owner.attachedSheet == nil else {
			completionHandler(nil); return
		}
		let panel = NSOpenPanel()
		let host = frame.securityOrigin.host
		panel.message = host.isEmpty ? "Choose files for this web page" : "Choose files for web page: \(host)"
		panel.prompt = "Choose"
		panel.allowsMultipleSelection = parameters.allowsMultipleSelection
		panel.canChooseDirectories = parameters.allowsDirectories
		panel.canChooseFiles = !parameters.allowsDirectories
		panel.canCreateDirectories = false
		// WKOpenPanelParameters has no public accepted-content-type property.
		let selection = BrowserFileSelection(panel, completion: completionHandler)
		fileSelection = selection
		panel.beginSheetModal(for: owner) { [weak self, weak browser, weak owner] response in
			let current = self?.fileSelection === selection && browser != nil && self?.webView === browser && owner != nil && self?.window === owner
			if current { self?.fileSelection = nil }
			selection.finish(current ? response : .cancel, parent: owner)
		}
	}
	public func webView(_ browser: WKWebView, didStartProvisionalNavigation value: WKNavigation!) {
		if browser === webView { cancelPanels(); navigation = value; status?.isHidden = true; status?.stringValue = "" }
	}
	public func webView(_ browser: WKWebView, didFinish value: WKNavigation!) {
		if browser === webView && value === navigation { status?.isHidden = true; updateChrome(browser) }
	}
	public func webView(_ browser: WKWebView, didFailProvisionalNavigation value: WKNavigation!, withError error: Error) { failed(browser, value, error) }
	public func webView(_ browser: WKWebView, didFail value: WKNavigation!, withError error: Error) { failed(browser, value, error) }
	public func webViewWebContentProcessDidTerminate(_ browser: WKWebView) {
		if browser === webView { cancelPanels(); status?.stringValue = "Page stopped. Try Reload."; status?.isHidden = false }
	}
	private func failed(_ browser: WKWebView, _ value: WKNavigation?, _ error: Error) {
		guard browser === webView, value === navigation else { return }
		let failure = error as NSError
		if failure.domain == NSURLErrorDomain && failure.code == NSURLErrorCancelled { return }
		status?.stringValue = "Could not load this page. Try Reload."
		status?.isHidden = false
	}

	deinit { Self.cleanup(window, webView, observations, dialog, fileSelection, close: true) }
}
