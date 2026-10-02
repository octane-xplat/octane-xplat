import AppKit
import WebKit

// One isolated, local document per editor. No general app/service bridge.
private final class EditorChannel: NSObject, WKScriptMessageHandler, WKNavigationDelegate {
    var dispatch: ((String) -> Void)?
    func userContentController(_: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame, let body = message.body as? String else { return }
        dispatch?(body)
    }
    func webView(_: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        decisionHandler(action.request.url?.absoluteString == "about:blank" ? .allow : .cancel)
    }
}

@objc(XplatEditorHost)
public final class XplatEditorHost: NSObject {
    private let webView: WKWebView
    private let channel = EditorChannel()
    private var disposed = false
    @objc public override init() {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .nonPersistent()
        webView = WKWebView(frame: .zero, configuration: config)
        super.init()
        config.userContentController.add(channel, name: "editor")
        webView.navigationDelegate = channel
        webView.autoresizingMask = [.width, .height]
    }
    @objc public func attach(to parent: NSView) {
        webView.frame = parent.bounds
        parent.addSubview(webView)
    }
    @objc public func installDispatcher(_ dispatch: @escaping (String) -> Void) {
        channel.dispatch = dispatch
    }
    @objc public func load(_ html: String) {
        guard !disposed else { return }
        webView.loadHTMLString(html, baseURL: nil)
    }
    @objc public func deliver(_ packet: String) {
        guard !disposed,
              let data = try? JSONSerialization.data(withJSONObject: [packet]),
              let literal = String(data: data, encoding: .utf8) else { return }
        webView.evaluateJavaScript("window.__xplatEditorReceive?.(\(literal)[0])") { [weak self] _, error in
            if let error {
                let body = ["event": "error", "message": error.localizedDescription]
                if let data = try? JSONSerialization.data(withJSONObject: body),
                   let text = String(data: data, encoding: .utf8) { self?.channel.dispatch?(text) }
            }
        }
    }
    @objc public func dispose() {
        guard !disposed else { return }
        disposed = true
        channel.dispatch = nil
        webView.stopLoading()
        webView.configuration.userContentController.removeScriptMessageHandler(forName: "editor")
        webView.navigationDelegate = nil
        webView.removeFromSuperview()
    }
}
