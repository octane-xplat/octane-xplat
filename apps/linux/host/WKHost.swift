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

// Same dispatch table as gjs-host.js — replies go back by evaluating
// __xplatBridge.resolve/reject; events go in through __xplatBridge.emit.
final class Bridge: NSObject, WKScriptMessageHandler {
	weak var webView: WKWebView?
	let secrets = UserDefaults(suiteName: "xplat-host")! // stand-in for Secret Service

	func userContentController(
		_: WKUserContentController, didReceive message: WKScriptMessage
	) {
		guard message.name == "xplat",
			let body = message.body as? String,
			let req = (try? JSONSerialization.jsonObject(with: Data(body.utf8))) as? [String: Any],
			let id = req["id"] as? Int,
			let service = req["service"] as? String,
			let method = req["method"] as? String
		else { return }
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
		case ("deepLinks", "initialUrl"):
			respond(id, NSNull())
		default:
			rejectRequest(id, "host has no \(service).\(method)")
		}
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
		webView?.evaluateJavaScript(
			"__xplatBridge?.resolve(\(id), \(jsLiteral(value)))", completionHandler: nil)
	}

	private func rejectRequest(_ id: Int, _ message: String) {
		webView?.evaluateJavaScript(
			"__xplatBridge?.reject(\(id), \(jsLiteral(message)))", completionHandler: nil)
	}

	func emit(_ service: String, _ event: String, _ payload: Any) {
		webView?.evaluateJavaScript(
			"__xplatBridge?.emit('\(service)', '\(event)', \(jsLiteral(payload)))",
			completionHandler: nil)
	}
}

final class LogSink: NSObject, WKScriptMessageHandler {
	func userContentController(_: WKUserContentController, didReceive message: WKScriptMessage) {
		NSLog("[webview] %@", "\(message.body)")
	}
}

let app = NSApplication.shared
let bridge = Bridge()
let ucc = WKUserContentController()
ucc.add(bridge, name: "xplat")
ucc.add(LogSink(), name: "xplatLog")
// Document-start injection — the sync half of the contract (__xplatInitialUrl
// must be readable before app code runs; a round-trip would be too late).
ucc.addUserScript(
	WKUserScript(
		source: "window.__xplatInitialUrl = null",
		injectionTime: .atDocumentStart, forMainFrameOnly: true))

let config = WKWebViewConfiguration()
config.userContentController = ucc
let window = NSWindow(
	contentRect: NSRect(x: 0, y: 0, width: 1024, height: 768),
	styleMask: [.titled, .closable, .resizable, .miniaturizable],
	backing: .buffered, defer: false)
window.title = "xplat linux harness"
let webView = WKWebView(frame: window.contentView!.bounds, configuration: config)
webView.autoresizingMask = [.width, .height]
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

window.makeKeyAndOrderFront(nil)
app.setActivationPolicy(.regular)
app.activate(ignoringOtherApps: true)
webView.load(URLRequest(url: URL(string: urlString)!))
NSLog("[xplat] loading %@", urlString)
app.run()
