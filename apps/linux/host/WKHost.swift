// WKHost — macOS stand-in for the Linux WebKitGTK host. The webview side is
// identical: WKWebView and WebKitGTK share the `webkit.messageHandlers`
// script-message API, so this exercises the same wire contract
// (packages/platform/src/bridge.linux.ts) the real GJS host (gjs-host.js)
// implements. What it does NOT prove: GTK windowing, D-Bus, WebKitGTK version
// skew — those need the container/VM.
//
//   pnpm --filter @xplat/linux dev     # vite on :5201
//   apps/linux/host/run.sh             # build + open this harness
//   apps/linux/host/run.sh --self-test # also run the bridge round-trip check

import Cocoa
import WebKit

let urlString = CommandLine.arguments.dropFirst().first { !$0.hasPrefix("--") }
	?? "http://localhost:5201"
let selfTest = CommandLine.arguments.contains("--self-test")

// Same protocol and dispatch table as gjs-host.js, with a macOS-native test
// mediator for the Linux renderer's bridge self-test.
final class Bridge: NSObject, WKScriptMessageHandler {
	weak var webView: WKWebView?
	var windows: [String: (window: NSWindow, wv: WKWebView)] = [:]
	var closeDelegates: [String: NSWindowDelegate] = [:] // NSWindow.delegate is weak
	private var currentSender: WKWebView? // replies land on the window that asked
	private var currentProtocol = false
	let secrets = UserDefaults(suiteName: "xplat-host")! // stand-in for Secret Service
	private let hostCapabilities: [String: [String]] = [
		"notifications": ["ensure", "notify"],
		"clipboard": ["read", "write"],
		"secureStorage": ["get", "set", "remove"],
		"appearance": ["get"],
		"files": ["readText", "pick", "writeText"],
		"windows": ["open", "close", "setTitle"],
		"system": ["openUrl"],
		"deepLinks": ["initialUrl"],
	]

	static func currentScheme() -> String {
		NSApp.effectiveAppearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua
			? "dark" : "light"
	}

	func userContentController(
		_: WKUserContentController, didReceive message: WKScriptMessage
	) {
		guard message.name == "xplat",
			let body = message.body as? String,
			let req = (try? JSONSerialization.jsonObject(with: Data(body.utf8))) as? [String: Any],
			let id = req["id"] as? Int
		else { return }
		let protocolType = req["type"] as? String
		let sender = message.webView ?? webView
		currentSender = sender
		if protocolType == "capabilities" {
			currentProtocol = true
			respond(id, hostCapabilities)
			currentProtocol = false
			return
		}
		guard protocolType == nil || protocolType == "call",
			let service = req["service"] as? String,
			let method = req["method"] as? String
		else { return }
		currentProtocol = protocolType == "call"
		let args = req["args"] as? [Any] ?? []

		switch (service, method) {
		case ("notifications", "ensure"):
			// UNUserNotificationCenter needs a bundled app — the harness grants
			// and logs instead. The real host maps to org.freedesktop.Notifications.
			respond(id, "granted")
		case ("notifications", "notify"):
			NSLog("[xplat] notification: %@ — %@", args.first as? String ?? "", args.dropFirst().first as? String ?? "")
			respond(id, true)
		case ("clipboard", "write"):
			NSPasteboard.general.clearContents()
			respond(id, NSPasteboard.general.setString(args.first as? String ?? "", forType: .string))
		case ("clipboard", "read"):
			respond(id, NSPasteboard.general.string(forType: .string) as Any)
		case ("secureStorage", "get"):
			respond(id, secrets.string(forKey: args.first as? String ?? "") as Any)
		case ("secureStorage", "set"):
			secrets.set(args.dropFirst().first as? String ?? "", forKey: args.first as? String ?? "")
			respond(id, true)
		case ("secureStorage", "remove"):
			secrets.removeObject(forKey: args.first as? String ?? "")
			respond(id, true)
		case ("system", "openUrl"):
			let ok = (args.first as? String).flatMap(URL.init).map { NSWorkspace.shared.open($0) } ?? false
			respond(id, ok)
		case ("appearance", "get"):
			respond(id, Self.currentScheme())
		case ("files", "readText"):
			let text = (args.first as? String)
				.flatMap(URL.init(string:))
				.flatMap { try? String(contentsOf: $0, encoding: .utf8) }
			respond(id, text as Any)
		case ("files", "pick"):
			let panel = NSOpenPanel()
			panel.allowsMultipleSelection = false
			respond(id, panel.runModal() == .OK && panel.url != nil
				? ["name": panel.url!.lastPathComponent, "uri": panel.url!.absoluteString]
				: NSNull())
		case ("files", "writeText"):
			let panel = NSSavePanel()
			panel.nameFieldStringValue = args.first as? String ?? "untitled.txt"
			guard panel.runModal() == .OK, let url = panel.url else {
				respond(id, NSNull())
				return
			}
			try? (args.dropFirst().first as? String ?? "").write(to: url, atomically: true, encoding: .utf8)
			respond(id, ["name": url.lastPathComponent, "uri": url.absoluteString])
		case ("windows", "open"):
			respond(id, openSecondary(sender, args.first as? [String: Any] ?? [:]))
		case ("windows", "close"):
			if let wid = args.first as? String, let entry = windows[wid] {
				entry.window.close() // close-request delegate emits windows.closed
			}
			respond(id, true)
		case ("windows", "setTitle"):
			if let wid = args.first as? String {
				windows[wid]?.window.title = args.dropFirst().first as? String ?? ""
			}
			respond(id, true)
		case ("deepLinks", "initialUrl"):
			respond(id, NSNull())
		default:
			rejectRequest(id, "host has no \(service).\(method)")
		}
	}

	// windows.open — own NSWindow + WKWebView (own root), like gjs-host's
	// Adw window. 'dialog' shows as a sheet on the sender's window.
	private func openSecondary(_ sender: WKWebView?, _ opts: [String: Any]) -> String {
		let wid = (opts["id"] as? String) ?? "w\(windows.count + 1)"
		let size = opts["size"] as? [String: Double] ?? ["width": 640, "height": 480]
		let w = NSWindow(
			contentRect: NSRect(x: 0, y: 0, width: size["width"] ?? 640, height: size["height"] ?? 480),
			styleMask: [.titled, .closable, .resizable],
			backing: .buffered, defer: false)
		w.title = opts["title"] as? String ?? "xplat"
		let dataJson = jsLiteral(opts["data"] ?? NSNull())
		let wv = makeWebView(
			extraInjected: "window.__xplatWindowId = \"\(wid)\"; window.__xplatWindowData = \(dataJson);")
		wv.autoresizingMask = [.width, .height]
		wv.frame = w.contentView!.bounds
		w.contentView!.addSubview(wv)
		windows[wid] = (w, wv)
		let delegate = WindowCloseDelegate { [weak self] in
			self?.windows.removeValue(forKey: wid)
			self?.closeDelegates.removeValue(forKey: wid)
			if let opener = sender {
				self?.emitTo(opener, "windows", "closed", wid)
			}
		}
		closeDelegates[wid] = delegate
		w.delegate = delegate
		let target = opts["url"] as? String ?? "/"
		let resolved = target.hasPrefix("http") || target.contains("://")
			? target
			: URL(string: urlString)!.deletingLastPathComponent().appendingPathComponent(target).absoluteString
		wv.load(URLRequest(url: URL(string: resolved)!))
		w.makeKeyAndOrderFront(nil)
		return wid
	}

	private func emitTo(_ wv: WKWebView, _ service: String, _ event: String, _ payload: Any) {
		let name = (service == "deepLinks" || service == "deep-links") && event == "open"
			? "app.deep-link"
			: "\(service).\(event)"
		let packet: [String: Any] = ["type": "event", "name": name, "payload": payload]
		let encodedPacket = jsLiteral(packet)
		wv.evaluateJavaScript(
			"window.__xplatHostTransport?.receive(\(jsLiteral(encodedPacket)));" +
				"__xplatBridge?.emit('\(service)', '\(event)', \(jsLiteral(payload)))",
			completionHandler: nil)
	}

	// JSONSerialization only writes top-level arrays/dicts — wrap scalars and
	// strip the brackets so `"granted"`, `true`, `null` all serialize.
	private func jsLiteral(_ value: Any) -> String {
		if JSONSerialization.isValidJSONObject(value),
			let s = (try? JSONSerialization.data(withJSONObject: value))
				.flatMap({ String(data: $0, encoding: .utf8) })
		{
			return s
		}

		if var s = (try? JSONSerialization.data(withJSONObject: [value]))
			.flatMap({ String(data: $0, encoding: .utf8) }), s.count >= 2
		{
			s.removeFirst()
			s.removeLast()
			return s
		}

		return "null"
	}

	private func respond(_ id: Int, _ value: Any) {
		if currentProtocol {
			let packet: [String: Any] = ["type": "reply", "id": id, "ok": true, "value": value]
			let encodedPacket = jsLiteral(packet)
			(currentSender ?? webView)?.evaluateJavaScript(
				"window.__xplatHostTransport?.receive(\(jsLiteral(encodedPacket)))",
				completionHandler: nil)
		} else {
			(currentSender ?? webView)?.evaluateJavaScript(
				"__xplatBridge?.resolve(\(id), \(jsLiteral(value)))", completionHandler: nil)
		}
	}

	private func rejectRequest(_ id: Int, _ message: String) {
		if currentProtocol {
			let packet: [String: Any] = ["type": "reply", "id": id, "ok": false, "error": message]
			let encodedPacket = jsLiteral(packet)
			(currentSender ?? webView)?.evaluateJavaScript(
				"window.__xplatHostTransport?.receive(\(jsLiteral(encodedPacket)))",
				completionHandler: nil)
		} else {
			(currentSender ?? webView)?.evaluateJavaScript(
				"__xplatBridge?.reject(\(id), \(jsLiteral(message)))", completionHandler: nil)
		}
	}

	func emit(_ service: String, _ event: String, _ payload: Any) {
		guard let webView else { return }
		emitTo(webView, service, event, payload)
	}
}

final class LogSink: NSObject, WKScriptMessageHandler {
	func userContentController(_: WKUserContentController, didReceive message: WKScriptMessage) {
		NSLog("[webview] %@", "\(message.body)")
	}
}

final class WindowCloseDelegate: NSObject, NSWindowDelegate {
	let onClose: () -> Void
	init(_ onClose: @escaping () -> Void) { self.onClose = onClose }
	func windowWillClose(_: Notification) { onClose() }
}

let app = NSApplication.shared
let bridge = Bridge()

// Every webview gets its own UCC — per-window message wiring and its own
// document-start injection (initial url / color scheme / window data).
func makeWebView(extraInjected: String = "") -> WKWebView {
	let ucc = WKUserContentController()
	ucc.add(bridge, name: "xplat")
	ucc.add(LogSink(), name: "xplatLog")
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
	ucc.addUserScript(
		WKUserScript(
			source: transportScript + "window.__xplatInitialUrl = null; window.__xplatColorScheme = "
				+ (Bridge.currentScheme() == "dark" ? "\"dark\"" : "\"light\"") + ";" + extraInjected,
			injectionTime: .atDocumentStart, forMainFrameOnly: true))
	let config = WKWebViewConfiguration()
	config.userContentController = ucc
	return WKWebView(frame: .zero, configuration: config)
}

let window = NSWindow(
	contentRect: NSRect(x: 0, y: 0, width: 1024, height: 768),
	styleMask: [.titled, .closable, .resizable, .miniaturizable],
	backing: .buffered, defer: false)
window.title = "xplat linux harness"
let webView = makeWebView()
webView.autoresizingMask = [.width, .height]
webView.frame = window.contentView!.bounds
window.contentView!.addSubview(webView)
bridge.webView = webView

final class NavDelegate: NSObject, WKNavigationDelegate {
	let selftestJS = // cwd is host/ — run.sh cds here
		(try? String(contentsOfFile: "bridge-selftest.linux.js", encoding: .utf8))
		?? "webkit.messageHandlers.xplatLog.postMessage('SELFTEST missing bridge-selftest.linux.js')"

	func webView(_ webView: WKWebView, didFinish _: WKNavigation!) {
		guard selfTest else { return }
		// Poll until the app's bridge.linux.ts install is visible, then run
		// bridge-selftest.linux.js — the same file gjs-host.js evaluates on Linux.
		webView.evaluateJavaScript("typeof __xplatBridge === 'object'") { result, _ in
			if result as? Bool == true {
				webView.evaluateJavaScript(self.selftestJS, completionHandler: nil)
				DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
					bridge.emit("deep-links", "open", "xplat://self-test/deep-link")
				}
			} else {
				DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
					self.webView(webView, didFinish: nil)
				}
			}
		}
	}
}
let navDelegate = NavDelegate() // WKWebView.navigationDelegate is weak
webView.navigationDelegate = navDelegate

// Mirrors gjs-host's 'open' signal + appearance watch: deep links delivered
// by the OS while running, and system dark-mode flips pushed as events.
final class AppDelegate: NSObject, NSApplicationDelegate {
	func application(_: NSApplication, open urls: [URL]) {
		for u in urls {
			bridge.emit("deep-links", "open", u.absoluteString)
		}
	}
}
let appDelegate = AppDelegate()
app.delegate = appDelegate
var appearanceObs: NSKeyValueObservation?
appearanceObs = NSApp.observe(\.effectiveAppearance) { _, _ in
	bridge.emit("appearance", "change", Bridge.currentScheme())
}

window.makeKeyAndOrderFront(nil)
app.setActivationPolicy(.regular)
app.activate(ignoringOtherApps: true)
webView.load(URLRequest(url: URL(string: urlString)!))
NSLog("[xplat] loading %@", urlString)
app.run()
