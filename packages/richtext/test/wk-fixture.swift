import AppKit
import WebKit

@main
struct EditorFixture {
    static var host: XplatEditorHost!
    static var window: NSWindow!
    static var phase = 0
    static var seedJSON: Any?
    static var linkedHTML = ""
    static func send(_ method: String, _ args: [Any]) {
        let data = try! JSONSerialization.data(withJSONObject: ["method": method, "args": args])
        host.deliver(String(data: data, encoding: .utf8)!)
    }
    static func fail(_ reason: String) -> Never {
        fputs("EDITOR_FAIL \(reason)\n", stderr)
        exit(1)
    }
    static func main() {
        let app = NSApplication.shared
        app.setActivationPolicy(.accessory)
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 480, height: 220),
                          styleMask: [.titled], backing: .buffered, defer: false)
        host = XplatEditorHost()
        host.attach(to: window.contentView!)
        host.installDispatcher { text in
            guard let data = text.data(using: .utf8),
                  let packet = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let event = packet["event"] as? String else { fail("invalid packet") }
            if event == "error" { fail(text) }
            let html = packet["html"] as? String ?? ""
            if event == "boot" {
                send("props", [["value": "<p>Seed <strong>bold</strong></p>", "placeholder": "Write", "editable": true]])
            } else if event == "ready" && phase == 0 {
                guard html.contains("Seed"), html.contains("<strong"), !(packet["json"] is NSNull) else { fail("initial document: \(text)") }
                phase = 1
                send("setHTML", ["<h2>Replacement</h2><p>Body</p>"])
            } else if (event == "change" || event == "snapshot") && phase == 1 && html.contains("Replacement") {
                guard html.contains("<h2"), let json = packet["json"] else { fail("setHTML: \(text)") }
                seedJSON = json
                phase = 2
                send("setHTML", ["<p>Other</p>"])
            } else if (event == "change" || event == "snapshot") && phase == 2 && html.contains("Other") {
                phase = 3
                send("setJSON", [seedJSON!])
            } else if (event == "change" || event == "snapshot") && phase == 3 && html.contains("Replacement") {
                phase = 4
                send("focus", [])
                send("linkTo", ["https://example.com", "Link text"])
            } else if (event == "change" || event == "snapshot") && phase == 4 && html.contains("Link text") {
                guard html.contains("https://example.com") else { fail("link target missing") }
                phase = 5
                linkedHTML = html
                send("props", [["value": "<p>Seed <strong>bold</strong></p>", "editable": true, "placeholder": "Different hint"]])
            } else if event == "snapshot" && phase == 5 {
                guard html == linkedHTML else { fail("unchanged value replayed over imperative edit") }
                phase = 6
                send("apply", ["heading1"])
            } else if (event == "change" || event == "snapshot") && phase == 6 && html.contains("<h1") {
                phase = 7
                send("undo", [])
            } else if (event == "change" || event == "snapshot") && phase == 7 && !html.contains("<h1") {
                phase = 8
                send("redo", [])
            } else if (event == "change" || event == "snapshot") && phase == 8 && html.contains("<h1") {
                phase = 9
                // External controlled content must update a mounted engine.
                send("props", [["value": "<p>External</p>", "editable": false, "placeholder": "Read only"]])
            } else if (event == "change" || event == "snapshot") && phase == 9 && html.contains("External") {
                phase = 10
                let webView = window.contentView!.subviews.first as! WKWebView
                webView.evaluateJavaScript("document.querySelector('[contenteditable]').contentEditable") { value, error in
                    guard error == nil, value as? String == "false" else { fail("editable=false not applied") }
                    host.dispose()
                    host.dispose()
                    host.deliver("{\"method\":\"focus\",\"args\":[]}")
                    print("WK_EDITOR_OK HTML JSON link heading undo redo unchanged-input read-only controlled-update dispose; OS WebKit runtime, command dispatch only")
                    app.terminate(nil)
                }
            }
        }
        host.load(try! String(contentsOfFile: CommandLine.arguments[1], encoding: .utf8))
        window.makeKeyAndOrderFront(nil)
        DispatchQueue.main.asyncAfter(deadline: .now() + 20) { fail("timeout phase \(phase)") }
        app.run()
    }
}
