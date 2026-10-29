import Foundation
import AppKit
import PDFKit

var assertions = 0
func check(_ value: Bool, _ message: String) {
    guard value else { FileHandle.standardError.write(Data(("FAIL " + message + "\n").utf8)); exit(1) }
    assertions += 1
}
func payload(_ html: String, _ width: Double = 612, _ height: Double = 792, _ base64: Bool = true) -> String {
    let value: [String: Any] = ["html": html, "width": width, "height": height, "margins": ["top": 18, "bottom": 18, "left": 18, "right": 18], "base64": base64, "textZoom": 100, "useMarkupFormatter": false]
    return String(data: try! JSONSerialization.data(withJSONObject: value), encoding: .utf8)!
}
func reply(_ json: String) -> [String: Any] { return try! JSONSerialization.jsonObject(with: Data(json.utf8)) as! [String: Any] }
_ = NSApplication.shared
NSApplication.shared.setActivationPolicy(.prohibited)
let engine = XplatPrintEngine()
let html = "<html><body><h1>Xplat engine fixture</h1><script>document.body.textContent='SCRIPT RAN'</script><div style='break-before:page;page-break-before:always'>Second page</div></body></html>"
var rejectedBusy = false
engine.render(payload(html)) { json in
    let result = reply(json)
    check(result["ok"] as? Bool == true, "first export succeeds")
    check(rejectedBusy, "concurrent native operation is rejected")
    let first = URL(string: result["uri"] as! String)!
    let firstData = try! Data(contentsOf: first)
    check(String(data: firstData.prefix(5), encoding: .ascii) == "%PDF-", "PDF signature")
    check(Data(base64Encoded: result["base64"] as! String) == firstData, "base64 matches file bytes")
    let firstDocument = PDFDocument(data: firstData)!
    check(firstDocument.pageCount == 2 && result["numberOfPages"] as? Int == 2, "two actual pages")
    check(firstDocument.string!.contains("Xplat engine fixture") && firstDocument.string!.contains("Second page"), "expected PDF text")
    check(!firstDocument.string!.contains("SCRIPT RAN"), "page scripts disabled")
    check(firstDocument.page(at: 0)!.bounds(for: .mediaBox).size == NSSize(width: 612, height: 792), "default page bounds")
    engine.render(payload("<html><body>Small document</body></html>", 360, 540, false)) { secondJSON in
        let secondResult = reply(secondJSON)
        check(secondResult["ok"] as? Bool == true && secondResult["base64"] == nil, "optional base64 omitted")
        let second = URL(string: secondResult["uri"] as! String)!
        check(first != second && FileManager.default.fileExists(atPath: first.path), "earlier export outlives a later export")
        let document = PDFDocument(url: second)!
        check(document.pageCount == 1 && document.page(at: 0)!.bounds(for: .mediaBox).size == NSSize(width: 360, height: 540), "custom page geometry")
        check(engine.remove(first.absoluteString) && !FileManager.default.fileExists(atPath: first.path), "release removes first export")
        check(engine.remove(first.absoluteString), "release is idempotent")
        check(FileManager.default.fileExists(atPath: second.path), "releasing first preserves second")
        check(engine.remove(second.absoluteString) && !FileManager.default.fileExists(atPath: second.path), "release removes second export")
        let sentinel = FileManager.default.temporaryDirectory.appendingPathComponent("xplat-print-sentinel-\(UUID().uuidString).txt")
        try! Data("owned by caller".utf8).write(to: sentinel)
        check(engine.remove(sentinel.absoluteString) && FileManager.default.fileExists(atPath: sentinel.path), "unknown files are preserved")
        try! FileManager.default.removeItem(at: sentinel)
        engine.render(payload("")) { emptyJSON in
            let empty = reply(emptyJSON)
            check(empty["ok"] as? Bool == true && empty["numberOfPages"] as? Int == 1, "empty HTML produces a blank page")
            check(engine.remove(empty["uri"] as! String), "blank result released")
            engine.render("invalid JSON") { failedJSON in
                check(reply(failedJSON)["ok"] as? Bool == false, "invalid native payload rejects")
                print("PRINT_ENGINE_OK assertions=\(assertions)")
                exit(0)
            }
        }
    }
}
engine.render(payload("duplicate")) { json in rejectedBusy = reply(json)["code"] as? String == "ERR_PRINT_BUSY" }
DispatchQueue.main.asyncAfter(deadline: .now() + 25) { FileHandle.standardError.write(Data("FAIL engine timeout\n".utf8)); exit(1) }
NSApplication.shared.run()
